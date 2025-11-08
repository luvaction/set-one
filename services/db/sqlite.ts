import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "set1.db";
const DB_VERSION = 5;
let db: SQLiteDatabase | null = null;

/**
 * 데이터베이스 버전 1에서 2로 마이그레이션합니다.
 */
async function migrateDbV1ToV2(database: SQLiteDatabase) {
  console.log("Migrating database from version 1 to 2...");
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_records (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        routine_id TEXT,
        routine_name TEXT NOT NULL,
        status TEXT NOT NULL,
        duration REAL NOT NULL,
        total_volume REAL,
        completion_rate REAL NOT NULL,
        body_weight REAL,
        memo TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE SET NULL
      );
    `);

    // custom_exercises 테이블에 컬럼 추가 시도
    await database.execAsync("ALTER TABLE custom_exercises ADD COLUMN default_sets INTEGER;");
    await database.execAsync("ALTER TABLE custom_exercises ADD COLUMN default_reps_min INTEGER;");
    await database.execAsync("ALTER TABLE custom_exercises ADD COLUMN default_reps_max INTEGER;");
    await database.execAsync("ALTER TABLE custom_exercises ADD COLUMN default_duration_seconds INTEGER;");
    await database.execAsync("ALTER TABLE custom_exercises ADD COLUMN rest_time INTEGER;");

    console.log("Migration to version 2 completed successfully.");
  } catch (error) {
    // ALTER TABLE은 이미 컬럼이 존재하면 오류를 발생시킬 수 있습니다.
    // 이는 정상적인 동작일 수 있으므로 경고만 출력하고 계속 진행합니다.
    console.warn("A migration step for V2 might have failed (this can be normal if columns already exist):", error);
  }
}

/**
 * 데이터베이스 버전 2에서 3으로 마이그레이션합니다.
 */
async function migrateDbV2ToV3(database: SQLiteDatabase) {
  console.log("Migrating database from version 2 to 3...");
  try {
    await database.execAsync("ALTER TABLE routines ADD COLUMN sequence INTEGER;");
    console.log("Added 'sequence' column to 'routines' table.");

    const userRoutines = await database.getAllAsync<{ id: string }>("SELECT id FROM routines WHERE is_recommended = 0 OR is_recommended IS NULL ORDER BY created_at ASC;", []);

    for (let i = 0; i < userRoutines.length; i++) {
      const routine = userRoutines[i];
      await database.runAsync("UPDATE routines SET sequence = ? WHERE id = ?;", [i, routine.id]);
    }
    console.log("Populated 'sequence' for existing user routines.");
    console.log("Migration to version 3 completed successfully.");
  } catch (error) {
    console.error("[DB_DEBUG] Error during migrateDbV2ToV3:", error);
    console.warn("A migration step for V3 might have failed (this can be normal if columns already exist):", error);
  }
}

/**
 * 데이터베이스 버전 3에서 4로 마이그레이션합니다.
 * 참고: V4 마이그레이션은 V3와 로직이 중복되어 잠재적 오류를 유발할 수 있었습니다.
 * V4에만 해당하는 새로운 스키마 변경이 없다면 이 함수는 비워두는 것이 안전합니다.
 * 만약 V4 변경사항이 있다면 여기에 추가하십시오.
 */
async function migrateDbV3ToV4(_database: SQLiteDatabase) {
  console.log("Migrating database from version 3 to 4...");
  try {
    // V4에 필요한 스키마 변경이 있다면 여기에 코드를 작성합니다.
    // 예: await database.execAsync('ALTER TABLE profiles ADD COLUMN new_feature_flag INTEGER;');
    console.log("No schema changes for V4. Migration completed successfully.");
  } catch (error) {
    console.error("[DB_DEBUG] Error during migrateDbV3ToV4:", error);
  }
}

/**
 * 데이터베이스 버전 4에서 5로 마이그레이션합니다.
 * weight_records 테이블을 추가하여 프로필 체중 기록을 추적합니다.
 */
async function migrateDbV4ToV5(database: SQLiteDatabase) {
  console.log("Migrating database from version 4 to 5...");
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        weight REAL NOT NULL,
        date TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    console.log("weight_records table created successfully.");
    console.log("Migration to version 5 completed successfully.");
  } catch (error) {
    console.error("[DB_DEBUG] Error during migrateDbV4ToV5:", error);
  }
}

/**
 * 데이터베이스를 초기화하고, 필요한 경우 스키마 마이그레이션을 수행합니다.
 */
export const initDb = async () => {
  console.log("initDb function called.");
  if (db) {
    console.log("Database already initialized.");
    return;
  }

  try {
    const localDb = await openDatabaseAsync(DATABASE_NAME);
    db = localDb;
    console.log("Database opened successfully.");

    if (!db) {
      throw new Error("Database connection failed to initialize.");
    }

    // ✅ [수정된 부분 1] 테이블 생성을 마이그레이션보다 먼저 실행합니다.
    // 이렇게 하면 마이그레이션 함수가 실행될 때 테이블이 항상 존재하게 됩니다.
    await localDb.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT UNIQUE NOT NULL, name TEXT, gender TEXT, birth_date TEXT, height REAL, weight REAL, target_weight REAL, goal TEXT, activity_level TEXT, weekly_goal INTEGER, unit_system TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, category TEXT, subcategory TEXT, description TEXT, equipment TEXT, muscle_groups TEXT, difficulty TEXT,
        default_sets INTEGER, default_reps_min INTEGER, default_reps_max INTEGER, default_duration_seconds INTEGER, rest_time INTEGER,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS hidden_exercises ( exercise_id TEXT PRIMARY KEY NOT NULL, created_at INTEGER NOT NULL );
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, is_recommended INTEGER, category TEXT, last_used TEXT, duration TEXT, sequence INTEGER,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS routine_exercises (
        id TEXT PRIMARY KEY NOT NULL, routine_id TEXT NOT NULL, exercise_id TEXT NOT NULL, name TEXT NOT NULL, sets INTEGER NOT NULL, reps_min INTEGER, reps_max INTEGER, duration_seconds INTEGER,
        target_weight REAL, target_muscle TEXT, difficulty TEXT, rest_time INTEGER, "order" INTEGER NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS workout_records (
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, date TEXT NOT NULL, routine_id TEXT, routine_name TEXT NOT NULL, status TEXT NOT NULL, duration REAL NOT NULL, total_volume REAL,
        completion_rate REAL NOT NULL, body_weight REAL, memo TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS recorded_exercises (
        id TEXT PRIMARY KEY NOT NULL, workout_record_id TEXT NOT NULL, exercise_id TEXT NOT NULL, exercise_name TEXT NOT NULL, target_sets INTEGER NOT NULL, target_weight REAL,
        is_completed INTEGER NOT NULL, "order" INTEGER NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (workout_record_id) REFERENCES workout_records (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS completed_sets (
        id TEXT PRIMARY KEY NOT NULL, recorded_exercise_id TEXT NOT NULL, set_number INTEGER NOT NULL, target_reps INTEGER, target_reps_min INTEGER, target_reps_max INTEGER, target_duration_seconds INTEGER,
        actual_reps INTEGER NOT NULL, actual_duration_seconds INTEGER, weight REAL NOT NULL, is_completed INTEGER NOT NULL, completed_at INTEGER,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (recorded_exercise_id) REFERENCES recorded_exercises (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS active_session (
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, routine_id TEXT, routine_name TEXT NOT NULL, status TEXT NOT NULL, start_time TEXT NOT NULL, exercises_data TEXT NOT NULL,
        current_exercise_index INTEGER NOT NULL, total_duration REAL NOT NULL, paused_duration REAL NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS key_value_store ( key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL );
    `);
    console.log("All tables checked/created successfully.");

    const versionResult = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version;", []);
    const user_version = versionResult?.user_version ?? 0;
    console.log(`Current DB version: ${user_version}, Required DB version: ${DB_VERSION}`);

    if (user_version < DB_VERSION) {
      console.log("Database schema is outdated. Starting migration...");

      if (user_version < 2) {
        await migrateDbV1ToV2(localDb);
      }
      if (user_version < 3) {
        await migrateDbV2ToV3(localDb);
      }
      if (user_version < 4) {
        await migrateDbV3ToV4(localDb);
      }
      if (user_version < 5) {
        await migrateDbV4ToV5(localDb);
      }

      await localDb.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
      console.log(`Database version successfully updated to ${DB_VERSION}`);
    }
  } catch (error) {
    console.error("Error during database initialization:", error);
    throw error;
  }
};

// (이하 runSql, getSingleItem, getMultipleItems 함수는 변경 없이 그대로 둡니다.)
export const runSql = async (sqlStatement: string, params: any[] = []): Promise<any> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  return db.runAsync(sqlStatement, params);
};

export const getSingleItem = async <T>(sqlStatement: string, params: any[] = []): Promise<T | null> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  const result = await db.getFirstAsync<T>(sqlStatement, params);
  return result;
};

export const getMultipleItems = async <T>(sqlStatement: string, params: any[] = []): Promise<T[]> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  const result = await db.getAllAsync<T>(sqlStatement, params);
  return result;
};
