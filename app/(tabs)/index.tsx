import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { routineService, workoutSessionService } from "@/services";
import { Routine } from "@/models";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [lastUsedRoutine, setLastUsedRoutine] = useState<Routine | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRecommendedRoutines();
      loadLastUsedRoutine();
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
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 인사말 */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>안녕하세요!</Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>오늘도 Set1부터 시작해볼까요?</Text>
      </View>

      {/* 빠른 시작 버튼 */}
      <TouchableOpacity style={[styles.quickStartButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleQuickStart}>
        <View style={styles.quickStartContent}>
          <Ionicons name="play-circle" size={32} color={colors.primary} />
          <View style={styles.quickStartText}>
            <Text style={[styles.quickStartTitle, { color: colors.text }]}>빠른 시작</Text>
            <Text style={[styles.quickStartSubtitle, { color: colors.textSecondary }]}>{lastUsedRoutine ? `${lastUsedRoutine.name} 계속하기` : "루틴 선택하기"}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* 오늘의 통계 */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>완료한 세트</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>0분</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>운동 시간</Text>
        </View>
      </View>

      {/* 추천 루틴 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>추천 루틴</Text>
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
  quickStartButton: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    borderWidth: 1,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
