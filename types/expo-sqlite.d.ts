// types/expo-sqlite.d.ts
declare module 'expo-sqlite' {
  export function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (database: any) => void): any;
  export function openDatabaseAsync(name: string, options?: any, directory?: string): Promise<any>;

  export interface WebSQLDatabase {
    transaction(callback: (tx: SQLTransaction) => void, errorCallback?: (error: SQLError) => void, successCallback?: () => void): void;
    readTransaction(callback: (tx: SQLTransaction) => void, errorCallback?: (error: SQLError) => void, successCallback?: () => void): void;
    exec(queries: any[], readOnly: boolean, callback: (error: SQLError | null, resultSet: SQLResultSet[] | null) => void): void;
  }

  export interface SQLTransaction {
    executeSql(sqlStatement: string, arguments?: (string | number | boolean | null)[], successCallback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void, errorCallback?: (transaction: SQLTransaction, error: SQLError) => boolean): void;
  }

  export interface SQLResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: SQLResultSetRowList;
  }

  export interface SQLResultSetRowList {
    length: number;
    item(index: number): any;
    _array: any[]; // Expo specific
  }

  export interface SQLError {
    code: number;
    message: string;
  }

  // For the modern API (SQLiteDatabase)
  export class SQLiteDatabase {
    databasePath: string;
    execAsync(source: string): Promise<void>;
    runAsync(source: string, params: any[]): Promise<any>;
    getFirstAsync<T>(source: string, params: any[]): Promise<T | null>;
    getAllAsync<T>(source: string, params: any[]): Promise<T[]>;
    withTransactionAsync(task: (txn: any) => Promise<void>): Promise<void>;
    // Add other methods as needed
  }
}