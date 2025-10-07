import { BaseEntity } from "./common";

export interface ExerciseSet {
  reps: number;
  weight: number;
  type: "normal" | "warmup" | "dropset" | "failure";
}

// 루틴에 포함된 운동 (간단한 형태)
export interface RoutineExercise {
  id: string; // 운동 ID
  name: string; // 운동 이름
  sets: number; // 세트 수
  reps: string; // 횟수/시간 (예: "10-15", "30초")
  targetMuscle?: string; // 타겟 근육
  difficulty?: string; // 난이도
  restTime?: number; // 휴식 시간 (초)
}

// 루틴에 포함된 운동 (상세 형태 - 나중에 사용)
export interface DetailedRoutineExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  order: number;
  restTime?: number; // 초 단위
}

export interface Routine extends BaseEntity {
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isRecommended?: boolean; // 추천 루틴인지
  category?: string; // 루틴 카테고리 (예: "상체", "하체", "전신")
  lastUsed?: string; // 마지막 사용 날짜
  duration?: string; // 예상 소요 시간 (예: "20분", "45분")
}

export type CreateRoutineData = Omit<
  Routine,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateRoutineData = Partial<CreateRoutineData>;
