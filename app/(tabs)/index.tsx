import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { routineService, workoutSessionService, workoutRecordService, profileService } from "@/services";
import { Routine, WorkoutRecord } from "@/models";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [lastUsedRoutine, setLastUsedRoutine] = useState<Routine | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(0);
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState<number>(0);
  const [recentRecords, setRecentRecords] = useState<WorkoutRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecommendedRoutines();
      loadLastUsedRoutine();
      loadWeeklyProgress();
      loadRecentRecords();
    }, [])
  );

  const loadRecommendedRoutines = async () => {
    try {
      const routines = await routineService.getRecommendedRoutines();
      setRecommendedRoutines(routines.slice(0, 3)); // 첫 3개만
    } catch (error) {
      console.error("Failed to load recommended routines:", error);
    }
  };

  const loadLastUsedRoutine = async () => {
    try {
      const userRoutines = await routineService.getUserRoutines();
      // lastUsed가 있는 루틴 중 가장 최근 것 찾기
      const sortedRoutines = userRoutines
        .filter((r) => r.lastUsed)
        .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime());

      if (sortedRoutines.length > 0) {
        setLastUsedRoutine(sortedRoutines[0]);
      }
    } catch (error) {
      console.error("Failed to load last used routine:", error);
    }
  };

  const loadWeeklyProgress = async () => {
    try {
      // 프로필에서 주간 목표 가져오기
      const profile = await profileService.getProfile();
      if (profile) {
        setWeeklyGoal(profile.weeklyGoal);
      }

      // 이번 주 운동 기록 계산
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일

      const records = await workoutRecordService.getRecordsByDateRange(
        startOfWeek.toISOString().split("T")[0],
        endOfWeek.toISOString().split("T")[0]
      );

      setThisWeekWorkouts(records.length);
    } catch (error) {
      console.error("Failed to load weekly progress:", error);
    }
  };

  const loadRecentRecords = async () => {
    try {
      const allRecords = await workoutRecordService.getAllRecords();
      // 최근 3개만
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
      // 마지막 루틴이 없으면 루틴 화면으로 이동
      router.push("/(tabs)/routines");
    }
  };

  const handlePlayRoutine = async (routine: Routine) => {
    try {
      await workoutSessionService.startSession(routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert(t('errors.generic'), t('errors.saveFailed'));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 인사말 */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>{t('home.greeting')}</Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{t('home.subGreeting')}</Text>
      </View>

      {/* 주간 목표 진행률 */}
      {weeklyGoal > 0 && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>{t('home.weeklyGoal')}</Text>
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
            {thisWeekWorkouts >= weeklyGoal ? t('home.goalAchieved') : t('home.workoutsRemaining', { count: weeklyGoal - thisWeekWorkouts })}
          </Text>
        </View>
      )}

      {/* 빠른 시작 버튼 */}
      <TouchableOpacity style={[styles.quickStartButton, { backgroundColor: colors.primary }]} onPress={handleQuickStart}>
        <View style={styles.quickStartContent}>
          <Ionicons name="play-circle" size={32} color={colors.buttonText} />
          <View style={styles.quickStartText}>
            <Text style={[styles.quickStartTitle, { color: colors.buttonText }]}>{t('home.startWorkout')}</Text>
            <Text style={[styles.quickStartSubtitle, { color: colors.buttonText, opacity: 0.8 }]}>{lastUsedRoutine ? `${lastUsedRoutine.name}` : t('home.selectRoutine')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.buttonText} />
      </TouchableOpacity>

      {/* 최근 운동 기록 */}
      {recentRecords.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recentWorkouts')}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {recentRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/history")}
            >
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.text }]}>{record.routineName}</Text>
                <Text style={[styles.recentDate, { color: colors.textSecondary }]}>{record.date}</Text>
              </View>
              <View style={styles.recentStats}>
                <View style={styles.recentStatItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t('history.duration', { minutes: record.duration })}</Text>
                </View>
                <View style={styles.recentStatItem}>
                  <Ionicons name="fitness-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t('history.completionRate', { rate: record.completionRate })}</Text>
                </View>
                {record.totalVolume !== undefined && record.totalVolume > 0 && (
                  <View style={styles.recentStatItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.recentStatText, { color: colors.textSecondary }]}>{t('history.volume', { volume: record.totalVolume })}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 추천 루틴 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recommendedRoutines')}</Text>
        {recommendedRoutines.map((routine) => (
          <TouchableOpacity key={routine.id} style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handlePlayRoutine(routine)}>
            <View style={styles.routineHeader}>
              <Text style={[styles.routineTitle, { color: colors.text }]}>{routine.name}</Text>
              {routine.category && (
                <View style={[styles.routineBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.routineBadgeText, { color: colors.primary }]}>{routine.category}</Text>
                </View>
              )}
            </View>
            {routine.description && <Text style={[styles.routineDescription, { color: colors.textSecondary }]}>{routine.description}</Text>}
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
});
