import { BaseEntity } from "./common";

// 완료된 세트 정보
export interface CompletedSet {
  setNumber: number; // 몇 번째 세트인지
  targetReps: string; // 목표 횟수 (예: "10", "10-15")
  actualReps: number; // 실제 수행한 횟수
  weight: number; // 무게 (kg)
  isCompleted: boolean; // 완료 여부
  completedAt?: string; // 완료 시간
}

// 운동 기록에 포함된 운동
export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number; // 목표 세트 수
  sets: CompletedSet[];
  isCompleted: boolean; // 이 운동을 모두 완료했는지
}

// 운동 세션 상태
export type WorkoutStatus = "in_progress" | "completed" | "stopped";

// 진행 중인 운동 세션 (실시간 저장용)
export interface WorkoutSession extends BaseEntity {
  routineId: string;
  routineName: string;
  status: WorkoutStatus;
  startTime: string;
  endTime?: string;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number; // 현재 진행 중인 운동 인덱스
  totalDuration?: number; // 초 단위
  pausedDuration?: number; // 일시정지 시간 (초)
}

// 완료된 운동 기록 (히스토리용)
export interface WorkoutRecord extends BaseEntity {
  date: string; // YYYY-MM-DD
  routineId?: string;
  routineName: string;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];
  duration: number; // 분 단위
  totalVolume?: number; // 총 볼륨 (kg)
  completionRate: number; // 완료율 (0-100)
  memo?: string;
}

export type CreateWorkoutSessionData = Omit<
  WorkoutSession,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateWorkoutSessionData = Partial<CreateWorkoutSessionData>;

export type CreateWorkoutRecordData = Omit<
  WorkoutRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateWorkoutRecordData = Partial<CreateWorkoutRecordData>;
