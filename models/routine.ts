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
  repsMin?: number; // 횟수 최소값 (횟수 기반 운동)
  repsMax?: number; // 횟수 최대값 (횟수 기반 운동)
  durationSeconds?: number; // 시간 (시간 기반 운동)
  targetWeight?: number; // 목표 무게 (kg) - 운동 시 기본값으로 사용
  targetMuscle?: string; // 타겟 근육
  difficulty?: string; // 난이도
  restTime?: number; // 휴식 시간 (초)
  restTimeAfterExercise?: number; // 이 운동 후 휴식 시간 (초)
  sequence?: number; // 루틴 내 운동 순서
}

// 루틴에 포함된 운동 (상세 형태 - 나중에 사용)
export interface DetailedRoutineExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  order: number;
  restTime?: number; // 초 단위
}

export interface Routine extends BaseEntity {
  userId: string; // 루틴을 생성한 사용자 ID
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isRecommended?: boolean; // 추천 루틴인지
  category?: string; // 루틴 카테고리 (예: "상체", "하체", "전신")
  lastUsed?: string; // 마지막 사용 날짜
  duration?: string; // 예상 소요 시간 (예: "20분", "45분")
  sequence?: number; // 루틴 목록에서의 순서
}

export type CreateRoutineData = Omit<
  Routine,
  "id" | "createdAt" | "updatedAt" | "userId"
>;

export type UpdateRoutineData = Partial<CreateRoutineData>;
