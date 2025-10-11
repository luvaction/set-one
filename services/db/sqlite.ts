import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'set1.db';
let db: SQLiteDatabase | null = null;

export const initDb = async () => {
  console.log('initDb function called.');
  if (db) {
    console.log('Database already initialized.');
    return;
  }

  try {
    db = await openDatabaseAsync(DATABASE_NAME);
    console.log('Database opened successfully.');

    if (!db) { // Assert db is not null
      throw new Error('Failed to open database.');
    }
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- 기존 active_session 데이터 정리 (잘못된 데이터 방지)
      DELETE FROM active_session;
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT,
        gender TEXT,
        birth_date TEXT,
        height REAL,
        weight REAL,
        target_weight REAL,
        goal TEXT,
        activity_level TEXT,
        weekly_goal INTEGER,
        unit_system TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        subcategory TEXT,
        description TEXT,
        equipment TEXT, -- JSON array as string
        muscle_groups TEXT, -- JSON array as string
        difficulty TEXT, -- Added difficulty column
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS hidden_exercises (
        exercise_id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_recommended INTEGER, -- 0 for false, 1 for true
        category TEXT,
        last_used TEXT,
        duration TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS routine_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        routine_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL,
        reps_min INTEGER,
        reps_max INTEGER,
        duration_seconds INTEGER,
        target_weight REAL,
        target_muscle TEXT,
        difficulty TEXT,
        rest_time INTEGER,
        "order" INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
      );
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
      CREATE TABLE IF NOT EXISTS recorded_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        workout_record_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        target_sets INTEGER NOT NULL,
        target_weight REAL,
        is_completed INTEGER NOT NULL, -- 0 for false, 1 for true
        "order" INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (workout_record_id) REFERENCES workout_records (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS completed_sets (
        id TEXT PRIMARY KEY NOT NULL,
        recorded_exercise_id TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        target_reps INTEGER,
        target_reps_min INTEGER,
        target_reps_max INTEGER,
        target_duration_seconds INTEGER,
        actual_reps INTEGER NOT NULL,
        actual_duration_seconds INTEGER,
        weight REAL NOT NULL,
        is_completed INTEGER NOT NULL, -- 0 for false, 1 for true
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (recorded_exercise_id) REFERENCES recorded_exercises (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS active_session (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        routine_id TEXT,
        routine_name TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time TEXT NOT NULL,
        exercises_data TEXT NOT NULL, -- JSON as string
        current_exercise_index INTEGER NOT NULL,
        total_duration REAL NOT NULL,
        paused_duration REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      

      CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    console.log('Database schema created or already exists.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Helper to execute SQL queries (for DML - INSERT, UPDATE, DELETE)
export const runSql = async (sqlStatement: string, params: any[] = []): Promise<any> => {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db.runAsync(sqlStatement, params);
};

// Helper to get a single item (for SELECT)
export const getSingleItem = async <T>(sqlStatement: string, params: any[] = []): Promise<T | null> => {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  const result = await db.getFirstAsync<T>(sqlStatement, params);
  return result;
};

// Helper to get multiple items (for SELECT)
export const getMultipleItems = async <T>(sqlStatement: string, params: any[] = []): Promise<T[]> => {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  const result = await db.getAllAsync<T>(sqlStatement, params);
  return result;
};