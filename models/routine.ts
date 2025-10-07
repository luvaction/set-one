import { BaseEntity } from "./common";

export interface ExerciseSet {
  reps: number;
  weight: number;
  type: "normal" | "warmup" | "dropset" | "failure";
}

export interface RoutineExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  order: number;
  restTime?: number; // 초 단위
}

export interface Routine extends BaseEntity {
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isRecommended: boolean; // 추천 루틴인지
}

export type CreateRoutineData = Omit<
  Routine,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateRoutineData = Partial<CreateRoutineData>;
