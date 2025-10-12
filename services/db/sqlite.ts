import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "set1.db";
let db: SQLiteDatabase | null = null;

export const initDb = async () => {
  console.log("initDb function called.");
  if (db) {
    console.log("Database already initialized.");
    return;
  }

  try {
    db = await openDatabaseAsync(DATABASE_NAME);
    console.log("Database opened successfully.");

    if (!db) {
      // Assert db is not null
      throw new Error("Failed to open database.");
    }
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- (이하 다른 CREATE TABLE 구문들은 동일)
      
      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        subcategory TEXT,
        description TEXT,
        equipment TEXT, 
        muscle_groups TEXT, 
        difficulty TEXT,
        default_sets INTEGER,
        default_reps_min INTEGER,
        default_reps_max INTEGER,
        default_duration_seconds INTEGER,
        rest_time INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- (이하 다른 CREATE TABLE 구문들은 동일)
    `);
    console.log("Database schema created or already exists.");

    // --- 스키마 마이그레이션 ---
    const columnsToAdd = [
      { name: "default_sets", type: "INTEGER" },
      { name: "default_reps_min", type: "INTEGER" },
      { name: "default_reps_max", type: "INTEGER" },
      { name: "default_duration_seconds", type: "INTEGER" },
      { name: "rest_time", type: "INTEGER" },
    ];

    for (const column of columnsToAdd) {
      try {
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(custom_exercises);`, []); // 👇 [수정] 두 번째 인자로 빈 배열 [] 추가
        const columnExists = tableInfo.some((info: any) => info.name === column.name);

        if (!columnExists) {
          await db.execAsync(`ALTER TABLE custom_exercises ADD COLUMN ${column.name} ${column.type};`);
          console.log(`Added column ${column.name} to custom_exercises table.`);
        }
      } catch (migrationError) {
        console.error(`Error migrating column ${column.name}:`, migrationError);
      }
    }
    console.log("Custom exercises table migration check completed.");
    // --- 스키마 마이그레이션 끝 ---
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Helper to execute SQL queries (for DML - INSERT, UPDATE, DELETE)
export const runSql = async (sqlStatement: string, params: any[] = []): Promise<any> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  return db.runAsync(sqlStatement, params);
};

// Helper to get a single item (for SELECT)
export const getSingleItem = async <T>(sqlStatement: string, params: any[] = []): Promise<T | null> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  const result = await db.getFirstAsync<T>(sqlStatement, params);
  return result;
};

// Helper to get multiple items (for SELECT)
export const getMultipleItems = async <T>(sqlStatement: string, params: any[] = []): Promise<T[]> => {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  const result = await db.getAllAsync<T>(sqlStatement, params);
  return result;
};
