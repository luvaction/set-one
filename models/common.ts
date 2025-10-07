// 공통 Base Entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  PROFILE: "@set1/profile",
  CUSTOM_EXERCISES: "@set1/custom_exercises",        // 사용자가 추가한 운동
  HIDDEN_EXERCISE_IDS: "@set1/hidden_exercise_ids",  // 숨긴 기본 운동 ID
  USER_ROUTINES: "@set1/user_routines",              // 사용자 루틴
  WORKOUT_RECORDS: "@set1/workout_records",
  SETTINGS: "@set1/settings",
} as const;
