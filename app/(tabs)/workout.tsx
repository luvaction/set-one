import { useTheme } from "@/contexts/ThemeContext";
import { Routine, WorkoutSession } from "@/models";
import { routineService } from "@/services/routine";
import { workoutSessionService } from "@/services/workoutSession";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// 타이머 상태 타입
type SetTimerState = {
  exerciseIndex: number;
  setIndex: number;
  startTime: number;
  elapsedTime: number; // 초 단위
  isRunning: boolean;
};

type RestTimerState = {
  exerciseIndex: number;
  setIndex: number;
  startTime: number;
  elapsedTime: number; // 초 단위 (0부터 카운트업)
  isRunning: boolean;
};

// reps를 표시용 문자열로 변환하는 헬퍼 함수
const formatReps = (reps: { min: number; max: number } | string): string => {
  if (typeof reps === "string") {
    return reps;
  }
  if (reps.min === reps.max) {
    return `${reps.min}`;
  }
  return `${reps.min}-${reps.max}`;
};

// reps에서 최솟값 추출 (기본값으로 사용)
const getMinReps = (reps: { min: number; max: number } | string): number => {
  if (typeof reps === "string") {
    // 문자열인 경우 숫자 추출 (예: "10-15" → 10, "30초" → 30)
    const match = reps.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
  return reps.min;
};

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // 타이머 관련 상태
  const [totalElapsedTime, setTotalElapsedTime] = useState(0); // 전체 운동 시간 (초)
  const [activeSetTimer, setActiveSetTimer] = useState<SetTimerState | null>(null); // 현재 진행 중인 세트 타이머
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null); // 휴식 타이머

  // 세트 완료 입력 모달 상태
  const [showSetCompleteModal, setShowSetCompleteModal] = useState(false);
  const [completingSet, setCompletingSet] = useState<{ exerciseIndex: number; setIndex: number; targetReps: string } | null>(null);
  const [actualReps, setActualReps] = useState("");
  const [weight, setWeight] = useState("");

  const totalTimerRef = useRef<number | null>(null);
  const setTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const workoutStartTimeRef = useRef<number>(0);

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

      // 세션이 있으면 타이머 시작
      if (session) {
        // 이미 진행 중인 세션 시간을 복원하는 로직이 필요할 수 있지만, 여기서는 단순화하여 전체 타이머만 시작
        startTotalTimer();
      }
    } catch (error) {
      console.error("Failed to load workout data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (setTimerRef.current) clearInterval(setTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  // 전체 타이머 시작
  const startTotalTimer = () => {
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);

    // activeSession에 저장된 startTime을 사용하여 elapsed 시간을 계산해야 하지만,
    // 현재 코드에서는 workoutStartTimeRef를 사용하므로 해당 로직을 따릅니다.
    if (workoutStartTimeRef.current === 0) {
      workoutStartTimeRef.current = Date.now();
    }

    totalTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - workoutStartTimeRef.current) / 1000);
      setTotalElapsedTime(elapsed);
    }, 1000);
  };

  // 전체 타이머 정지
  const stopTotalTimer = () => {
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  };

  // 시간 포맷 함수
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // 세트 타이머 시작
  const startSetTimer = (exerciseIndex: number, setIndex: number) => {
    // 휴식 타이머가 실행 중이면 중지
    if (restTimer) {
      stopRestTimer();
    }

    setActiveSetTimer({
      exerciseIndex,
      setIndex,
      startTime: Date.now(),
      elapsedTime: 0,
      isRunning: true,
    });

    if (setTimerRef.current) clearInterval(setTimerRef.current);
    setTimerRef.current = setInterval(() => {
      setActiveSetTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, 1000);
  };

  // 세트 타이머 일시정지
  const pauseSetTimer = () => {
    setActiveSetTimer((prev) => {
      if (!prev) return prev;
      return { ...prev, isRunning: false };
    });
    if (setTimerRef.current) {
      clearInterval(setTimerRef.current);
      setTimerRef.current = null;
    }
  };

  // 세트 타이머 재개
  const resumeSetTimer = () => {
    setActiveSetTimer((prev) => {
      if (!prev) return prev;
      const newStartTime = Date.now() - prev.elapsedTime * 1000;
      return { ...prev, startTime: newStartTime, isRunning: true };
    });

    if (setTimerRef.current) clearInterval(setTimerRef.current);
    setTimerRef.current = setInterval(() => {
      setActiveSetTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, 1000);
  };

  // 세트 타이머 중지
  const stopSetTimer = () => {
    if (setTimerRef.current) {
      clearInterval(setTimerRef.current);
      setTimerRef.current = null;
    }
    setActiveSetTimer(null);
  };

  // 휴식 타이머 시작 (0초부터 카운트업)
  const startRestTimer = (exerciseIndex: number, setIndex: number) => {
    stopSetTimer();

    setRestTimer({
      exerciseIndex,
      setIndex,
      startTime: Date.now(),
      elapsedTime: 0,
      isRunning: true,
    });

    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, 1000);
  };

  // 휴식 타이머 중지
  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setRestTimer(null);
  };

  const startWorkout = async (routine: Routine) => {
    try {
      const session = await workoutSessionService.startSession(routine);
      setActiveSession(session);
      setShowRoutineSelector(false);

      // 타이머 초기화 및 시작
      workoutStartTimeRef.current = Date.now();
      setTotalElapsedTime(0);
      startTotalTimer();
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

              // 모든 타이머 정지 및 초기화
              stopTotalTimer();
              stopSetTimer();
              stopRestTimer();
              workoutStartTimeRef.current = 0;
              setTotalElapsedTime(0);

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

      // 모든 타이머 정지 및 초기화
      stopTotalTimer();
      stopSetTimer();
      stopRestTimer();
      workoutStartTimeRef.current = 0;
      setTotalElapsedTime(0);

      Alert.alert("축하합니다!", "운동을 완료했습니다. 수고하셨습니다! 💪");
    } catch (error) {
      console.error("Failed to complete workout:", error);
      Alert.alert("오류", "운동 완료 처리에 실패했습니다.");
    }
  };

  // 세트 완료 버튼 클릭 (모달 표시)
  const handleCompleteSetClick = (exerciseIndex: number, setIndex: number) => {
    if (!activeSession) return;

    const exercise = activeSession.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];

    // 목표 횟수 포맷 (표시용)
    const targetRepsString = set.targetReps || "0";

    // 기본값: 최솟값 추출
    const minReps = getMinReps(targetRepsString);

    setCompletingSet({
      exerciseIndex,
      setIndex,
      targetReps: targetRepsString, // 원본 데이터 저장 (표시용)
    });

    // 기본값 설정: 최솟값을 기본값으로 설정
    setActualReps(String(minReps));
    setWeight(""); // 무게는 빈 값으로 시작
    setShowSetCompleteModal(true);
  };

  // 세트 완료 저장
  const handleSaveSetComplete = async () => {
    if (!activeSession || !completingSet) return;

    const reps = parseInt(actualReps) || 0;
    const weightValue = parseFloat(weight) || 0;

    if (reps <= 0) {
      Alert.alert("오류", "횟수는 1 이상이어야 합니다.");
      return;
    }

    try {
      const { exerciseIndex, setIndex } = completingSet;
      const exercise = activeSession.exercises[exerciseIndex];

      // 세트 완료 처리
      const updated = await workoutSessionService.completeSet(activeSession.id, exerciseIndex, setIndex, reps, weightValue);
      setActiveSession(updated);

      // 세트 타이머 중지
      stopSetTimer();

      // 마지막 세트가 아니면 휴식 타이머 시작
      if (setIndex < exercise.sets.length - 1) {
        // 다음 세트가 완료된 상태가 아닐 경우에만 휴식 타이머 시작
        const nextSet = exercise.sets[setIndex + 1];
        if (!nextSet.isCompleted) {
          startRestTimer(exerciseIndex, setIndex + 1);
        }
      }

      // 모달 닫기
      setShowSetCompleteModal(false);
      setCompletingSet(null);
      setActualReps("");
      setWeight("");
    } catch (error) {
      console.error("Failed to complete set:", error);
      Alert.alert("오류", "세트 완료 처리에 실패했습니다.");
    }
  };

  // 활성 세션이 있으면 운동 진행 화면
  if (activeSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{activeSession.routineName}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>운동 진행 중</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.totalTimerText, { color: colors.primary }]}>{formatTime(totalElapsedTime)}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.textSecondary + "20" }]} onPress={handleStopWorkout}>
            <Ionicons name="stop-circle" size={20} color={colors.textSecondary} />
            <Text style={[styles.stopButtonText, { color: colors.textSecondary }]}>중단</Text>
          </TouchableOpacity>
        </View>

        {/* 휴식 타이머 표시 */}
        {restTimer && (
          <View style={[styles.restTimerBanner, { backgroundColor: colors.primary }]}>
            <Ionicons name="cafe-outline" size={24} color={colors.buttonText} />
            <View style={styles.restTimerContent}>
              <Text style={[styles.restTimerTitle, { color: colors.buttonText }]}>휴식 시간</Text>
              <Text style={[styles.restTimerValue, { color: colors.buttonText }]}>{formatTime(restTimer.elapsedTime)}</Text>
            </View>
            <TouchableOpacity onPress={stopRestTimer}>
              <Ionicons name="close-circle" size={24} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.contentScroll}>
          {activeSession.exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.exerciseId} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.exerciseName}</Text>
                {exercise.isCompleted && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => {
                  const isActiveSet = activeSetTimer?.exerciseIndex === exerciseIndex && activeSetTimer?.setIndex === setIndex;

                  return (
                    <View
                      key={set.setNumber}
                      style={[
                        styles.setRow,
                        { borderBottomColor: colors.border },
                        set.isCompleted && { backgroundColor: colors.primary + "15", borderLeftWidth: 3, borderLeftColor: colors.primary },
                        isActiveSet &&
                          !set.isCompleted && {
                            backgroundColor: colors.surface,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.primary,
                            borderWidth: 1,
                            borderColor: colors.primary + "30",
                          },
                      ]}
                    >
                      <View style={styles.setInfo}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {set.isCompleted && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                          {isActiveSet && !set.isCompleted && <Ionicons name="play-circle" size={16} color={colors.primary} />}
                          <Text style={[styles.setNumber, { color: set.isCompleted || isActiveSet ? colors.primary : colors.textSecondary }]}>세트 {set.setNumber}</Text>
                        </View>
                        <Text style={[styles.targetReps, { color: colors.textSecondary }]}>목표: {formatReps(set.targetReps)}회</Text>
                      </View>

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
                        <View style={styles.setControls}>
                          {isActiveSet && (
                            <View style={styles.setTimerDisplay}>
                              <Ionicons name="timer-outline" size={16} color={colors.primary} />
                              <Text style={[styles.setTimerText, { color: colors.primary }]}>{formatTime(activeSetTimer.elapsedTime)}</Text>
                            </View>
                          )}

                          <View style={styles.setButtons}>
                            {!isActiveSet ? (
                              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + "20" }]} onPress={() => startSetTimer(exerciseIndex, setIndex)}>
                                <Ionicons name="play" size={18} color={colors.primary} />
                              </TouchableOpacity>
                            ) : activeSetTimer.isRunning ? (
                              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.textSecondary + "20" }]} onPress={pauseSetTimer}>
                                <Ionicons name="pause" size={18} color={colors.textSecondary} />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + "20" }]} onPress={resumeSetTimer}>
                                <Ionicons name="play" size={18} color={colors.primary} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={[styles.iconButton, styles.completeIconButton, { backgroundColor: colors.primary }]}
                              onPress={() => handleCompleteSetClick(exerciseIndex, setIndex)}
                            >
                              <Ionicons name="checkmark" size={18} color={colors.buttonText} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.completeButton, { backgroundColor: colors.primary }]} onPress={handleCompleteWorkout}>
            <Ionicons name="checkmark-circle" size={24} color={colors.buttonText} />
            <Text style={[styles.completeButtonText, { color: colors.buttonText }]}>운동 완료</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ 추가된 부분: 세트 완료 입력 모달 */}
        <Modal visible={showSetCompleteModal} animationType="fade" transparent={true} onRequestClose={() => setShowSetCompleteModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.setCompleteModal, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitleSmall, { color: colors.text }]}>세트 완료 기록</Text>

              {completingSet && activeSession && (
                <View style={styles.modalContent}>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{activeSession.exercises[completingSet.exerciseIndex].exerciseName}</Text>

                  {/* 오류 발생 위치 수정 완료 */}
                  <Text style={[styles.modalLabel, { color: colors.textSecondary, marginBottom: 15 }]}>
                    세트 {completingSet.setIndex + 1} (목표: {completingSet.targetReps}회)
                  </Text>

                  {/* 횟수 입력 */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>실제 횟수</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={actualReps}
                    onChangeText={setActualReps}
                    keyboardType="numeric"
                    placeholder="횟수 입력 (필수)"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={3}
                  />

                  {/* 무게 입력 */}
                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 15 }]}>무게 (kg)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="무게 입력 (선택)"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={6}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <Pressable style={[styles.modalCancelButton, { borderColor: colors.border }]} onPress={() => setShowSetCompleteModal(false)}>
                  <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>취소</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveButton, { backgroundColor: colors.primary }]} onPress={handleSaveSetComplete}>
                  <Text style={[styles.modalSaveButtonText, { color: colors.buttonText }]}>저장</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 활성 세션이 없으면 루틴 선택 화면
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentCenter}>
        <Ionicons name="fitness-outline" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>운동 시작하기</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>루틴을 선택하여{"\n"}운동을 시작하세요</Text>

        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={() => setShowRoutineSelector(true)}>
          <Ionicons name="play-circle" size={24} color={colors.buttonText} />
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
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  totalTimerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  restTimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  restTimerContent: {
    flex: 1,
  },
  restTimerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  restTimerValue: {
    fontSize: 24,
    fontWeight: "bold",
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
    gap: 8,
  },
  setInfo: {
    flex: 1,
    gap: 2,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  targetReps: {
    fontSize: 12,
  },
  setControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setTimerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  setTimerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  setButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  completeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  setCompleteModal: {
    width: "85%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitleSmall: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  modalLabel: {
    // ⬅️ 이 스타일을 추가하여 오류를 해결했습니다.
    fontSize: 14,
    marginBottom: 8, // 참고 코드에서 가져옴
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
