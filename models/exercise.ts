import { BaseEntity } from "./common";

export interface Exercise extends BaseEntity {
  userId?: string; // 사용자를 생성한 경우 (커스텀 운동)
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  equipment?: string[];
  muscleGroups: string[];
  difficulty?: string; // 난이도: 초급, 중급, 고급
  defaultSets?: number; // 기본 세트 수
  defaultRepsMin?: number; // 기본 최소 횟수
  defaultRepsMax?: number; // 기본 최대 횟수
  defaultDurationSeconds?: number; // 기본 지속 시간 (초)
  restTime?: number; // 휴식 시간 (초)
  targetWeight?: number; // 목표 무게 (kg)
  isCustom: boolean; // 사용자가 직접 추가한 운동인지
}

export type CreateExerciseData = Omit<
  Exercise,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateExerciseData = Partial<CreateExerciseData>;
