import { storage } from "@/services/storage/asyncStorage";
import { WorkoutRecord, STORAGE_KEYS } from "@/models";

// 임시 과거 데이터 생성 (통계 확인용)
export async function generateMockWorkoutData() {
  const mockRecords: WorkoutRecord[] = [];

  const exercises = [
    { name: "벤치프레스", weight: 60, reps: 10 },
    { name: "스쿼트", weight: 80, reps: 12 },
    { name: "데드리프트", weight: 100, reps: 8 },
    { name: "숄더프레스", weight: 40, reps: 10 },
    { name: "바벨로우", weight: 50, reps: 12 },
    { name: "런닝", weight: 0, reps: 30 }, // 시간(분)
    { name: "사이클", weight: 0, reps: 20 },
  ];

  // 최근 30일 데이터 생성
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];

    // 주 3-4회 운동
    if (i % 2 === 0 || i % 3 === 0) {
      const selectedExercises = exercises
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 3); // 3-5개 운동

      const workoutExercises = selectedExercises.map((ex, idx) => ({
        id: `${dateString}-ex-${idx}`,
        exerciseName: ex.name,
        sets: Array.from({ length: 3 }, (_, setIdx) => ({
          id: `${dateString}-ex-${idx}-set-${setIdx}`,
          targetReps: ex.reps,
          targetWeight: ex.weight,
          actualReps: ex.reps + Math.floor(Math.random() * 3) - 1,
          weight: ex.weight + Math.floor(Math.random() * 10) - 5,
          isCompleted: true,
        })),
        restTime: 60,
      }));

      const totalVolume = workoutExercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets.reduce((s, set) => s + (set.isCompleted ? set.weight * set.actualReps : 0), 0),
        0
      );

      const totalSets = workoutExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      const completedSets = workoutExercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
        0
      );

      mockRecords.push({
        id: `mock-${dateString}`,
        routineId: "mock-routine",
        routineName: "임시 루틴",
        date: dateString,
        startTime: `${9 + Math.floor(Math.random() * 3)}:00`,
        endTime: `${10 + Math.floor(Math.random() * 3)}:30`,
        duration: 60 + Math.floor(Math.random() * 60),
        exercises: workoutExercises,
        totalVolume,
        completionRate: Math.round((completedSets / totalSets) * 100),
        status: "completed",
        notes: "",
      });
    }
  }

  // 기존 데이터 가져오기
  const existingRecords = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);

  // 임시 데이터와 병합 (중복 제거)
  const allRecords = [...mockRecords, ...existingRecords.filter(r => !r.id.startsWith('mock-'))];

  // 저장
  await storage.setArray(STORAGE_KEYS.WORKOUT_RECORDS, allRecords);

  console.log(`✅ Generated ${mockRecords.length} mock workout records`);
  return mockRecords.length;
}

// 임시 데이터 삭제
export async function clearMockWorkoutData() {
  const existingRecords = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
  const realRecords = existingRecords.filter(r => !r.id.startsWith('mock-'));
  await storage.setArray(STORAGE_KEYS.WORKOUT_RECORDS, realRecords);
  console.log(`✅ Cleared mock data, kept ${realRecords.length} real records`);
}
