import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorage } from "./interface";

class AsyncStorageService implements IStorage {
  // 기본 CRUD
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }

  // 배열 데이터 관리
  async getArray<T>(key: string): Promise<T[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error(`Error getting array ${key}:`, error);
      return [];
    }
  }

  async setArray<T>(key: string, items: T[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(items);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting array ${key}:`, error);
      throw error;
    }
  }

  async addToArray<T>(key: string, item: T): Promise<void> {
    try {
      const items = await this.getArray<T>(key);
      items.push(item);
      await this.setArray(key, items);
    } catch (error) {
      console.error(`Error adding to array ${key}:`, error);
      throw error;
    }
  }

  async updateInArray<T extends { id: string }>(
    key: string,
    item: T
  ): Promise<void> {
    try {
      const items = await this.getArray<T>(key);
      const index = items.findIndex((i) => i.id === item.id);
      if (index !== -1) {
        items[index] = item;
        await this.setArray(key, items);
      } else {
        throw new Error(`Item with id ${item.id} not found in ${key}`);
      }
    } catch (error) {
      console.error(`Error updating in array ${key}:`, error);
      throw error;
    }
  }

  async removeFromArray(key: string, id: string): Promise<void> {
    try {
      const items = await this.getArray<{ id: string }>(key);
      const filtered = items.filter((item) => item.id !== id);
      await this.setArray(key, filtered);
    } catch (error) {
      console.error(`Error removing from array ${key}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const storage = new AsyncStorageService();
