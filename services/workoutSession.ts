import {
  WorkoutSession,
  WorkoutRecord,
  CreateWorkoutSessionData,
  WorkoutExercise,
  CompletedSet,
  STORAGE_KEYS,
} from "@/models";
import { storage } from "./storage/asyncStorage";
import { Routine } from "@/models";
import { routineService } from "./routine";

const generateId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const now = (): string => new Date().toISOString();

// reps를 문자열로 변환하는 헬퍼 함수
const formatRepsToString = (reps: { min: number; max: number } | string): string => {
  if (typeof reps === "string") {
    return reps;
  }
  if (reps.min === reps.max) {
    return `${reps.min}`;
  }
  return `${reps.min}-${reps.max}`;
};

// 루틴을 WorkoutExercise로 변환
const convertRoutineToWorkoutExercises = (routine: Routine): WorkoutExercise[] => {
  return routine.exercises.map((exercise) => ({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    targetSets: exercise.sets,
    sets: Array.from({ length: exercise.sets }, (_, i) => ({
      setNumber: i + 1,
      targetReps: formatRepsToString(exercise.reps), // 객체를 문자열로 변환
      actualReps: 0,
      weight: 0,
      isCompleted: false,
    })),
    isCompleted: false,
  }));
};

// 완료율 계산
const calculateCompletionRate = (exercises: WorkoutExercise[]): number => {
  let totalSets = 0;
  let completedSets = 0;

  exercises.forEach((exercise) => {
    totalSets += exercise.sets.length;
    completedSets += exercise.sets.filter((set) => set.isCompleted).length;
  });

  return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
};

// 총 볼륨 계산 (kg)
const calculateTotalVolume = (exercises: WorkoutExercise[]): number => {
  return exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((exTotal, set) => {
        return set.isCompleted ? exTotal + set.actualReps * set.weight : exTotal;
      }, 0)
    );
  }, 0);
};

export const workoutSessionService = {
  // 활성 세션 가져오기
  async getActiveSession(): Promise<WorkoutSession | null> {
    return await storage.getItem<WorkoutSession>(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  },

  // 새 운동 세션 시작
  async startSession(routine: Routine): Promise<WorkoutSession> {
    // 기존 활성 세션이 있으면 중단 처리
    const existingSession = await this.getActiveSession();
    if (existingSession) {
      await this.stopSession(existingSession.id);
    }

    const exercises = convertRoutineToWorkoutExercises(routine);

    const newSession: WorkoutSession = {
      id: generateId(),
      routineId: routine.id,
      routineName: routine.name,
      status: "in_progress",
      startTime: now(),
      exercises,
      currentExerciseIndex: 0,
      totalDuration: 0,
      pausedDuration: 0,
      createdAt: now(),
      updatedAt: now(),
    };

    await storage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, newSession);

    // 루틴의 lastUsed 업데이트
    await routineService.updateLastUsed(routine.id);

    return newSession;
  },

  // 세션 업데이트 (실시간 저장)
  async updateSession(session: WorkoutSession): Promise<WorkoutSession> {
    const updatedSession: WorkoutSession = {
      ...session,
      updatedAt: now(),
    };

    await storage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, updatedSession);
    return updatedSession;
  },

  // 세트 완료 처리
  async completeSet(
    sessionId: string,
    exerciseIndex: number,
    setIndex: number,
    actualReps: number,
    weight: number
  ): Promise<WorkoutSession> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    // 세트 완료 업데이트
    session.exercises[exerciseIndex].sets[setIndex] = {
      ...session.exercises[exerciseIndex].sets[setIndex],
      actualReps,
      weight,
      isCompleted: true,
      completedAt: now(),
    };

    // 운동 완료 여부 확인
    const allSetsCompleted = session.exercises[exerciseIndex].sets.every(
      (set) => set.isCompleted
    );
    session.exercises[exerciseIndex].isCompleted = allSetsCompleted;

    return await this.updateSession(session);
  },

  // 세트 완료 취소
  async uncompleteSet(
    sessionId: string,
    exerciseIndex: number,
    setIndex: number
  ): Promise<WorkoutSession> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    session.exercises[exerciseIndex].sets[setIndex].isCompleted = false;
    session.exercises[exerciseIndex].sets[setIndex].completedAt = undefined;
    session.exercises[exerciseIndex].isCompleted = false;

    return await this.updateSession(session);
  },

  // 운동 완료
  async completeSession(sessionId: string): Promise<WorkoutRecord> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    // 세션을 완료된 기록으로 변환
    const endTime = now();
    const startDate = new Date(session.startTime);
    const endDate = new Date(endTime);
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60); // 분 단위

    const record: WorkoutRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date: startDate.toISOString().split("T")[0], // YYYY-MM-DD
      routineId: session.routineId,
      routineName: session.routineName,
      status: "completed",
      exercises: session.exercises,
      duration,
      totalVolume: calculateTotalVolume(session.exercises),
      completionRate: calculateCompletionRate(session.exercises),
      createdAt: session.createdAt,
      updatedAt: now(),
    };

    // 기록 저장
    await storage.addToArray(STORAGE_KEYS.WORKOUT_RECORDS, record);

    // 활성 세션 삭제
    await storage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);

    return record;
  },

  // 운동 중단
  async stopSession(sessionId: string): Promise<WorkoutRecord> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    // 세션을 중단된 기록으로 변환
    const endTime = now();
    const startDate = new Date(session.startTime);
    const endDate = new Date(endTime);
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60); // 분 단위

    const record: WorkoutRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date: startDate.toISOString().split("T")[0],
      routineId: session.routineId,
      routineName: session.routineName,
      status: "stopped",
      exercises: session.exercises,
      duration,
      totalVolume: calculateTotalVolume(session.exercises),
      completionRate: calculateCompletionRate(session.exercises),
      createdAt: session.createdAt,
      updatedAt: now(),
    };

    // 기록 저장
    await storage.addToArray(STORAGE_KEYS.WORKOUT_RECORDS, record);

    // 활성 세션 삭제
    await storage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);

    return record;
  },

  // 활성 세션 삭제 (저장 없이)
  async deleteActiveSession(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  },
};
