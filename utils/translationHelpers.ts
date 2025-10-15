import { TFunction } from "i18next";

export const getExerciseName = (t: TFunction, exerciseId: string, exerciseName?: string) => {
    if (exerciseId.startsWith("ex_custom_")) {
      return exerciseName || exerciseId;
    }
    return t(`exercises.${exerciseId}`);
  };
  
  export const getRoutineName = (t: TFunction, routineId?: string, routineName?: string) => {
    if (routineId && routineId.startsWith("routine_") && !routineId.startsWith("routine_user_")) {
      return t(`routines.${routineId}`);
    }
    return routineName || "";
  };
  
  export const getMuscleGroupKey = (targetMuscle: string | undefined) => {
    if (!targetMuscle) return "fullBody";
    const map: Record<string, string> = {
      가슴: "chest",
      삼두: "triceps",
      등: "back",
      이두: "biceps",
      하체: "legs",
      코어: "core",
      "가슴 상부": "chestUpper",
      "가슴 하부": "chestLower",
      "등/하체": "backLegs",
      햄스트링: "hamstring",
      전신: "fullBody",
      어깨: "shoulder",
    };
    return map[targetMuscle] || targetMuscle;
  };
  
  export const getDifficultyKey = (difficulty: string | undefined) => {
    if (!difficulty) return "beginner";
    const map: Record<string, string> = {
      초급: "beginner",
      중급: "intermediate",
      고급: "advanced",
    };
    return map[difficulty] || difficulty;
  };
  
  export const formatReps = (t: TFunction, repsMin?: number, repsMax?: number, durationSeconds?: number): string => {
    if (durationSeconds) {
      return t("workoutSession.secondsUnit", { count: durationSeconds });
    }
    if (repsMin && repsMax) {
      if (repsMin === repsMax) {
        return t("workoutSession.repsUnit", { count: repsMin });
      }
      return `${repsMin}-${repsMax}`;
    }
    if (repsMin) {
      return t("workoutSession.repsUnit", { count: repsMin });
    }
    return ""; // Fallback
  };
  