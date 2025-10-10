import { Exercise, CreateExerciseData } from "@/models";
import { getSingleItem, getMultipleItems, runSql } from "./db/sqlite";
import { DEFAULT_EXERCISES } from "@/data/defaultExercises";

const generateId = (): string => {
  return `ex_custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const nowTimestamp = (): number => Date.now();

// DB row 타입
interface CustomExerciseRow {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  equipment: string | null; // JSON string
  muscle_groups: string | null; // JSON string
  created_at: number;
  updated_at: number;
}

const rowToExercise = (row: CustomExerciseRow): Exercise => {
  return {
    id: row.id,
    name: row.name,
    category: row.category || '',
    subcategory: row.subcategory ?? undefined,
    description: row.description ?? undefined,
    equipment: row.equipment ? JSON.parse(row.equipment) : undefined,
    muscleGroups: row.muscle_groups ? JSON.parse(row.muscle_groups) : [],
    isCustom: true,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
};

export const exerciseService = {
  // 모든 운동 가져오기 (기본 + 커스텀 - 숨김)
  async getAllExercises(): Promise<Exercise[]> {
    const [customRows, hiddenIds] = await Promise.all([
      getMultipleItems<CustomExerciseRow>('SELECT * FROM custom_exercises'),
      getMultipleItems<{ exercise_id: string }>('SELECT exercise_id FROM hidden_exercises'),
    ]);

    const customExercises = customRows.map(rowToExercise);

    // 기본 운동을 Exercise 타입으로 변환
    const defaultExercises: Exercise[] = DEFAULT_EXERCISES.map((ex) => ({
      ...ex,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));

    // 숨긴 운동 ID 목록
    const hiddenIdList = hiddenIds.map(row => row.exercise_id);

    // 기본 운동에서 숨긴 운동 제외
    const visibleDefaultExercises = defaultExercises.filter(
      (ex) => !hiddenIdList.includes(ex.id)
    );

    return [...visibleDefaultExercises, ...customExercises];
  },

  // ID로 운동 가져오기
  async getExerciseById(id: string): Promise<Exercise | null> {
    const exercises = await this.getAllExercises();
    return exercises.find((e) => e.id === id) || null;
  },

  // 커스텀 운동 생성
  async createExercise(data: CreateExerciseData): Promise<Exercise> {
    const id = generateId();
    const createdAt = nowTimestamp();
    const updatedAt = createdAt;

    await runSql(
      `INSERT INTO custom_exercises (
        id, name, category, subcategory, description, equipment, muscle_groups, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.category || null,
        data.subcategory || null,
        data.description || null,
        JSON.stringify(data.equipment || []),
        JSON.stringify(data.muscleGroups || []),
        createdAt,
        updatedAt,
      ]
    );

    return {
      id,
      ...data,
      isCustom: true,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },

  // 커스텀 운동 업데이트
  async updateExercise(id: string, data: Partial<CreateExerciseData>): Promise<Exercise> {
    const exercise = await this.getExerciseById(id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    if (!exercise.isCustom) {
      throw new Error("Cannot update default exercise. Create a copy instead.");
    }

    const updatedAt = nowTimestamp();

    await runSql(
      `UPDATE custom_exercises SET
        name = ?, category = ?, subcategory = ?, description = ?,
        equipment = ?, muscle_groups = ?, updated_at = ?
      WHERE id = ?`,
      [
        data.name ?? exercise.name,
        data.category ?? exercise.category,
        data.subcategory ?? exercise.subcategory,
        data.description ?? exercise.description,
        JSON.stringify(data.equipment ?? exercise.equipment),
        JSON.stringify(data.muscleGroups ?? exercise.muscleGroups),
        updatedAt,
        id,
      ]
    );

    return {
      ...exercise,
      ...data,
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },

  // 커스텀 운동 삭제
  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.getExerciseById(id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    if (!exercise.isCustom) {
      throw new Error("Cannot delete default exercise. Use hideExercise instead.");
    }

    await runSql('DELETE FROM custom_exercises WHERE id = ?', [id]);
  },

  // 기본 운동 숨기기
  async hideExercise(id: string): Promise<void> {
    const existing = await getSingleItem<{ exercise_id: string }>(
      'SELECT exercise_id FROM hidden_exercises WHERE exercise_id = ?',
      [id]
    );

    if (!existing) {
      await runSql(
        'INSERT INTO hidden_exercises (exercise_id, created_at) VALUES (?, ?)',
        [id, nowTimestamp()]
      );
    }
  },

  // 기본 운동 숨김 해제
  async unhideExercise(id: string): Promise<void> {
    await runSql('DELETE FROM hidden_exercises WHERE exercise_id = ?', [id]);
  },

  // 숨긴 운동 ID 목록 가져오기
  async getHiddenExerciseIds(): Promise<string[]> {
    const rows = await getMultipleItems<{ exercise_id: string }>(
      'SELECT exercise_id FROM hidden_exercises'
    );
    return rows.map(row => row.exercise_id);
  },

  // 카테고리별 운동 가져오기
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    const exercises = await this.getAllExercises();
    return exercises.filter((e) => e.category === category);
  },

  // 사용자 커스텀 운동만 가져오기
  async getCustomExercises(): Promise<Exercise[]> {
    const rows = await getMultipleItems<CustomExerciseRow>('SELECT * FROM custom_exercises');
    return rows.map(rowToExercise);
  },

  // 기본 운동을 복사해서 커스텀 운동으로 생성
  async copyToCustom(id: string): Promise<Exercise> {
    const exercise = await this.getExerciseById(id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    const customCopy: CreateExerciseData = {
      name: `${exercise.name} (사본)`,
      category: exercise.category,
      subcategory: exercise.subcategory,
      description: exercise.description,
      equipment: exercise.equipment,
      muscleGroups: exercise.muscleGroups,
      isCustom: true,
    };

    return await this.createExercise(customCopy);
  },
};
