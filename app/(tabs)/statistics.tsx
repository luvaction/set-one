import { useTheme } from "@/contexts/ThemeContext";
import { profileService } from "@/services/profile";
import {
  CoreStats,
  ExerciseStats,
  statisticsService,
  TrendPeriod,
  VolumeTrendData,
  WeekComparison,
  WeightTrendData,
} from "@/services/statistics";
import { generateMockWorkoutData } from "@/utils/generateMockData";
import { formatWeight, getWeightUnit, type UnitSystem } from "@/utils/unitConversion";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getStyles } from "../style/Statistics.styles";

// 한글 이름 -> exerciseId 역매핑
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

// 번역 헬퍼 함수들
const getExerciseName = (t: any, exerciseId: string, exerciseName?: string) => {
  // exerciseId가 없거나 비어있으면 한글 이름에서 ID 추론 시도
  if (!exerciseId && exerciseName) {
    const inferredId = koreanToExerciseId[exerciseName];
    if (inferredId) {
      return t(`exercises.${inferredId}`);
    }
    // 추론 실패하면 원래 이름 반환
    return exerciseName;
  }

  // 커스텀 운동이면 실제 이름 반환 (번역 불필요)
  if (exerciseId && exerciseId.startsWith("ex_custom_")) {
    return exerciseName || exerciseId;
  }

  // 기본 운동은 번역 키 사용
  if (exerciseId) {
    return t(`exercises.${exerciseId}`);
  }

  // fallback
  return exerciseName || "";
};

const getExerciseTypeName = (t: any, type: string) => {
  // 'type' is already an English key like 'cardio', 'weights', 'bodyweight'
  return t(`category.${type}`);
};

const formatDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  if (language === "ko") {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    // English: MM/DD/YYYY format
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
};

const getAdaptiveDotRadius = (dataLength: number) => {
  if (dataLength <= 10) {
    return "3"; // Larger dots for fewer points
  } else if (dataLength <= 30) {
    return "2"; // Medium dots
  } else {
    return "1"; // Smaller dots for many points
  }
};

export default function StatisticsScreen() {
  const { colors, theme } = useTheme();
  const styles = getStyles(colors);
  const { t, i18n, ready } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMockButton, setShowMockButton] = useState(true); // 테스트 버튼 표시

  const [coreStats, setCoreStats] = useState<CoreStats | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [weightTrendData, setWeightTrendData] = useState<WeightTrendData[]>([]);
  const [weightTrendPeriod, setWeightTrendPeriod] = useState<TrendPeriod>("month");

  // 볼륨 추이 관련 state
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [volumeTrends, setVolumeTrends] = useState<Map<string, VolumeTrendData[]>>(new Map());
  const [volumeTrendPeriod, setVolumeTrendPeriod] = useState<TrendPeriod>("month");
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  // 체중 추이 범위 선택 상태
  const [weightDayRange, setWeightDayRange] = useState(7);
  const [weightWeekRange, setWeightWeekRange] = useState(4);
  const [weightMonthRange, setWeightMonthRange] = useState(12);
  const [weightYearRange, setWeightYearRange] = useState<number | undefined>(undefined); // 전체 데이터

  // 범위 선택 모달 상태
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [tempRangeValue, setTempRangeValue] = useState<string>("");
  const [rangeError, setRangeError] = useState<string>("");

  // 차트 클릭 모달 상태
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState<{
    type: "weight";
    label: string;
    items: Array<{
      exerciseName: string;
      value: string | number;
      color: string;
    }>;
  } | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  // 체중 추이 로드 함수 분리
  const loadWeightTrends = async () => {
    let range: number | undefined;
    if (weightTrendPeriod === "day") range = weightDayRange;
    else if (weightTrendPeriod === "week") range = weightWeekRange;
    else if (weightTrendPeriod === "month") range = weightMonthRange;
    else if (weightTrendPeriod === "year") range = weightYearRange;

    const trends = await statisticsService.getWeightTrendData(t, weightTrendPeriod, range);
    setWeightTrendData(trends);
  };

  // 볼륨 추이 로드 함수
  const loadVolumeTrends = async () => {
    if (selectedExercises.size === 0) return;

    const selectedIds = Array.from(selectedExercises);
    const trends = await statisticsService.getVolumeTrend(t, volumeTrendPeriod, selectedIds);
    setVolumeTrends(trends);
  };

  // loadStatistics를 일반 함수로 변경하여 항상 최신 상태 참조
  const loadStatistics = async () => {
    try {
      const [stats, weekComp, profileData, exStats] = await Promise.all([
        statisticsService.getCoreStats(),
        statisticsService.getWeekComparison(),
        profileService.getProfile(),
        statisticsService.getExerciseStats(),
      ]);

      setCoreStats(stats);
      setWeekComparison(weekComp);
      setWeeklyGoal(profileData?.weeklyGoal || null);
      setUnitSystem(profileData?.unitSystem || "metric");
      setExerciseStats(exStats);

      // 초기 선택: 상위 3개 운동 자동 선택
      if (exStats.length > 0 && selectedExercises.size === 0) {
        const topExercises = exStats.slice(0, 3).map(ex => ex.exerciseId);
        setSelectedExercises(new Set(topExercises));
      }

      // 체중 추이도 새로고침
      await loadWeightTrends();
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // 체중 추이 기간 또는 범위가 변경되면 체중 추이만 다시 로드
  useEffect(() => {
    loadWeightTrends();
    // loadWeightTrends는 일반 함수이므로 dependency에 포함하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightTrendPeriod, weightDayRange, weightWeekRange, weightMonthRange, weightYearRange]);

  // 볼륨 추이 기간 또는 선택된 운동이 변경되면 볼륨 추이 로드
  useEffect(() => {
    if (selectedExercises.size > 0) {
      loadVolumeTrends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeTrendPeriod, selectedExercises]);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
      // loadStatistics는 일반 함수이므로 dependency에 포함하지 않음
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const handleGenerateMockData = async () => {
    let generatedCount = 0;
    generatedCount = await generateMockWorkoutData();
    setShowMockButton(false);
    loadStatistics();
    Alert.alert(t("common.success"), t("statistics.mockDataGenerated") + ` (${generatedCount} records)`);
  };

  if (loading || !ready) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // 주간 목표 달성률 계산
  const goalAchievementRate = weeklyGoal && weekComparison && weeklyGoal > 0 ? Math.min(100, (weekComparison.thisWeek.workouts / weeklyGoal) * 100) : null;
  const isGoalSet = weeklyGoal !== null && weeklyGoal > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 리프레시 버튼 */}
        <View style={styles.titleContainer}>
          <View />
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 핵심 지표 카드 */}
        {coreStats && (
          <View style={styles.statsCardsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{t("statistics.workoutDays", { count: coreStats.currentStreak })}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("statistics.currentStreak")}</Text>
            </View>


            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{isGoalSet ? `${goalAchievementRate?.toFixed(0)}%` : "-"}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11, textAlign: "center" }]}>
                {isGoalSet ? `${t("statistics.weeklyGoalRate")}\n(${weekComparison?.thisWeek.workouts}/${weeklyGoal})` : t("statistics.goalNotSet")}
              </Text>
            </View>
          </View>
        )}

        {/* 주간 비교 */}
        {weekComparison && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("statistics.thisWeekGrowth")}</Text>
            <View style={[styles.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>{t("statistics.workoutCount")}</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>{weekComparison.thisWeek.workouts}</Text>
                  {weekComparison.change.workouts !== 0 && (
                    <View style={styles.changeContainer}>
                      <Ionicons
                        name={weekComparison.change.workouts > 0 ? "arrow-up" : "arrow-down"}
                        size={14}
                        color={weekComparison.change.workouts > 0 ? "#4CAF50" : "#FF5252"}
                      />
                      <Text style={[styles.changeText, { color: weekComparison.change.workouts > 0 ? "#4CAF50" : "#FF5252" }]}>{Math.abs(weekComparison.change.workouts)}%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>{t("statistics.totalTime")}</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>{Math.floor(weekComparison.thisWeek.duration / 60)}h</Text>
                  {weekComparison.change.duration !== 0 && (
                    <View style={styles.changeContainer}>
                      <Ionicons
                        name={weekComparison.change.duration > 0 ? "arrow-up" : "arrow-down"}
                        size={14}
                        color={weekComparison.change.duration > 0 ? "#4CAF50" : "#FF5252"}
                      />
                      <Text style={[styles.changeText, { color: weekComparison.change.duration > 0 ? "#4CAF50" : "#FF5252" }]}>{Math.abs(weekComparison.change.duration)}%</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.comparisonHint, { color: colors.textSecondary }]}>{t("statistics.vsLastWeek")}</Text>
            </View>
          </View>
        )}

        {/* 연간 통계 */}
        {coreStats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("statistics.thisYearActivity")}</Text>
            <View style={[styles.yearStatsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.yearStatRow}>
                <View style={styles.yearStatItem}>
                  <Text style={[styles.yearStatValue, { color: colors.primary }]}>
                    {coreStats.thisYearWorkouts}
                    {t("statistics.timesUnit")}
                  </Text>
                  <Text style={[styles.yearStatLabel, { color: colors.textSecondary }]}>{t("statistics.totalWorkouts")}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 볼륨 추이 차트 */}
        {exerciseStats.length > 0 && selectedExercises.size > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t("statistics.volumeTrend")}</Text>
              <TouchableOpacity
                onPress={() => setShowExerciseSelector(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.primary + "15",
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                }}
              >
                <Ionicons name="filter" size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                  {selectedExercises.size}개 선택됨
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.filterButtons, { marginBottom: 16 }]}>
              {(["day", "week", "month", "year"] as TrendPeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.filterButton, { borderColor: colors.border }, volumeTrendPeriod === period && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setVolumeTrendPeriod(period)}
                >
                  <Text style={[styles.filterButtonText, { color: volumeTrendPeriod === period ? (theme === "dark" ? colors.buttonText : "#fff") : colors.text }]}>
                    {t(`statistics.period${period.charAt(0).toUpperCase() + period.slice(1)}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {volumeTrends.size === 0 || Array.from(volumeTrends.values()).every(data => data.length === 0) ? (
              <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.emptyChartContainer}>
                  <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>{t("statistics.noTrendData")}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* 범례 */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20, paddingHorizontal: 4 }}>
                  {Array.from(selectedExercises).map((exerciseId, idx) => {
                    const exercise = exerciseStats.find(ex => ex.exerciseId === exerciseId);
                    if (!exercise) return null;
                    const chartColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                    const color = chartColors[idx % chartColors.length];
                    return (
                      <View
                        key={exerciseId}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 20,
                          backgroundColor: color + "15",
                          borderWidth: 1.5,
                          borderColor: color + "40",
                        }}
                      >
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: color,
                          }}
                        />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                          {getExerciseName(t, exercise.exerciseId, exercise.exerciseName)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <LineChart
                  data={{
                    labels: (() => {
                      const firstExercise = Array.from(selectedExercises)[0];
                      const trends = volumeTrends.get(firstExercise) || [];
                      return trends.map((data, index) => {
                        const maxLabels = 7;
                        const labelSkip = trends.length > maxLabels ? Math.ceil(trends.length / maxLabels) : 1;
                        return index % labelSkip === 0 ? data.periodLabel : "";
                      });
                    })(),
                    datasets: Array.from(selectedExercises).map((exerciseId, idx) => {
                      const trends = volumeTrends.get(exerciseId) || [];
                      const chartColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                      const color = chartColors[idx % chartColors.length];
                      return {
                        data: trends.map(t => unitSystem === "imperial" ? t.totalVolume * 2.20462 : t.totalVolume),
                        color: (_opacity = 1) => color,
                        strokeWidth: 3,
                      };
                    }),
                    legend: [],
                  }}
                  width={Dimensions.get("window").width - 40}
                  height={240}
                  yAxisSuffix={unitSystem === "imperial" ? " lb" : " kg"}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (_opacity = 1) => colors.primary,
                    labelColor: (_opacity = 1) => colors.text,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: colors.surface,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: "0",
                      stroke: colors.border + "40",
                      strokeWidth: 1,
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withDots={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={false}
                  onDataPointClick={({ index }) => {
                    // 모든 선택된 운동의 데이터를 alert로 표시
                    const items = Array.from(selectedExercises).map((exerciseId) => {
                      const trends = volumeTrends.get(exerciseId) || [];
                      const data = trends[index];
                      const exercise = exerciseStats.find(ex => ex.exerciseId === exerciseId);
                      if (data && exercise) {
                        return {
                          name: getExerciseName(t, exerciseId, exercise.exerciseName),
                          volume: formatWeight(data.totalVolume, unitSystem),
                          maxWeight: formatWeight(data.maxWeight, unitSystem),
                          avgReps: data.averageReps,
                          workouts: data.workoutCount,
                        };
                      }
                      return null;
                    }).filter((item): item is NonNullable<typeof item> => item !== null);

                    if (items.length > 0) {
                      const firstExercise = Array.from(selectedExercises)[0];
                      const trends = volumeTrends.get(firstExercise) || [];
                      const data = trends[index];

                      const message = items.map(item =>
                        `${item.name}\n` +
                        `  ${t("statistics.totalVolume")}: ${item.volume}\n` +
                        `  ${t("statistics.maxWeight")}: ${item.maxWeight}\n` +
                        `  ${t("statistics.averageReps")}: ${item.avgReps}\n` +
                        `  ${t("statistics.workoutCount")}: ${item.workouts}${t("statistics.timesUnit")}`
                      ).join('\n\n');

                      Alert.alert(data?.periodLabel || "", message);
                    }
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* 체중 추이 차트 */}
        {weightTrendData.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t("statistics.weightTrend")}</Text>
              {weightTrendPeriod !== "year" && (
                <TouchableOpacity
                  onPress={() => {
                    const currentValue = weightTrendPeriod === "day" ? weightDayRange : weightTrendPeriod === "week" ? weightWeekRange : weightMonthRange;
                    setTempRangeValue(String(currentValue));
                    setRangeModalVisible(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: colors.primary + "15",
                    borderWidth: 1,
                    borderColor: colors.primary + "40",
                  }}
                >
                  <Ionicons name="options-outline" size={16} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                    {weightTrendPeriod === "day" && `${weightDayRange}${t("statistics.periodDay")}`}
                    {weightTrendPeriod === "week" && `${weightWeekRange}${t("statistics.periodWeek")}`}
                    {weightTrendPeriod === "month" && `${weightMonthRange}${t("statistics.periodMonth")}`}
                  </Text>
                </TouchableOpacity>
              )}
              {weightTrendPeriod === "year" && <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>{t("statistics.allData")}</Text>}
            </View>
            <View style={[styles.filterButtons, { marginBottom: 16 }]}>
              {(["day", "week", "month", "year"] as TrendPeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.filterButton, { borderColor: colors.border }, weightTrendPeriod === period && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setWeightTrendPeriod(period)}
                >
                  <Text style={[styles.filterButtonText, { color: weightTrendPeriod === period ? (theme === "dark" ? colors.buttonText : "#fff") : colors.text }]}>
                    {t(`statistics.period${period.charAt(0).toUpperCase() + period.slice(1)}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {weightTrendData.length === 0 ? (
              <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.emptyChartContainer}>
                  <Ionicons name="body-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>{t("statistics.noTrendData")}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LineChart
                  data={{
                    labels: weightTrendData.map((data, index) => {
                      const maxWeightLabels = 7; // Adjust as needed
                      const weightLabelSkip = weightTrendData.length > maxWeightLabels ? Math.ceil(weightTrendData.length / maxWeightLabels) : 1;
                      return index % weightLabelSkip === 0 ? data.periodLabel : "";
                    }),
                    datasets: [
                      {
                        data: weightTrendData.map((data) =>
                          unitSystem === "imperial"
                            ? parseFloat(formatWeight(data.averageWeight, unitSystem))
                            : data.averageWeight
                        ),
                        color: (_opacity = 1) => colors.primary,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={Dimensions.get("window").width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (_opacity = 1) => colors.primary,
                    labelColor: (_opacity = 1) => colors.text,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: getAdaptiveDotRadius(weightTrendData.length),
                      strokeWidth: "2",
                      stroke: colors.primary,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: "0", // Solid line
                      stroke: colors.border + "50", // Lighter border color
                      strokeWidth: 1,
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withDots={true}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={false}
                  onDataPointClick={({ index }) => {
                    const weightKg = weightTrendData[index].averageWeight;
                    setSelectedChartData({
                      type: "weight",
                      label: weightTrendData[index].periodLabel,
                      items: [
                        {
                          exerciseName: t("statistics.weightTrend"),
                          value: formatWeight(weightKg, unitSystem),
                          color: colors.primary,
                        },
                      ],
                    });
                    setChartModalVisible(true);
                  }}
                />
              </View>
            )}
          </View>
        )}


        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 차트 데이터 상세 정보 모달 */}
      <Modal animationType="fade" transparent={true} visible={chartModalVisible} onRequestClose={() => setChartModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setChartModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedChartData && (
              <>
                {/* 기간/레이블 */}
                <Text style={[styles.modalLabel, { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 16 }]}>{selectedChartData.label}</Text>

                {/* 운동 리스트 - ScrollView로 감싸기 */}
                <ScrollView style={{ width: "100%", maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  <View style={{ width: "100%", marginBottom: 16 }}>
                    {selectedChartData.items.map((item, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          marginBottom: 8,
                          borderRadius: 12,
                          backgroundColor: item.color + "15",
                          borderWidth: 2,
                          borderColor: item.color + "40",
                        }}
                      >
                        {/* 색상 인디케이터 */}
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: item.color,
                            marginRight: 12,
                            shadowColor: item.color,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 4,
                            elevation: 4,
                          }}
                        />

                        {/* 운동 정보 */}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalItemName, { color: colors.text }]}>{item.exerciseName}</Text>
                          <Text style={[styles.modalItemValue, { color: colors.text }]}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* 닫기 버튼 */}
                <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.primary }]} onPress={() => setChartModalVisible(false)}>
                  <Text style={[styles.modalCloseButtonText, { color: colors.buttonText }]}>{t("common.confirm")}</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 범위 선택 모달 */}
      <Modal animationType="fade" transparent={true} visible={rangeModalVisible} onRequestClose={() => setRangeModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setRangeModalVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.modalLabel, { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 20 }]}>{t("statistics.selectRange")}</Text>

                  <View style={{ width: "100%", gap: 16, marginBottom: 20 }}>
                    {/* 입력 레이블 */}
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: -8 }}>
                      {weightTrendPeriod === "day" && t("statistics.rangeInputLabel.day")}
                      {weightTrendPeriod === "week" && t("statistics.rangeInputLabel.week")}
                      {weightTrendPeriod === "month" && t("statistics.rangeInputLabel.month")}
                    </Text>

                    {/* TextInput */}
                    <TextInput
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: rangeError ? "#FF5252" : colors.primary,
                        backgroundColor: colors.surface,
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.text,
                        textAlign: "center",
                      }}
                      value={tempRangeValue}
                      onChangeText={(text) => {
                        setTempRangeValue(text);
                        setRangeError(""); // Clear error when user types
                      }}
                      keyboardType="numeric"
                      placeholder={
                        weightTrendPeriod === "day"
                          ? "7"
                          : weightTrendPeriod === "week"
                          ? "2"
                          : "3"
                      }
                      placeholderTextColor={colors.textSecondary}
                    />

                    {/* 힌트 텍스트 */}
                    <Text style={{ fontSize: 12, color: rangeError ? "#FF5252" : colors.textSecondary, textAlign: "center" }}>
                      {rangeError ||
                        (weightTrendPeriod === "day" && t("statistics.rangeHint.day")) ||
                        (weightTrendPeriod === "week" && t("statistics.rangeHint.week")) ||
                        (weightTrendPeriod === "month" && t("statistics.rangeHint.month"))}
                    </Text>
                  </View>

                  {/* 버튼 그룹 */}
                  <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                    {/* 취소 버튼 */}
                    <TouchableOpacity
                      style={[
                        styles.modalCloseButton,
                        {
                          backgroundColor: colors.border + "40",
                          flex: 1,
                        },
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setRangeModalVisible(false);
                        setRangeError("");
                      }}
                    >
                      <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
                    </TouchableOpacity>

                    {/* 확인 버튼 */}
                    <TouchableOpacity
                      style={[
                        styles.modalCloseButton,
                        {
                          backgroundColor: colors.primary,
                          flex: 1,
                        },
                      ]}
                      onPress={() => {
                        const value = parseInt(tempRangeValue, 10);

                        // Validate input
                        if (isNaN(value) || tempRangeValue.trim() === "") {
                          setRangeError(t("statistics.rangeError.invalidNumber") || "유효한 숫자를 입력해주세요");
                          return;
                        }

                        // Check min/max based on period
                        let min = 0;
                        let max = 0;
                        if (weightTrendPeriod === "day") {
                          min = 7;
                          max = 30;
                        } else if (weightTrendPeriod === "week") {
                          min = 2;
                          max = 12;
                        } else if (weightTrendPeriod === "month") {
                          min = 3;
                          max = 24;
                        }

                        if (value < min || value > max) {
                          setRangeError(
                            weightTrendPeriod === "day"
                              ? t("statistics.rangeError.outOfRange", { min: 7, max: 30 }) || `7일에서 30일 사이의 값을 입력해주세요`
                              : weightTrendPeriod === "week"
                              ? t("statistics.rangeError.outOfRange", { min: 2, max: 12 }) || `2주에서 12주 사이의 값을 입력해주세요`
                              : t("statistics.rangeError.outOfRange", { min: 3, max: 24 }) || `3개월에서 24개월 사이의 값을 입력해주세요`
                          );
                          return;
                        }

                        // Apply value
                        if (weightTrendPeriod === "day") {
                          setWeightDayRange(value);
                        } else if (weightTrendPeriod === "week") {
                          setWeightWeekRange(value);
                        } else if (weightTrendPeriod === "month") {
                          setWeightMonthRange(value);
                        }

                        Keyboard.dismiss();
                        setRangeModalVisible(false);
                        setRangeError("");
                      }}
                    >
                      <Text style={[styles.modalCloseButtonText, { color: colors.buttonText }]}>{t("common.confirm")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* 운동 선택 모달 */}
      <Modal animationType="slide" transparent={true} visible={showExerciseSelector} onRequestClose={() => setShowExerciseSelector(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: "80%" }]}>
            <Text style={[styles.modalLabel, { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 20 }]}>
              {t("statistics.selectExercises")}
            </Text>

            <ScrollView style={{ width: "100%", maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {exerciseStats.map((exercise) => {
                const isSelected = selectedExercises.has(exercise.exerciseId);
                return (
                  <TouchableOpacity
                    key={exercise.exerciseId}
                    onPress={() => {
                      const newSelected = new Set(selectedExercises);
                      if (isSelected) {
                        newSelected.delete(exercise.exerciseId);
                      } else {
                        newSelected.add(exercise.exerciseId);
                      }
                      setSelectedExercises(newSelected);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      marginBottom: 8,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary + "15" : colors.border + "10",
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : colors.border + "40",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.textSecondary,
                        backgroundColor: isSelected ? colors.primary : "transparent",
                        marginRight: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color={colors.buttonText} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                        {getExerciseName(t, exercise.exerciseId, exercise.exerciseName)}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {t("statistics.totalVolume")}: {formatWeight(exercise.totalVolume, unitSystem)} · {exercise.workoutCount}{t("statistics.timesUnit")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 버튼 그룹 */}
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.border + "40", flex: 1 }]}
                onPress={() => setShowExerciseSelector(false)}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => {
                  setShowExerciseSelector(false);
                  if (selectedExercises.size > 0) {
                    loadVolumeTrends();
                  }
                }}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.buttonText }]}>{t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
