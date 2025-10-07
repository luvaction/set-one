// 공통 타입
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 프로필
export interface UserProfile extends BaseEntity {
  name: string;
  gender: "male" | "female" | "";
  birthDate: string;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  goal: "lose" | "gain" | "maintain" | "";
  activityLevel: "low" | "medium" | "high" | "";
  weeklyGoal: number; // 주간 운동 목표 횟수
}

// 운동 (라이브러리)
export interface Exercise extends BaseEntity {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  equipment?: string[];
  muscleGroups: string[];
  isCustom: boolean; // 사용자가 직접 추가한 운동인지
}

// 루틴
export interface Routine extends BaseEntity {
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isRecommended: boolean; // 추천 루틴인지
}

export interface RoutineExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  order: number;
  restTime?: number; // 초 단위
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  type: "normal" | "warmup" | "dropset" | "failure";
}

// 운동 기록
export interface WorkoutRecord extends BaseEntity {
  date: string; // YYYY-MM-DD
  routineId?: string; // 루틴 기반 운동이면 루틴 ID
  routineName: string;
  exercises: WorkoutExercise[];
  duration: number; // 분 단위
  memo?: string;
  totalVolume?: number; // 총 볼륨 (kg)
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
  timestamp?: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  PROFILE: "@set1/profile",
  EXERCISES: "@set1/exercises",
  ROUTINES: "@set1/routines",
  WORKOUT_RECORDS: "@set1/workout_records",
  SETTINGS: "@set1/settings",
} as const;
