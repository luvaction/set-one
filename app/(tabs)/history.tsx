import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useTheme } from "@/contexts/ThemeContext";

interface WorkoutRecord {
  date: string;
  routineName: string;
  exercises: {
    name: string;
    sets: { reps: number; weight: number }[];
  }[];
  duration: number; // 분 단위
  memo?: string;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<"record" | "stats">("record");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WorkoutRecord | null>(null);
  const [memo, setMemo] = useState("");

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
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const record = records.find((r) => r.date === day.dateString);
    if (record) {
      setCurrentRecord(record);
      setMemo(record.memo || "");
      setShowEditModal(true);
    }
  };

  const handleSaveRecord = () => {
    if (currentRecord) {
      setRecords(
        records.map((r) =>
          r.date === currentRecord.date ? { ...currentRecord, memo } : r
        )
      );
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
        <Pressable
          style={[styles.tab, activeTab === "record" && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab("record")}
        >
          <Text
            style={[styles.tabText, { color: colors.textSecondary }, activeTab === "record" && styles.activeTabText]}
          >
            기록
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "stats" && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab("stats")}
        >
          <Text
            style={[styles.tabText, { color: colors.textSecondary }, activeTab === "stats" && styles.activeTabText]}
          >
            통계
          </Text>
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
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
          </View>
          <View style={[styles.calendarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Calendar
              key={currentMonth}
              current={currentMonth || undefined}
              onDayPress={handleDayPress}
              onMonthChange={(month) => setCurrentMonth(month.dateString)}
              markedDates={markedDates}
              theme={{
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: "#000000",
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                monthTextColor: colors.primary,
                arrowColor: colors.primary,
                dotColor: colors.primary,
                selectedDotColor: "#000000",
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
                <View key={idx} style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>{record.routineName}</Text>
                  <Text style={[styles.recordDuration, { color: colors.textSecondary }]}>{record.duration}분</Text>
                  {record.exercises.map((ex, exIdx) => (
                    <View key={exIdx} style={styles.exerciseItem}>
                      <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                      <Text style={[styles.exerciseSets, { color: colors.textSecondary }]}>
                        {ex.sets.length} 세트
                      </Text>
                    </View>
                  ))}
                  {record.memo && (
                    <Text style={[styles.recordMemo, { color: colors.textSecondary }]}>📝 {record.memo}</Text>
                  )}
                </View>
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
        <View style={styles.comingSoonContainer}>
          <Text style={[styles.comingSoonText, { color: colors.text }]}>Coming Soon</Text>
          <Text style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}>통계 기능이 곧 추가됩니다</Text>
        </View>
      )}

      {/* 기록 편집 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>기록 편집</Text>

            {currentRecord && (
              <>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>루틴: {currentRecord.routineName}</Text>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>시간: {currentRecord.duration}분</Text>

                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>메모</Text>
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
              <Pressable
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveRecord}
              >
                <Text style={[styles.saveButtonText, { color: colors.text }]}>저장</Text>
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
  recordTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recordDuration: {
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 14,
  },
  exerciseSets: {
    fontSize: 14,
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
  saveButton: {
  },
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
  activeTab: {
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
  },
});
