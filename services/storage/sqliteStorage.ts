import { IStorage } from "./interface";
import { runSql, getSingleItem, getMultipleItems } from "@/services/db/sqlite";

class SQLiteStorageService implements IStorage {
  private readonly KEY_VALUE_TABLE = "key_value_store";

  async getItem<T>(key: string): Promise<T | null> {
    const result = await getSingleItem<{ value: string }>(
      `SELECT value FROM ${this.KEY_VALUE_TABLE} WHERE key = ?`,
      [key]
    );
    if (result && result.value) {
      try {
        return JSON.parse(result.value) as T;
      } catch (e) {
        console.error(`Error parsing JSON for key ${key}:`, e);
        return null;
      }
    }
    return null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await runSql(
      `INSERT OR REPLACE INTO ${this.KEY_VALUE_TABLE} (key, value) VALUES (?, ?)`,
      [key, jsonValue]
    );
  }

  async removeItem(key: string): Promise<void> {
    await runSql(`DELETE FROM ${this.KEY_VALUE_TABLE} WHERE key = ?`, [key]);
  }

  async clear(): Promise<void> {
    // This clears only the key_value_store table, not the entire database.
    // If a full database clear is needed, a separate method should be implemented.
    await runSql(`DELETE FROM ${this.KEY_VALUE_TABLE}`);
  }

  // The following array methods are designed for key-value stores where arrays are stored as single values.
  // For a relational database like SQLite, it's generally more appropriate to interact
  // with specific tables directly (e.g., via dedicated services like routineService).
  // Implementing these generically for SQLite would require a complex mapping of keys to tables
  // and handling of individual items, which is usually done by higher-level services.
  // For now, these will throw an error to indicate they should not be used directly with this SQLiteStorageService
  // for array-like data that has its own dedicated table.
  // If there's a specific need to store a generic array as a single JSON blob in key_value_store,
  // then getItem/setItem should be used directly.

  async getArray<T>(key: string): Promise<T[]> {
    // This method is typically used for fetching an array stored as a single JSON string.
    // If the 'key' refers to a table (e.g., 'routines'), then a dedicated service
    // (e.g., routineService.getAllRoutines()) should be used instead.
    const item = await this.getItem<T[]>(key);
    return item || [];
  }

  async setArray<T>(key: string, items: T[]): Promise<void> {
    // This method is typically used for storing an array as a single JSON string.
    // If the 'key' refers to a table, then individual items should be managed via
    // dedicated services (e.g., routineService.saveRoutine()).
    await this.setItem(key, items);
  }

  async addToArray<T extends { id: string }>(key: string, item: T): Promise<void> {
    // This method is problematic for a relational database.
    // It implies fetching an array, adding an item, and saving the whole array back.
    // For SQLite, you should insert directly into the relevant table.
    // If 'key' refers to a table, use a dedicated service (e.g., routineService.addRoutine(item)).
    // If it's a generic array stored as JSON, use getArray then setArray.
    const currentArray = await this.getArray<T>(key);
    currentArray.push(item);
    await this.setArray(key, currentArray);
  }

  async updateInArray<T extends { id: string }>(key: string, item: T): Promise<void> {
    // Similar to addToArray, this is not ideal for relational databases.
    // For SQLite, you should update directly in the relevant table.
    const currentArray = await this.getArray<T>(key);
    const index = currentArray.findIndex(i => i.id === item.id);
    if (index !== -1) {
      currentArray[index] = item;
      await this.setArray(key, currentArray);
    }
  }

  async removeFromArray(key: string, id: string): Promise<void> {
    // Similar to addToArray, this is not ideal for relational databases.
    // For SQLite, you should delete directly from the relevant table.
    const currentArray = await this.getArray<any>(key);
    const newArray = currentArray.filter(i => i.id !== id);
    await this.setArray(key, newArray);
  }
}

export const storage = new SQLiteStorageService();
