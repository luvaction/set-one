// Storage 인터페이스 - 나중에 Firebase/iCloud로 전환 가능
export interface IStorage {
  // 기본 CRUD
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  // 배열 데이터 관리 (Routines, Exercises, WorkoutRecords)
  getArray<T>(key: string): Promise<T[]>;
  setArray<T>(key: string, items: T[]): Promise<void>;
  addToArray<T>(key: string, item: T): Promise<void>;
  updateInArray<T extends { id: string }>(key: string, item: T): Promise<void>;
  removeFromArray(key: string, id: string): Promise<void>;
}

// Sync 인터페이스 - 나중에 클라우드 동기화용
export interface ISyncService {
  sync(): Promise<void>;
  uploadData(): Promise<void>;
  downloadData(): Promise<void>;
  getLastSyncTime(): Promise<string | null>;
}
