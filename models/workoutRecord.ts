import { BaseEntity } from "./common";

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
  timestamp?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
}

export interface WorkoutRecord extends BaseEntity {
  date: string; // YYYY-MM-DD
  routineId?: string; // 루틴 기반 운동이면 루틴 ID
  routineName: string;
  exercises: WorkoutExercise[];
  duration: number; // 분 단위
  memo?: string;
  totalVolume?: number; // 총 볼륨 (kg)
}

export type CreateWorkoutRecordData = Omit<
  WorkoutRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateWorkoutRecordData = Partial<CreateWorkoutRecordData>;
