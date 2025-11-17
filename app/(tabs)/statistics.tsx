import { useTheme } from "@/contexts/ThemeContext";
import { profileService } from "@/services/profile";
import {
  CoreStats,
  ExerciseStats,
  ExerciseTypeDistribution,
  Insight,
  PersonalRecord,
  SetsTrendData,
  statisticsService,
  TrendPeriod,
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
import { LineChart, PieChart } from "react-native-chart-kit";
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
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [chartVisibleExercises, setChartVisibleExercises] = useState<Set<string>>(new Set());
  const [exerciseTypeDistribution, setExerciseTypeDistribution] = useState<ExerciseTypeDistribution[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("month");
  const [setsTrends, setSetsTrends] = useState<Map<string, SetsTrendData[]>>(new Map());
  const [weightTrendData, setWeightTrendData] = useState<WeightTrendData[]>([]);
  const [weightTrendPeriod, setWeightTrendPeriod] = useState<TrendPeriod>("month");

  // 범위 선택 상태 (각 기간별로 다른 범위)
  const [dayRange, setDayRange] = useState(30);
  const [weekRange, setWeekRange] = useState(4);
  const [monthRange, setMonthRange] = useState(12);
  const [yearRange, setYearRange] = useState<number | undefined>(undefined); // 전체 데이터

  // 체중 추이 범위 선택 상태
  const [weightDayRange, setWeightDayRange] = useState(7);
  const [weightWeekRange, setWeightWeekRange] = useState(4);
  const [weightMonthRange, setWeightMonthRange] = useState(12);
  const [weightYearRange, setWeightYearRange] = useState<number | undefined>(undefined); // 전체 데이터

  // 범위 선택 모달 상태
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [rangeModalType, setRangeModalType] = useState<"sets" | "weight">("sets");
  const [tempRangeValue, setTempRangeValue] = useState<string>("");
  const [rangeError, setRangeError] = useState<string>("");

  // 차트 클릭 모달 상태
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState<{
    type: "sets" | "pie" | "weight";
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

  // loadStatistics를 일반 함수로 변경하여 항상 최신 상태 참조
  const loadStatistics = async () => {
    try {
      const [stats, weekComp, prs, exStats, exerciseTypes, insightsData, profileData] = await Promise.all([
        statisticsService.getCoreStats(),
        statisticsService.getWeekComparison(),
        statisticsService.getPersonalRecords(),
        statisticsService.getExerciseStats(),
        statisticsService.getExerciseTypeDistribution(),
        statisticsService.getInsights(),
        profileService.getProfile(),
      ]);

      setCoreStats(stats);
      setWeekComparison(weekComp);
      setPersonalRecords(prs);
      setExerciseStats(exStats);
      setExerciseTypeDistribution(exerciseTypes);
      setInsights(insightsData);
      setWeeklyGoal(profileData?.weeklyGoal || null);
      setUnitSystem(profileData?.unitSystem || "metric");

      // 체중 추이도 새로고침
      await loadWeightTrends();
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 세트 수 추이 데이터 로드 - 자동으로 상위 5개 운동 선택
  useEffect(() => {
    const loadSetsTrends = async () => {
      if (exerciseStats.length === 0) {
        return;
      }

      // 상위 5개 운동의 exerciseId 가져오기
      const topExerciseIds = exerciseStats
        .slice(0, 5)
        .map((ex) => ex.exerciseId)
        .filter((id) => id); // exerciseId가 없는 경우 제외

      if (topExerciseIds.length === 0) {
        return;
      }

      let range: number | undefined;
      if (trendPeriod === "day") range = dayRange;
      else if (trendPeriod === "week") range = weekRange;
      else if (trendPeriod === "month") range = monthRange;
      else if (trendPeriod === "year") range = yearRange;

      const trends = await statisticsService.getSetsTrend(t, trendPeriod, topExerciseIds, range);
      setSetsTrends(trends);
      // Initialize chartVisibleExercises with all top 5 exercises
      const topExerciseNames = exerciseStats.slice(0, 5).map((ex) => ex.exerciseName);
      setChartVisibleExercises(new Set(topExerciseNames));
    };

    loadSetsTrends();
  }, [t, trendPeriod, exerciseStats, dayRange, weekRange, monthRange, yearRange]);

  // 체중 추이 기간 또는 범위가 변경되면 체중 추이만 다시 로드
  useEffect(() => {
    loadWeightTrends();
    // loadWeightTrends는 일반 함수이므로 dependency에 포함하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightTrendPeriod, weightDayRange, weightWeekRange, weightMonthRange, weightYearRange]);

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

  const toggleChartExerciseVisibility = (exerciseName: string) => {
    setChartVisibleExercises((prev) => {
      const newVisible = new Set(prev);
      if (newVisible.has(exerciseName)) {
        newVisible.delete(exerciseName);
      } else {
        newVisible.add(exerciseName);
      }
      return newVisible;
    });
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
              <Text style={styles.statIcon}>💪</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{coreStats.totalVolume.toLocaleString()}kg</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("statistics.totalVolume")}</Text>
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
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>{t("statistics.totalVolume")}</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>
                    {isNaN(weekComparison.thisWeek.volume) ? "0" : Math.round(weekComparison.thisWeek.volume).toLocaleString()}kg
                  </Text>
                  {weekComparison.change.volume !== 0 && !isNaN(weekComparison.change.volume) && (
                    <View style={styles.changeContainer}>
                      <Ionicons name={weekComparison.change.volume > 0 ? "arrow-up" : "arrow-down"} size={14} color={weekComparison.change.volume > 0 ? "#4CAF50" : "#FF5252"} />
                      <Text style={[styles.changeText, { color: weekComparison.change.volume > 0 ? "#4CAF50" : "#FF5252" }]}>{Math.abs(weekComparison.change.volume)}%</Text>
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
                <View style={styles.yearStatDivider} />
                <View style={styles.yearStatItem}>
                  <Text style={[styles.yearStatValue, { color: colors.primary }]}>{coreStats.thisYearVolume.toLocaleString()}kg</Text>
                  <Text style={[styles.yearStatLabel, { color: colors.textSecondary }]}>{t("statistics.totalVolume")}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 인사이트 카드 */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("statistics.insights")}</Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>{t(insight.messageKey, insight.messageParams)}</Text>
              </View>
            ))}
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
                    setRangeModalType("weight");
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
                          value: `${formatWeight(weightKg, unitSystem)} ${getWeightUnit(unitSystem)}`,
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

        {/* 개인 기록 */}
        {personalRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("statistics.personalRecords")}</Text>
            <View style={[styles.prContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {personalRecords.slice(0, 5).map((pr, index) => (
                <View key={index} style={styles.prItem}>
                  <View style={styles.prRank}>
                    <Text style={[styles.prRankText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.prContent}>
                    <Text style={[styles.prExercise, { color: colors.text }]}>{getExerciseName(t, pr.exerciseId, pr.exerciseName)}</Text>
                    <Text style={[styles.prDate, { color: colors.textSecondary }]}>{formatDate(pr.date, i18n.language)}</Text>
                  </View>
                  <View style={styles.prStats}>
                    <Text style={[styles.prValue, { color: colors.primary }]}>
                      {formatWeight(pr.weight, unitSystem)} {getWeightUnit(unitSystem)} × {pr.reps}
                    </Text>
                    <Text style={[styles.prTotal, { color: colors.textSecondary }]}>
                      {formatWeight(pr.weight * pr.reps, unitSystem)} {getWeightUnit(unitSystem)} {t("statistics.totalAmount")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 임시 데이터 생성 버튼 (개발 모드) */}
        {/* {showMockButton && (
          <View style={styles.section}>
            <TouchableOpacity style={[styles.mockButton, { backgroundColor: colors.primary }]} onPress={handleGenerateMockData}>
              <Ionicons name="flask" size={20} color="#fff" />
              <Text style={styles.mockButtonText}>임시 데이터 생성 (테스트용)</Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* 운동별 통계 - 세트 수 추이 */}
        {exerciseStats.length > 0 && (
          <View style={styles.section}>
            {/* 세트 수 추이 차트 */}
            {(() => {
              // 자동으로 상위 5개 운동 사용
              const selectedData = exerciseStats.slice(0, 5);

              // 데이터가 없는 경우
              if (selectedData.length === 0) {
                return null;
              }

              // 추이 데이터 수집
              const periodSet = new Set<string>();

              selectedData.forEach((ex) => {
                const trends = setsTrends.get(ex.exerciseId);
                if (trends) {
                  trends.forEach((trend) => {
                    periodSet.add(trend.period);
                  });
                }
              });

              const sortedPeriods = Array.from(periodSet).sort();

              // 데이터가 부족한 경우
              if (sortedPeriods.length === 0) {
                return (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>{t("statistics.setsTrend")}</Text>
                    <View style={[styles.filterButtons, { marginBottom: 16 }]}>
                      {(["day", "week", "month", "year"] as TrendPeriod[]).map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[styles.filterButton, { borderColor: colors.border }, trendPeriod === period && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                          onPress={() => setTrendPeriod(period)}
                        >
                          <Text style={[styles.filterButtonText, { color: trendPeriod === period ? (theme === "dark" ? colors.buttonText : "#fff") : colors.text }]}>
                            {t(`statistics.period${period.charAt(0).toUpperCase() + period.slice(1)}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.emptyChartContainer}>
                        <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>{t("statistics.noTrendData")}</Text>
                      </View>
                    </View>
                  </>
                );
              }

              // 라인 차트용 데이터 준비 - 테두리 없이 순수한 색상으로 크기만 차별화
              const chartColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
              const dotConfigs = [
                { r: 9, strokeWidth: 0, stroke: "transparent", opacity: 0.95 }, // 가장 큰 점
                { r: 6.5, strokeWidth: 0, stroke: "transparent", opacity: 0.95 }, // 작은 점
                { r: 8, strokeWidth: 0, stroke: "transparent", opacity: 0.95 }, // 큰 점
                { r: 6, strokeWidth: 0, stroke: "transparent", opacity: 0.95 }, // 가장 작은 점
                { r: 7.5, strokeWidth: 0, stroke: "transparent", opacity: 0.95 }, // 중간 큰 점
              ];

              // 큰 점을 먼저 그리고 작은 점을 나중에 그려서 작은 점이 위에 오도록
              // 겹치는 점들이 보이도록 아주 작은 오프셋 추가
              const offsets = [0, 0.03, -0.03, 0.05, -0.05]; // 각 운동별 오프셋

              const datasetsWithConfig = selectedData
                .filter((ex) => setsTrends.get(ex.exerciseId) && setsTrends.get(ex.exerciseId)!.length > 0)
                .filter((ex) => chartVisibleExercises.has(ex.exerciseName))
                .map((ex, idx) => {
                  const trends = setsTrends.get(ex.exerciseId) || [];
                  const dotConfig = dotConfigs[idx % dotConfigs.length];
                  const baseColor = chartColors[idx % chartColors.length];
                  const offset = offsets[idx % offsets.length]; // 오프셋 적용
                  // 투명도를 적용한 색상 생성
                  const colorWithOpacity =
                    baseColor +
                    Math.round(dotConfig.opacity * 255)
                      .toString(16)
                      .padStart(2, "0");

                  return {
                    dataset: {
                      // 아주 작은 오프셋을 추가해서 겹치지 않도록
                      data: trends.map((t) => t.averageSets + offset),
                      color: (_opacity = 1) => colorWithOpacity,
                      strokeWidth: 3,
                      withDots: true,
                      propsForDots: {
                        r: dotConfig.r.toString(),
                        strokeWidth: dotConfig.strokeWidth.toString(),
                        stroke: dotConfig.stroke,
                        fill: colorWithOpacity,
                      },
                    },
                    size: dotConfig.r,
                    originalColor: baseColor,
                    offset: offset, // 오프셋 저장 (나중에 모달에서 원본 값 표시용)
                  };
                })
                .sort((a, b) => b.size - a.size); // 큰 것부터 정렬 (큰 점이 먼저 그려지도록)

              const datasets = datasetsWithConfig.map((d) => d.dataset);

              // 첫 번째 운동의 레이블 사용
              const labels = setsTrends.get(selectedData[0].exerciseId)?.map((t) => t.periodLabel) || [];

              return (
                <>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 16 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t("statistics.setsTrend")}</Text>
                    {trendPeriod !== "year" && (
                      <TouchableOpacity
                        onPress={() => {
                          setRangeModalType("sets");
                          const currentValue = trendPeriod === "day" ? dayRange : trendPeriod === "week" ? weekRange : monthRange;
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
                          {trendPeriod === "day" && `${dayRange}${t("statistics.periodDay")}`}
                          {trendPeriod === "week" && `${weekRange}${t("statistics.periodWeek")}`}
                          {trendPeriod === "month" && `${monthRange}${t("statistics.periodMonth")}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {trendPeriod === "year" && <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>{t("statistics.allData")}</Text>}
                  </View>
                  <View style={[styles.filterButtons, { marginBottom: 16 }]}>
                    {(["day", "week", "month", "year"] as TrendPeriod[]).map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[styles.filterButton, { borderColor: colors.border }, trendPeriod === period && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setTrendPeriod(period)}
                      >
                        <Text style={[styles.filterButtonText, { color: trendPeriod === period ? (theme === "dark" ? colors.buttonText : "#fff") : colors.text }]}>
                          {t(`statistics.period${period.charAt(0).toUpperCase() + period.slice(1)}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* 범례 - 스타일 개선 */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20, paddingHorizontal: 4, width: "100%" }}>
                      {selectedData
                        .filter((ex) => setsTrends.get(ex.exerciseId) && setsTrends.get(ex.exerciseId)!.length > 0)
                        .map((ex, idx) => (
                          <TouchableOpacity
                            key={ex.exerciseName}
                            onPress={() => toggleChartExerciseVisibility(ex.exerciseName)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              borderRadius: 20,
                              backgroundColor: chartVisibleExercises.has(ex.exerciseName) ? chartColors[idx % chartColors.length] + "15" : colors.border + "20",
                              borderWidth: 1.5,
                              borderColor: chartVisibleExercises.has(ex.exerciseName) ? chartColors[idx % chartColors.length] + "40" : colors.border + "40",
                              opacity: chartVisibleExercises.has(ex.exerciseName) ? 1 : 0.5,
                            }}
                          >
                            <View
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: chartColors[idx % chartColors.length],
                                shadowColor: chartColors[idx % chartColors.length],
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.4,
                                shadowRadius: 3,
                                elevation: 3,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: chartVisibleExercises.has(ex.exerciseName) ? colors.text : colors.textSecondary,
                                textDecorationLine: chartVisibleExercises.has(ex.exerciseName) ? "none" : "line-through",
                              }}
                            >
                              {getExerciseName(t, ex.exerciseId, ex.exerciseName)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>

                    <LineChart
                      data={{
                        labels: labels.map((label, index) => {
                          const maxSetsLabels = 7; // Adjust as needed
                          const setsLabelSkip = labels.length > maxSetsLabels ? Math.ceil(labels.length / maxSetsLabels) : 1;
                          return index % setsLabelSkip === 0 ? label : "";
                        }),
                        datasets,
                        legend: [], // 커스텀 범례 사용
                      }}
                      width={Dimensions.get("window").width - 40}
                      height={240}
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
                          r: getAdaptiveDotRadius(labels.length),
                          strokeWidth: "0",
                          stroke: "transparent",
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
                      withShadow={false}
                      fromZero={false}
                      onDataPointClick={({ index }) => {
                        // 모든 visible 데이터의 해당 인덱스 값을 수집
                        // datasetsWithConfig의 originalColor를 사용하여 정렬 전 원본 순서의 색상 사용
                        const visibleExercises = selectedData.filter(
                          (ex) => setsTrends.get(ex.exerciseId) && setsTrends.get(ex.exerciseId)!.length > 0 && chartVisibleExercises.has(ex.exerciseName)
                        );

                        const items = visibleExercises
                          .map((exercise, idx) => {
                            const trends = setsTrends.get(exercise.exerciseId) || [];
                            const value = trends[index]?.averageSets;
                            if (value !== undefined) {
                              return {
                                exerciseName: getExerciseName(t, exercise.exerciseId, exercise.exerciseName),
                                value: value.toFixed(1),
                                color: chartColors[idx % chartColors.length],
                              };
                            }
                            return null;
                          })
                          .filter((item): item is NonNullable<typeof item> => item !== null);

                        if (items.length > 0) {
                          setSelectedChartData({
                            type: "sets",
                            label: labels[index],
                            items,
                          });
                          setChartModalVisible(true);
                        }
                      }}
                      segments={4}
                    />
                  </View>
                </>
              );
            })()}
          </View>
        )}

        {/* 운동 유형 분포 - 파이차트 */}
        {exerciseTypeDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("statistics.exerciseTypeDistribution")}</Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <PieChart
                data={exerciseTypeDistribution.map((item, index) => {
                  // 더 화려하고 선명한 색상 팔레트
                  const vibrantColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
                  return {
                    name: getExerciseTypeName(t, item.type),
                    population: item.count,
                    color: vibrantColors[index % vibrantColors.length],
                    legendFontColor: colors.text,
                    legendFontSize: 14,
                  };
                })}
                width={Dimensions.get("window").width - 40}
                height={240}
                chartConfig={{
                  color: (_opacity = 1) => colors.primary,
                  labelColor: (_opacity = 1) => colors.text,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
                style={{
                  borderRadius: 16,
                }}
              />
            </View>
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
                            {selectedChartData.type === "sets" && `${item.value} ${t("routines.sets")}`}
                            {selectedChartData.type === "pie" && item.value}
                            {selectedChartData.type === "weight" && item.value}
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
                      {(rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "day" && t("statistics.rangeInputLabel.day")}
                      {(rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "week" && t("statistics.rangeInputLabel.week")}
                      {(rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "month" && t("statistics.rangeInputLabel.month")}
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
                        (rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "day"
                          ? "7"
                          : (rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "week"
                          ? "2"
                          : "3"
                      }
                      placeholderTextColor={colors.textSecondary}
                    />

                    {/* 힌트 텍스트 */}
                    <Text style={{ fontSize: 12, color: rangeError ? "#FF5252" : colors.textSecondary, textAlign: "center" }}>
                      {rangeError ||
                        ((rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "day" && t("statistics.rangeHint.day")) ||
                        ((rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "week" && t("statistics.rangeHint.week")) ||
                        ((rangeModalType === "sets" ? trendPeriod : weightTrendPeriod) === "month" && t("statistics.rangeHint.month"))}
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
                        const currentPeriod = rangeModalType === "sets" ? trendPeriod : weightTrendPeriod;
                        const value = parseInt(tempRangeValue, 10);

                        // Validate input
                        if (isNaN(value) || tempRangeValue.trim() === "") {
                          setRangeError(t("statistics.rangeError.invalidNumber") || "유효한 숫자를 입력해주세요");
                          return;
                        }

                        // Check min/max based on period
                        let min = 0;
                        let max = 0;
                        if (currentPeriod === "day") {
                          min = 7;
                          max = 30;
                        } else if (currentPeriod === "week") {
                          min = 2;
                          max = 12;
                        } else if (currentPeriod === "month") {
                          min = 3;
                          max = 24;
                        }

                        if (value < min || value > max) {
                          setRangeError(
                            currentPeriod === "day"
                              ? t("statistics.rangeError.outOfRange", { min: 7, max: 30 }) || `7일에서 30일 사이의 값을 입력해주세요`
                              : currentPeriod === "week"
                              ? t("statistics.rangeError.outOfRange", { min: 2, max: 12 }) || `2주에서 12주 사이의 값을 입력해주세요`
                              : t("statistics.rangeError.outOfRange", { min: 3, max: 24 }) || `3개월에서 24개월 사이의 값을 입력해주세요`
                          );
                          return;
                        }

                        // Apply value
                        if (currentPeriod === "day") {
                          if (rangeModalType === "sets") setDayRange(value);
                          else setWeightDayRange(value);
                        } else if (currentPeriod === "week") {
                          if (rangeModalType === "sets") setWeekRange(value);
                          else setWeightWeekRange(value);
                        } else if (currentPeriod === "month") {
                          if (rangeModalType === "sets") setMonthRange(value);
                          else setWeightMonthRange(value);
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
    </View>
  );
}
