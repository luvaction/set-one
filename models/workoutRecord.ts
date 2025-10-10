import { BaseEntity } from "./common";

// 완료된 세트 정보
export interface CompletedSet {
  setNumber: number; // 몇 번째 세트인지
  targetReps?: number; // 목표 횟수 (횟수 기반 운동)
  targetRepsMin?: number; // 목표 횟수 최소값 (횟수 범위)
  targetRepsMax?: number; // 목표 횟수 최대값 (횟수 범위)
  targetDurationSeconds?: number; // 목표 시간 (시간 기반 운동)
  actualReps: number; // 실제 수행한 횟수
  actualDurationSeconds?: number; // 실제 수행 시간 (시간 기반 운동)
  weight: number; // 무게 (kg)
  isCompleted: boolean; // 완료 여부
  completedAt?: string; // 완료 시간
}

// 운동 기록에 포함된 운동
export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number; // 목표 세트 수
  targetWeight?: number; // 목표 무게 (kg) - 세트 완료 시 기본값으로 사용
  sets: CompletedSet[];
  isCompleted: boolean; // 이 운동을 모두 완료했는지
}

// 운동 세션 상태
export type WorkoutStatus = "in_progress" | "completed" | "stopped";

// 진행 중인 운동 세션 (실시간 저장용)
export interface WorkoutSession extends BaseEntity {
  userId: string; // 운동 세션을 생성한 사용자 ID
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
  userId: string; // 운동 기록을 생성한 사용자 ID
  date: string; // YYYY-MM-DD
  routineId?: string;
  routineName: string;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];
  duration: number; // 분 단위
  totalVolume?: number; // 총 볼륨 (kg)
  completionRate: number; // 완료율 (0-100)
  bodyWeight?: number; // 운동 완료 시점의 체중 (kg) - 선택 사항
  memo?: string;
}

export type CreateWorkoutSessionData = Omit<
  WorkoutSession,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateWorkoutSessionData = Partial<CreateWorkoutSessionData>;

export type CreateWorkoutRecordData = Omit<
  WorkoutRecord,
  "id" | "createdAt" | "updatedAt" | "userId"
>;

export type UpdateWorkoutRecordData = Partial<CreateWorkoutRecordData>;
