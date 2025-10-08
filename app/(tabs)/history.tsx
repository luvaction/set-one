import { useTheme } from "@/contexts/ThemeContext";
import { WorkoutRecord } from "@/models";
import { workoutRecordService } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

export default function HistoryScreen() {
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<"record" | "stats">("record");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WorkoutRecord | null>(null);
  const [memo, setMemo] = useState("");

  // 화면 포커스될 때마다 기록 로드
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

  // 날짜별 마킹 데이터
  const markedDates = records.reduce((acc, record) => {
    acc[record.date] = {
      marked: true,
      dotColor: colors.primary,
      selected: selectedDate === record.date,
      selectedColor: colors.primary,
    };
    return acc;
  }, {} as any);

  // 선택한 날짜에 마킹 추가
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

  const selectedDateRecords = records.filter((r) => r.date === selectedDate);
  const totalWorkouts = records.length;
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>운동 기록</Text>
      </View>

      {/* 탭 버튼 */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <Pressable style={[styles.tab, activeTab === "record" && { backgroundColor: colors.primary }]} onPress={() => setActiveTab("record")}>
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === "record" && { color: colors.buttonText }]}>기록</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === "stats" && { backgroundColor: colors.primary }]} onPress={() => setActiveTab("stats")}>
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === "stats" && { color: colors.buttonText }]}>통계</Text>
        </Pressable>
      </View>

      {activeTab === "record" ? (
        <ScrollView>
          {/* 이번 주 통계 */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalWorkouts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 운동 횟수</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalDuration}분</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 운동 시간</Text>
            </View>
          </View>

          {/* 캘린더 */}
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

          {/* 선택한 날짜 기록 */}
          {selectedDate && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedDate} 기록</Text>

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
                      <Text style={[styles.recordTitle, { color: colors.text }]}>{record.routineName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: record.status === "completed" ? colors.primary + "20" : colors.textSecondary + "20" }]}>
                        <Text style={[styles.statusText, { color: record.status === "completed" ? colors.primary : colors.textSecondary }]}>
                          {record.status === "completed" ? "완료" : "중단"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recordStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>{record.duration}분</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>{record.completionRate}%</Text>
                      </View>
                      {record.totalVolume !== undefined && record.totalVolume > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.statText, { color: colors.textSecondary }]}>{record.totalVolume}kg</Text>
                        </View>
                      )}
                    </View>

                    {record.exercises.map((ex, exIdx) => (
                      <View key={exIdx} style={styles.exerciseItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.exerciseName}</Text>
                          <Text style={[styles.exerciseSets, { color: colors.textSecondary }]}>
                            {ex.sets.filter((s) => s.isCompleted).length}/{ex.sets.length} 세트
                          </Text>
                          <View style={styles.setsDetailContainer}>
                            {ex.sets.map((set, setIdx) => (
                              <Text key={setIdx} style={[styles.setDetail, { color: colors.textSecondary }]}>
                                {set.isCompleted ? `${set.actualReps}회${set.weight > 0 ? ` × ${set.weight}kg` : ""}` : "-"}
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
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>이 날의 운동 기록이 없어요</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.statisticsTabContainer}>
          <Pressable
            style={[styles.statisticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/statistics")}
          >
            <View style={styles.statisticsIconContainer}>
              <Ionicons name="bar-chart" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.statisticsTitle, { color: colors.text }]}>운동 통계 보기</Text>
            <Text style={[styles.statisticsDescription, { color: colors.textSecondary }]}>
              볼륨 추이, 운동 부위 분포, 인사이트 확인
            </Text>
            <View style={[styles.statisticsButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.statisticsButtonText, { color: colors.buttonText }]}>통계 보러가기</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.buttonText} />
            </View>
          </Pressable>
        </View>
      )}

      {/* 기록 편집 모달 */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>기록 편집</Text>

            {currentRecord && (
              <>
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>루틴: {currentRecord.routineName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: currentRecord.status === "completed" ? colors.primary + "20" : colors.textSecondary + "20" }]}>
                    <Text style={[styles.statusText, { color: currentRecord.status === "completed" ? colors.primary : colors.textSecondary }]}>
                      {currentRecord.status === "completed" ? "완료" : "중단"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>시간: {currentRecord.duration}분</Text>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>완료율: {currentRecord.completionRate}%</Text>
                {currentRecord.totalVolume !== undefined && currentRecord.totalVolume > 0 && (
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>총 볼륨: {currentRecord.totalVolume}kg</Text>
                )}

                <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 12 }]}>메모</Text>
                <TextInput
                  style={[styles.memoInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="오늘 운동 메모..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>취소</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveRecord}>
                <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>저장</Text>
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
