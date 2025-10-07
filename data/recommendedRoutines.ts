import { Routine } from "@/models";

// 추천 루틴 (읽기 전용, 삭제 불가)
export const RECOMMENDED_ROUTINES: Omit<Routine, "createdAt" | "updatedAt">[] = [
  {
    id: "routine_beginner_fullbody",
    name: "초보자 전신 운동",
    description: "헬스 입문자를 위한 기본 전신 운동 루틴",
    isRecommended: true,
    exercises: [
      {
        exerciseId: "ex_pushup",
        order: 1,
        restTime: 60,
        sets: [
          { reps: 10, weight: 0, type: "normal" },
          { reps: 10, weight: 0, type: "normal" },
          { reps: 10, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_squat",
        order: 2,
        restTime: 60,
        sets: [
          { reps: 15, weight: 0, type: "normal" },
          { reps: 15, weight: 0, type: "normal" },
          { reps: 15, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_plank",
        order: 3,
        restTime: 60,
        sets: [
          { reps: 30, weight: 0, type: "normal" }, // 30초
          { reps: 30, weight: 0, type: "normal" },
          { reps: 30, weight: 0, type: "normal" },
        ],
      },
    ],
  },
  {
    id: "routine_chest_day",
    name: "가슴 집중 운동",
    description: "가슴 근육 발달을 위한 루틴",
    isRecommended: true,
    exercises: [
      {
        exerciseId: "ex_bench_press",
        order: 1,
        restTime: 90,
        sets: [
          { reps: 12, weight: 60, type: "warmup" },
          { reps: 10, weight: 80, type: "normal" },
          { reps: 8, weight: 90, type: "normal" },
          { reps: 6, weight: 100, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_dumbbell_press",
        order: 2,
        restTime: 60,
        sets: [
          { reps: 12, weight: 20, type: "normal" },
          { reps: 10, weight: 25, type: "normal" },
          { reps: 8, weight: 30, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_pushup",
        order: 3,
        restTime: 60,
        sets: [
          { reps: 15, weight: 0, type: "normal" },
          { reps: 12, weight: 0, type: "normal" },
          { reps: 10, weight: 0, type: "failure" },
        ],
      },
    ],
  },
  {
    id: "routine_back_day",
    name: "등 집중 운동",
    description: "넓은 등을 만들기 위한 루틴",
    isRecommended: true,
    exercises: [
      {
        exerciseId: "ex_deadlift",
        order: 1,
        restTime: 120,
        sets: [
          { reps: 10, weight: 100, type: "warmup" },
          { reps: 8, weight: 140, type: "normal" },
          { reps: 6, weight: 160, type: "normal" },
          { reps: 5, weight: 180, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_pullup",
        order: 2,
        restTime: 90,
        sets: [
          { reps: 8, weight: 0, type: "normal" },
          { reps: 6, weight: 0, type: "normal" },
          { reps: 5, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_bent_over_row",
        order: 3,
        restTime: 60,
        sets: [
          { reps: 12, weight: 60, type: "normal" },
          { reps: 10, weight: 70, type: "normal" },
          { reps: 8, weight: 80, type: "normal" },
        ],
      },
    ],
  },
  {
    id: "routine_leg_day",
    name: "하체 집중 운동",
    description: "강한 하체를 위한 루틴",
    isRecommended: true,
    exercises: [
      {
        exerciseId: "ex_barbell_squat",
        order: 1,
        restTime: 120,
        sets: [
          { reps: 10, weight: 80, type: "warmup" },
          { reps: 8, weight: 120, type: "normal" },
          { reps: 6, weight: 140, type: "normal" },
          { reps: 5, weight: 160, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_lunge",
        order: 2,
        restTime: 60,
        sets: [
          { reps: 12, weight: 0, type: "normal" },
          { reps: 12, weight: 0, type: "normal" },
          { reps: 12, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_leg_raise",
        order: 3,
        restTime: 45,
        sets: [
          { reps: 15, weight: 0, type: "normal" },
          { reps: 12, weight: 0, type: "normal" },
          { reps: 10, weight: 0, type: "normal" },
        ],
      },
    ],
  },
  {
    id: "routine_home_workout",
    name: "홈트레이닝",
    description: "집에서 기구 없이 할 수 있는 운동",
    isRecommended: true,
    exercises: [
      {
        exerciseId: "ex_pushup",
        order: 1,
        restTime: 60,
        sets: [
          { reps: 15, weight: 0, type: "normal" },
          { reps: 12, weight: 0, type: "normal" },
          { reps: 10, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_squat",
        order: 2,
        restTime: 60,
        sets: [
          { reps: 20, weight: 0, type: "normal" },
          { reps: 18, weight: 0, type: "normal" },
          { reps: 15, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_plank",
        order: 3,
        restTime: 45,
        sets: [
          { reps: 45, weight: 0, type: "normal" },
          { reps: 40, weight: 0, type: "normal" },
          { reps: 35, weight: 0, type: "normal" },
        ],
      },
      {
        exerciseId: "ex_crunch",
        order: 4,
        restTime: 45,
        sets: [
          { reps: 20, weight: 0, type: "normal" },
          { reps: 18, weight: 0, type: "normal" },
          { reps: 15, weight: 0, type: "normal" },
        ],
      },
    ],
  },
];
