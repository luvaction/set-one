import { Routine, CreateRoutineData, RoutineExercise } from "@/models";
import { getSingleItem, getMultipleItems, runSql } from "./db/sqlite";
import { RECOMMENDED_ROUTINES } from "@/data/recommendedRoutines";

const generateId = (): string => {
  return `routine_user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const generateExerciseId = (): string => {
  return `routine_ex_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const nowTimestamp = (): number => Date.now();

// DB row 타입
interface RoutineRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_recommended: number;
  category: string | null;
  last_used: string | null;
  duration: string | null;
  created_at: number;
  updated_at: number;
}

interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  exercise_id: string;
  name: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  target_weight: number | null;
  target_muscle: string | null;
  difficulty: string | null;
  rest_time: number | null;
  order: number;
  created_at: number;
  updated_at: number;
}

const rowToRoutineExercise = (row: RoutineExerciseRow): RoutineExercise => {
  return {
    id: row.exercise_id,
    name: row.name,
    sets: row.sets,
    repsMin: row.reps_min ?? undefined,
    repsMax: row.reps_max ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    targetWeight: row.target_weight ?? undefined,
    targetMuscle: row.target_muscle ?? undefined,
    difficulty: row.difficulty ?? undefined,
    restTime: row.rest_time ?? undefined,
  };
};

const rowToRoutine = async (row: RoutineRow): Promise<Routine> => {
  // 해당 루틴의 운동 목록 가져오기
  const exerciseRows = await getMultipleItems<RoutineExerciseRow>(
    'SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY "order"',
    [row.id]
  );

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    exercises: exerciseRows.map(rowToRoutineExercise),
    isRecommended: row.is_recommended === 1,
    category: row.category ?? undefined,
    lastUsed: row.last_used ?? undefined,
    duration: row.duration ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
};

// 루틴 exercises를 DB에 저장
const saveRoutineExercises = async (routineId: string, exercises: RoutineExercise[]): Promise<void> => {
  const createdAt = nowTimestamp();
  const updatedAt = createdAt;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await runSql(
      `INSERT INTO routine_exercises (
        id, routine_id, exercise_id, name, sets, reps_min, reps_max,
        duration_seconds, target_weight, target_muscle, difficulty, rest_time,
        "order", created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateExerciseId(),
        routineId,
        ex.id,
        ex.name,
        ex.sets,
        ex.repsMin ?? null,
        ex.repsMax ?? null,
        ex.durationSeconds ?? null,
        ex.targetWeight ?? null,
        ex.targetMuscle ?? null,
        ex.difficulty ?? null,
        ex.restTime ?? null,
        i,
        createdAt,
        updatedAt,
      ]
    );
  }
};

export const routineService = {
  // 모든 루틴 가져오기 (추천 + 사용자)
  async getAllRoutines(): Promise<Routine[]> {
    const userRoutineRows = await getMultipleItems<RoutineRow>(
      'SELECT * FROM routines WHERE is_recommended = 0'
    );

    const userRoutines = await Promise.all(userRoutineRows.map(rowToRoutine));

    // 추천 루틴을 Routine 타입으로 변환
    const recommendedRoutines: Routine[] = RECOMMENDED_ROUTINES.map((routine) => ({
      ...routine,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));

    return [...recommendedRoutines, ...userRoutines];
  },

  // ID로 루틴 가져오기
  async getRoutineById(id: string): Promise<Routine | null> {
    // 먼저 DB에서 찾기
    const row = await getSingleItem<RoutineRow>(
      'SELECT * FROM routines WHERE id = ?',
      [id]
    );

    if (row) {
      return rowToRoutine(row);
    }

    // DB에 없으면 추천 루틴에서 찾기
    const recommended = RECOMMENDED_ROUTINES.find((r) => r.id === id);
    if (recommended) {
      return {
        ...recommended,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
    }

    return null;
  },

  // 사용자 루틴 생성
  async createRoutine(userId: string, data: CreateRoutineData): Promise<Routine> {
    const id = generateId();
    const createdAt = nowTimestamp();
    const updatedAt = createdAt;

    await runSql(
      `INSERT INTO routines (
        id, user_id, name, description, is_recommended, category, last_used, duration,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.name,
        data.description ?? null,
        0, // 사용자 루틴은 무조건 false
        data.category ?? null,
        data.lastUsed ?? null,
        data.duration ?? null,
        createdAt,
        updatedAt,
      ]
    );

    // exercises 저장
    await saveRoutineExercises(id, data.exercises);

    return {
      id,
      userId,
      ...data,
      isRecommended: false,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },

  // 사용자 루틴 업데이트
  async updateRoutine(id: string, data: Partial<CreateRoutineData>): Promise<Routine> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error(`Routine with id ${id} not found`);
    }

    if (routine.isRecommended) {
      throw new Error("Cannot update recommended routine. Create a copy instead.");
    }

    const updatedAt = nowTimestamp();

    await runSql(
      `UPDATE routines SET
        name = ?, description = ?, category = ?, last_used = ?, duration = ?, updated_at = ?
      WHERE id = ?`,
      [
        data.name ?? routine.name,
        data.description ?? routine.description ?? null,
        data.category ?? routine.category ?? null,
        data.lastUsed ?? routine.lastUsed ?? null,
        data.duration ?? routine.duration ?? null,
        updatedAt,
        id,
      ]
    );

    // exercises 업데이트 (기존 삭제 후 재생성)
    if (data.exercises) {
      await runSql('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
      await saveRoutineExercises(id, data.exercises);
    }

    return {
      ...routine,
      ...data,
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },

  // 사용자 루틴 삭제
  async deleteRoutine(id: string): Promise<void> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error(`Routine with id ${id} not found`);
    }

    if (routine.isRecommended) {
      throw new Error("Cannot delete recommended routine.");
    }

    await runSql('DELETE FROM routines WHERE id = ?', [id]);
    // routine_exercises는 CASCADE로 자동 삭제됨
  },

  // 사용자 루틴만 가져오기
  async getUserRoutines(): Promise<Routine[]> {
    const rows = await getMultipleItems<RoutineRow>(
      'SELECT * FROM routines WHERE is_recommended = 0'
    );
    return Promise.all(rows.map(rowToRoutine));
  },

  // 추천 루틴만 가져오기
  async getRecommendedRoutines(): Promise<Routine[]> {
    return RECOMMENDED_ROUTINES.map((routine) => ({
      ...routine,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));
  },

  

  // 루틴 마지막 사용 시간 업데이트
  async updateLastUsed(id: string): Promise<void> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      return;
    }

    // 추천 루틴은 업데이트하지 않음
    if (routine.isRecommended) {
      return;
    }

    const updatedAt = nowTimestamp();
    const lastUsed = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    await runSql(
      'UPDATE routines SET last_used = ?, updated_at = ? WHERE id = ?',
      [lastUsed, updatedAt, id]
    );
  },

  // 루틴에 운동 추가
  async addExerciseToRoutine(
    routineId: string,
    exercise: {
      id: string;
      name: string;
      sets: number;
      repsMin?: number;
      repsMax?: number;
      durationSeconds?: number;
      targetMuscle?: string;
      difficulty?: string;
      restTime?: number;
    }
  ): Promise<Routine> {
    const routine = await this.getRoutineById(routineId);
    if (!routine) {
      throw new Error(`Routine with id ${routineId} not found`);
    }

    if (routine.isRecommended) {
      throw new Error("Cannot add exercise to recommended routine. Create a copy instead.");
    }

    // 이미 같은 운동이 있는지 확인
    const existingExercise = routine.exercises.find((ex) => ex.id === exercise.id);
    if (existingExercise) {
      throw new Error(`Exercise "${exercise.name}" already exists in this routine`);
    }

    const updatedExercises = [...routine.exercises, exercise];

    return await this.updateRoutine(routineId, { exercises: updatedExercises });
  },

  // 루틴 순서 변경 (현재는 지원하지 않음 - 나중에 구현 가능)
  async reorderRoutines(routineIds: string[]): Promise<void> {
    // SQLite에서는 루틴의 순서를 별도 컬럼으로 관리하지 않음
    // 필요시 order 컬럼 추가 필요
    console.warn('reorderRoutines is not implemented for SQLite');
  },
};
