import { useTheme } from "@/contexts/ThemeContext";
import {
  statisticsService,
  CoreStats,
  WeekComparison,
  PersonalRecord,
  ExerciseStats,
  ExerciseTypeDistribution,
  Insight,
} from "@/services/statistics";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Alert } from "react-native";
import { generateMockWorkoutData } from "@/utils/generateMockData";
import { PieChart } from "react-native-chart-kit";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMockButton, setShowMockButton] = useState(__DEV__); // 개발 모드에서만 표시

  const [coreStats, setCoreStats] = useState<CoreStats | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [exerciseTypeDistribution, setExerciseTypeDistribution] = useState<ExerciseTypeDistribution[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadStatistics = useCallback(async () => {
    try {
      const [stats, weekComp, prs, exStats, exerciseTypes, insightsData] = await Promise.all([
        statisticsService.getCoreStats(),
        statisticsService.getWeekComparison(),
        statisticsService.getPersonalRecords(),
        statisticsService.getExerciseStats(),
        statisticsService.getExerciseTypeDistribution(),
        statisticsService.getInsights(),
      ]);

      setCoreStats(stats);
      setWeekComparison(weekComp);
      setPersonalRecords(prs);
      setExerciseStats(exStats);
      setExerciseTypeDistribution(exerciseTypes);
      setInsights(insightsData);

      // 처음에는 모든 운동 선택
      if (selectedExercises.size === 0 && exStats.length > 0) {
        setSelectedExercises(new Set(exStats.slice(0, 5).map(ex => ex.exerciseName)));
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const handleGenerateMockData = async () => {
    await generateMockWorkoutData();
    setShowMockButton(false);
    loadStatistics();
  };

  const toggleExercise = (exerciseName: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseName)) {
      newSelected.delete(exerciseName);
    } else {
      if (newSelected.size >= 5) {
        Alert.alert(
          "최대 5개까지 선택 가능",
          "다른 운동을 선택하려면 먼저 하나를 취소해주세요.",
          [{ text: "확인" }]
        );
        return;
      }
      newSelected.add(exerciseName);
    }
    setSelectedExercises(newSelected);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 타이틀 */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>통계</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 핵심 지표 카드 */}
        {coreStats && (
          <View style={styles.statsCardsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{coreStats.currentStreak}일</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>연속 운동</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.statIcon}>💪</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{coreStats.totalVolume.toLocaleString()}kg</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 중량</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.floor(coreStats.totalDuration / 60)}h {coreStats.totalDuration % 60}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 시간</Text>
            </View>
          </View>
        )}

        {/* 주간 비교 */}
        {weekComparison && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>이번 주 성장</Text>
            <View style={[styles.comparisonCard, { backgroundColor: colors.surface }]}>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>운동 횟수</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>
                    {weekComparison.thisWeek.workouts}회
                  </Text>
                  {weekComparison.change.workouts !== 0 && (
                    <View style={styles.changeContainer}>
                      <Ionicons
                        name={weekComparison.change.workouts > 0 ? "arrow-up" : "arrow-down"}
                        size={14}
                        color={weekComparison.change.workouts > 0 ? "#4CAF50" : "#FF5252"}
                      />
                      <Text
                        style={[
                          styles.changeText,
                          { color: weekComparison.change.workouts > 0 ? "#4CAF50" : "#FF5252" },
                        ]}
                      >
                        {Math.abs(weekComparison.change.workouts)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>총 중량</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>
                    {Math.round(weekComparison.thisWeek.volume).toLocaleString()}kg
                  </Text>
                  {weekComparison.change.volume !== 0 && (
                    <View style={styles.changeContainer}>
                      <Ionicons
                        name={weekComparison.change.volume > 0 ? "arrow-up" : "arrow-down"}
                        size={14}
                        color={weekComparison.change.volume > 0 ? "#4CAF50" : "#FF5252"}
                      />
                      <Text
                        style={[
                          styles.changeText,
                          { color: weekComparison.change.volume > 0 ? "#4CAF50" : "#FF5252" },
                        ]}
                      >
                        {Math.abs(weekComparison.change.volume)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.comparisonItem}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>총 시간</Text>
                  <Text style={[styles.comparisonValue, { color: colors.text }]}>
                    {Math.floor(weekComparison.thisWeek.duration / 60)}h
                  </Text>
                  {weekComparison.change.duration !== 0 && (
                    <View style={styles.changeContainer}>
                      <Ionicons
                        name={weekComparison.change.duration > 0 ? "arrow-up" : "arrow-down"}
                        size={14}
                        color={weekComparison.change.duration > 0 ? "#4CAF50" : "#FF5252"}
                      />
                      <Text
                        style={[
                          styles.changeText,
                          { color: weekComparison.change.duration > 0 ? "#4CAF50" : "#FF5252" },
                        ]}
                      >
                        {Math.abs(weekComparison.change.duration)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.comparisonHint, { color: colors.textSecondary }]}>vs 지난주</Text>
            </View>
          </View>
        )}

        {/* 연간 통계 */}
        {coreStats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>올해 활동</Text>
            <View style={[styles.yearStatsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.yearStatRow}>
                <View style={styles.yearStatItem}>
                  <Text style={[styles.yearStatValue, { color: colors.primary }]}>
                    {coreStats.thisYearWorkouts}회
                  </Text>
                  <Text style={[styles.yearStatLabel, { color: colors.textSecondary }]}>총 운동</Text>
                </View>
                <View style={styles.yearStatDivider} />
                <View style={styles.yearStatItem}>
                  <Text style={[styles.yearStatValue, { color: colors.primary }]}>
                    {coreStats.thisYearVolume.toLocaleString()}kg
                  </Text>
                  <Text style={[styles.yearStatLabel, { color: colors.textSecondary }]}>총 중량</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 인사이트 카드 */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>인사이트</Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor:
                      insight.type === "success" ? "#4CAF50" : insight.type === "warning" ? "#FF9800" : colors.primary,
                  },
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 개인 기록 */}
        {personalRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>개인 기록 (PR)</Text>
            <View style={[styles.prContainer, { backgroundColor: colors.surface }]}>
              {personalRecords.slice(0, 5).map((pr, index) => (
                <View key={index} style={styles.prItem}>
                  <View style={styles.prRank}>
                    <Text style={[styles.prRankText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.prContent}>
                    <Text style={[styles.prExercise, { color: colors.text }]}>{pr.exerciseName}</Text>
                    <Text style={[styles.prDate, { color: colors.textSecondary }]}>
                      {new Date(pr.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                  <View style={styles.prStats}>
                    <Text style={[styles.prValue, { color: colors.primary }]}>
                      {pr.weight}kg × {pr.reps}
                    </Text>
                    <Text style={[styles.prTotal, { color: colors.textSecondary }]}>
                      {pr.weight * pr.reps}kg 총량
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 임시 데이터 생성 버튼 (개발 모드) */}
        {showMockButton && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.mockButton, { backgroundColor: colors.primary }]}
              onPress={handleGenerateMockData}
            >
              <Ionicons name="flask" size={20} color="#fff" />
              <Text style={styles.mockButtonText}>임시 데이터 생성 (테스트용)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 운동별 통계 - 바차트 */}
        {exerciseStats.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>운동별 상세 통계</Text>

            {/* 체크박스 필터 */}
            <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>표시할 운동 선택 (최대 5개)</Text>
              <View style={styles.checkboxContainer}>
                {exerciseStats.slice(0, 10).map((ex) => {
                  const isSelected = selectedExercises.has(ex.exerciseName);
                  return (
                    <TouchableOpacity
                      key={ex.exerciseName}
                      style={[
                        styles.checkboxItem,
                        isSelected && {
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => toggleExercise(ex.exerciseName)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text
                        style={[
                          styles.checkboxLabel,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {ex.exerciseName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 바차트 - 총 중량 */}
            {selectedExercises.size > 0 && (() => {
              const selectedData = exerciseStats.filter((ex) => selectedExercises.has(ex.exerciseName));

              // 데이터가 없는 경우
              if (selectedData.length === 0) {
                return null;
              }

              const maxValue = Math.max(...selectedData.map(ex => ex.totalVolume), 0);

              // 모든 운동의 중량이 0인 경우 (유산소, 맨몸 운동 등)
              if (maxValue === 0 || !isFinite(maxValue)) {
                return (
                  <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>총 중량 비교</Text>
                    <View style={styles.emptyChartContainer}>
                      <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                        선택한 운동은 중량 기록이 없습니다
                      </Text>
                      <Text style={[styles.emptyChartSubtext, { color: colors.textSecondary }]}>
                        (유산소, 맨몸 운동 등)
                      </Text>
                    </View>
                  </View>
                );
              }

              const chartWidth = Dimensions.get("window").width - 80;
              const chartHeight = 300;
              const padding = { top: 40, bottom: 60, left: 50, right: 20 };
              const barWidth = Math.max(20, (chartWidth - padding.left - padding.right) / selectedData.length - 16);
              const graphHeight = chartHeight - padding.top - padding.bottom;

              return (
                <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.chartTitle, { color: colors.text }]}>총 중량 비교</Text>
                  <Svg width={chartWidth} height={chartHeight}>
                    {/* 가로 그리드 라인 */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = padding.top + graphHeight * (1 - ratio);
                      return (
                        <Line
                          key={idx}
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke={colors.border}
                          strokeWidth="1"
                          strokeDasharray={ratio === 0 ? "0" : "3,3"}
                        />
                      );
                    })}

                    {/* Y축 레이블 */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = padding.top + graphHeight * (1 - ratio);
                      const value = Math.round(maxValue * ratio);
                      return (
                        <SvgText
                          key={idx}
                          x={padding.left - 10}
                          y={y + 4}
                          fontSize="10"
                          fill={colors.textSecondary}
                          textAnchor="end"
                        >
                          {value}
                        </SvgText>
                      );
                    })}

                    {/* 막대와 레이블 */}
                    {selectedData.map((ex, idx) => {
                      const barHeight = Math.max(0, Math.min(graphHeight, (ex.totalVolume / maxValue) * graphHeight));
                      const x = padding.left + idx * (barWidth + 16) + 8;
                      const y = padding.top + graphHeight - barHeight;

                      // 안전성 검증
                      if (!isFinite(x) || !isFinite(y) || !isFinite(barWidth) || !isFinite(barHeight)) {
                        return null;
                      }

                      return (
                        <React.Fragment key={idx}>
                          {/* 막대 */}
                          {barHeight > 0 && (
                            <Rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill={colors.primary}
                              rx="6"
                              ry="6"
                            />
                          )}

                          {/* 막대 위 숫자 */}
                          <SvgText
                            x={x + barWidth / 2}
                            y={Math.max(padding.top + 12, y - 8)}
                            fontSize="11"
                            fill={colors.text}
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {ex.totalVolume.toLocaleString()}
                          </SvgText>

                          {/* X축 레이블 */}
                          <SvgText
                            x={x + barWidth / 2}
                            y={chartHeight - padding.bottom + 20}
                            fontSize="10"
                            fill={colors.text}
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {ex.exerciseName.length > 6 ? ex.exerciseName.slice(0, 6) + "..." : ex.exerciseName}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}

                    {/* Y축 단위 */}
                    <SvgText
                      x={padding.left - 10}
                      y={padding.top - 10}
                      fontSize="10"
                      fill={colors.textSecondary}
                      textAnchor="end"
                    >
                      kg
                    </SvgText>
                  </Svg>
                </View>
              );
            })()}

            {/* 상세 통계 테이블 */}
            {selectedExercises.size > 0 && (
              <View style={[styles.exerciseStatsContainer, { backgroundColor: colors.surface }]}>
                {exerciseStats
                  .filter((ex) => selectedExercises.has(ex.exerciseName))
                  .map((ex, index) => (
                    <View key={index} style={[styles.exerciseStatItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.exerciseStatHeader}>
                        <Text style={[styles.exerciseStatName, { color: colors.text }]}>{ex.exerciseName}</Text>
                        <Text style={[styles.exerciseStatWorkouts, { color: colors.textSecondary }]}>
                          {ex.workoutCount}일 운동
                        </Text>
                      </View>
                      <View style={styles.exerciseStatGrid}>
                        <View style={styles.exerciseStatCell}>
                          <Text style={[styles.exerciseStatValue, { color: colors.primary }]}>{ex.totalSets}세트</Text>
                          <Text style={[styles.exerciseStatLabel, { color: colors.textSecondary }]}>총 세트</Text>
                        </View>
                        <View style={styles.exerciseStatCell}>
                          <Text style={[styles.exerciseStatValue, { color: colors.primary }]}>{ex.totalReps}회</Text>
                          <Text style={[styles.exerciseStatLabel, { color: colors.textSecondary }]}>총 반복</Text>
                        </View>
                        <View style={styles.exerciseStatCell}>
                          <Text style={[styles.exerciseStatValue, { color: colors.primary }]}>
                            {ex.totalVolume.toLocaleString()}kg
                          </Text>
                          <Text style={[styles.exerciseStatLabel, { color: colors.textSecondary }]}>총 중량</Text>
                        </View>
                      </View>
                      {ex.avgWeight > 0 && (
                        <View style={styles.exerciseStatFooter}>
                          <Text style={[styles.exerciseStatDetail, { color: colors.textSecondary }]}>
                            평균 {ex.avgWeight}kg · 최대 {ex.maxWeight}kg
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            )}

            {selectedExercises.size === 0 && (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  운동을 선택해주세요
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 운동 유형 분포 - 파이차트 */}
        {exerciseTypeDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>운동 유형 분포</Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <PieChart
                data={exerciseTypeDistribution.map((item, index) => {
                  const chartColors = ["#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED"];
                  return {
                    name: item.type,
                    population: item.count,
                    color: chartColors[index % chartColors.length],
                    legendFontColor: colors.text,
                    legendFontSize: 13,
                  };
                })}
                width={Dimensions.get("window").width - 80}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.text,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  statsCardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  mockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  mockButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filterContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  exerciseStatsContainer: {
    padding: 16,
    borderRadius: 16,
  },
  exerciseStatItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  exerciseStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseStatName: {
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseStatWorkouts: {
    fontSize: 12,
  },
  exerciseStatGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  exerciseStatCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseStatLabel: {
    fontSize: 11,
  },
  exerciseStatFooter: {
    marginTop: 4,
  },
  exerciseStatDetail: {
    fontSize: 12,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
  },
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  emptyChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyChartText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyChartSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  comparisonCard: {
    padding: 20,
    borderRadius: 16,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  comparisonItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 12,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparisonHint: {
    fontSize: 11,
    textAlign: "center",
  },
  yearStatsCard: {
    padding: 20,
    borderRadius: 16,
  },
  yearStatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  yearStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  yearStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  yearStatValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  yearStatLabel: {
    fontSize: 13,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  prContainer: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  prItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  prRankText: {
    fontSize: 14,
    fontWeight: "700",
  },
  prContent: {
    flex: 1,
    gap: 2,
  },
  prExercise: {
    fontSize: 15,
    fontWeight: "600",
  },
  prDate: {
    fontSize: 12,
  },
  prStats: {
    alignItems: "flex-end",
    gap: 2,
  },
  prValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  prTotal: {
    fontSize: 11,
  },
});
