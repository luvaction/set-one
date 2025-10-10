import { useTheme } from "@/contexts/ThemeContext";
import { Routine, WorkoutRecord } from "@/models";
import { profileService, routineService, workoutRecordService, workoutSessionService } from "@/services";
import { Insight, statisticsService } from "@/services/statistics";
import { getOrCreateUserId } from "@/utils/userIdHelper";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 한글 이름 -> exerciseId 역매핑 (HistoryScreen에서 가져옴)
const koreanToExerciseId: Record<string, string> = {
  "일반 푸시업": "regularPushup",
  "다이아몬드 푸시업": "diamondPushup",
  "와이드 푸시업": "widePushup",
  "인클라인 푸시업": "inclinePushup",
  "디클라인 푸시업": "declinePushup",
  풀업: "regularPullup",
  친업: "chinup",
  "어시스트 풀업": "assistedPullup",
  "바디웨이트 스쿼트": "bodyweightSquat",
  "점프 스쿼트": "jumpSquat",
  "피스톨 스쿼트": "pistolSquat",
  "불가리안 스플릿 스쿼트": "bulgarianSplitSquat",
  "플랫 벤치프레스": "flatBenchPress",
  "인클라인 벤치프레스": "inclineBenchPress",
  "디클라인 벤치프레스": "declineBenchPress",
  "덤벨 벤치프레스": "dumbbellBenchPress",
  "컨벤셔널 데드리프트": "conventionalDeadlift",
  "스모 데드리프트": "sumoDeadlift",
  "루마니안 데드리프트": "romanianDeadlift",
  "덤벨 플라이": "dumbbellFly",
  "바벨 로우": "barbellRow",
  "덤벨 로우": "dumbbellRow",
  "바디웨이트 딥스": "bodyweightDips",
  "어시스트 딥스": "assistedDips",
  플랭크: "regularPlank",
  "사이드 플랭크": "sidePlank",
  "플랭크 업다운": "plankUpDown",
  버피: "burpee",
  마운틴클라이머: "mountainClimber",
  점핑잭: "jumpingJack",
  하이니: "highKnees",
  "햄스트링 스트레칭": "hamstringStretch",
  "어깨 스트레칭": "shoulderStretch",
  "가슴 스트레칭": "chestStretch",
};

// 번역 헬퍼 함수
const getRoutineName = (t: any, routineId?: string, routineName?: string) => {
  // 추천 루틴인 경우 ID로 번역 (routine_user_는 제외)
  if (routineId && routineId.startsWith("routine_") && !routineId.startsWith("routine_user_")) {
    return t(`routines.${routineId}`);
  }

  // 한글 루틴 이름 매핑 (추천 루틴의 경우)
  const koreanRoutineMap: Record<string, string> = {
    "초보자 전신 운동": "routine_beginner_fullbody",
    "가슴 집중 운동": "routine_chest_day",
    "등 집중 운동": "routine_back_day",
    "하체 집중 운동": "routine_leg_day",
    홈트레이닝: "routine_home_workout",
  };

  // 한글 이름으로 저장된 추천 루틴 변환
  if (routineName && koreanRoutineMap[routineName]) {
    return t(`routines.${koreanRoutineMap[routineName]}`);
  }

  // 루틴 이름이 기본 운동 이름과 일치할 경우 (단일 운동 루틴일 가능성, 번역 강제 적용)
  if (routineName) {
    const exerciseId = koreanToExerciseId[routineName];
    if (exerciseId) {
      // 해당 운동의 번역 키를 사용하여 표시 (예: t('exercises.bodyweightDips') -> "Bodyweight Dips")
      return t(`exercises.${exerciseId}`);
    }
  }

  // 일반 루틴은 이름 그대로 반환
  return routineName || "";
};

const getCategoryName = (t: any, category?: string) => {
  if (!category) return "";
  const categoryMap: Record<string, string> = {
    전신: "fullBody",
    상체: "upperBody",
    하체: "lowerBody",
    맨몸: "bodyweight",
    웨이트: "weights",
    유산소: "cardio",
  };
  const key = categoryMap[category] || category;
  return t(`category.${key}`);
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [lastUsedRoutine, setLastUsedRoutine] = useState<Routine | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(0);
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState<number>(0);
  const [recentRecords, setRecentRecords] = useState<WorkoutRecord[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecommendedRoutines();
      loadLastUsedRoutine();
      loadWeeklyProgress();
      loadRecentRecords();
      loadInsights();
    }, [])
  );

  const loadInsights = async () => {
    try {
      const insightsData = await statisticsService.getInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to load insights:", error);
    }
  };

  const loadRecommendedRoutines = async () => {
    try {
      const routines = await routineService.getRecommendedRoutines();
      setRecommendedRoutines(routines.slice(0, 3));
    } catch (error) {
      console.error("Failed to load recommended routines:", error);
    }
  };

  const loadLastUsedRoutine = async () => {
    try {
      const userRoutines = await routineService.getUserRoutines();
      const sortedRoutines = userRoutines.filter((r) => r.lastUsed).sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime());

      if (sortedRoutines.length > 0) {
        setLastUsedRoutine(sortedRoutines[0]);
      }
    } catch (error) {
      console.error("Failed to load last used routine:", error);
    }
  };

  const loadWeeklyProgress = async () => {
    try {
      const profile = await profileService.getProfile();
      if (profile) {
        setWeeklyGoal(profile.weeklyGoal);
      }

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const records = await workoutRecordService.getRecordsByDateRange(startOfWeek.toISOString().split("T")[0], endOfWeek.toISOString().split("T")[0]);

      setThisWeekWorkouts(records.length);
    } catch (error) {
      console.error("Failed to load weekly progress:", error);
    }
  };

  const loadRecentRecords = async () => {
    try {
      const allRecords = await workoutRecordService.getAllRecords();
      const sorted = allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentRecords(sorted.slice(0, 3));
    } catch (error) {
      console.error("Failed to load recent records:", error);
    }
  };

  const handleQuickStart = async () => {
    if (lastUsedRoutine) {
      await handlePlayRoutine(lastUsedRoutine);
    } else {
      router.push("/(tabs)/routines");
    }
  };

  const handlePlayRoutine = async (routine: Routine) => {
    try {
      const userId = await getOrCreateUserId();
      await workoutSessionService.startSession(userId, routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert(t("errors.generic"), t("errors.saveFailed"));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>{t("home.greeting")}</Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{t("home.subGreeting")}</Text>
      </View>

      {weeklyGoal > 0 && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>{t("home.weeklyGoal")}</Text>
            <Text style={[styles.progressValue, { color: colors.primary }]}>
              {thisWeekWorkouts}/{weeklyGoal}
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, (thisWeekWorkouts / weeklyGoal) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
            {thisWeekWorkouts >= weeklyGoal ? t("home.goalAchieved") : t("home.workoutsRemaining", { count: weeklyGoal - thisWeekWorkouts })}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.quickStartButton, { backgroundColor: colors.primary }]} onPress={handleQuickStart}>
        <View style={styles.quickStartContent}>
          <Ionicons name="play-circle" size={32} color={colors.buttonText} />
          <View style={styles.quickStartText}>
            <Text style={[styles.quickStartTitle, { color: colors.buttonText }]}>{t("home.startWorkout")}</Text>
            <Text style={[styles.quickStartSubtitle, { color: colors.buttonText, opacity: 0.8 }]}>{lastUsedRoutine ? `${lastUsedRoutine.name}` : t("home.selectRoutine")}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.buttonText} />
      </TouchableOpacity>

      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          {insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: insight.type === "success" ? "#4CAF50" : insight.type === "warning" ? "#FF9800" : colors.primary,
                },
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>{t(insight.messageKey, insight.messageParams)}</Text>
            </View>
          ))}
        </View>
      )}

      {recentRecords.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.recentWorkouts")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>{t("common.viewAll")}</Text>
            </TouchableOpacity>
          </View>
          {recentRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/history")}
            >
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.text }]}>{getRoutineName(t, record.routineId, record.routineName)}</Text>
                <Text style={[styles.recentDate, { color: colors.textSecondary }]}>{record.date}</Text>
              </View>
              <View style={styles.recentStats}>
                <View style={styles.recentStatItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t("history.duration", { minutes: record.duration })}</Text>
                </View>
                <View style={styles.recentStatItem}>
                  <Ionicons name="fitness-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t("history.completionRate", { rate: record.completionRate })}</Text>
                </View>
                {record.totalVolume !== undefined && record.totalVolume > 0 && (
                  <View style={styles.recentStatItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t("history.volume", { volume: record.totalVolume })}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.recommendedRoutines")}</Text>
        {recommendedRoutines.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handlePlayRoutine(routine)}
          >
            <View style={styles.routineHeader}>
              <Text style={[styles.routineTitle, { color: colors.text }]}>{getRoutineName(t, routine.id, routine.name)}</Text>
              {routine.category && (
                <View style={[styles.routineBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.routineBadgeText, { color: colors.primary }]}>{getCategoryName(t, routine.category)}</Text>
                </View>
              )}
            </View>
            {routine.description && <Text style={[styles.routineDescription, { color: colors.textSecondary }]}>{t(`routines.${routine.id}_description`)}</Text>}
            {routine.duration && <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.duration}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
  },
  progressCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  quickStartButton: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickStartText: {
    gap: 4,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  quickStartSubtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  recentDate: {
    fontSize: 12,
  },
  recentStats: {
    flexDirection: "row",
    gap: 12,
  },
  recentStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentStatText: {
    fontSize: 12,
  },
  routineCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  routineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routineBadgeWeight: {
    backgroundColor: "#FF6B00" + "20",
  },
  routineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  routineDescription: {
    fontSize: 14,
  },
  routineDuration: {
    fontSize: 12,
  },
  insightsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: "center",
    gap: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
