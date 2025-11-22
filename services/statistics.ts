import { WorkoutRecord } from "@/models";
import { workoutRecordService } from "./workoutRecord";
import { weightRecordService } from "./weightRecord";

export interface CoreStats {
  currentStreak: number; // 연속 운동 일수
  totalVolume: number; // 총 볼륨 (kg)
  totalDuration: number; // 총 운동 시간 (분)
  totalWorkouts: number; // 총 운동 횟수
  thisWeekWorkouts: number; // 이번 주 운동 횟수
  thisMonthWorkouts: number; // 이번 달 운동 횟수
  thisYearWorkouts: number; // 이번 년도 운동 횟수
  thisYearVolume: number; // 이번 년도 총 중량
  hasWorkoutToday: boolean; // 오늘 운동 기록이 있는지 여부
}

export interface VolumeData {
  date: string;
  volume: number;
}

export interface CompletionRateData {
  date: string;
  rate: number;
}

export interface DayOfWeekData {
  day: string;
  count: number;
}

export interface ExerciseTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface CategoryDistribution {
  category: string;
  duration: number;
  percentage: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface Insight {
  type: "success" | "warning" | "info";
  icon: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
}

export interface WeekComparison {
  thisWeek: {
    workouts: number;
    volume: number;
    duration: number;
  };
  lastWeek: {
    workouts: number;
    volume: number;
    duration: number;
  };
  change: {
    workouts: number; // percentage
    volume: number; // percentage
    duration: number; // percentage
  };
}

export interface MonthlyCalendar {
  date: string;
  hasWorkout: boolean;
  workoutCount: number;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  avgWeight: number;
  maxWeight: number;
  workoutCount: number;
}

export interface SetsTrendData {
  period: string; // "2025-W40" (주차) or "2025-10" (월) or "2025" (년)
  periodLabel: string; // "10월 1주" or "10월" or "2025년"
  averageSets: number; // 평균 세트 수
  workoutCount: number;
}

export interface VolumeTrendData {
  period: string;
  periodLabel: string;
  totalVolume: number; // 총 볼륨 (무게 × 횟수 × 세트)
  averageVolume?: number; // 평균 볼륨 (세션당)
  maxWeight: number; // 그 기간의 최대 중량
  averageReps: number; // 평균 반복 횟수
  workoutCount: number; // 운동 횟수
}

export interface WeightTrendData {
  period: string; // "2025-W40" (주차) or "2025-10" (월) or "2025" (년)
  periodLabel: string; // "10월 1주" or "10월" or "2025년"
  averageWeight: number; // 평균 체중
  recordCount: number; // 기록된 체중 횟수
}

// 실행 횟수 추이 데이터
export interface FrequencyTrendData {
  period: string;
  periodLabel: string;
  count: number; // 해당 기간의 실행 횟수
}

// 운동별 최대 중량 추이 데이터
export interface MaxWeightTrendData {
  period: string;
  periodLabel: string;
  maxWeight: number; // 해당 기간의 최대 중량
}

// 운동 일수 추이 데이터
export interface WorkoutDaysTrendData {
  period: string;
  periodLabel: string;
  workoutDays: number; // 해당 기간의 운동 일수
  totalDays: number; // 해당 기간의 전체 일수
}

export type TrendPeriod = "week" | "month" | "year" | "day";

// 루틴별 통계
export interface RoutineStats {
  routineId: string;
  routineName: string;
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  averageVolume: number;
  averageDuration: number;
  lastWorkout: string;
}

// 루틴별 최고기록
export interface RoutinePersonalRecord {
  routineId: string;
  routineName: string;
  bestVolume: number;
  bestVolumeDate: string;
  bestDuration: number;
  bestDurationDate: string;
}

// 운동별 최고기록 (개선된 버전)
export interface ExercisePersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxWeightDate: string;
  maxVolume: number; // weight × reps (단일 세트)
  maxVolumeDate: string;
  maxReps: number;
  maxRepsDate: string;
}

const getDayOfWeek = (dateString: string): string => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
};

const getWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split("T")[0];
};

const getMonthStart = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
};

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const statisticsService = {
  // 핵심 지표 계산
  async getCoreStats(): Promise<CoreStats> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    // 총 볼륨, 총 시간
    const totalVolume = completedRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0);
    const totalDuration = completedRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalWorkouts = completedRecords.length;

    // 날짜별로 정렬
    const sortedRecords = [...completedRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 연속 운동 일수 계산
    let currentStreak = 0;
    const today = getLocalDateString(new Date()); // FIX: Use local date string
    const uniqueDates = [...new Set(completedRecords.map((r) => r.date))].sort().reverse();

    const hasWorkoutToday = uniqueDates.includes(today);

    if (uniqueDates.length > 0) {
      let checkDate = today;
      // 오늘 운동이 있다면 오늘부터 스트릭 계산 시작
      if (hasWorkoutToday) {
        for (const date of uniqueDates) {
          if (date === checkDate) {
            currentStreak++;
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = prevDate.toISOString().split("T")[0];
          } else {
            break;
          }
        }
      } else {
        // 오늘 운동이 없다면 어제부터 스트릭 계산 시작
        currentStreak = 0; // 오늘 운동이 없으므로 스트릭은 0부터 시작
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        checkDate = getLocalDateString(yesterday); // FIX: Use local date string

        for (const date of uniqueDates) {
          if (date === checkDate) {
            currentStreak++;
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = prevDate.toISOString().split("T")[0];
          } else {
            break;
          }
        }
      }
    }

    // 이번 주/달/년 운동 횟수
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

    const thisWeekWorkouts = completedRecords.filter((r) => r.date >= weekStart).length;
    const thisMonthWorkouts = completedRecords.filter((r) => r.date >= monthStart).length;
    const thisYearWorkouts = completedRecords.filter((r) => r.date >= yearStart).length;
    const thisYearVolume = completedRecords.filter((r) => r.date >= yearStart).reduce((sum, r) => sum + (r.totalVolume || 0), 0);

    return {
      currentStreak,
      totalVolume: Math.round(totalVolume),
      totalDuration,
      totalWorkouts,
      thisWeekWorkouts,
      thisMonthWorkouts,
      thisYearWorkouts,
      thisYearVolume: Math.round(thisYearVolume),
      hasWorkoutToday,
    };
  },

  // 주간 볼륨 추이 (최근 7일)
  async getWeeklyVolumeData(): Promise<VolumeData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const last7Days: VolumeData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      const dayVolume = completedRecords.filter((r) => r.date === dateString).reduce((sum, r) => sum + (r.totalVolume || 0), 0);

      last7Days.push({
        date: dateString,
        volume: Math.round(dayVolume),
      });
    }

    return last7Days;
  },

  // 월간 볼륨 추이 (최근 30일)
  async getMonthlyVolumeData(): Promise<VolumeData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const last30Days: VolumeData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      const dayVolume = completedRecords.filter((r) => r.date === dateString).reduce((sum, r) => sum + (r.totalVolume || 0), 0);

      last30Days.push({
        date: dateString,
        volume: Math.round(dayVolume),
      });
    }

    return last30Days;
  },

  // 완료율 추이 (최근 7일)
  async getWeeklyCompletionRate(): Promise<CompletionRateData[]> {
    const records = await workoutRecordService.getAllRecords();

    const last7Days: CompletionRateData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      const dayRecords = records.filter((r) => r.date === dateString);
      const avgRate = dayRecords.length > 0 ? dayRecords.reduce((sum, r) => sum + (r.completionRate || 0), 0) / dayRecords.length : 0;

      last7Days.push({
        date: dateString,
        rate: Math.round(avgRate),
      });
    }

    return last7Days;
  },

  // 요일별 운동 횟수
  async getDayOfWeekDistribution(): Promise<DayOfWeekData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const dayCount: Record<string, number> = {
      월: 0,
      화: 0,
      수: 0,
      목: 0,
      금: 0,
      토: 0,
      일: 0,
    };

    completedRecords.forEach((record) => {
      const day = getDayOfWeek(record.date);
      dayCount[day]++;
    });

    return Object.entries(dayCount).map(([day, count]) => ({ day, count }));
  },

  // 운동 유형별 분포
  async getExerciseTypeDistribution(): Promise<ExerciseTypeDistribution[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const typeCount: Record<string, number> = {};

    completedRecords.forEach((record) => {
      record.exercises.forEach((exercise) => {
        // exerciseName에서 운동 유형 추출
        const type = this.categorizeExerciseType(exercise.exerciseName);
        typeCount[type] = (typeCount[type] || 0) + exercise.sets.filter((s) => s.isCompleted).length;
      });
    });

    const total = Object.values(typeCount).reduce((sum, count) => sum + count, 0);

    return Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  },

  // 카테고리별 시간 분포
  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    // 간단한 분류 (실제로는 루틴/운동 데이터에서 가져와야 함)
    const categoryDuration: Record<string, number> = {
      bodyweight: 0,
      weights: 0,
      cardio: 0,
    };

    completedRecords.forEach((record) => {
      // 간단하게 운동 이름으로 분류 (추후 개선 필요)
      const category = this.guessCategory(record.routineName);
      if (categoryDuration[category] !== undefined) {
        categoryDuration[category] += record.duration || 0;
      }
    });

    const total = Object.values(categoryDuration).reduce((sum, duration) => sum + duration, 0);

    return Object.entries(categoryDuration)
      .map(([category, duration]) => ({
        category,
        duration,
        percentage: total > 0 ? Math.round((duration / total) * 100) : 0,
      }))
      .filter((item) => item.duration > 0)
      .sort((a, b) => b.duration - a.duration);
  },

  // 개인 기록 추적 (운동별 최고 무게×횟수)
  async getPersonalRecords(): Promise<PersonalRecord[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const prMap: Record<string, PersonalRecord> = {};

    completedRecords.forEach((record) => {
      record.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.isCompleted && set.weight > 0 && set.actualReps > 0) {
            const key = exercise.exerciseName;
            const currentPR = prMap[key];
            const score = set.weight * set.actualReps;

            if (!currentPR || score > currentPR.weight * currentPR.reps) {
              prMap[key] = {
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                weight: set.weight,
                reps: set.actualReps,
                date: record.date,
              };
            }
          }
        });
      });
    });

    return Object.values(prMap).sort((a, b) => b.weight * b.reps - a.weight * a.reps);
  },

  // 인사이트 생성
  async getInsights(): Promise<Insight[]> {
    const insights: Insight[] = [];
    const coreStats = await this.getCoreStats();
    const exerciseDistribution = await this.getExerciseTypeDistribution();

    // 스트릭 인사이트
    if (coreStats.currentStreak >= 7) {
      insights.push({
        type: "success",
        icon: "🔥",
        messageKey: "insights.streak.high",
        messageParams: { count: coreStats.currentStreak },
      });
    } else if (coreStats.hasWorkoutToday && coreStats.currentStreak > 0) {
      insights.push({
        type: "success",
        icon: "💪",
        messageKey: "insights.streak.todayWorkout",
      });
    } else if (!coreStats.hasWorkoutToday && coreStats.totalWorkouts > 0) {
      insights.push({
        type: "info",
        icon: "💪",
        messageKey: "insights.streak.start",
      });
    }

    // 균형 인사이트
    if (exerciseDistribution.length > 1) {
      const top = exerciseDistribution[0];
      const bottom = exerciseDistribution[exerciseDistribution.length - 1];

      if (top.percentage > 40 && exerciseDistribution.length > 2) {
        insights.push({
          type: "warning",
          icon: "⚖️",
          messageKey: "insights.balance.warning",
          messageParams: { topType: top.type, topPercentage: top.percentage, bottomType: bottom.type },
        });
      }
    }

    // 운동 다양성 인사이트
    if (coreStats.totalWorkouts > 5) {
      if (exerciseDistribution.length === 1) {
        insights.push({
          type: "info",
          icon: "🎯",
          messageKey: "insights.variety.low",
        });
      } else if (exerciseDistribution.length >= 3) {
        insights.push({
          type: "success",
          icon: "🌟",
          messageKey: "insights.variety.high",
          messageParams: { count: exerciseDistribution.length },
        });
      }
    }

    // 볼륨 증가 인사이트
    const weeklyData = await this.getWeeklyVolumeData();
    if (weeklyData.length >= 7) {
      const thisWeekTotal = weeklyData.slice(-7).reduce((sum, d) => sum + d.volume, 0);
      const lastDate = new Date(weeklyData[weeklyData.length - 1].date);
      lastDate.setDate(lastDate.getDate() - 7);
      const lastWeekStartDate = lastDate.toISOString().split("T")[0];

      const records = await workoutRecordService.getAllRecords();
      const lastWeekRecords = records.filter(r => r.date >= lastWeekStartDate && r.date < weeklyData[0].date);
      const lastWeekTotal = lastWeekRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0);

      if (thisWeekTotal > lastWeekTotal && lastWeekTotal > 0) {
        const increase = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
        insights.push({
          type: "success",
          icon: "📈",
          messageKey: "insights.volume.increase",
          messageParams: { percentage: increase },
        });
      }
    }

    return insights;
  },

  // 주간 비교 (이번 주 vs 지난 주)
  async getWeekComparison(): Promise<WeekComparison> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const thisWeekRecords = completedRecords.filter((r) => new Date(r.date) >= thisWeekStart);
    const lastWeekRecords = completedRecords.filter((r) => new Date(r.date) >= lastWeekStart && new Date(r.date) <= lastWeekEnd);

    const thisWeekStats = {
      workouts: thisWeekRecords.length,
      volume: thisWeekRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0),
      duration: thisWeekRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
    };

    const lastWeekStats = {
      workouts: lastWeekRecords.length,
      volume: lastWeekRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0),
      duration: lastWeekRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
    };

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      change: {
        workouts: calculateChange(thisWeekStats.workouts, lastWeekStats.workouts),
        volume: calculateChange(thisWeekStats.volume, lastWeekStats.volume),
        duration: calculateChange(thisWeekStats.duration, lastWeekStats.duration),
      },
    };
  },

  // 월간 캘린더 (현재 달)
  async getMonthlyCalendar(): Promise<MonthlyCalendar[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendar: MonthlyCalendar[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split("T")[0];
      const dayRecords = completedRecords.filter((r) => r.date === dateString);

      calendar.push({
        date: dateString,
        hasWorkout: dayRecords.length > 0,
        workoutCount: dayRecords.length,
      });
    }

    return calendar;
  },

  // 운동별 통계
  async getExerciseStats(): Promise<ExerciseStats[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const exerciseMap: Record<
      string,
      {
        exerciseId: string;
        sets: number;
        reps: number;
        volume: number;
        weights: number[];
        dates: Set<string>;
      }
    > = {};

    completedRecords.forEach((record) => {
      record.exercises.forEach((exercise) => {
        if (!exerciseMap[exercise.exerciseName]) {
          exerciseMap[exercise.exerciseName] = {
            exerciseId: exercise.exerciseId,
            sets: 0,
            reps: 0,
            volume: 0,
            weights: [],
            dates: new Set(),
          };
        }

        const completedSets = exercise.sets.filter((s) => s.isCompleted);
        exerciseMap[exercise.exerciseName].sets += completedSets.length;
        exerciseMap[exercise.exerciseName].reps += completedSets.reduce((sum, s) => sum + (s.actualReps || s.actualDurationSeconds || 0), 0);
        exerciseMap[exercise.exerciseName].volume += completedSets.reduce((sum, s) => sum + (s.weight * (s.actualReps || 0)), 0);
        completedSets.forEach((s) => {
          if (s.weight > 0) {
            exerciseMap[exercise.exerciseName].weights.push(s.weight);
          }
        });
        exerciseMap[exercise.exerciseName].dates.add(record.date);
      });
    });

    return Object.entries(exerciseMap)
      .map(([exerciseName, data]) => ({
        exerciseId: data.exerciseId,
        exerciseName,
        totalSets: data.sets,
        totalReps: data.reps,
        totalVolume: Math.round(data.volume),
        avgWeight: data.weights.length > 0 ? Math.round(data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length) : 0,
        maxWeight: data.weights.length > 0 ? Math.max(...data.weights) : 0,
        workoutCount: data.dates.size,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume); // 총 중량 순 정렬
  },

  // 헬퍼: 운동 이름에서 운동 유형 분류 (3가지로 단순화)
  categorizeExerciseType(exerciseName: string): string {
    const name = exerciseName.toLowerCase();

    // 유산소 운동
    if (
      name.includes("런닝") ||
      name.includes("러닝") ||
      name.includes("조깅") ||
      name.includes("사이클") ||
      name.includes("자전거") ||
      name.includes("달리기") ||
      name.includes("줄넘기") ||
      name.includes("로잉") ||
      name.includes("계단")
    ) {
      return "cardio";
    }

    // 웨이트 트레이닝 (바벨, 덤벨 사용)
    if (name.includes("바벨") || name.includes("덤벨") || name.includes("벤치프레스") || name.includes("데드리프트") || name.includes("머신") || name.includes("케이블")) {
      return "weights";
    }

    // 맨몸/기타 (푸시업, 플랭크, 스쿼트 등 모두 포함)
    return "bodyweight";
  },

  // 헬퍼: 카테고리 추측
  guessCategory(routineName: string): string {
    if (routineName.includes("맨몸") || routineName.includes("홈")) return "bodyweight";
    if (routineName.includes("웨이트") || routineName.includes("벤치") || routineName.includes("데드")) return "weights";
    if (routineName.includes("유산소") || routineName.includes("HIIT")) return "cardio";
    return "bodyweight";
  },

  // 운동별 세트 수 추이 (선택한 운동들의 기간별 평균 세트 수)
  async getSetsTrend(t: (key: string, params?: any) => string, period: TrendPeriod, exerciseIds: string[], range?: number): Promise<Map<string, SetsTrendData[]>> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const trendMap = new Map<string, SetsTrendData[]>();

    // 각 운동별로 추이 데이터 계산
    exerciseIds.forEach((exerciseId) => {
      const periodData: Record<string, { totalSets: number; workoutCount: number }> = {};

      completedRecords.forEach((record) => {
        const exercise = record.exercises.find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        const completedSets = exercise.sets.filter((s) => s.isCompleted);
        if (completedSets.length === 0) return;

        const date = new Date(record.date);
        let periodKey = "";

        if (period === "week") {
          // ISO week number
          const weekNumber = this.getWeekNumber(date);
          periodKey = `${date.getFullYear()}-W${weekNumber}`;
        } else if (period === "month") {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (period === "day") {
          periodKey = date.toISOString().split("T")[0];
        } else {
          // year: aggregate by year
          periodKey = `${date.getFullYear()}`;
        }

        if (!periodData[periodKey]) {
          periodData[periodKey] = { totalSets: 0, workoutCount: 0 };
        }

        periodData[periodKey].totalSets += completedSets.length;
        periodData[periodKey].workoutCount++;
      });

      // 기간별 평균 계산 및 정렬
      const trendArray: SetsTrendData[] = Object.entries(periodData)
        .map(([periodKey, data]) => {
          const avgSets = data.totalSets / data.workoutCount;
          return {
            period: periodKey,
            periodLabel: this.formatPeriodLabel(t, periodKey, period),
            averageSets: Math.round(avgSets * 10) / 10,
            workoutCount: data.workoutCount,
          };
        })
        .sort((a, b) => a.period.localeCompare(b.period));

      // 기간별로 최근 N개만 표시
      let recentTrends = trendArray;
      if (range !== undefined && range > 0) {
        // 사용자가 지정한 범위 사용
        recentTrends = trendArray.slice(-range);
      } else {
        // 기본값 사용
        if (period === "week") {
          recentTrends = trendArray.slice(-12); // 최근 12주
        } else if (period === "month") {
          recentTrends = trendArray.slice(-12); // 최근 12개월
        } else if (period === "year") {
          recentTrends = trendArray.slice(-5); // 최근 5년
        } else if (period === "day") {
          recentTrends = trendArray.slice(-30); // 최근 30일
        }
      }

      trendMap.set(exerciseId, recentTrends);
    });

    return trendMap;
  },

  // ISO week number 계산
  getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    return 1 + Math.round(diff / 604800000); // 604800000 = 7 * 24 * 3600 * 1000
  },

  // 기간 레이블 포맷팅
  formatPeriodLabel(t: (key: string, params?: any) => string, periodKey: string, period: TrendPeriod): string {
    if (period === "week") {
      const [year, week] = periodKey.split("-W");
      const weekNum = parseInt(week);
      // 해당 주의 첫날 구하기
      const date = this.getDateOfISOWeek(weekNum, parseInt(year));
      const month = date.getMonth() + 1;
      const weekOfMonth = Math.ceil(date.getDate() / 7);
      return t('statistics.periodLabel.week', { month, weekOfMonth });
    } else if (period === "month") {
      const [year, month] = periodKey.split("-");
      return t('statistics.periodLabel.month', { month });
    } else if (period === "day") {
      const [year, month, day] = periodKey.split("-");
      return t('statistics.periodLabel.day', { month: parseInt(month), day: parseInt(day) });
    } else {
      // year: just the year
      return t('statistics.periodLabel.year', { year: periodKey });
    }
  },

  // ISO week의 첫날 날짜 구하기
  getDateOfISOWeek(week: number, year: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  },

  // 운동별 볼륨 추이
  async getVolumeTrend(t: (key: string, params?: any) => string, period: TrendPeriod, exerciseIds: string[], range?: number): Promise<Map<string, VolumeTrendData[]>> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const trendMap = new Map<string, VolumeTrendData[]>();

    // 각 운동별로 추이 데이터 계산
    exerciseIds.forEach((exerciseId) => {
      const periodData: Record<string, { totalVolume: number; weights: number[]; reps: number[]; workoutCount: number }> = {};

      completedRecords.forEach((record) => {
        const exercise = record.exercises.find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        const completedSets = exercise.sets.filter((s) => s.isCompleted);
        if (completedSets.length === 0) return;

        const date = new Date(record.date);
        let periodKey = "";

        if (period === "week") {
          const weekNumber = this.getWeekNumber(date);
          periodKey = `${date.getFullYear()}-W${weekNumber}`;
        } else if (period === "month") {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (period === "day") {
          periodKey = date.toISOString().split("T")[0];
        } else {
          periodKey = `${date.getFullYear()}`;
        }

        if (!periodData[periodKey]) {
          periodData[periodKey] = { totalVolume: 0, weights: [], reps: [], workoutCount: 0 };
        }

        // 볼륨, 중량, 반복 횟수 집계
        completedSets.forEach((set) => {
          const volume = set.weight * (set.actualReps || 0);
          periodData[periodKey].totalVolume += volume;
          if (set.weight > 0) {
            periodData[periodKey].weights.push(set.weight);
          }
          if (set.actualReps > 0) {
            periodData[periodKey].reps.push(set.actualReps);
          }
        });

        periodData[periodKey].workoutCount++;
      });

      // 기간별 데이터 정리
      const trendArray: VolumeTrendData[] = Object.entries(periodData)
        .map(([periodKey, data]) => {
          const avgVolume = data.workoutCount > 0 ? Math.round(data.totalVolume / data.workoutCount) : 0;
          return {
            period: periodKey,
            periodLabel: this.formatPeriodLabel(t, periodKey, period),
            totalVolume: Math.round(data.totalVolume),
            averageVolume: avgVolume,
            maxWeight: data.weights.length > 0 ? Math.max(...data.weights) : 0,
            averageReps: data.reps.length > 0 ? Math.round((data.reps.reduce((sum, r) => sum + r, 0) / data.reps.length) * 10) / 10 : 0,
            workoutCount: data.workoutCount,
          };
        })
        .sort((a, b) => a.period.localeCompare(b.period));

      // 기간별로 최근 N개만 표시
      let recentTrends = trendArray;
      if (range !== undefined && range > 0) {
        recentTrends = trendArray.slice(-range);
      } else {
        if (period === "week") {
          recentTrends = trendArray.slice(-12); // 최근 12주
        } else if (period === "month") {
          recentTrends = trendArray.slice(-12); // 최근 12개월
        } else if (period === "year") {
          recentTrends = trendArray.slice(-5); // 최근 5년
        } else if (period === "day") {
          recentTrends = trendArray.slice(-30); // 최근 30일
        }
      }

      trendMap.set(exerciseId, recentTrends);
    });

    return trendMap;
  },

  // 체중 추이 데이터
  async getWeightTrendData(t: (key: string, params?: any) => string, period: TrendPeriod, range?: number): Promise<WeightTrendData[]> {
    // 1. 운동 기록에서 체중 데이터 가져오기
    const records = await workoutRecordService.getAllRecords();
    const completedRecordsWithWeight = records.filter((r) => r.status === "completed" && r.bodyWeight !== undefined && r.bodyWeight > 0);

    // 2. 프로필 체중 기록 가져오기
    const weightRecords = await weightRecordService.getAllWeightRecords();

    const periodData: Record<string, { totalWeight: number; count: number }> = {};

    // 운동 기록의 체중 데이터 처리
    completedRecordsWithWeight.forEach((record) => {
      const date = new Date(record.date);
      let periodKey = "";

      if (period === "week") {
        const weekNumber = this.getWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${weekNumber}`;
      } else if (period === "month") {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "day") {
        periodKey = date.toISOString().split("T")[0];
      } else {
        // year: aggregate by year
        periodKey = `${date.getFullYear()}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { totalWeight: 0, count: 0 };
      }

      periodData[periodKey].totalWeight += record.bodyWeight!;
      periodData[periodKey].count++;
    });

    // 프로필 체중 기록 처리
    weightRecords.forEach((record) => {
      const date = new Date(record.date);
      let periodKey = "";

      if (period === "week") {
        const weekNumber = this.getWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${weekNumber}`;
      } else if (period === "month") {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "day") {
        periodKey = date.toISOString().split("T")[0];
      } else {
        // year: aggregate by year
        periodKey = `${date.getFullYear()}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { totalWeight: 0, count: 0 };
      }

      periodData[periodKey].totalWeight += record.weight;
      periodData[periodKey].count++;
    });

    const trendArray: WeightTrendData[] = Object.entries(periodData)
      .map(([periodKey, data]) => {
        const avgWeight = data.totalWeight / data.count;
        return {
          period: periodKey,
          periodLabel: this.formatPeriodLabel(t, periodKey, period),
          averageWeight: Math.round(avgWeight * 10) / 10,
          recordCount: data.count,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));

    // 기간별로 최근 N개만 표시
    let recentTrends = trendArray;
    if (range !== undefined && range > 0) {
      // 사용자가 지정한 범위 사용
      recentTrends = trendArray.slice(-range);
    } else {
      // 기본값 사용
      if (period === "week") {
        recentTrends = trendArray.slice(-8); // 최근 8주
      } else if (period === "month") {
        recentTrends = trendArray.slice(-6); // 최근 6개월
      } else if (period === "year") {
        recentTrends = trendArray.slice(-12); // 최근 12개월
      } else if (period === "day") {
        recentTrends = trendArray.slice(-7); // 최근 7일
      }
    }

    return recentTrends;
  },

  // 루틴별 통계 가져오기
  async getRoutineStats(): Promise<RoutineStats[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const routineMap: Record<string, {
      routineName: string;
      workouts: number;
      totalVolume: number;
      totalDuration: number;
      lastWorkout: string;
    }> = {};

    completedRecords.forEach((record) => {
      const routineId = record.routineId || "unknown";
      if (!routineMap[routineId]) {
        routineMap[routineId] = {
          routineName: record.routineName,
          workouts: 0,
          totalVolume: 0,
          totalDuration: 0,
          lastWorkout: record.date,
        };
      }

      routineMap[routineId].workouts++;
      routineMap[routineId].totalVolume += record.totalVolume || 0;
      routineMap[routineId].totalDuration += record.duration || 0;
      if (record.date > routineMap[routineId].lastWorkout) {
        routineMap[routineId].lastWorkout = record.date;
      }
    });

    return Object.entries(routineMap)
      .map(([routineId, data]) => ({
        routineId,
        routineName: data.routineName,
        totalWorkouts: data.workouts,
        totalVolume: Math.round(data.totalVolume),
        totalDuration: data.totalDuration,
        averageVolume: data.workouts > 0 ? Math.round(data.totalVolume / data.workouts) : 0,
        averageDuration: data.workouts > 0 ? Math.round(data.totalDuration / data.workouts) : 0,
        lastWorkout: data.lastWorkout,
      }))
      .sort((a, b) => b.totalWorkouts - a.totalWorkouts);
  },

  // 루틴별 볼륨 추이
  async getRoutineVolumeTrend(t: (key: string, params?: any) => string, period: TrendPeriod, routineId: string, range?: number): Promise<VolumeTrendData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed" && r.routineId === routineId);

    const periodData: Record<string, { totalVolume: number; weights: number[]; reps: number[]; workoutCount: number }> = {};

    completedRecords.forEach((record) => {
      const date = new Date(record.date);
      let periodKey = "";

      if (period === "week") {
        const weekNumber = this.getWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${weekNumber}`;
      } else if (period === "month") {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "day") {
        periodKey = date.toISOString().split("T")[0];
      } else {
        periodKey = `${date.getFullYear()}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { totalVolume: 0, weights: [], reps: [], workoutCount: 0 };
      }

      periodData[periodKey].totalVolume += record.totalVolume || 0;

      // 운동별 무게와 횟수 집계
      record.exercises.forEach((exercise) => {
        exercise.sets.filter((s) => s.isCompleted).forEach((set) => {
          if (set.weight > 0) {
            periodData[periodKey].weights.push(set.weight);
          }
          if (set.actualReps > 0) {
            periodData[periodKey].reps.push(set.actualReps);
          }
        });
      });

      periodData[periodKey].workoutCount++;
    });

    const trendArray: VolumeTrendData[] = Object.entries(periodData)
      .map(([periodKey, data]) => {
        const avgVolume = data.workoutCount > 0 ? Math.round(data.totalVolume / data.workoutCount) : 0;
        return {
          period: periodKey,
          periodLabel: this.formatPeriodLabel(t, periodKey, period),
          totalVolume: Math.round(data.totalVolume),
          averageVolume: avgVolume,
          maxWeight: data.weights.length > 0 ? Math.max(...data.weights) : 0,
          averageReps: data.reps.length > 0 ? Math.round((data.reps.reduce((sum, r) => sum + r, 0) / data.reps.length) * 10) / 10 : 0,
          workoutCount: data.workoutCount,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));

    // 범위 적용
    let recentTrends = trendArray;
    if (range !== undefined && range > 0) {
      recentTrends = trendArray.slice(-range);
    } else {
      if (period === "week") {
        recentTrends = trendArray.slice(-12);
      } else if (period === "month") {
        recentTrends = trendArray.slice(-12);
      } else if (period === "year") {
        recentTrends = trendArray.slice(-5);
      } else if (period === "day") {
        recentTrends = trendArray.slice(-30);
      }
    }

    return recentTrends;
  },

  // 루틴별 최고기록
  async getRoutinePersonalRecords(): Promise<RoutinePersonalRecord[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const routineMap: Record<string, {
      routineName: string;
      bestVolume: number;
      bestVolumeDate: string;
      bestDuration: number;
      bestDurationDate: string;
    }> = {};

    completedRecords.forEach((record) => {
      const routineId = record.routineId || "unknown";
      const volume = record.totalVolume || 0;
      const duration = record.duration || 0;

      if (!routineMap[routineId]) {
        routineMap[routineId] = {
          routineName: record.routineName,
          bestVolume: volume,
          bestVolumeDate: record.date,
          bestDuration: duration,
          bestDurationDate: record.date,
        };
      } else {
        if (volume > routineMap[routineId].bestVolume) {
          routineMap[routineId].bestVolume = volume;
          routineMap[routineId].bestVolumeDate = record.date;
        }
        if (duration > routineMap[routineId].bestDuration) {
          routineMap[routineId].bestDuration = duration;
          routineMap[routineId].bestDurationDate = record.date;
        }
      }
    });

    return Object.entries(routineMap)
      .map(([routineId, data]) => ({
        routineId,
        routineName: data.routineName,
        bestVolume: Math.round(data.bestVolume),
        bestVolumeDate: data.bestVolumeDate,
        bestDuration: data.bestDuration,
        bestDurationDate: data.bestDurationDate,
      }))
      .filter((pr) => pr.bestVolume > 0)
      .sort((a, b) => b.bestVolume - a.bestVolume);
  },

  // 운동별 최고기록 (개선된 버전 - 최대 중량, 최대 볼륨, 최대 횟수)
  async getExercisePersonalRecords(): Promise<ExercisePersonalRecord[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const exerciseMap: Record<string, {
      exerciseName: string;
      maxWeight: number;
      maxWeightDate: string;
      maxVolume: number;
      maxVolumeDate: string;
      maxReps: number;
      maxRepsDate: string;
    }> = {};

    completedRecords.forEach((record) => {
      record.exercises.forEach((exercise) => {
        exercise.sets.filter((s) => s.isCompleted).forEach((set) => {
          const exerciseId = exercise.exerciseId;
          const volume = set.weight * (set.actualReps || 0);

          if (!exerciseMap[exerciseId]) {
            exerciseMap[exerciseId] = {
              exerciseName: exercise.exerciseName,
              maxWeight: 0,
              maxWeightDate: "",
              maxVolume: 0,
              maxVolumeDate: "",
              maxReps: 0,
              maxRepsDate: "",
            };
          }

          // 최대 중량 갱신
          if (set.weight > exerciseMap[exerciseId].maxWeight) {
            exerciseMap[exerciseId].maxWeight = set.weight;
            exerciseMap[exerciseId].maxWeightDate = record.date;
          }

          // 최대 볼륨 (단일 세트) 갱신
          if (volume > exerciseMap[exerciseId].maxVolume) {
            exerciseMap[exerciseId].maxVolume = volume;
            exerciseMap[exerciseId].maxVolumeDate = record.date;
          }

          // 최대 횟수 갱신
          if ((set.actualReps || 0) > exerciseMap[exerciseId].maxReps) {
            exerciseMap[exerciseId].maxReps = set.actualReps || 0;
            exerciseMap[exerciseId].maxRepsDate = record.date;
          }
        });
      });
    });

    return Object.entries(exerciseMap)
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.exerciseName,
        maxWeight: data.maxWeight,
        maxWeightDate: data.maxWeightDate,
        maxVolume: Math.round(data.maxVolume),
        maxVolumeDate: data.maxVolumeDate,
        maxReps: data.maxReps,
        maxRepsDate: data.maxRepsDate,
      }))
      .filter((pr) => pr.maxWeight > 0 || pr.maxReps > 0)
      .sort((a, b) => b.maxVolume - a.maxVolume);
  },

  // 루틴별 실행 횟수 추이
  async getRoutineFrequencyTrend(t: (key: string, params?: any) => string, period: TrendPeriod, routineId: string, range?: number): Promise<FrequencyTrendData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed" && r.routineId === routineId);

    const periodData: Record<string, number> = {};

    completedRecords.forEach((record) => {
      const date = new Date(record.date);
      let periodKey = "";

      if (period === "week") {
        const weekNumber = this.getWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${weekNumber}`;
      } else if (period === "month") {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "day") {
        periodKey = date.toISOString().split("T")[0];
      } else {
        periodKey = `${date.getFullYear()}`;
      }

      periodData[periodKey] = (periodData[periodKey] || 0) + 1;
    });

    const trendArray: FrequencyTrendData[] = Object.entries(periodData)
      .map(([periodKey, count]) => ({
        period: periodKey,
        periodLabel: this.formatPeriodLabel(t, periodKey, period),
        count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // 범위 적용
    let recentTrends = trendArray;
    if (range !== undefined && range > 0) {
      recentTrends = trendArray.slice(-range);
    } else {
      if (period === "week") {
        recentTrends = trendArray.slice(-12);
      } else if (period === "month") {
        recentTrends = trendArray.slice(-12);
      } else if (period === "year") {
        recentTrends = trendArray.slice(-5);
      } else if (period === "day") {
        recentTrends = trendArray.slice(-30);
      }
    }

    return recentTrends;
  },

  // 운동별 실행 횟수 추이
  async getExerciseFrequencyTrend(t: (key: string, params?: any) => string, period: TrendPeriod, exerciseIds: string[], range?: number): Promise<Map<string, FrequencyTrendData[]>> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const trendMap = new Map<string, FrequencyTrendData[]>();

    exerciseIds.forEach((exerciseId) => {
      const periodData: Record<string, number> = {};

      completedRecords.forEach((record) => {
        const exercise = record.exercises.find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        const completedSets = exercise.sets.filter((s) => s.isCompleted);
        if (completedSets.length === 0) return;

        const date = new Date(record.date);
        let periodKey = "";

        if (period === "week") {
          const weekNumber = this.getWeekNumber(date);
          periodKey = `${date.getFullYear()}-W${weekNumber}`;
        } else if (period === "month") {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (period === "day") {
          periodKey = date.toISOString().split("T")[0];
        } else {
          periodKey = `${date.getFullYear()}`;
        }

        periodData[periodKey] = (periodData[periodKey] || 0) + 1;
      });

      const trendArray: FrequencyTrendData[] = Object.entries(periodData)
        .map(([periodKey, count]) => ({
          period: periodKey,
          periodLabel: this.formatPeriodLabel(t, periodKey, period),
          count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // 범위 적용
      let recentTrends = trendArray;
      if (range !== undefined && range > 0) {
        recentTrends = trendArray.slice(-range);
      } else {
        if (period === "week") {
          recentTrends = trendArray.slice(-12);
        } else if (period === "month") {
          recentTrends = trendArray.slice(-12);
        } else if (period === "year") {
          recentTrends = trendArray.slice(-5);
        } else if (period === "day") {
          recentTrends = trendArray.slice(-30);
        }
      }

      trendMap.set(exerciseId, recentTrends);
    });

    return trendMap;
  },

  // 운동별 최대 중량 추이
  async getMaxWeightTrend(t: (key: string, params?: any) => string, period: TrendPeriod, exerciseIds: string[], range?: number): Promise<Map<string, MaxWeightTrendData[]>> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    const trendMap = new Map<string, MaxWeightTrendData[]>();

    exerciseIds.forEach((exerciseId) => {
      const periodData: Record<string, number> = {}; // period -> maxWeight

      completedRecords.forEach((record) => {
        const exercise = record.exercises.find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        const completedSets = exercise.sets.filter((s) => s.isCompleted && s.weight > 0);
        if (completedSets.length === 0) return;

        const date = new Date(record.date);
        let periodKey = "";

        if (period === "week") {
          const weekNumber = this.getWeekNumber(date);
          periodKey = `${date.getFullYear()}-W${weekNumber}`;
        } else if (period === "month") {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else if (period === "day") {
          periodKey = date.toISOString().split("T")[0];
        } else {
          periodKey = `${date.getFullYear()}`;
        }

        const maxWeightInSession = Math.max(...completedSets.map(s => s.weight));
        periodData[periodKey] = Math.max(periodData[periodKey] || 0, maxWeightInSession);
      });

      const trendArray: MaxWeightTrendData[] = Object.entries(periodData)
        .map(([periodKey, maxWeight]) => ({
          period: periodKey,
          periodLabel: this.formatPeriodLabel(t, periodKey, period),
          maxWeight,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // 범위 적용
      let recentTrends = trendArray;
      if (range !== undefined && range > 0) {
        recentTrends = trendArray.slice(-range);
      } else {
        if (period === "week") {
          recentTrends = trendArray.slice(-12);
        } else if (period === "month") {
          recentTrends = trendArray.slice(-12);
        } else if (period === "year") {
          recentTrends = trendArray.slice(-5);
        } else if (period === "day") {
          recentTrends = trendArray.slice(-30);
        }
      }

      trendMap.set(exerciseId, recentTrends);
    });

    return trendMap;
  },

  // 운동 일수 추이 (주별/월별)
  async getWorkoutDaysTrend(t: (key: string, params?: any) => string, period: TrendPeriod, range?: number): Promise<WorkoutDaysTrendData[]> {
    const records = await workoutRecordService.getAllRecords();
    const completedRecords = records.filter((r) => r.status === "completed");

    // 날짜별로 운동 여부 체크
    const workoutDates = new Set(completedRecords.map(r => r.date));

    const periodData: Record<string, { workoutDays: Set<string>; totalDays: number }> = {};

    // 모든 운동 기록의 날짜 범위 계산
    if (completedRecords.length === 0) return [];

    const allDates = completedRecords.map(r => new Date(r.date));
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date();

    // 날짜 범위 내 모든 날짜 순회
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      let periodKey = "";

      if (period === "week") {
        const weekNumber = this.getWeekNumber(currentDate);
        periodKey = `${currentDate.getFullYear()}-W${weekNumber}`;
      } else if (period === "month") {
        periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "year") {
        periodKey = `${currentDate.getFullYear()}`;
      } else {
        // day - 의미없으므로 week로 대체
        const weekNumber = this.getWeekNumber(currentDate);
        periodKey = `${currentDate.getFullYear()}-W${weekNumber}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { workoutDays: new Set(), totalDays: 0 };
      }

      periodData[periodKey].totalDays++;
      if (workoutDates.has(dateString)) {
        periodData[periodKey].workoutDays.add(dateString);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const trendArray: WorkoutDaysTrendData[] = Object.entries(periodData)
      .map(([periodKey, data]) => ({
        period: periodKey,
        periodLabel: this.formatPeriodLabel(t, periodKey, period === "day" ? "week" : period),
        workoutDays: data.workoutDays.size,
        totalDays: data.totalDays,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // 범위 적용
    let recentTrends = trendArray;
    if (range !== undefined && range > 0) {
      recentTrends = trendArray.slice(-range);
    } else {
      if (period === "week" || period === "day") {
        recentTrends = trendArray.slice(-12); // 최근 12주
      } else if (period === "month") {
        recentTrends = trendArray.slice(-12); // 최근 12개월
      } else if (period === "year") {
        recentTrends = trendArray.slice(-5); // 최근 5년
      }
    }

    return recentTrends;
  },
};
