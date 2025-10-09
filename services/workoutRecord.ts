import { WorkoutRecord, CreateWorkoutRecordData, STORAGE_KEYS } from "@/models";
import { storage } from "./storage/asyncStorage";

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const now = (): string => new Date().toISOString();

export const workoutRecordService = {
  // 모든 운동 기록 가져오기
  async getAllRecords(): Promise<WorkoutRecord[]> {
    return await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
  },

  // ID로 운동 기록 가져오기
  async getRecordById(id: string): Promise<WorkoutRecord | null> {
    const records = await this.getAllRecords();
    return records.find((r) => r.id === id) || null;
  },

  // 날짜로 운동 기록 가져오기
  async getRecordsByDate(date: string): Promise<WorkoutRecord[]> {
    const records = await this.getAllRecords();
    return records.filter((r) => r.date === date);
  },

  // 날짜 범위로 운동 기록 가져오기
  async getRecordsByDateRange(startDate: string, endDate: string): Promise<WorkoutRecord[]> {
    const records = await this.getAllRecords();
    return records.filter((r) => r.date >= startDate && r.date <= endDate);
  },

  // 운동 기록 생성
  async createRecord(userId: string, data: CreateWorkoutRecordData): Promise<WorkoutRecord> {
    const newRecord: WorkoutRecord = {
      id: generateId(),
      userId,
      ...data,
      createdAt: now(),
      updatedAt: now(),
    };
    await storage.addToArray(STORAGE_KEYS.WORKOUT_RECORDS, newRecord);
    return newRecord;
  },

  // 운동 기록 업데이트
  async updateRecord(id: string, data: Partial<CreateWorkoutRecordData>): Promise<WorkoutRecord> {
    const record = await this.getRecordById(id);
    if (!record) {
      throw new Error(`Workout record with id ${id} not found`);
    }

    const updatedRecord: WorkoutRecord = {
      ...record,
      ...data,
      updatedAt: now(),
    };

    await storage.updateInArray(STORAGE_KEYS.WORKOUT_RECORDS, updatedRecord);
    return updatedRecord;
  },

  // 운동 기록 삭제
  async deleteRecord(id: string): Promise<void> {
    await storage.removeFromArray(STORAGE_KEYS.WORKOUT_RECORDS, id);
  },

  // 특정 루틴으로 한 운동 기록 가져오기
  async getRecordsByRoutineId(routineId: string): Promise<WorkoutRecord[]> {
    const records = await this.getAllRecords();
    return records.filter((r) => r.routineId === routineId);
  },

  // 운동 기록이 있는 날짜 목록 가져오기 (캘린더 마킹용)
  async getRecordDates(): Promise<string[]> {
    const records = await this.getAllRecords();
    const dates = records.map((r) => r.date);
    return [...new Set(dates)].sort();
  },
};
