import { useTheme } from "@/contexts/ThemeContext";
import { Routine, WorkoutSession } from "@/models";
import { routineService } from "@/services/routine";
import { workoutSessionService } from "@/services/workoutSession";
import { getOrCreateUserId } from "@/utils/userIdHelper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../style/Workout.style";

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

// 번역 헬퍼 함수
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

const getRoutineName = (t: any, routineId?: string, routineName?: string) => {
  // 추천 루틴인 경우 ID로 번역 (routine_user_는 제외)
  if (routineId && routineId.startsWith("routine_") && !routineId.startsWith("routine_user_")) {
    return t(`routines.${routineId}`);
  }

  // 한글 루틴 이름 매핑 (추천 루틴의 경우)
  const koreanRoutineMap: Record<string, string> = {
    "초보자 전신 운동": "routine_beginner_fullbody",
    "가슴 집중 운동": "routine_chest_day",
    "등 집중 운동": "routine_back_day",
    "하체 집중 운동": "routine_leg_day",
    홈트레이닝: "routine_home_workout",
  };

  // 한글 이름으로 저장된 추천 루틴 변환
  if (routineName && koreanRoutineMap[routineName]) {
    return t(`routines.${koreanRoutineMap[routineName]}`);
  }

  // 일반 루틴은 이름 그대로 반환
  return routineName || "";
};

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
const formatReps = (reps?: number, repsMin?: number, repsMax?: number, durationSeconds?: number): string => {
  if (durationSeconds) {
    return `${durationSeconds}초`;
  }
  if (reps) {
    // If a single rep value is provided
    return `${reps}`;
  }
  if (repsMin && repsMax) {
    if (repsMin === repsMax) {
      return `${repsMin}`;
    }
    return `${repsMin}-${repsMax}`;
  }
  return ""; // Fallback
};

// reps에서 최솟값 추출 (기본값으로 사용)
const getMinReps = (targetReps?: number, targetRepsMin?: number, targetRepsMax?: number, targetDurationSeconds?: number): number => {
  if (targetDurationSeconds) {
    return targetDurationSeconds; // For time-based, return duration as "reps" for default
  }
  if (targetReps) {
    return targetReps;
  }
  if (targetRepsMin) {
    return targetRepsMin;
  }
  return 0; // Fallback
};

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [recommendedRoutines, setRecommendedRoutines] = useState<Routine[]>([]);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // 타이머 관련 상태
  const [totalElapsedTime, setTotalElapsedTime] = useState(0); // 전체 운동 시간 (초)
  const [activeSetTimer, setActiveSetTimer] = useState<SetTimerState | null>(null); // 현재 진행 중인 세트 타이머
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null); // 휴식 타이머
  const [exerciseRestTimer, setExerciseRestTimer] = useState<RestTimerState | null>(null); // 운동 간 휴식 타이머

  // 세트 완료 입력 모달 상태
  const [showSetCompleteModal, setShowSetCompleteModal] = useState(false);
  const [completingSet, setCompletingSet] = useState<{
    exerciseIndex: number;
    setIndex: number;
    targetReps?: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    targetDurationSeconds?: number;
  } | null>(null);
  const [actualReps, setActualReps] = useState("");
  const [actualDurationSeconds, setActualDurationSeconds] = useState(""); // New state for actual duration
  const [weight, setWeight] = useState("");
  const [showBodyWeightInputModal, setShowBodyWeightInputModal] = useState(false);
  const [bodyWeightInput, setBodyWeightInput] = useState("");

  const totalTimerRef = useRef<number | null>(null);
  const setTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const exerciseRestTimerRef = useRef<number | null>(null); // New ref for exercise rest timer
  const workoutStartTimeRef = useRef<number>(0);
  const exerciseStartTimeRef = useRef<number>(0); // New ref for exercise start time

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
      if (setTimerRef.current) clearInterval(setTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      if (exerciseRestTimerRef.current) clearInterval(exerciseRestTimerRef.current);
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
    // 운동 간 휴식 타이머가 실행 중이면 중지
    if (exerciseRestTimer) {
      stopExerciseRestTimer();
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

  // 운동 간 휴식 타이머 시작 (0초부터 카운트업)
  const startExerciseRestTimer = (exerciseIndex: number) => {
    // 다른 타이머 중지
    stopSetTimer();
    stopRestTimer();

    setExerciseRestTimer({
      exerciseIndex,
      setIndex: -1, // 운동 간 휴식은 특정 세트에 속하지 않으므로 -1
      startTime: Date.now(),
      elapsedTime: 0,
      isRunning: true,
    });

    if (exerciseRestTimerRef.current) clearInterval(exerciseRestTimerRef.current); // 기존 exerciseRestTimerRef 재사용
    exerciseRestTimerRef.current = setInterval(() => {
      setExerciseRestTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, 1000);
  };

  // 운동 간 휴식 타이머 중지
  const stopExerciseRestTimer = () => {
    if (exerciseRestTimerRef.current) {
      clearInterval(exerciseRestTimerRef.current);
      exerciseRestTimerRef.current = null;
    }
    setExerciseRestTimer(null);
  };

  const startWorkout = async (routine: Routine) => {
    try {
      const userId = await getOrCreateUserId();
      console.log("Starting workout with routine:", routine);

      const session = await workoutSessionService.startSession(userId, routine);
      setActiveSession(session);
      setShowRoutineSelector(false);

      // 타이머 초기화 및 시작
      workoutStartTimeRef.current = Date.now();
      exerciseStartTimeRef.current = Date.now(); // Initialize exercise start time
      setTotalElapsedTime(0);
      startTotalTimer();
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert(t("workoutSession.error"), t("routines.startWorkoutFailed"));
    }
  };

  const handleStopWorkout = () => {
    Alert.alert(t("workoutSession.stopWorkoutTitle"), t("workoutSession.stopWorkoutMessage"), [
      { text: t("workoutSession.continue"), style: "cancel" },
      {
        text: t("workoutSession.stop"),
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

              Alert.alert(t("workout.completed"), t("workoutSession.workoutSaved"));
            } catch (error) {
              console.error("Failed to stop workout:", error);
              Alert.alert(t("workoutSession.error"), t("workoutSession.stopWorkoutFailed"));
            }
          }
        },
      },
    ]);
  };

  const handleCompleteWorkout = async () => {
    if (!activeSession) return;

    // 모든 타이머 정지 및 초기화
    stopTotalTimer();
    stopSetTimer();
    stopRestTimer();
    workoutStartTimeRef.current = 0;
    setTotalElapsedTime(0);

    // 체중 입력 모달 표시
    setShowBodyWeightInputModal(true);
  };

  const handleSaveCompletedWorkout = async () => {
    if (!activeSession) return;

    try {
      const bodyWeight = parseFloat(bodyWeightInput) || undefined;

      await workoutSessionService.completeSession(activeSession.id, bodyWeight);
      setActiveSession(null);
      setShowBodyWeightInputModal(false);
      setBodyWeightInput("");

      Alert.alert(t("workoutSession.congratulations"), t("workoutSession.workoutCompletedMessage"));
    } catch (error) {
      console.error("Failed to complete workout:", error);
      Alert.alert(t("workoutSession.error"), t("workoutSession.completeWorkoutFailed"));
    }
  };

  // 세트 완료 버튼 클릭 (모달 표시)
  const handleCompleteSetClick = (exerciseIndex: number, setIndex: number) => {
    if (!activeSession) return;

    const exercise = activeSession.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];

    setCompletingSet({
      exerciseIndex,
      setIndex,
      targetReps: set.targetReps,
      targetRepsMin: set.targetRepsMin,
      targetRepsMax: set.targetRepsMax,
      targetDurationSeconds: set.targetDurationSeconds,
    });

    // 기본값 설정
    if (set.targetDurationSeconds) {
      setActualDurationSeconds(String(set.targetDurationSeconds));
      setActualReps(""); // Clear reps if duration-based
    } else {
      const minReps = getMinReps(set.targetReps, set.targetRepsMin, set.targetRepsMax);
      setActualReps(String(minReps));
      setActualDurationSeconds(""); // Clear duration if reps-based
    }

    // 무게 기본값: 목표 무게가 있으면 사용, 없으면 이전 세트의 무게 사용
    let defaultWeight = "";
    if (exercise.targetWeight && exercise.targetWeight > 0) {
      defaultWeight = String(exercise.targetWeight);
    } else if (setIndex > 0) {
      // 이전 세트의 무게가 있으면 사용
      const previousSet = exercise.sets[setIndex - 1];
      if (previousSet.isCompleted && previousSet.weight > 0) {
        defaultWeight = String(previousSet.weight);
      }
    }
    setWeight(defaultWeight);
    setShowSetCompleteModal(true);
  };

  // 세트 완료 저장
  const handleSaveSetComplete = async () => {
    if (!activeSession || !completingSet) return;

    const reps = parseInt(actualReps) || 0;
    const duration = parseInt(actualDurationSeconds) || 0; // New
    const weightValue = parseFloat(weight) || 0;
    const restDuration = restTimer?.elapsedTime || 0; // Get rest duration
    const setElapsedTime = activeSetTimer?.elapsedTime || 0; // Get elapsed time for the current set

    if (reps <= 0 && duration <= 0) {
      Alert.alert(t("workoutSession.error"), t("workoutSession.repsMinimum"));
      return;
    }

    try {
      const { exerciseIndex, setIndex } = completingSet;
      const exercise = activeSession.exercises[exerciseIndex];

      // 세트 완료 처리
      const updated = await workoutSessionService.completeSet(
        activeSession.id,
        exerciseIndex,
        setIndex,
        reps,
        duration, // Pass duration
        weightValue,
        restDuration, // Pass rest duration
        setElapsedTime // Pass set elapsed time
      );
      setActiveSession(updated);

      // 운동 완료 여부 확인
      const allSetsCompleted = exercise.sets.every((set) => set.isCompleted);

      // 현재 운동의 모든 세트가 완료되었다면 운동 시간 기록
      if (allSetsCompleted && exerciseStartTimeRef.current !== 0) {
        const exerciseDuration = Math.floor((Date.now() - exerciseStartTimeRef.current) / 1000);
        await workoutSessionService.updateExerciseDuration(activeSession.id, exerciseIndex, exerciseDuration);
        exerciseStartTimeRef.current = Date.now(); // Reset for next exercise
      }

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

      // 현재 운동의 모든 세트가 완료되었고, 다음 운동이 있다면,
      // 다음 운동을 위해 exerciseStartTimeRef를 설정하고 운동 간 휴식 타이머 시작
      if (allSetsCompleted && exerciseIndex < activeSession.exercises.length - 1) {
        exerciseStartTimeRef.current = Date.now();
        const nextExercise = activeSession.exercises[exerciseIndex + 1];
        // 다음 운동의 첫 번째 세트가 완료되지 않았다면 운동 간 휴식 타이머 시작
        if (!nextExercise.sets[0].isCompleted) {
          startExerciseRestTimer(exerciseIndex + 1);
        }
      }

      // 모달 닫기
      setShowSetCompleteModal(false);
      setCompletingSet(null);
      setActualReps("");
      setWeight("");
    } catch (error) {
      console.error("Failed to complete set:", error);
      Alert.alert(t("workoutSession.error"), t("workoutSession.completeSetFailed"));
    }
  };

  // 활성 세션이 있으면 운동 진행 화면
  if (activeSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getRoutineName(t, activeSession.routineId, activeSession.routineName)}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t("workoutSession.workoutInProgress")}</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.totalTimerText, { color: colors.primary }]}>{formatTime(totalElapsedTime)}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.textSecondary + "20" }]} onPress={handleStopWorkout}>
            <Ionicons name="stop-circle" size={20} color={colors.textSecondary} />
            <Text style={[styles.stopButtonText, { color: colors.textSecondary }]}>{t("workoutSession.stop")}</Text>
          </TouchableOpacity>
        </View>

        {/* 휴식 타이머 표시 */}
        {restTimer && (
          <View style={[styles.restTimerBanner, { backgroundColor: colors.primary }]}>
            <Ionicons name="cafe-outline" size={24} color={colors.buttonText} />
            <View style={styles.restTimerContent}>
              <Text style={[styles.restTimerTitle, { color: colors.buttonText }]}>{t("workoutSession.restTime")}</Text>
              <Text style={[styles.restTimerValue, { color: colors.buttonText }]}>{formatTime(restTimer.elapsedTime)}</Text>
            </View>
            <TouchableOpacity onPress={stopRestTimer}>
              <Ionicons name="close-circle" size={24} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        )}

        {/* 운동 간 휴식 타이머 표시 */}
        {exerciseRestTimer && (
          <View style={[styles.restTimerBanner, { backgroundColor: colors.primary }]}>
            <Ionicons name="walk-outline" size={24} color={colors.buttonText} />
            <View style={styles.restTimerContent}>
              <Text style={[styles.restTimerTitle, { color: colors.buttonText }]}>{t("workoutSession.restBetweenExercises")}</Text>
              <Text style={[styles.restTimerValue, { color: colors.buttonText }]}>{formatTime(exerciseRestTimer.elapsedTime)}</Text>
            </View>
            <TouchableOpacity onPress={stopExerciseRestTimer}>
              <Ionicons name="close-circle" size={24} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.contentScroll}>
          {activeSession.exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.exerciseId} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{getExerciseName(t, exercise.exerciseId, exercise.exerciseName)}</Text>
                {exercise.isCompleted && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => {
                  const isActiveSet = activeSetTimer?.exerciseIndex === exerciseIndex && activeSetTimer?.setIndex === setIndex;

                  return (
                    <React.Fragment key={set.setNumber}>
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
                            <Text style={[styles.setNumber, { color: set.isCompleted || isActiveSet ? colors.primary : colors.textSecondary }]}>
                              {t("workoutSession.setNumber", { number: set.setNumber })}
                            </Text>
                          </View>
                          <Text style={[styles.targetReps, { color: colors.textSecondary }]}>
                            {t("workoutSession.target", { reps: formatReps(set.targetReps, set.targetRepsMin, set.targetRepsMax, set.targetDurationSeconds) })}
                          </Text>
                        </View>

                        {set.isCompleted ? (
                          <View style={styles.completedInfo}>
                            <Text style={[styles.completedText, { color: colors.primary }]}>
                              ✓ {set.actualDurationSeconds !== undefined && set.actualDurationSeconds > 0 ? `${formatTime(set.actualDurationSeconds)}` : `${set.actualReps}회`}
                              {set.weight > 0 && ` (${set.weight}kg)`}
                              {set.elapsedTimeSeconds !== undefined && set.elapsedTimeSeconds > 0 && ` (${formatTime(set.elapsedTimeSeconds)})`}
                            </Text>
                            {set.restDurationSeconds !== undefined && set.restDurationSeconds > 0 && (
                              <Text style={[styles.restTimeText, { color: colors.textSecondary }]}>
                                {t("workoutSession.rest")} {formatTime(set.restDurationSeconds)}
                              </Text>
                            )}
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
                      {set.isCompleted && set.restDurationSeconds !== undefined && set.restDurationSeconds > 0 && setIndex < exercise.sets.length - 1 && (
                        <View style={[styles.restBetweenSets, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.restBetweenSetsText, { color: colors.textSecondary }]}>
                            {t("workoutSession.rest")} {formatTime(set.restDurationSeconds)}
                          </Text>
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.completeButton, { backgroundColor: colors.primary }]} onPress={handleCompleteWorkout}>
            <Ionicons name="checkmark-circle" size={24} color={colors.buttonText} />
            <Text style={[styles.completeButtonText, { color: colors.buttonText }]}>{t("workoutSession.finishWorkout")}</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ 추가된 부분: 세트 완료 입력 모달 */}
        <Modal visible={showSetCompleteModal} animationType="fade" transparent={true} onRequestClose={() => setShowSetCompleteModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.setCompleteModal, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitleSmall, { color: colors.text }]}>{t("workoutSession.setCompleteRecord")}</Text>

              {completingSet && activeSession && (
                <View style={styles.modalContent}>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {getExerciseName(t, activeSession.exercises[completingSet.exerciseIndex].exerciseId, activeSession.exercises[completingSet.exerciseIndex].exerciseName)}
                  </Text>

                  {/* 오류 발생 위치 수정 완료 */}
                  <Text style={[styles.modalLabel, { color: colors.textSecondary, marginBottom: 15 }]}>
                    {t("workoutSession.setInfo", {
                      number: completingSet.setIndex + 1,
                      target: formatReps(completingSet.targetReps, completingSet.targetRepsMin, completingSet.targetRepsMax, completingSet.targetDurationSeconds),
                    })}
                  </Text>

                  {/* 횟수 입력 */}
                  {completingSet.targetDurationSeconds === undefined ? (
                    <View>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{t("workoutSession.actualReps")}</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={actualReps}
                        onChangeText={setActualReps}
                        keyboardType="numeric"
                        placeholder={t("workoutSession.repsRequired")}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={3}
                      />
                    </View>
                  ) : (
                    <View>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{t("workoutSession.actualDuration")}</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={actualDurationSeconds}
                        onChangeText={setActualDurationSeconds}
                        keyboardType="numeric"
                        placeholder={t("workoutSession.durationRequired")}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={3}
                      />
                    </View>
                  )}

                  {/* 무게 입력 */}
                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 15 }]}>{t("workoutSession.weightKg")}</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder={t("workoutSession.weightOptional")}
                    placeholderTextColor={colors.textSecondary}
                    maxLength={6}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <Pressable style={[styles.modalCancelButton, { borderColor: colors.border }]} onPress={() => setShowSetCompleteModal(false)}>
                  <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveButton, { backgroundColor: colors.primary }]} onPress={handleSaveSetComplete}>
                  <Text style={[styles.modalSaveButtonText, { color: colors.buttonText }]}>{t("common.save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 운동 완료 시 체중 입력 모달 */}
        <Modal visible={showBodyWeightInputModal} animationType="fade" transparent={true} onRequestClose={() => setShowBodyWeightInputModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.setCompleteModal, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitleSmall, { color: colors.text }]}>{t("workoutSession.recordBodyWeight")}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginBottom: 15 }]}>{t("workoutSession.recordBodyWeightOptional")}</Text>

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("workoutSession.bodyWeightKg")}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={bodyWeightInput}
                onChangeText={setBodyWeightInput}
                keyboardType="numeric"
                placeholder={t("workoutSession.bodyWeightPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                maxLength={6}
              />

              <View style={styles.modalActions}>
                <Pressable style={[styles.modalCancelButton, { borderColor: colors.border }]} onPress={() => setShowBodyWeightInputModal(false)}>
                  <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveButton, { backgroundColor: colors.primary }]} onPress={handleSaveCompletedWorkout}>
                  <Text style={[styles.modalSaveButtonText, { color: colors.buttonText }]}>{t("common.save")}</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>{t("workoutSession.startWorkoutTitle")}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{t("workoutSession.selectRoutinePrompt")}</Text>

        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={() => setShowRoutineSelector(true)}>
          <Ionicons name="play-circle" size={24} color={colors.buttonText} />
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>{t("workoutSession.selectRoutine")}</Text>
        </TouchableOpacity>
      </View>

      {/* 루틴 선택 모달 */}
      <Modal visible={showRoutineSelector} animationType="slide" onRequestClose={() => setShowRoutineSelector(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("workoutSession.selectRoutine")}</Text>
            <TouchableOpacity onPress={() => setShowRoutineSelector(false)}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.routinesList}>
            {myRoutines.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routines.myRoutines")}</Text>
                {myRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => startWorkout(routine)}
                  >
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineName, { color: colors.text }]}>{getRoutineName(t, routine.id, routine.name)}</Text>
                      <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>{t("workoutSession.exercisesCount", { count: routine.exercises.length })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {recommendedRoutines.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routines.recommended")}</Text>
                {recommendedRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => startWorkout(routine)}
                  >
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineName, { color: colors.text }]}>{getRoutineName(t, routine.id, routine.name)}</Text>
                      <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>{t("workoutSession.exercisesCount", { count: routine.exercises.length })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {myRoutines.length === 0 && recommendedRoutines.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("workoutSession.noRoutinesMessage")}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
