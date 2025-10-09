import { STORAGE_KEYS, WorkoutRecord } from "@/models";
import { storage } from "./storage/asyncStorage";

export interface CoreStats {
  currentStreak: number; // 연속 운동 일수
  totalVolume: number; // 총 볼륨 (kg)
  totalDuration: number; // 총 운동 시간 (분)
  totalWorkouts: number; // 총 운동 횟수
  thisWeekWorkouts: number; // 이번 주 운동 횟수
  thisMonthWorkouts: number; // 이번 달 운동 횟수
  thisYearWorkouts: number; // 이번 년도 운동 횟수
  thisYearVolume: number; // 이번 년도 총 중량
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

export type TrendPeriod = "week" | "month" | "year";

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

export const statisticsService = {
  // 핵심 지표 계산
  async getCoreStats(): Promise<CoreStats> {
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
    const completedRecords = records.filter((r) => r.status === "completed");

    // 총 볼륨, 총 시간
    const totalVolume = completedRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0);
    const totalDuration = completedRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalWorkouts = completedRecords.length;

    // 날짜별로 정렬
    const sortedRecords = [...completedRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 연속 운동 일수 계산
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const uniqueDates = [...new Set(sortedRecords.map((r) => r.date))].sort().reverse();

    if (uniqueDates.length > 0) {
      let checkDate = today;
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

      // 오늘 운동 안했으면 어제부터 시작
      if (!uniqueDates.includes(today)) {
        currentStreak = 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        checkDate = yesterday.toISOString().split("T")[0];

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
    };
  },

  // 주간 볼륨 추이 (최근 7일)
  async getWeeklyVolumeData(): Promise<VolumeData[]> {
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);

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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
    const completedRecords = records.filter((r) => r.status === "completed");

    // 간단한 분류 (실제로는 루틴/운동 데이터에서 가져와야 함)
    const categoryDuration: Record<string, number> = {
      맨몸: 0,
      웨이트: 0,
      유산소: 0,
    };

    completedRecords.forEach((record) => {
      // 간단하게 운동 이름으로 분류 (추후 개선 필요)
      const category = this.guessCategory(record.routineName);
      categoryDuration[category] += record.duration || 0;
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
    const completedRecords = records.filter((r) => r.status === "completed");

    const prMap: Record<string, PersonalRecord> = {};

    completedRecords.forEach((record) => {
      record.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.isCompleted && set.weight > 0) {
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
    } else if (coreStats.currentStreak === 0 && coreStats.totalWorkouts > 0) {
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

      const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
        exerciseMap[exercise.exerciseName].reps += completedSets.reduce((sum, s) => sum + s.actualReps, 0);
        exerciseMap[exercise.exerciseName].volume += completedSets.reduce((sum, s) => sum + s.weight * s.actualReps, 0);
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
      return "유산소";
    }

    // 웨이트 트레이닝 (바벨, 덤벨 사용)
    if (name.includes("바벨") || name.includes("덤벨") || name.includes("벤치프레스") || name.includes("데드리프트") || name.includes("머신") || name.includes("케이블")) {
      return "웨이트";
    }

    // 맨몸/기타 (푸시업, 플랭크, 스쿼트 등 모두 포함)
    return "맨몸/기타";
  },

  // 헬퍼: 카테고리 추측
  guessCategory(routineName: string): string {
    if (routineName.includes("맨몸") || routineName.includes("홈")) return "맨몸";
    if (routineName.includes("웨이트") || routineName.includes("벤치") || routineName.includes("데드")) return "웨이트";
    if (routineName.includes("유산소") || routineName.includes("HIIT")) return "유산소";
    return "맨몸";
  },

  // 운동별 세트 수 추이 (선택한 운동들의 기간별 평균 세트 수)
  async getSetsTrend(period: TrendPeriod, exerciseIds: string[]): Promise<Map<string, SetsTrendData[]>> {
    const records = await storage.getArray<WorkoutRecord>(STORAGE_KEYS.WORKOUT_RECORDS);
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
        } else {
          // year
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
            periodLabel: this.formatPeriodLabel(periodKey, period),
            averageSets: Math.round(avgSets * 10) / 10,
            workoutCount: data.workoutCount,
          };
        })
        .sort((a, b) => a.period.localeCompare(b.period));

      // 기간별로 최근 N개만 표시
      let recentTrends = trendArray;
      if (period === "week") {
        recentTrends = trendArray.slice(-8); // 최근 8주
      } else if (period === "month") {
        recentTrends = trendArray.slice(-6); // 최근 6개월
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
  formatPeriodLabel(periodKey: string, period: TrendPeriod): string {
    if (period === "week") {
      const [year, week] = periodKey.split("-W");
      const weekNum = parseInt(week);
      // 해당 주의 첫날 구하기
      const date = this.getDateOfISOWeek(weekNum, parseInt(year));
      const month = date.getMonth() + 1;
      const weekOfMonth = Math.ceil(date.getDate() / 7);
      return `${month}월 ${weekOfMonth}주`;
    } else if (period === "month") {
      const [year, month] = periodKey.split("-");
      return `${year}.${month}`;
    } else {
      // year
      return `${periodKey}년`;
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
};
