import { Routine, CreateRoutineData, STORAGE_KEYS } from "@/models";
import { storage } from "./storage/asyncStorage";
import { RECOMMENDED_ROUTINES } from "@/data/recommendedRoutines";

const generateId = (): string => {
  return `routine_user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const now = (): string => new Date().toISOString();

export const routineService = {
  // 모든 루틴 가져오기 (추천 + 사용자)
  async getAllRoutines(): Promise<Routine[]> {
    const userRoutines = await storage.getArray<Routine>(STORAGE_KEYS.USER_ROUTINES);

    // 추천 루틴을 Routine 타입으로 변환
    const recommendedRoutines: Routine[] = RECOMMENDED_ROUTINES.map((routine) => ({
      ...routine,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));

    // 추천 루틴 + 사용자 루틴
    return [...recommendedRoutines, ...userRoutines];
  },

  // ID로 루틴 가져오기
  async getRoutineById(id: string): Promise<Routine | null> {
    const routines = await this.getAllRoutines();
    return routines.find((r) => r.id === id) || null;
  },

  // 사용자 루틴 생성
  async createRoutine(data: CreateRoutineData): Promise<Routine> {
    const newRoutine: Routine = {
      id: generateId(),
      ...data,
      isRecommended: false, // 사용자 루틴은 무조건 false
      createdAt: now(),
      updatedAt: now(),
    };
    await storage.addToArray(STORAGE_KEYS.USER_ROUTINES, newRoutine);
    return newRoutine;
  },

  // 사용자 루틴 업데이트 (추천 루틴은 수정 불가)
  async updateRoutine(id: string, data: Partial<CreateRoutineData>): Promise<Routine> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error(`Routine with id ${id} not found`);
    }

    if (routine.isRecommended) {
      throw new Error("Cannot update recommended routine. Create a copy instead.");
    }

    const updatedRoutine: Routine = {
      ...routine,
      ...data,
      updatedAt: now(),
    };

    await storage.updateInArray(STORAGE_KEYS.USER_ROUTINES, updatedRoutine);
    return updatedRoutine;
  },

  // 사용자 루틴 삭제 (추천 루틴은 삭제 불가)
  async deleteRoutine(id: string): Promise<void> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error(`Routine with id ${id} not found`);
    }

    if (routine.isRecommended) {
      throw new Error("Cannot delete recommended routine.");
    }

    await storage.removeFromArray(STORAGE_KEYS.USER_ROUTINES, id);
  },

  // 사용자 루틴만 가져오기
  async getUserRoutines(): Promise<Routine[]> {
    return await storage.getArray<Routine>(STORAGE_KEYS.USER_ROUTINES);
  },

  // 추천 루틴만 가져오기
  async getRecommendedRoutines(): Promise<Routine[]> {
    return RECOMMENDED_ROUTINES.map((routine) => ({
      ...routine,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }));
  },

  // 추천 루틴을 복사해서 사용자 루틴으로 생성
  async copyToUserRoutine(id: string): Promise<Routine> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error(`Routine with id ${id} not found`);
    }

    const userCopy: CreateRoutineData = {
      name: `${routine.name} (사본)`,
      description: routine.description,
      exercises: routine.exercises,
      isRecommended: false,
    };

    return await this.createRoutine(userCopy);
  },

  // 루틴 마지막 사용 시간 업데이트 (사용자 루틴만)
  async updateLastUsed(id: string): Promise<void> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      return; // 루틴이 없으면 무시
    }

    // 추천 루틴은 업데이트하지 않음
    if (routine.isRecommended) {
      return;
    }

    const updatedRoutine: Routine = {
      ...routine,
      lastUsed: new Date().toISOString().split("T")[0], // YYYY-MM-DD 형식
      updatedAt: now(),
    };

    await storage.updateInArray(STORAGE_KEYS.USER_ROUTINES, updatedRoutine);
  },

  // 루틴에 운동 추가 (사용자 루틴만)
  async addExerciseToRoutine(routineId: string, exercise: { id: string; name: string; sets: number; reps: string; targetMuscle?: string; difficulty?: string }): Promise<Routine> {
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

    const updatedRoutine: Routine = {
      ...routine,
      exercises: [
        ...routine.exercises,
        {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          targetMuscle: exercise.targetMuscle,
          difficulty: exercise.difficulty,
        },
      ],
      updatedAt: now(),
    };

    await storage.updateInArray(STORAGE_KEYS.USER_ROUTINES, updatedRoutine);
    return updatedRoutine;
  },

  // 루틴 순서 변경 (사용자 루틴만)
  async reorderRoutines(routineIds: string[]): Promise<void> {
    const userRoutines = await this.getUserRoutines();

    // ID 순서대로 루틴 재정렬
    const reorderedRoutines = routineIds
      .map(id => userRoutines.find(r => r.id === id))
      .filter((r): r is Routine => r !== undefined);

    // 전체 루틴 배열 교체
    await storage.setArray(STORAGE_KEYS.USER_ROUTINES, reorderedRoutines);
  },
};
