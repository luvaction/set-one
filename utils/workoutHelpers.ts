import { Routine, RoutineExercise } from "@/models";

// 개별 운동을 Routine 객체로 변환
export const convertExerciseToRoutine = (exercise: {
  id: string;
  name: string;
  defaultSets: number;
  defaultReps: string;
  targetMuscle?: string;
  difficulty?: string;
}): Routine => {
  const now = new Date().toISOString();

  return {
    id: `temp_routine_${Date.now()}`,
    name: exercise.name,
    exercises: [
      {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        targetMuscle: exercise.targetMuscle,
        difficulty: exercise.difficulty,
      },
    ],
    isRecommended: false,
    createdAt: now,
    updatedAt: now,
  };
};

// 템플릿 루틴을 Routine 객체로 변환
export const convertTemplateToRoutine = (template: {
  id: number | string;
  name: string;
  exercises: any[];
  category?: string;
  purpose?: string;
  duration?: string;
  level?: string;
}): Routine => {
  const now = new Date().toISOString();

  const exercises: RoutineExercise[] = template.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets || ex.defaultSets || 3,
    reps: ex.reps || ex.defaultReps || "10",
    targetMuscle: ex.targetMuscle,
    difficulty: ex.difficulty,
    restTime: ex.restTime,
  }));

  return {
    id: `temp_routine_${Date.now()}_${template.id}`,
    name: template.name,
    description: `${template.category || ""} ${template.duration || ""}`.trim(),
    exercises,
    isRecommended: false,
    category: template.category,
    createdAt: now,
    updatedAt: now,
  };
};
