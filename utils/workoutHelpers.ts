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

  // reps 정보가 전혀 없으면 기본값 사용
  const hasRepsInfo = exercise.defaultRepsMin !== undefined ||
                       exercise.defaultRepsMax !== undefined ||
                       exercise.defaultDurationSeconds !== undefined;

  return {
    id: `temp_routine_${Date.now()}`,
    userId,
    name: exercise.name,
    exercises: [
      {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.defaultSets || 3, // 기본값 추가
        repsMin: exercise.defaultRepsMin || (hasRepsInfo ? undefined : 10),
        repsMax: exercise.defaultRepsMax || (hasRepsInfo ? undefined : 12),
        durationSeconds: exercise.defaultDurationSeconds,
        targetMuscle: exercise.targetMuscle,
        difficulty: exercise.difficulty,
        restTime: exercise.restTime,
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

  const exercises: RoutineExercise[] = template.exercises.map((ex) => {
    // reps 정보가 전혀 없으면 기본값 사용
    const hasRepsInfo = ex.repsMin !== undefined ||
                         ex.repsMax !== undefined ||
                         ex.defaultRepsMin !== undefined ||
                         ex.defaultRepsMax !== undefined ||
                         ex.durationSeconds !== undefined ||
                         ex.defaultDurationSeconds !== undefined;

    return {
      id: ex.id,
      name: ex.name,
      sets: ex.sets || ex.defaultSets || 3,
      repsMin: ex.repsMin || ex.defaultRepsMin || (hasRepsInfo ? undefined : 10),
      repsMax: ex.repsMax || ex.defaultRepsMax || (hasRepsInfo ? undefined : 12),
      durationSeconds: ex.durationSeconds || ex.defaultDurationSeconds,
      targetMuscle: ex.targetMuscle,
      difficulty: ex.difficulty,
      restTime: ex.restTime,
    };
  });

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
