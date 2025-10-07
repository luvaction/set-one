import { useTheme } from "@/contexts/ThemeContext";
import { Routine, WorkoutSession } from "@/models";
import { routineService } from "@/services/routine";
import { workoutSessionService } from "@/services/workoutSession";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // 화면 포커스될 때마다 활성 세션 확인
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [session, userRoutines, recommended] = await Promise.all([
        workoutSessionService.getActiveSession(),
        routineService.getUserRoutines(),
        routineService.getRecommendedRoutines(),
      ]);
      setActiveSession(session);
      setMyRoutines(userRoutines);
      setRecommendedRoutines(recommended);
    } catch (error) {
      console.error("Failed to load workout data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async (routine: Routine) => {
    try {
      const session = await workoutSessionService.startSession(routine);
      setActiveSession(session);
      setShowRoutineSelector(false);
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  };

  const handleStopWorkout = () => {
    Alert.alert("운동 중단", "운동을 중단하시겠습니까? 진행 상황은 저장됩니다.", [
      { text: "계속하기", style: "cancel" },
      {
        text: "중단",
        style: "destructive",
        onPress: async () => {
          if (activeSession) {
            try {
              await workoutSessionService.stopSession(activeSession.id);
              setActiveSession(null);
              Alert.alert("완료", "운동 기록이 저장되었습니다.");
            } catch (error) {
              console.error("Failed to stop workout:", error);
              Alert.alert("오류", "운동 중단에 실패했습니다.");
            }
          }
        },
      },
    ]);
  };

  const handleCompleteWorkout = async () => {
    if (!activeSession) return;

    try {
      await workoutSessionService.completeSession(activeSession.id);
      setActiveSession(null);
      Alert.alert("축하합니다!", "운동을 완료했습니다. 수고하셨습니다! 💪");
    } catch (error) {
      console.error("Failed to complete workout:", error);
      Alert.alert("오류", "운동 완료 처리에 실패했습니다.");
    }
  };

  // 활성 세션이 있으면 운동 진행 화면
  if (activeSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{activeSession.routineName}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>운동 진행 중</Text>
          </View>
          <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.textSecondary + "20" }]} onPress={handleStopWorkout}>
            <Ionicons name="stop-circle" size={20} color={colors.textSecondary} />
            <Text style={[styles.stopButtonText, { color: colors.textSecondary }]}>중단</Text>
          </TouchableOpacity>
        </View>

        {/* ⭐️ [수정] ScrollView에 contentScroll 적용 */}
        <ScrollView style={styles.contentScroll}>
          {activeSession.exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.exerciseId} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.exerciseName}</Text>
                {exercise.isCompleted && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.setNumber} style={[styles.setRow, { borderBottomColor: colors.border }, set.isCompleted && { backgroundColor: colors.primary + "10" }]}>
                    <Text style={[styles.setNumber, { color: colors.textSecondary }]}>세트 {set.setNumber}</Text>
                    <Text style={[styles.targetReps, { color: colors.textSecondary }]}>목표: {set.targetReps}회</Text>
                    {set.isCompleted ? (
                      <View style={styles.completedInfo}>
                        <Text style={[styles.completedText, { color: colors.primary }]}>✓ {set.actualReps}회</Text>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              const updated = await workoutSessionService.uncompleteSet(activeSession.id, exerciseIndex, setIndex);
                              setActiveSession(updated);
                            } catch (error) {
                              console.error("Failed to uncomplete set:", error);
                            }
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.checkButton, { backgroundColor: colors.primary }]}
                        onPress={async () => {
                          // TODO: 무게/횟수 입력 모달 표시
                          // 지금은 임시로 목표 횟수대로 완료
                          try {
                            const targetReps = parseInt(set.targetReps) || 10;
                            const updated = await workoutSessionService.completeSet(activeSession.id, exerciseIndex, setIndex, targetReps, 0);
                            setActiveSession(updated);
                          } catch (error) {
                            console.error("Failed to complete set:", error);
                          }
                        }}
                      >
                        {/* ⭐️ [수정] buttonText 사용 */}
                        <Text style={[styles.checkButtonText, { color: colors.buttonText }]}>완료</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.completeButton, { backgroundColor: colors.primary }]} onPress={handleCompleteWorkout}>
            {/* ⭐️ [수정] buttonText 사용 */}
            <Ionicons name="checkmark-circle" size={24} color={colors.buttonText} />
            {/* ⭐️ [수정] buttonText 사용 */}
            <Text style={[styles.completeButtonText, { color: colors.buttonText }]}>운동 완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 활성 세션이 없으면 루틴 선택 화면
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ⭐️ [수정] View에 contentCenter 적용 */}
      <View style={styles.contentCenter}>
        <Ionicons name="fitness-outline" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>운동 시작하기</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>루틴을 선택하여{"\n"}운동을 시작하세요</Text>

        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={() => setShowRoutineSelector(true)}>
          {/* ⭐️ [수정] buttonText 사용 */}
          <Ionicons name="play-circle" size={24} color={colors.buttonText} />
          {/* ⭐️ [수정] buttonText 사용 */}
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>루틴 선택</Text>
        </TouchableOpacity>
      </View>

      {/* 루틴 선택 모달 */}
      <Modal visible={showRoutineSelector} animationType="slide" onRequestClose={() => setShowRoutineSelector(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>루틴 선택</Text>
            <TouchableOpacity onPress={() => setShowRoutineSelector(false)}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.routinesList}>
            {myRoutines.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>내 루틴</Text>
                {myRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => startWorkout(routine)}
                  >
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                      <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>{routine.exercises.length}개 운동</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {recommendedRoutines.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>추천 루틴</Text>
                {recommendedRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => startWorkout(routine)}
                  >
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                      <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>{routine.exercises.length}개 운동</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {myRoutines.length === 0 && recommendedRoutines.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>루틴이 없습니다.{"\n"}루틴 탭에서 루틴을 만들어보세요.</Text>
              </View>
            )}
          </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    // ⭐️ [수정] color 속성 제거 (인라인 스타일로 대체)
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
    width: 60,
  },
  targetReps: {
    fontSize: 14,
    flex: 1,
  },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  checkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    // ⭐️ [수정] color 속성 제거 (인라인 스타일로 대체)
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    // ⭐️ [수정] color 속성 제거 (인라인 스타일로 대체)
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  routinesList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
