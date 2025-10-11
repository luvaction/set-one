import { WorkoutRecord, CreateWorkoutRecordData, WorkoutExercise, CompletedSet } from "@/models";
import { getSingleItem, getMultipleItems, runSql } from "./db/sqlite";

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const generateExerciseId = (): string => {
  return `rec_ex_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const generateSetId = (): string => {
  return `set_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const nowTimestamp = (): number => Date.now();

// DB row 타입
interface WorkoutRecordRow {
  id: string;
  user_id: string;
  date: string;
  routine_id: string | null;
  routine_name: string;
  status: string;
  duration: number;
  total_volume: number | null;
  completion_rate: number;
  body_weight: number | null;
  memo: string | null;
  created_at: number;
  updated_at: number;
}

interface RecordedExerciseRow {
  id: string;
  workout_record_id: string;
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_weight: number | null;
  is_completed: number;
  order: number;
  created_at: number;
  updated_at: number;
}

interface CompletedSetRow {
  id: string;
  recorded_exercise_id: string;
  set_number: number;
  target_reps: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_duration_seconds: number | null;
  actual_reps: number;
  actual_duration_seconds: number | null;
  weight: number;
  is_completed: number;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}

const rowToCompletedSet = (row: CompletedSetRow): CompletedSet => {
  return {
    setNumber: row.set_number,
    targetReps: row.target_reps ?? undefined,
    targetRepsMin: row.target_reps_min ?? undefined,
    targetRepsMax: row.target_reps_max ?? undefined,
    targetDurationSeconds: row.target_duration_seconds ?? undefined,
    actualReps: row.actual_reps,
    actualDurationSeconds: row.actual_duration_seconds ?? undefined,
    weight: row.weight,
    isCompleted: row.is_completed === 1,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  };
};

const rowToWorkoutExercise = async (row: RecordedExerciseRow): Promise<WorkoutExercise> => {
  // 해당 운동의 세트 목록 가져오기
  const setRows = await getMultipleItems<CompletedSetRow>(
    'SELECT * FROM completed_sets WHERE recorded_exercise_id = ? ORDER BY set_number',
    [row.id]
  );

  return {
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    targetSets: row.target_sets,
    targetWeight: row.target_weight ?? undefined,
    sets: setRows.map(rowToCompletedSet),
    isCompleted: row.is_completed === 1,
  };
};

const rowToWorkoutRecord = async (row: WorkoutRecordRow): Promise<WorkoutRecord> => {
  // 해당 레코드의 운동 목록 가져오기
  const exerciseRows = await getMultipleItems<RecordedExerciseRow>(
    'SELECT * FROM recorded_exercises WHERE workout_record_id = ? ORDER BY "order"',
    [row.id]
  );

  const exercises = await Promise.all(exerciseRows.map(rowToWorkoutExercise));

  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    routineId: row.routine_id ?? undefined,
    routineName: row.routine_name,
    status: row.status as "in_progress" | "completed" | "stopped",
    exercises,
    duration: row.duration,
    totalVolume: row.total_volume ?? undefined,
    completionRate: row.completion_rate,
    bodyWeight: row.body_weight ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
};

// WorkoutRecord를 DB에 저장
const saveWorkoutRecord = async (userId: string, data: CreateWorkoutRecordData): Promise<string> => {
  const id = generateId();
  const createdAt = nowTimestamp();
  const updatedAt = createdAt;

  await runSql(
    `INSERT INTO workout_records (
      id, user_id, date, routine_id, routine_name, status, duration,
      total_volume, completion_rate, body_weight, memo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      data.date,
      data.routineId ?? null,
      data.routineName,
      data.status,
      data.duration,
      data.totalVolume ?? null,
      data.completionRate,
      data.bodyWeight ?? null,
      data.memo ?? null,
      createdAt,
      updatedAt,
    ]
  );

  // Exercises 저장
  for (let i = 0; i < data.exercises.length; i++) {
    const exercise = data.exercises[i];
    const exerciseId = generateExerciseId();

    // target_sets가 없으면 sets 배열 길이 또는 기본값 사용
    const targetSets = exercise.targetSets ?? exercise.sets?.length ?? 3;

    await runSql(
      `INSERT INTO recorded_exercises (
        id, workout_record_id, exercise_id, exercise_name, target_sets,
        target_weight, is_completed, "order", created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exerciseId,
        id,
        exercise.exerciseId,
        exercise.exerciseName,
        targetSets,
        exercise.targetWeight ?? null,
        exercise.isCompleted ? 1 : 0,
        i,
        createdAt,
        updatedAt,
      ]
    );

    // Sets 저장
    for (const set of exercise.sets) {
      await runSql(
        `INSERT INTO completed_sets (
          id, recorded_exercise_id, set_number, target_reps, target_reps_min,
          target_reps_max, target_duration_seconds, actual_reps, actual_duration_seconds,
          weight, is_completed, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateSetId(),
          exerciseId,
          set.setNumber,
          set.targetReps ?? null,
          set.targetRepsMin ?? null,
          set.targetRepsMax ?? null,
          set.targetDurationSeconds ?? null,
          set.actualReps,
          set.actualDurationSeconds ?? null,
          set.weight,
          set.isCompleted ? 1 : 0,
          set.completedAt ? new Date(set.completedAt).getTime() : null,
          createdAt,
          updatedAt,
        ]
      );
    }
  }

  return id;
};

export const workoutRecordService = {
  // 모든 운동 기록 가져오기
  async getAllRecords(): Promise<WorkoutRecord[]> {
    const rows = await getMultipleItems<WorkoutRecordRow>('SELECT * FROM workout_records ORDER BY date DESC');
    return Promise.all(rows.map(rowToWorkoutRecord));
  },

  // ID로 운동 기록 가져오기
  async getRecordById(id: string): Promise<WorkoutRecord | null> {
    const row = await getSingleItem<WorkoutRecordRow>(
      'SELECT * FROM workout_records WHERE id = ?',
      [id]
    );
    return row ? rowToWorkoutRecord(row) : null;
  },

  // 날짜로 운동 기록 가져오기
  async getRecordsByDate(date: string): Promise<WorkoutRecord[]> {
    const rows = await getMultipleItems<WorkoutRecordRow>(
      'SELECT * FROM workout_records WHERE date = ?',
      [date]
    );
    return Promise.all(rows.map(rowToWorkoutRecord));
  },

  // 날짜 범위로 운동 기록 가져오기
  async getRecordsByDateRange(startDate: string, endDate: string): Promise<WorkoutRecord[]> {
    const rows = await getMultipleItems<WorkoutRecordRow>(
      'SELECT * FROM workout_records WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return Promise.all(rows.map(rowToWorkoutRecord));
  },

  // 운동 기록 생성
  async createRecord(userId: string, data: CreateWorkoutRecordData): Promise<WorkoutRecord> {
    const id = await saveWorkoutRecord(userId, data);
    const record = await this.getRecordById(id);
    if (!record) {
      throw new Error('Failed to create workout record');
    }
    return record;
  },

  // 운동 기록 업데이트
  async updateRecord(id: string, data: Partial<CreateWorkoutRecordData>): Promise<WorkoutRecord> {
    const record = await this.getRecordById(id);
    if (!record) {
      throw new Error(`Workout record with id ${id} not found`);
    }

    const updatedAt = nowTimestamp();

    await runSql(
      `UPDATE workout_records SET
        date = ?, routine_id = ?, routine_name = ?, status = ?, duration = ?,
        total_volume = ?, completion_rate = ?, body_weight = ?, memo = ?, updated_at = ?
      WHERE id = ?`,
      [
        data.date ?? record.date,
        data.routineId ?? record.routineId ?? null,
        data.routineName ?? record.routineName,
        data.status ?? record.status,
        data.duration ?? record.duration,
        data.totalVolume ?? record.totalVolume ?? null,
        data.completionRate ?? record.completionRate,
        data.bodyWeight ?? record.bodyWeight ?? null,
        data.memo ?? record.memo ?? null,
        updatedAt,
        id,
      ]
    );

    // exercises 업데이트 (기존 삭제 후 재생성)
    if (data.exercises) {
      await runSql('DELETE FROM recorded_exercises WHERE workout_record_id = ?', [id]);
      // recorded_exercises 삭제 시 CASCADE로 completed_sets도 자동 삭제됨

      // 재생성
      const createdAt = nowTimestamp();
      for (let i = 0; i < data.exercises.length; i++) {
        const exercise = data.exercises[i];
        const exerciseId = generateExerciseId();

        // target_sets가 없으면 sets 배열 길이 또는 기본값 사용
        const targetSets = exercise.targetSets ?? exercise.sets?.length ?? 3;

        await runSql(
          `INSERT INTO recorded_exercises (
            id, workout_record_id, exercise_id, exercise_name, target_sets,
            target_weight, is_completed, "order", created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exerciseId,
            id,
            exercise.exerciseId,
            exercise.exerciseName,
            targetSets,
            exercise.targetWeight ?? null,
            exercise.isCompleted ? 1 : 0,
            i,
            createdAt,
            updatedAt,
          ]
        );

        // Sets 저장
        for (const set of exercise.sets) {
          await runSql(
            `INSERT INTO completed_sets (
              id, recorded_exercise_id, set_number, target_reps, target_reps_min,
              target_reps_max, target_duration_seconds, actual_reps, actual_duration_seconds,
              weight, is_completed, completed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateSetId(),
              exerciseId,
              set.setNumber,
              set.targetReps ?? null,
              set.targetRepsMin ?? null,
              set.targetRepsMax ?? null,
              set.targetDurationSeconds ?? null,
              set.actualReps,
              set.actualDurationSeconds ?? null,
              set.weight,
              set.isCompleted ? 1 : 0,
              set.completedAt ? new Date(set.completedAt).getTime() : null,
              createdAt,
              updatedAt,
            ]
          );
        }
      }
    }

    const updatedRecord = await this.getRecordById(id);
    if (!updatedRecord) {
      throw new Error('Failed to update workout record');
    }
    return updatedRecord;
  },

  // 운동 기록 삭제
  async deleteRecord(id: string): Promise<void> {
    await runSql('DELETE FROM workout_records WHERE id = ?', [id]);
    // recorded_exercises와 completed_sets는 CASCADE로 자동 삭제됨
  },

  // 특정 루틴으로 한 운동 기록 가져오기
  async getRecordsByRoutineId(routineId: string): Promise<WorkoutRecord[]> {
    const rows = await getMultipleItems<WorkoutRecordRow>(
      'SELECT * FROM workout_records WHERE routine_id = ?',
      [routineId]
    );
    return Promise.all(rows.map(rowToWorkoutRecord));
  },

  // 운동 기록이 있는 날짜 목록 가져오기 (캘린더 마킹용)
  async getRecordDates(): Promise<string[]> {
    const rows = await getMultipleItems<{ date: string }>(
      'SELECT DISTINCT date FROM workout_records ORDER BY date'
    );
    return rows.map(row => row.date);
  },

  // 모든 운동 기록 삭제
  async clearAllWorkoutRecords(): Promise<void> {
    await runSql('DELETE FROM workout_records');
    // CASCADE 설정으로 recorded_exercises와 completed_sets도 함께 삭제됩니다.
  },
};
