import { useTheme } from "@/contexts/ThemeContext";
import { WorkoutRecord } from "@/models";
import { workoutRecordService } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

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

const getExerciseName = (t: any, exerciseId: string, exerciseName?: string) => {
  if (!exerciseId && exerciseName) {
    const inferredId = koreanToExerciseId[exerciseName];
    if (inferredId) {
      return t(`exercises.${inferredId}`);
    }
    return exerciseName;
  }

  if (exerciseId && exerciseId.startsWith("ex_custom_")) {
    return exerciseName || exerciseId;
  }

  if (exerciseId) {
    return t(`exercises.${exerciseId}`);
  }

  return exerciseName || "";
};

const getRoutineName = (t: any, routineId?: string, routineName?: string) => {
  const koreanRoutineMap: Record<string, string> = {
    "초보자 전신 운동": "routine_beginner_fullbody",
    "가슴 집중 운동": "routine_chest_day",
    "등 집중 운동": "routine_back_day",
    "하체 집중 운동": "routine_leg_day",
    홈트레이닝: "routine_home_workout",
  };

  if (routineId && routineId.startsWith("routine_") && !routineId.startsWith("routine_user_")) {
    return t(`routines.${routineId}`);
  }

  if (routineName && koreanRoutineMap[routineName]) {
    return t(`routines.${koreanRoutineMap[routineName]}`);
  }

  if (routineName) {
    const exerciseId = koreanToExerciseId[routineName];
    if (exerciseId) {
      return t(`exercises.${exerciseId}`);
    }
  }

  return routineName || "";
};

export default function HistoryScreen() {
  const { theme, colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"record" | "stats">("record");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WorkoutRecord | null>(null);
  const [memo, setMemo] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const loadRecords = async () => {
    try {
      const allRecords = await workoutRecordService.getAllRecords();
      setRecords(allRecords);
    } catch (error) {
      console.error("Failed to load workout records:", error);
    }
  };

  const markedDates = records.reduce((acc, record) => {
    acc[record.date] = {
      marked: true,
      dotColor: colors.primary,
      selected: selectedDate === record.date,
      selectedColor: colors.primary,
    };
    return acc;
  }, {} as any);

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: colors.primary,
    };
  }

  const goToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleSaveRecord = async () => {
    if (currentRecord) {
      try {
        await workoutRecordService.updateRecord(currentRecord.id, { memo });
        await loadRecords();
      } catch (error) {
        console.error("Failed to save memo:", error);
      }
    }
    setShowEditModal(false);
  };

  const handleDeleteRecord = () => {
    if (!currentRecord) return;

    Alert.alert(t("history.deleteRecord"), t("history.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await workoutRecordService.deleteRecord(currentRecord.id);
            await loadRecords();
            setShowEditModal(false);
            setCurrentRecord(null);
          } catch (error) {
            console.error("Failed to delete record:", error);
            Alert.alert(t("errors.generic"), t("history.deleteFailed"));
          }
        },
      },
    ]);
  };

  const selectedDateRecords = records.filter((r) => r.date === selectedDate);
  const totalWorkouts = records.length;
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>{/* <Text style={[styles.title, { color: colors.text }]}>{t('history.title')}</Text> */}</View>

      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <Pressable style={[styles.tab, activeTab === "record" && { backgroundColor: colors.primary }]} onPress={() => setActiveTab("record")}>
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === "record" && { color: colors.buttonText }]}>{t("history.record")}</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === "stats" && { backgroundColor: colors.primary }]} onPress={() => setActiveTab("stats")}>
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === "stats" && { color: colors.buttonText }]}>{t("history.stats")}</Text>
        </Pressable>
      </View>

      {activeTab === "record" ? (
        <ScrollView>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalWorkouts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("history.totalWorkouts")}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{t("history.duration", { minutes: totalDuration })}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("history.totalDuration")}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.calendarHeaderWrapper}>
              <Pressable style={[styles.todayButton, { backgroundColor: colors.primary }]} onPress={goToToday}>
                <Text style={[styles.todayButtonText, { color: colors.buttonText }]}>Today</Text>
              </Pressable>
            </View>
            <View style={[styles.calendarContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Calendar
                key={`${theme}-${currentMonth}`}
                current={currentMonth || undefined}
                onDayPress={handleDayPress}
                onMonthChange={(month) => setCurrentMonth(month.dateString)}
                markedDates={markedDates}
                theme={{
                  backgroundColor: colors.background,
                  calendarBackground: colors.background,
                  textSectionTitleColor: colors.text,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.buttonText,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.textSecondary,
                  monthTextColor: colors.text,
                  arrowColor: colors.text,
                  dotColor: colors.primary,
                  selectedDotColor: colors.buttonText,
                  textDayFontWeight: "400",
                  textMonthFontWeight: "600",
                  textDayHeaderFontWeight: "600",
                }}
              />
            </View>
          </View>

          {selectedDate && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("history.dateRecord", { date: selectedDate })}</Text>

              {selectedDateRecords.length > 0 ? (
                selectedDateRecords.map((record, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      setCurrentRecord(record);
                      setMemo(record.memo || "");
                      setShowEditModal(true);
                    }}
                  >
                    <View style={styles.recordHeader}>
                      <Text style={[styles.recordTitle, { color: colors.text }]}>{getRoutineName(t, record.routineId, record.routineName)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: record.status === "completed" ? colors.primary + "20" : colors.textSecondary + "20" }]}>
                        <Text style={[styles.statusText, { color: record.status === "completed" ? colors.primary : colors.textSecondary }]}>
                          {record.status === "completed" ? t("history.completed") : t("history.stopped")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recordStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>{t("history.duration", { minutes: record.duration })}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>{t("history.completionRate", { rate: record.completionRate })}</Text>
                      </View>
                      {record.totalVolume !== undefined && record.totalVolume > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.statText, { color: colors.textSecondary }]}>{t("history.volume", { volume: record.totalVolume })}</Text>
                        </View>
                      )}
                    </View>

                    {record.exercises.map((ex, exIdx) => (
                      <View key={exIdx} style={styles.exerciseItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>{getExerciseName(t, ex.exerciseId, ex.exerciseName)}</Text>
                          <Text style={[styles.exerciseSets, { color: colors.textSecondary }]}>
                            {t("history.sets", { completed: ex.sets.filter((s) => s.isCompleted).length, total: ex.sets.length })}
                          </Text>
                          <View style={styles.setsDetailContainer}>
                            {ex.sets.map((set, setIdx) => (
                              <Text key={setIdx} style={[styles.setDetail, { color: colors.textSecondary }]}>
                                {set.isCompleted
                                  ? set.actualDurationSeconds !== undefined && set.actualDurationSeconds > 0
                                    ? t("history.duration", { minutes: Math.round(set.actualDurationSeconds / 60) })
                                    : set.weight > 0
                                      ? t("history.repsWithWeight", { reps: set.actualReps, weight: set.weight })
                                      : t("history.reps", { reps: set.actualReps })
                                  : "-"}
                              </Text>
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}

                    {record.memo && <Text style={[styles.recordMemo, { color: colors.textSecondary }]}>📝 {record.memo}</Text>}
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("history.noRecords")}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.statisticsTabContainer}>
          <Pressable style={[styles.statisticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push("/statistics")}>
            <View style={styles.statisticsIconContainer}>
              <Ionicons name="bar-chart" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.statisticsTitle, { color: colors.text }]}>{t("history.viewStatistics")}</Text>
            <Text style={[styles.statisticsDescription, { color: colors.textSecondary }]}>{t("history.statisticsDescription")}</Text>
            <View style={[styles.statisticsButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.statisticsButtonText, { color: colors.buttonText }]}>{t("history.goToStatistics")}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.buttonText} />
            </View>
          </Pressable>
        </View>
      )}

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("history.editRecord")}</Text>

            {currentRecord && (
              <>
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    {t("history.routine")}: {getRoutineName(t, currentRecord.routineId, currentRecord.routineName)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: currentRecord.status === "completed" ? colors.primary + "20" : colors.textSecondary + "20" }]}>
                    <Text style={[styles.statusText, { color: currentRecord.status === "completed" ? colors.primary : colors.textSecondary }]}>
                      {currentRecord.status === "completed" ? t("history.completed") : t("history.stopped")}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  {t("history.time")}: {t("history.duration", { minutes: currentRecord.duration })}
                </Text>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t("history.completionRate", { rate: currentRecord.completionRate })}</Text>
                {currentRecord.totalVolume !== undefined && currentRecord.totalVolume > 0 && (
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    {t("history.totalVolume")}: {t("history.volume", { volume: currentRecord.totalVolume })}
                  </Text>
                )}

                <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 12 }]}>{t("history.memo")}</Text>
                <TextInput
                  style={[styles.memoInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder={t("history.memoPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.deleteButton, { backgroundColor: "#FF5252" }]} onPress={handleDeleteRecord}>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveRecord}>
                <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{t("common.save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
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
    textAlign: "center",
  },
  calendarHeaderWrapper: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recordStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  recordDuration: {
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    marginTop: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 13,
    marginBottom: 4,
  },
  setsDetailContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setDetail: {
    fontSize: 12,
  },
  recordMemo: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  memoInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    maxWidth: 50,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {},
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statisticsTabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  statisticsCard: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 16,
  },
  statisticsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statisticsTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  statisticsDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  statisticsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  statisticsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
