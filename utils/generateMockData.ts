import { workoutRecordService } from "@/services/workoutRecord";
import { CreateWorkoutRecordData } from "@/models";

// 임시 과거 데이터 생성 (통계 확인용)
export async function generateMockWorkoutData() {
  console.log("🚀 Starting mock data generation...");

  // 먼저 기존 mock 데이터 삭제
  await clearMockWorkoutData();

  let createdCount = 0;

  // 다양한 운동 종류 (실제 exerciseId 사용)
  const exercises = [
    // 웨이트 운동
    { id: "flatBenchPress", name: "플랫 벤치프레스", weight: 60, reps: 10, type: "weights" },
    { id: "inclineBenchPress", name: "인클라인 벤치프레스", weight: 55, reps: 10, type: "weights" },
    { id: "bodyweightSquat", name: "바디웨이트 스쿼트", weight: 0, reps: 15, type: "bodyweight" },
    { id: "bulgarianSplitSquat", name: "불가리안 스플릿 스쿼트", weight: 20, reps: 12, type: "weights" },
    { id: "conventionalDeadlift", name: "컨벤셔널 데드리프트", weight: 100, reps: 8, type: "weights" },
    { id: "romanianDeadlift", name: "루마니안 데드리프트", weight: 80, reps: 10, type: "weights" },
    { id: "barbellRow", name: "바벨 로우", weight: 50, reps: 12, type: "weights" },
    { id: "dumbbellRow", name: "덤벨 로우", weight: 30, reps: 12, type: "weights" },
    { id: "regularPullup", name: "풀업", weight: 0, reps: 8, type: "bodyweight" },
    { id: "chinup", name: "친업", weight: 0, reps: 10, type: "bodyweight" },
    { id: "bodyweightDips", name: "바디웨이트 딥스", weight: 0, reps: 12, type: "bodyweight" },
    { id: "regularPushup", name: "일반 푸시업", weight: 0, reps: 20, type: "bodyweight" },
    { id: "diamondPushup", name: "다이아몬드 푸시업", weight: 0, reps: 15, type: "bodyweight" },
    { id: "dumbbellFly", name: "덤벨 플라이", weight: 25, reps: 12, type: "weights" },
    // 유산소 운동
    { id: "burpee", name: "버피", weight: 0, reps: 20, type: "cardio" },
    { id: "mountainClimber", name: "마운틴클라이머", weight: 0, reps: 30, type: "cardio" },
    { id: "jumpingJack", name: "점핑잭", weight: 0, reps: 30, type: "cardio" },
    { id: "highKnees", name: "하이니", weight: 0, reps: 40, type: "cardio" },
    // 코어 운동
    { id: "regularPlank", name: "플랭크", weight: 0, reps: 60, type: "bodyweight" },
    { id: "sidePlank", name: "사이드 플랭크", weight: 0, reps: 45, type: "bodyweight" },
  ];

  // 최근 365일 데이터 생성 (1년치)
  // 체중 변화 시뮬레이션 (시작: 75kg, 목표: -5kg 또는 +5kg)
  const startWeight = 75;
  const goalWeightChange = Math.random() > 0.5 ? -5 : 5; // 감량 또는 증량

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];

    // 주 4-5회 운동 (랜덤하게)
    const shouldWorkout = Math.random() < 0.6; // 60% 확률로 운동

    if (shouldWorkout) {
      // 체중 변화 계산 (점진적 변화 + 랜덤 변동)
      const progressRatio = (365 - i) / 365; // 0에서 1로 증가
      const weightChange = goalWeightChange * progressRatio; // 목표 체중 변화의 진행률
      const randomVariation = (Math.random() - 0.5) * 0.5; // ±0.25kg 랜덤 변동
      const currentWeight = parseFloat((startWeight + weightChange + randomVariation).toFixed(1));
      // 운동 타입 선택 (웨이트 위주 or 바디웨이트 위주 or 혼합)
      const workoutType = Math.random();
      let selectedExercises;

      if (workoutType < 0.4) {
        // 웨이트 위주
        selectedExercises = exercises
          .filter(ex => ex.type === "weights")
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 4); // 4-6개 운동
      } else if (workoutType < 0.7) {
        // 바디웨이트/코어 위주
        selectedExercises = exercises
          .filter(ex => ex.type === "bodyweight")
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 4);
      } else {
        // 혼합 (웨이트 + 유산소)
        const weightEx = exercises
          .filter(ex => ex.type === "weights")
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const cardioEx = exercises
          .filter(ex => ex.type === "cardio")
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        selectedExercises = [...weightEx, ...cardioEx];
      }

      // 시간이 지날수록 무게와 세트 수가 증가하는 진행도 반영
      const progressFactor = 1 + ((365 - i) / 365) * 0.3; // 최대 30% 증가
      const setsCount = Math.floor(Math.random() * 2) + 3; // 3-4 세트

      const workoutExercises = selectedExercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetSets: setsCount,
        sets: Array.from({ length: setsCount }, (_, setIdx) => {
          const baseWeight = ex.weight;
          const progressedWeight = Math.floor(baseWeight * progressFactor);
          const variation = Math.floor(Math.random() * 10) - 5;
          const weight = Math.max(0, progressedWeight + variation);

          const baseReps = ex.reps;
          const repsVariation = Math.floor(Math.random() * 4) - 2;
          const actualReps = Math.max(1, baseReps + repsVariation);

          return {
            setNumber: setIdx + 1,
            targetReps: baseReps,
            targetWeight: baseWeight,
            actualReps,
            weight,
            isCompleted: Math.random() < 0.95, // 95% 완료율
          };
        }),
        isCompleted: true,
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

      // SQLite에 직접 저장
      const recordData: CreateWorkoutRecordData = {
        routineId: `mock-routine-${Math.floor(i / 30)}`, // 한 달마다 다른 루틴
        routineName: `임시 루틴 ${Math.floor(i / 30) + 1}`,
        date: dateString,
        duration: 45 + Math.floor(Math.random() * 75), // 45-120분
        exercises: workoutExercises,
        totalVolume,
        completionRate: Math.round((completedSets / totalSets) * 100),
        bodyWeight: currentWeight, // 체중 추가
        status: "completed",
        memo: "임시 데이터",
      };

      try {
        await workoutRecordService.createRecord("mock-user-id", recordData);
        createdCount++;

        // 진행 상황 로그 (50개마다)
        if (createdCount % 50 === 0) {
          console.log(`  ... ${createdCount}개 생성 중`);
        }
      } catch (error) {
        console.error(`Failed to create mock record for ${dateString}:`, error);
      }
    }
  }

  console.log(`✅ Successfully created ${createdCount} mock workout records`);
  return createdCount;
}

// 임시 데이터 삭제
export async function clearMockWorkoutData() {
  console.log("🗑️  Clearing existing mock data...");
  const allRecords = await workoutRecordService.getAllRecords();
  const mockRecords = allRecords.filter((r) => r.memo === "임시 데이터");

  let deletedCount = 0;
  for (const record of mockRecords) {
    try {
      await workoutRecordService.deleteRecord(record.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete mock record ${record.id}:`, error);
    }
  }

  console.log(`✅ Deleted ${deletedCount} mock records`);
}
