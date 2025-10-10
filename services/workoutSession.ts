import {
  WorkoutSession,
  WorkoutRecord,
  CreateWorkoutSessionData,
  WorkoutExercise,
  CompletedSet,
} from "@/models";
import { getSingleItem, runSql } from "./db/sqlite";
import { Routine } from "@/models";
import { routineService } from "./routine";
import { profileService } from "./profile";
import { workoutRecordService } from "./workoutRecord";

const generateId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const nowTimestamp = (): number => Date.now();
const now = (): string => new Date().toISOString();

// 로컬 시간대 기준으로 날짜를 YYYY-MM-DD 형식으로 변환
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 루틴을 WorkoutExercise로 변환
const convertRoutineToWorkoutExercises = (routine: Routine): WorkoutExercise[] => {
  return routine.exercises.map((exercise) => {
    // sets가 없거나 유효하지 않으면 기본값 3 사용
    const numSets = exercise.sets && exercise.sets > 0 ? exercise.sets : 3;

    // reps 정보가 없으면 기본값 사용 (10-12 회)
    const hasRepsInfo = exercise.repsMin !== undefined || exercise.repsMax !== undefined || exercise.durationSeconds !== undefined;
    const defaultRepsMin = exercise.repsMin || (hasRepsInfo ? undefined : 10);
    const defaultRepsMax = exercise.repsMax || (hasRepsInfo ? undefined : 12);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: numSets,
      targetWeight: exercise.targetWeight,
      sets: Array.from({ length: numSets }, (_, i) => ({
        setNumber: i + 1,
        targetReps: defaultRepsMin === defaultRepsMax ? defaultRepsMin : undefined,
        targetRepsMin: defaultRepsMin,
        targetRepsMax: defaultRepsMax,
        targetDurationSeconds: exercise.durationSeconds,
        actualReps: 0,
        actualDurationSeconds: undefined,
        weight: 0,
        isCompleted: false,
      })),
      isCompleted: false,
    };
  });
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

// DB row 타입
interface ActiveSessionRow {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine_name: string;
  status: string;
  start_time: string;
  exercises_data: string; // JSON
  current_exercise_index: number;
  total_duration: number;
  paused_duration: number;
  created_at: number;
  updated_at: number;
}

const rowToSession = (row: ActiveSessionRow): WorkoutSession => {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id ?? '',
    routineName: row.routine_name,
    status: row.status as "in_progress" | "completed" | "stopped",
    startTime: row.start_time,
    exercises: JSON.parse(row.exercises_data),
    currentExerciseIndex: row.current_exercise_index,
    totalDuration: row.total_duration,
    pausedDuration: row.paused_duration,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
};

export const workoutSessionService = {
  // 활성 세션 가져오기
  async getActiveSession(): Promise<WorkoutSession | null> {
    const row = await getSingleItem<ActiveSessionRow>(
      'SELECT * FROM active_session LIMIT 1'
    );
    return row ? rowToSession(row) : null;
  },

  // 새 운동 세션 시작
  async startSession(userId: string, routine: Routine): Promise<WorkoutSession> {
    console.log("workoutSessionService.startSession received routine:", routine);

    // 기존 활성 세션이 있으면 중단 처리
    const existingSession = await this.getActiveSession();
    if (existingSession) {
      await this.stopSession(existingSession.id);
    }

    const exercises = convertRoutineToWorkoutExercises(routine);
    const id = generateId();
    const createdAt = nowTimestamp();
    const updatedAt = createdAt;

    const newSession: WorkoutSession = {
      id,
      userId,
      routineId: routine.id,
      routineName: routine.name,
      status: "in_progress",
      startTime: now(),
      exercises,
      currentExerciseIndex: 0,
      totalDuration: 0,
      pausedDuration: 0,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
    };

    console.log("Attempting to save new session:", newSession);

    await runSql(
      `INSERT INTO active_session (
        id, user_id, routine_id, routine_name, status, start_time,
        exercises_data, current_exercise_index, total_duration, paused_duration,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        routine.id,
        routine.name,
        "in_progress",
        newSession.startTime,
        JSON.stringify(exercises),
        0,
        0,
        0,
        createdAt,
        updatedAt,
      ]
    );

    // 루틴의 lastUsed 업데이트
    await routineService.updateLastUsed(routine.id);

    return newSession;
  },

  // 세션 업데이트 (실시간 저장)
  async updateSession(session: WorkoutSession): Promise<WorkoutSession> {
    const updatedAt = nowTimestamp();

    await runSql(
      `UPDATE active_session SET
        routine_id = ?, routine_name = ?, status = ?, start_time = ?,
        exercises_data = ?, current_exercise_index = ?, total_duration = ?,
        paused_duration = ?, updated_at = ?
      WHERE id = ?`,
      [
        session.routineId,
        session.routineName,
        session.status,
        session.startTime,
        JSON.stringify(session.exercises),
        session.currentExerciseIndex,
        session.totalDuration ?? 0,
        session.pausedDuration ?? 0,
        updatedAt,
        session.id,
      ]
    );

    return {
      ...session,
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },

  // 세트 완료 처리
  async completeSet(
    sessionId: string,
    exerciseIndex: number,
    setIndex: number,
    actualReps: number | undefined,
    actualDurationSeconds: number | undefined,
    weight: number,
    restDurationSeconds: number | undefined // Add rest duration
  ): Promise<WorkoutSession> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    // 세트 완료 업데이트
    session.exercises[exerciseIndex].sets[setIndex] = {
      ...session.exercises[exerciseIndex].sets[setIndex],
      actualReps: actualReps !== undefined ? actualReps : 0,
      actualDurationSeconds: actualDurationSeconds,
      weight,
      isCompleted: true,
      completedAt: now(),
      restDurationSeconds: restDurationSeconds, // Store rest duration
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

  // 운동 시간 업데이트
  async updateExerciseDuration(
    sessionId: string,
    exerciseIndex: number,
    duration: number
  ): Promise<WorkoutSession> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    session.exercises[exerciseIndex].exerciseDurationSeconds = duration;

    return await this.updateSession(session);
  },

  // 운동 완료
  async completeSession(sessionId: string, bodyWeight?: number): Promise<WorkoutRecord> {
    const session = await this.getActiveSession();
    if (!session || session.id !== sessionId) {
      throw new Error("Active session not found");
    }

    // 세션을 완료된 기록으로 변환
    const endTime = now();
    const startDate = new Date(session.startTime);
    const endDate = new Date(endTime);
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60); // 분 단위

    const record = await workoutRecordService.createRecord(session.userId, {
      date: toLocalDateString(startDate),
      routineId: session.routineId,
      routineName: session.routineName,
      status: "completed",
      exercises: session.exercises,
      duration,
      totalVolume: calculateTotalVolume(session.exercises),
      completionRate: calculateCompletionRate(session.exercises),
      bodyWeight,
    });

    // 프로필 체중 업데이트 (선택 사항)
    if (bodyWeight !== undefined && bodyWeight > 0) {
      const userProfile = await profileService.getProfile();
      if (userProfile) {
        await profileService.saveProfile({ ...userProfile, weight: bodyWeight });
      }
    }

    // 활성 세션 삭제
    await runSql('DELETE FROM active_session WHERE id = ?', [sessionId]);

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

    const record = await workoutRecordService.createRecord(session.userId, {
      date: toLocalDateString(startDate),
      routineId: session.routineId,
      routineName: session.routineName,
      status: "stopped",
      exercises: session.exercises,
      duration,
      totalVolume: calculateTotalVolume(session.exercises),
      completionRate: calculateCompletionRate(session.exercises),
    });

    // 활성 세션 삭제
    await runSql('DELETE FROM active_session WHERE id = ?', [sessionId]);

    return record;
  },

  // 활성 세션 삭제 (저장 없이)
  async deleteActiveSession(): Promise<void> {
    await runSql('DELETE FROM active_session');
  },
};