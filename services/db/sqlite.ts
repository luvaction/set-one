import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "set1.db";
const DB_VERSION = 2; // 1. 앱의 현재 데이터베이스 버전을 정의합니다. (구조가 변경되었으므로 올립니다)
let db: SQLiteDatabase | null = null;

/**
 * 데이터베이스 버전 1에서 2로 마이그레이션합니다.
 * - `workout_records` 테이블을 생성합니다.
 * - `custom_exercises` 테이블에 누락된 컬럼들을 추가합니다.
 * @param database - SQLiteDatabase 인스턴스
 */
async function migrateDbV1ToV2(database: SQLiteDatabase) {
  console.log("Migrating database from version 1 to 2...");
  try {
    await database.execAsync(`
      -- workout_records 테이블이 없으면 생성
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

      -- custom_exercises 테이블에 누락된 컬럼들 추가 (오류를 무시하고 진행)
      ALTER TABLE custom_exercises ADD COLUMN default_sets INTEGER;
      ALTER TABLE custom_exercises ADD COLUMN default_reps_min INTEGER;
      ALTER TABLE custom_exercises ADD COLUMN default_reps_max INTEGER;
      ALTER TABLE custom_exercises ADD COLUMN default_duration_seconds INTEGER;
      ALTER TABLE custom_exercises ADD COLUMN rest_time INTEGER;
    `);
    console.log("Migration to version 2 completed successfully.");
  } catch (error) {
    // ALTER TABLE은 이미 컬럼이 존재하면 오류를 발생시킬 수 있습니다.
    // 이는 예상된 동작일 수 있으므로 경고만 출력하고 계속 진행합니다.
    console.warn("A migration step might have failed (this can be normal if columns already exist):", error);
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
    db = localDb; // 전역 변수에 할당
    console.log("Database opened successfully.");

    // 👇 [수정 1] db 객체가 확실히 존재하는지 확인하는 블록 추가
    if (!db) {
      throw new Error("Database connection failed to initialize.");
    }

    // 데이터베이스의 현재 버전을 가져옵니다.
    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version;",
      [] // 👇 [수정 2] 두 번째 인수로 빈 배열 [] 추가
    );
    const user_version = versionResult?.user_version ?? 0; // 👇 [수정 3] 결과가 null일 경우 0으로 안전하게 처리
    console.log(`Current DB version: ${user_version}, Required DB version: ${DB_VERSION}`);

    // 앱 버전이 DB 버전보다 높으면 마이그레이션을 실행합니다.
    if (user_version < DB_VERSION) {
      console.log("Database schema is outdated. Starting migration...");

      if (user_version < 2) {
        await migrateDbV1ToV2(db); // db가 null이 아님이 보장된 상태에서 호출
      }

      await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
      console.log(`Database version successfully updated to ${DB_VERSION}`);
    }

    // 모든 테이블 생성 (신규 설치 유저 및 마이그레이션 안전장치)
    await db.execAsync(`
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
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, is_recommended INTEGER, category TEXT, last_used TEXT, duration TEXT,
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
