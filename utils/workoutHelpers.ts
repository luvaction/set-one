import { Routine, RoutineExercise } from "@/models";
import { getOrCreateUserId } from "@/utils/userIdHelper";

// 개별 운동을 Routine 객체로 변환
export const convertExerciseToRoutine = async (exercise: {
  id: string;
  name: string;
  defaultSets: number;
  defaultRepsMin?: number; // New
  defaultRepsMax?: number; // New
  defaultDurationSeconds?: number; // New
  targetMuscle?: string;
  difficulty?: string;
  restTime?: number; // New
}): Promise<Routine> => {
  const now = new Date().toISOString();
  const userId = await getOrCreateUserId();

  return {
    id: `temp_routine_${Date.now()}`,
    userId,
    name: exercise.name,
    exercises: [
      {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.defaultSets,
        repsMin: exercise.defaultRepsMin, // New
        repsMax: exercise.defaultRepsMax, // New
        durationSeconds: exercise.defaultDurationSeconds, // New
        targetMuscle: exercise.targetMuscle,
        difficulty: exercise.difficulty,
        restTime: exercise.restTime, // New
      },
    ],
    isRecommended: false,
    createdAt: now,
    updatedAt: now,
  };
};

// 템플릿 루틴을 Routine 객체로 변환
export const convertTemplateToRoutine = async (template: {
  id: number | string;
  name: string;
  exercises: any[];
  category?: string;
  purpose?: string;
  duration?: string;
  level?: string;
}): Promise<Routine> => {
  const now = new Date().toISOString();
  const userId = await getOrCreateUserId();

  const exercises: RoutineExercise[] = template.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets || ex.defaultSets || 3,
    repsMin: ex.repsMin || ex.defaultRepsMin, // New
    repsMax: ex.repsMax || ex.defaultRepsMax, // New
    durationSeconds: ex.durationSeconds || ex.defaultDurationSeconds, // New
    targetMuscle: ex.targetMuscle,
    difficulty: ex.difficulty,
    restTime: ex.restTime,
  }));

  return {
    id: `temp_routine_${Date.now()}_${template.id}`,
    userId,
    name: template.name,
    description: `${template.category || ""} ${template.duration || ""}`.trim(),
    exercises,
    isRecommended: false,
    category: template.category,
    createdAt: now,
    updatedAt: now,
  };
};
