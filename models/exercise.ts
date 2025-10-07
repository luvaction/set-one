import { BaseEntity } from "./common";

export interface Exercise extends BaseEntity {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  equipment?: string[];
  muscleGroups: string[];
  isCustom: boolean; // 사용자가 직접 추가한 운동인지
}

export type CreateExerciseData = Omit<
  Exercise,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateExerciseData = Partial<CreateExerciseData>;
