import { Exercise, CreateExerciseData, STORAGE_KEYS } from "@/models";
import { storage } from "./storage/asyncStorage";
import { DEFAULT_EXERCISES } from "@/data/defaultExercises";

const generateId = (): string => {
  return `ex_custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const now = (): string => new Date().toISOString();

export const exerciseService = {
  // 모든 운동 가져오기 (기본 + 커스텀 - 숨김)
  async getAllExercises(): Promise<Exercise[]> {
    const [customExercises, hiddenIds] = await Promise.all([
      storage.getArray<Exercise>(STORAGE_KEYS.CUSTOM_EXERCISES),
      storage.getArray<string>(STORAGE_KEYS.HIDDEN_EXERCISE_IDS),
    ]);

    // 기본 운동을 Exercise 타입으로 변환 (createdAt, updatedAt 추가)
    const defaultExercises: Exercise[] = DEFAULT_EXERCISES.map((ex) => ({
      ...ex,
      createdAt: "2024-01-01T00:00:00.000Z", // 기본값
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));

    // 기본 운동에서 숨긴 운동 제외
    const visibleDefaultExercises = defaultExercises.filter(
      (ex) => !hiddenIds.includes(ex.id)
    );

    // 기본 + 커스텀 합치기
    return [...visibleDefaultExercises, ...customExercises];
  },

  // ID로 운동 가져오기
  async getExerciseById(id: string): Promise<Exercise | null> {
    const exercises = await this.getAllExercises();
    return exercises.find((e) => e.id === id) || null;
  },

  // 커스텀 운동 생성
  async createExercise(data: CreateExerciseData): Promise<Exercise> {
    const newExercise: Exercise = {
      id: generateId(),
      ...data,
      isCustom: true, // 사용자가 추가한 운동은 무조건 커스텀
      createdAt: now(),
      updatedAt: now(),
    };
    await storage.addToArray(STORAGE_KEYS.CUSTOM_EXERCISES, newExercise);
    return newExercise;
  },

  // 커스텀 운동 업데이트 (기본 운동은 수정 불가)
  async updateExercise(id: string, data: Partial<CreateExerciseData>): Promise<Exercise> {
    const exercise = await this.getExerciseById(id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    if (!exercise.isCustom) {
      throw new Error("Cannot update default exercise. Create a copy instead.");
    }

    const updatedExercise: Exercise = {
      ...exercise,
      ...data,
      updatedAt: now(),
    };

    await storage.updateInArray(STORAGE_KEYS.CUSTOM_EXERCISES, updatedExercise);
    return updatedExercise;
  },

  // 커스텀 운동 삭제 (기본 운동은 삭제 불가, 숨기기만 가능)
  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.getExerciseById(id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    if (!exercise.isCustom) {
      throw new Error("Cannot delete default exercise. Use hideExercise instead.");
    }

    await storage.removeFromArray(STORAGE_KEYS.CUSTOM_EXERCISES, id);
  },

  // 기본 운동 숨기기
  async hideExercise(id: string): Promise<void> {
    const hiddenIds = await storage.getArray<string>(STORAGE_KEYS.HIDDEN_EXERCISE_IDS);
    if (!hiddenIds.includes(id)) {
      hiddenIds.push(id);
      await storage.setArray(STORAGE_KEYS.HIDDEN_EXERCISE_IDS, hiddenIds);
    }
  },

  // 기본 운동 숨김 해제
  async unhideExercise(id: string): Promise<void> {
    const hiddenIds = await storage.getArray<string>(STORAGE_KEYS.HIDDEN_EXERCISE_IDS);
    const filtered = hiddenIds.filter((hiddenId) => hiddenId !== id);
    await storage.setArray(STORAGE_KEYS.HIDDEN_EXERCISE_IDS, filtered);
  },

  // 숨긴 운동 ID 목록 가져오기
  async getHiddenExerciseIds(): Promise<string[]> {
    return await storage.getArray<string>(STORAGE_KEYS.HIDDEN_EXERCISE_IDS);
  },

  // 카테고리별 운동 가져오기
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    const exercises = await this.getAllExercises();
    return exercises.filter((e) => e.category === category);
  },

  // 사용자 커스텀 운동만 가져오기
  async getCustomExercises(): Promise<Exercise[]> {
    return await storage.getArray<Exercise>(STORAGE_KEYS.CUSTOM_EXERCISES);
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
