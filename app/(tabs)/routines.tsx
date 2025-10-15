import { useTheme } from "@/contexts/ThemeContext";
import { Exercise, Routine } from "@/models";
import { CreateRoutineData } from "@/models/routine";
import { workoutSessionService } from "@/services";
import { exerciseService } from "@/services/exercise";
import { routineService } from "@/services/routine";
import { getOrCreateUserId } from "@/utils/userIdHelper";
import { convertExerciseToRoutine } from "@/utils/workoutHelpers";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator, ShadowDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { styles } from "../style/Routine.styles";

// 추천 루틴 그룹 구조
const recommendedRoutineGroups = {
  beginner: {
    nameKey: "routineGroups.beginner",
    icon: "school",
    descriptionKey: "routineGroups.beginnerDesc",
    routines: ["초보자 전신 운동", "홈트레이닝"],
  },
  muscle_gain: {
    nameKey: "routineGroups.muscleGain",
    icon: "fitness",
    descriptionKey: "routineGroups.muscleGainDesc",
    routines: ["가슴 집중 운동", "등 집중 운동", "하체 집중 운동"],
  },
};

// 번역 헬퍼 함수들
const getExerciseName = (t: any, exerciseId: string, exerciseName?: string) => {
  // 커스텀 운동이면 실제 이름 반환 (번역 불필요)
  if (exerciseId.startsWith("ex_custom_")) {
    return exerciseName || exerciseId;
  }
  // 기본 운동은 번역 키 사용
  return t(`exercises.${exerciseId}`);
};

const getRoutineName = (t: any, routineId?: string, routineName?: string) => {
  // 추천 루틴인 경우 ID로 번역 (routine_user_는 제외)
  if (routineId && routineId.startsWith("routine_") && !routineId.startsWith("routine_user_")) {
    return t(`routines.${routineId}`);
  }
  // 일반 루틴은 이름 그대로 반환
  return routineName || "";
};

const getMuscleGroupKey = (targetMuscle: string | undefined) => {
  if (!targetMuscle) return "fullBody";
  const map: Record<string, string> = {
    가슴: "chest",
    삼두: "triceps",
    등: "back",
    이두: "biceps",
    하체: "legs",
    코어: "core",
    "가슴 상부": "chestUpper",
    "가슴 하부": "chestLower",
    "등/하체": "backLegs",
    햄스트링: "hamstring",
    전신: "fullBody",
    어깨: "shoulder",
  };
  return map[targetMuscle] || targetMuscle;
};

const getDifficultyKey = (difficulty: string | undefined) => {
  if (!difficulty) return "beginner";
  const map: Record<string, string> = {
    초급: "beginner",
    중급: "intermediate",
    고급: "advanced",
  };
  return map[difficulty] || difficulty;
};

const formatReps = (t: any, repsMin?: number, repsMax?: number, durationSeconds?: number): string => {
  if (durationSeconds) {
    return t("workoutSession.secondsUnit", { count: durationSeconds });
  }
  if (repsMin && repsMax) {
    if (repsMin === repsMax) {
      return t("workoutSession.repsUnit", { count: repsMin });
    }
    return `${repsMin}-${repsMax}`;
  }
  if (repsMin) {
    return t("workoutSession.repsUnit", { count: repsMin });
  }
  return ""; // Fallback
};

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedTab, setSelectedTab] = useState<"library" | "my" | "recommended">("library");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all"); // 난이도 필터
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendedSearchQuery, setRecommendedSearchQuery] = useState("");
  const [myRoutineSearchQuery, setMyRoutineSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAddToRoutineModal, setShowAddToRoutineModal] = useState(false);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<Exercise | null>(null);

  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseCategory, setCustomExerciseCategory] = useState("bodyweight");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("");
  const [customExerciseDifficulty, setCustomExerciseDifficulty] = useState("초급");
  const [customExerciseDefaultSets, setCustomExerciseDefaultSets] = useState("3");
  const [customExerciseDefaultRepsMin, setCustomExerciseDefaultRepsMin] = useState("10");
  const [customExerciseDefaultRepsMax, setCustomExerciseDefaultRepsMax] = useState("15");
  const [customExerciseTargetWeight, setCustomExerciseTargetWeight] = useState("");
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null); // 사용자 루틴 상태

  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [recommendedRoutinesList, setRecommendedRoutinesList] = useState<Routine[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  const closeCustomExerciseModal = () => {
    setShowCustomExerciseModal(false);
    setEditingExerciseId(null);
    setCustomExerciseName("");
    setCustomExerciseMuscle("");
    setCustomExerciseCategory("bodyweight");
    setCustomExerciseDifficulty("초급");
    setCustomExerciseDefaultSets("3");
    setCustomExerciseDefaultRepsMin("10");
    setCustomExerciseDefaultRepsMax("15");
    setCustomExerciseTargetWeight("");
    Keyboard.dismiss();
  };

  const loadData = useCallback(async () => {
    try {
      const [userRoutines, recommended, exercises] = await Promise.all([
        routineService.getUserRoutines(),
        routineService.getRecommendedRoutines(),
        exerciseService.getAllExercises(),
      ]);
      setMyRoutines(userRoutines);
      setRecommendedRoutinesList(recommended);
      setAllExercises(exercises);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateCustomExercise = async () => {
    if (!customExerciseName.trim()) {
      Alert.alert(t("workoutSession.error"), t("routines.enterExerciseName"));
      return;
    }
    if (!customExerciseMuscle.trim()) {
      Alert.alert(t("workoutSession.error"), t("routines.enterMuscleGroup"));
      return;
    }

    try {
      if (editingExerciseId) {
        // --- 수정 모드 ---
        const exerciseDataToUpdate = {
          name: customExerciseName,
          category: customExerciseCategory,
          muscleGroups: [customExerciseMuscle],
          difficulty: customExerciseDifficulty,
          defaultSets: parseInt(customExerciseDefaultSets) || 3,
          defaultRepsMin: parseInt(customExerciseDefaultRepsMin) || 10,
          defaultRepsMax: parseInt(customExerciseDefaultRepsMax) || 15,
          targetWeight: customExerciseTargetWeight ? parseFloat(customExerciseTargetWeight) : undefined,
        };

        await exerciseService.updateExercise(editingExerciseId, exerciseDataToUpdate);

        Alert.alert(t("workout.completed"), t("customExercise.updated"));
      } else {
        // --- 추가 모드 ---
        const newExerciseData = {
          userId: await getOrCreateUserId(),
          name: customExerciseName,
          category: customExerciseCategory,
          muscleGroups: [customExerciseMuscle],
          difficulty: customExerciseDifficulty,
          defaultSets: parseInt(customExerciseDefaultSets) || 3,
          defaultRepsMin: parseInt(customExerciseDefaultRepsMin) || 10,
          defaultRepsMax: parseInt(customExerciseDefaultRepsMax) || 15,
          targetWeight: customExerciseTargetWeight ? parseFloat(customExerciseTargetWeight) : undefined,
          isCustom: true,
        };

        await exerciseService.createExercise(newExerciseData);
        Alert.alert(t("workout.completed"), t("customExercise.added"));
      }

      closeCustomExerciseModal();
      await loadData(); // 데이터 다시 로드
    } catch (error) {
      console.error("Failed to save custom exercise:", error);
      Alert.alert(t("workoutSession.error"), t("customExercise.saveFailed"));
    }
  };

  const handleEditCustomExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setCustomExerciseName(exercise.name);
    setCustomExerciseCategory(exercise.category || "bodyweight");
    setCustomExerciseMuscle(exercise.muscleGroups?.[0] || "");
    setCustomExerciseDifficulty(exercise.difficulty || "초급");
    setCustomExerciseDefaultSets(exercise.defaultSets?.toString() || "3");
    setCustomExerciseDefaultRepsMin(exercise.defaultRepsMin?.toString() || "10");
    setCustomExerciseDefaultRepsMax(exercise.defaultRepsMax?.toString() || "15");
    setCustomExerciseTargetWeight(exercise.targetWeight?.toString() || "");
    setShowCustomExerciseModal(true);
  };

  const handleDeleteCustomExercise = (exerciseId: string) => {
    Alert.alert(t("customExercise.deleteTitle"), t("customExercise.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await exerciseService.deleteExercise(exerciseId);
            Alert.alert(t("workout.completed"), t("customExercise.deleted"));
            await loadData(); // 데이터 다시 로드
          } catch (error) {
            console.error("Failed to delete custom exercise:", error);
            Alert.alert(t("workoutSession.error"), t("customExercise.deleteFailed"));
          }
        },
      },
    ]);
  };

  const handleCustomExerciseLongPress = (exercise: Exercise) => {
    Alert.alert(t("customExercise.manage"), t("customExercise.manageMessage", { name: exercise.name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.edit"),
        onPress: () => handleEditCustomExercise(exercise),
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => handleDeleteCustomExercise(exercise.id),
      },
    ]);
  };

  const filteredExercises = useMemo(() => {
    return allExercises.filter((exercise) => {
      const matchesDifficulty = selectedDifficulty === "all" || getDifficultyKey(exercise.difficulty) === selectedDifficulty;
      const translatedExerciseName = getExerciseName(t, exercise.id, exercise.name);
      const translatedMuscleGroups = exercise.muscleGroups?.map((m) => t(`muscleGroups.${getMuscleGroupKey(m)}`)).join(", ") || "";
      const matchesSearch = translatedExerciseName.toLowerCase().includes(searchQuery.toLowerCase()) || translatedMuscleGroups.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDifficulty && matchesSearch;
    });
  }, [allExercises, selectedDifficulty, searchQuery, t]);

  const exerciseLibraryTree = useMemo(() => {
    const tree: Record<string, Record<string, Exercise[]>> = {};

    filteredExercises.forEach((exercise) => {
      if (exercise.isCustom) return; // 커스텀 운동은 별도 섹션으로

      const category = exercise.category || "uncategorized";
      const subcategory = exercise.muscleGroups?.[0] || t(`common.default`);

      if (!tree[category]) {
        tree[category] = {};
      }
      if (!tree[category][subcategory]) {
        tree[category][subcategory] = [];
      }
      tree[category][subcategory].push(exercise);
    });

    return tree;
  }, [filteredExercises, t]);

  const customExercises = useMemo(() => allExercises.filter((ex) => ex.isCustom), [allExercises]);

  // 추천 루틴 필터링
  const filteredRecommendedRoutines = recommendedRoutinesList.filter((routine) => {
    const translatedRoutineName = getRoutineName(t, routine.id, routine.name);
    const matchesSearch =
      translatedRoutineName.toLowerCase().includes(recommendedSearchQuery.toLowerCase()) ||
      routine.exercises.some((ex) => getExerciseName(t, ex.id, ex.name).toLowerCase().includes(recommendedSearchQuery.toLowerCase()));
    return matchesSearch;
  }); // 내 루틴 필터링

  const filteredMyRoutines = myRoutines.filter((routine) => {
    const translatedRoutineName = getRoutineName(t, routine.id, routine.name);
    const matchesSearch =
      translatedRoutineName.toLowerCase().includes(myRoutineSearchQuery.toLowerCase()) ||
      routine.exercises.some((ex) => getExerciseName(t, ex.id, ex.name).toLowerCase().includes(myRoutineSearchQuery.toLowerCase()));
    return matchesSearch;
  }); // 개별 운동 바로 시작

  const handlePlayExercise = async (exercise: Exercise) => {
    try {
      const routine = await convertExerciseToRoutine({ ...exercise, defaultSets: exercise.defaultSets || 3 });
      await workoutSessionService.startSession(await getOrCreateUserId(), routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  }; // 내 루틴 바로 시작

  const handlePlayRoutine = async (routine: Routine) => {
    try {
      await workoutSessionService.startSession(await getOrCreateUserId(), routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  }; // 운동을 루틴에 추가하는 함수

  const handleAddExerciseToRoutine = (exercise: Exercise) => {
    setSelectedExerciseForAdd(exercise);
    setShowAddToRoutineModal(true);
  };

  const addToNewRoutine = () => {
    if (!selectedExerciseForAdd) return;
    router.push({
      pathname: "/routine-builder",
      params: {
        preSelectedExercise: JSON.stringify({
          id: selectedExerciseForAdd.id,
          name: selectedExerciseForAdd.name,
          sets: selectedExerciseForAdd.defaultSets || 3,
          repsMin: selectedExerciseForAdd.defaultRepsMin,
          repsMax: selectedExerciseForAdd.defaultRepsMax,
          durationSeconds: selectedExerciseForAdd.defaultDurationSeconds,
          targetMuscle: selectedExerciseForAdd.muscleGroups?.[0],
          difficulty: selectedExerciseForAdd.difficulty,
          restTime: selectedExerciseForAdd.restTime,
        }),
      },
    });
    setShowAddToRoutineModal(false);
  }; // 기존 루틴에 운동 추가

  const addToExistingRoutine = async (routineId: string, routineName: string) => {
    if (!selectedExerciseForAdd) return;

    try {
      await routineService.addExerciseToRoutine(routineId, {
        id: selectedExerciseForAdd.id,
        name: selectedExerciseForAdd.name,
        sets: selectedExerciseForAdd.defaultSets || 3,
        repsMin: selectedExerciseForAdd.defaultRepsMin,
        repsMax: selectedExerciseForAdd.defaultRepsMax,
        durationSeconds: selectedExerciseForAdd.defaultDurationSeconds,
        targetMuscle: selectedExerciseForAdd.muscleGroups?.[0],
        difficulty: selectedExerciseForAdd.difficulty,
        restTime: selectedExerciseForAdd.restTime,
      });

      setShowAddToRoutineModal(false);
      await loadData(); // 목록 새로고침
      Alert.alert("성공", `"${getExerciseName(t, selectedExerciseForAdd.id, selectedExerciseForAdd.name)}"을(를) "${routineName}" 루틴에 추가했습니다.`);
    } catch (error: any) {
      console.error("Failed to add exercise to routine:", error);
      Alert.alert("오류", error.message || "운동 추가에 실패했습니다.");
    }
  }; // 추천 루틴을 내 루틴으로 복사

  const handleCopyToUserRoutine = async (routineToCopy: Routine) => {
    try {
      const userId = await getOrCreateUserId();

      const originalRoutine = await routineService.getRoutineById(routineToCopy.id);
      if (!originalRoutine) {
        throw new Error("Routine not found");
      }

      const originalName = getRoutineName(t, originalRoutine.id, originalRoutine.name);
      const newName = `${originalName} ${t("common.copy")}`;

      const userCopyData: CreateRoutineData = {
        name: newName,
        description: originalRoutine.description ? t(originalRoutine.description) : undefined,
        exercises: originalRoutine.exercises,
        isRecommended: false,
        category: originalRoutine.category,
        duration: originalRoutine.duration,
      };

      const copiedRoutine = await routineService.createRoutine(userId, userCopyData);

      await loadData();
      Alert.alert(t("common.success"), t("routines.routineCopied", { name: copiedRoutine.name }));
    } catch (error) {
      console.error("Failed to copy routine:", error);
      Alert.alert(t("workoutSession.error"), t("routines.routineCopyFailed"));
    }
  }; // 루틴 삭제 함수

  const handleDeleteRoutine = (routineId: string, routineName: string) => {
    Alert.alert("루틴 삭제", `"${routineName}" 루틴을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await routineService.deleteRoutine(routineId);
            await loadData(); // 목록 새로고침
            Alert.alert("성공", "루틴이 삭제되었습니다.");
          } catch (error) {
            console.error("Failed to delete routine:", error);
            Alert.alert("오류", "루틴 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleReorderRoutines = async (newRoutines: Routine[]) => {
    setMyRoutines(newRoutines);
    try {
      await routineService.reorderRoutines(newRoutines.map((r) => r.id));
    } catch (error) {
      console.error("Failed to reorder routines:", error);
    }
  };

  // 세그먼트 컨트롤 렌더링 (공통)
  const renderSegmentControl = () => (
    <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={[styles.segmentButton, selectedTab === "library" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("library")}>
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "library" && { color: colors.buttonText, fontWeight: "600" }]}>
          {t("routines.library")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.segmentButton, selectedTab === "recommended" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("recommended")}>
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "recommended" && { color: colors.buttonText, fontWeight: "600" }]}>
          {t("routines.recommended")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.segmentButton, selectedTab === "my" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("my")}>
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "my" && { color: colors.buttonText, fontWeight: "600" }]}>
          {t("routines.myRoutines")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRoutineItem = ({ item: routine, drag, isActive }: RenderItemParams<Routine>) => (
    <ShadowDecorator>
      <ScaleDecorator>
        <View
          style={[
            styles.routineCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            routine.isRecommended && { borderColor: colors.primary + "40", backgroundColor: colors.primary + "05" },
            isActive && {
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          ]}
        >
          <View style={styles.routineHeader}>
            <View style={styles.routineMainInfo}>
              <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
                <Ionicons name="menu" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.routineInfo}>
                <View style={styles.routineNameRow}>
                  <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                  {routine.isRecommended && (
                    <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.recommendedText, { color: colors.buttonText }]}>추천</Text>
                    </View>
                  )}
                </View>
                {routine.description && (
                  <Text style={[styles.routineDescription, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                    {t(routine.description)}
                  </Text>
                )}
                <View style={styles.routineMeta}>
                  <Text style={[styles.lastUsed, { color: colors.icon }]}>마지막 사용: {routine.lastUsed || "사용한 적 없음"}</Text>
                  <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.duration || t("routines.exerciseCount", { count: routine.exercises.length })}</Text>
                </View>
              </View>
            </View>
            <View style={styles.routineActions}>
              <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={() => handlePlayRoutine(routine)}>
                <Ionicons name="play" size={20} color={colors.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: "/routine-builder",
                    params: {
                      routineId: routine.id,
                      name: routine.name,
                      isEditing: "true",
                    },
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {!routine.isRecommended && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteRoutine(routine.id, routine.name)}>
                  <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.exerciseList}>
            {routine.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseMainInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>• {exercise.id ? getExerciseName(t, exercise.id, exercise.name) : exercise.name}</Text>
                  <View style={styles.exerciseTags}>
                    {exercise.targetMuscle && (
                      <View
                        style={[
                          styles.muscleTag,
                          exercise.targetMuscle === "가슴" && styles.chestTag,
                          exercise.targetMuscle === "등" && styles.backTag,
                          exercise.targetMuscle === "하체" && styles.legTag,
                          exercise.targetMuscle === "코어" && styles.coreTag,
                          exercise.targetMuscle === "삼두" && styles.tricepsTag,
                        ]}
                      >
                        <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                      </View>
                    )}
                    {exercise.difficulty && (
                      <View
                        style={[
                          styles.difficultyTag,
                          exercise.difficulty === "초급" && styles.beginnerTag,
                          exercise.difficulty === "중급" && styles.intermediateTag,
                          exercise.difficulty === "고급" && styles.advancedTag,
                        ]}
                      >
                        <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.exerciseActions}>
                  <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
                    {t("routines.setsRepsFormat", { sets: exercise.sets, reps: formatReps(t, exercise.repsMin, exercise.repsMax, exercise.durationSeconds) })}
                  </Text>
                  <TouchableOpacity style={styles.removeExerciseButton}>
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: colors.primary + "10" }]} onPress={() => setSelectedTab("library")}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.addExerciseText, { color: colors.primary }]}>{t("routines.addExercise")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScaleDecorator>
    </ShadowDecorator>
  );

  // "내 루틴" 탭일 때는 별도 렌더링 (DraggableFlatList가 자체 스크롤을 가지므로)
  if (selectedTab === "my") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View />
            <TouchableOpacity
              style={[
                styles.addButton,
                { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => router.push("/routine-builder")}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>{t("routines.createRoutine")}</Text>
            </TouchableOpacity>
          </View>

          {/* 세그먼트 컨트롤 */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "library" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("library")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "library" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t("routines.library")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "recommended" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("recommended")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "recommended" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t("routines.recommended")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, (selectedTab as string) === "my" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("my")}>
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "my" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t("routines.myRoutines")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 검색창 */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t("routines.searchMyRoutines")}
              placeholderTextColor={colors.textSecondary}
              value={myRoutineSearchQuery}
              onChangeText={setMyRoutineSearchQuery}
            />
            {myRoutineSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setMyRoutineSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <DraggableFlatList
            data={filteredMyRoutines}
            onDragEnd={({ data }) => handleReorderRoutines(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderRoutineItem}
            contentContainerStyle={[styles.routinesList, { paddingBottom: 230 }]}
            activationDistance={20}
          />

          {/* 운동을 루틴에 추가하는 모달 */}
          <Modal visible={showAddToRoutineModal} transparent animationType="fade" onRequestClose={() => setShowAddToRoutineModal(false)}>
            <TouchableWithoutFeedback onPress={() => setShowAddToRoutineModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.addToRoutineModalContent, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {t("routines.addExerciseTitle", { name: getExerciseName(t, selectedExerciseForAdd?.id || "", selectedExerciseForAdd?.name) })}
                      </Text>
                      <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAddToRoutineModal(false)}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalOptions}>
                      <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.background }]} onPress={addToNewRoutine}>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>{t("routines.createNewRoutine")}</Text>
                      </TouchableOpacity>

                      {filteredMyRoutines.length > 0 && (
                        <>
                          <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                          <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>{t("routines.addToExistingRoutine")}</Text>
                          {filteredMyRoutines.map((routine) => (
                            <TouchableOpacity
                              key={routine.id}
                              style={[styles.modalOption, { backgroundColor: colors.background }]}
                              onPress={() => addToExistingRoutine(routine.id, routine.name)}
                            >
                              <Ionicons name="list" size={20} color={colors.textSecondary} />
                              <View style={styles.routineOptionContent}>
                                <Text style={[styles.modalOptionText, { color: colors.text }]}>{routine.name}</Text>
                                <Text style={[styles.routineExerciseCount, { color: colors.textSecondary }]}>
                                  {t("routines.exerciseCount", { count: routine.exercises.length })}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View />
            <TouchableOpacity
              style={[
                styles.addButton,
                { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => router.push("/routine-builder")}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>{t("routines.createRoutine")}</Text>
            </TouchableOpacity>
          </View>

          {/* 세그먼트 컨트롤 */}
          {renderSegmentControl()}

          {/* 라이브러리 탭 - 트리 구조 */}
          {selectedTab === "library" && (
            <>
              {/* 검색창 */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t("routines.searchExercises")}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* 커스텀 운동 추가 버튼 */}
              <View style={styles.customExerciseButtonContainer}>
                <TouchableOpacity style={[styles.customExerciseButton, { backgroundColor: colors.primary }]} onPress={() => setShowCustomExerciseModal(true)}>
                  <Ionicons name="add-circle" size={20} color={colors.buttonText} />
                  <Text style={[styles.customExerciseButtonText, { color: colors.buttonText }]}>{t("routines.addCustomExercise")}</Text>
                </TouchableOpacity>
              </View>

              {/* 난이도 필터 */}
              <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "all" && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("all")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "all" ? colors.buttonText : colors.text }]}>{t("difficulty.all")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "beginner" && styles.beginnerFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("beginner")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "beginner" ? "#FFFFFF" : colors.text }]}>{t("difficulty.beginner")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "intermediate" && styles.intermediateFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("intermediate")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "intermediate" ? "#FFFFFF" : colors.text }]}>{t("difficulty.intermediate")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "advanced" && styles.advancedFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("advanced")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "advanced" ? "#FFFFFF" : colors.text }]}>{t("difficulty.advanced")}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* 트리 구조 카테고리 또는 검색 결과 */}
              <View style={styles.exerciseLibrary}>
                {searchQuery.length > 0 ? (
                  // 검색 중일 때는 필터링된 결과만 평평하게 표시
                  <View style={styles.exerciseList}>
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          onPlay={handlePlayExercise}
                          onAdd={handleAddExerciseToRoutine}
                          onLongPress={handleCustomExerciseLongPress}
                        />
                      ))
                    ) : (
                      <View style={styles.emptySearchResult}>
                        <Ionicons name="search-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>{t("routines.noSearchResults")}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // 검색하지 않을 때는 트리 구조 표시
                  <>
                    {Object.entries(exerciseLibraryTree).map(([category, subcategories]) => (
                      <View key={category}>
                        <TouchableOpacity
                          style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))}
                        >
                          <View style={styles.categoryHeaderContent}>
                            <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{t(`category.${getMuscleGroupKey(category)}`, category)}</Text>
                          </View>
                          <Ionicons name={expandedCategories[category] ? "chevron-down" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {expandedCategories[category] &&
                          Object.entries(subcategories).map(([subcategory, exercises]) => (
                            <View key={subcategory}>
                              <TouchableOpacity
                                style={[styles.subcategoryHeader, { backgroundColor: colors.surface + "80", borderColor: colors.border + "50" }]}
                                onPress={() => setExpandedCategories((prev) => ({ ...prev, [`${category}_${subcategory}`]: !prev[`${category}_${subcategory}`] }))}
                              >
                                <Text style={[styles.subcategoryHeaderText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(subcategory)}`, subcategory)}</Text>
                                <Ionicons name={expandedCategories[`${category}_${subcategory}`] ? "chevron-down" : "chevron-forward"} size={16} color={colors.textSecondary} />
                              </TouchableOpacity>

                              {expandedCategories[`${category}_${subcategory}`] && (
                                <View style={styles.exerciseList}>
                                  {exercises.map((exercise) => (
                                    <ExerciseCard
                                      key={exercise.id}
                                      exercise={exercise}
                                      onPlay={handlePlayExercise}
                                      onAdd={handleAddExerciseToRoutine}
                                      onLongPress={handleCustomExerciseLongPress}
                                    />
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                      </View>
                    ))}

                    {/* 커스텀 운동 섹션 */}
                    {customExercises.length > 0 && (
                      <View>
                        <TouchableOpacity
                          style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => setExpandedCategories((prev) => ({ ...prev, custom: !prev.custom }))}
                        >
                          <View style={styles.categoryHeaderContent}>
                            <Ionicons name="star" size={20} color={colors.primary} />
                            <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{t("routines.customExercise")}</Text>
                          </View>
                          <Ionicons name={expandedCategories.custom ? "chevron-down" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {expandedCategories.custom && (
                          <View style={styles.exerciseList}>
                            {customExercises.map((exercise) => (
                              <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onPlay={handlePlayExercise}
                                onAdd={handleAddExerciseToRoutine}
                                onLongPress={handleCustomExerciseLongPress}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          {/* 추천 루틴 탭 - 트리 구조 */}
          {selectedTab === "recommended" && (
            <>
              {/* 검색창 */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t("routines.searchRoutines")}
                  placeholderTextColor={colors.textSecondary}
                  value={recommendedSearchQuery}
                  onChangeText={setRecommendedSearchQuery}
                />
                {recommendedSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setRecommendedSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* 목적별 그룹 트리 구조 또는 검색 결과 */}
              <View style={styles.exerciseLibrary}>
                {recommendedSearchQuery.length > 0 ? (
                  // 검색 중일 때는 필터링된 결과만 평평하게 표시
                  <View style={styles.routinesList}>
                    {filteredRecommendedRoutines.length > 0 ? (
                      filteredRecommendedRoutines.map((routine) => (
                        <View key={routine.id} style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <View style={styles.routineHeader}>
                            <View style={styles.routineInfo}>
                              <Text style={[styles.routineName, { color: colors.text }]}>{getRoutineName(t, routine.id, routine.name)}</Text>
                              {routine.description && (
                                <Text style={[styles.routineDescription, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                  {t(routine.description)}
                                </Text>
                              )}
                              <View style={styles.routineMeta}>
                                <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {t("routines.exerciseCount", { count: routine.exercises.length })}</Text>
                              </View>
                            </View>
                            <View style={styles.routineActions}>
                              <TouchableOpacity style={[styles.addToMyButton, { backgroundColor: colors.primary + "20" }]} onPress={() => handleCopyToUserRoutine(routine)}>
                                <Ionicons name="add" size={20} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={() => handlePlayRoutine(routine)}>
                                <Ionicons name="play" size={20} color={colors.buttonText} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.exerciseList}>
                            {routine.exercises.map((exercise, index) => (
                              <View key={index} style={styles.exerciseItem}>
                                <View style={styles.exerciseMainInfo}>
                                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                                    • {exercise.id ? getExerciseName(t, exercise.id, exercise.name) : exercise.name}
                                  </Text>
                                  <View style={styles.exerciseTags}>
                                    <View
                                      style={[
                                        styles.muscleTag,
                                        exercise.targetMuscle === "가슴" && styles.chestTag,
                                        exercise.targetMuscle === "등" && styles.backTag,
                                        exercise.targetMuscle === "하체" && styles.legTag,
                                        exercise.targetMuscle === "코어" && styles.coreTag,
                                        exercise.targetMuscle === "삼두" && styles.tricepsTag,
                                      ]}
                                    >
                                      <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                                    </View>
                                    {exercise.difficulty && (
                                      <View
                                        style={[
                                          styles.difficultyTag,
                                          exercise.difficulty === "초급" && styles.beginnerTag,
                                          exercise.difficulty === "중급" && styles.intermediateTag,
                                          exercise.difficulty === "고급" && styles.advancedTag,
                                        ]}
                                      >
                                        <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                                <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
                                  {t("routines.setsRepsFormat", { sets: exercise.sets, reps: formatReps(exercise.repsMin, exercise.repsMax, exercise.durationSeconds) })}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptySearchResult}>
                        <Ionicons name="search-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>{t("routines.noSearchResults")}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // 검색하지 않을 때는 트리 구조 표시
                  Object.entries(recommendedRoutineGroups).map(([groupKey, groupData]) => (
                    <View key={groupKey}>
                      {/* 목적별 그룹 헤더 */}
                      <TouchableOpacity
                        style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [`recommended_${groupKey}`]: !prev[`recommended_${groupKey}`],
                          }))
                        }
                      >
                        <View style={styles.categoryHeaderContent}>
                          <Ionicons name={groupData.icon as any} size={20} color={colors.primary} />
                          <View style={styles.groupHeaderInfo}>
                            <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{t(groupData.nameKey)}</Text>
                            <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>{t(groupData.descriptionKey)}</Text>
                          </View>
                        </View>
                        <Ionicons name={expandedCategories[`recommended_${groupKey}`] ? "chevron-down" : "chevron-forward"} size={20} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 루틴 목록 */}
                      {expandedCategories[`recommended_${groupKey}`] && (
                        <View style={styles.subcategoryContainer}>
                          {filteredRecommendedRoutines
                            .filter((routine) => groupData.routines.includes(routine.name))
                            .map((routine) => {
                              return (
                                <View key={routine.id} style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                  <View style={styles.routineHeader}>
                                    <View style={styles.routineInfo}>
                                      <Text style={[styles.routineName, { color: colors.text }]}>{getRoutineName(t, routine.id, routine.name)}</Text>
                                      {routine.description && (
                                        <Text style={[styles.routineDescription, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                                          {t(routine.description)}
                                        </Text>
                                      )}
                                      <View style={styles.routineMeta}>
                                        <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {t("routines.exerciseCount", { count: routine.exercises.length })}</Text>
                                      </View>
                                    </View>
                                    <View style={styles.routineActions}>
                                      <TouchableOpacity style={[styles.addToMyButton, { backgroundColor: colors.primary + "20" }]} onPress={() => handleCopyToUserRoutine(routine)}>
                                        <Ionicons name="add" size={20} color={colors.primary} />
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={() => handlePlayRoutine(routine)}>
                                        <Ionicons name="play" size={20} color={colors.buttonText} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                  <View style={styles.exerciseList}>
                                    {routine.exercises.map((exercise, index) => (
                                      <View key={index} style={styles.exerciseItem}>
                                        <View style={styles.exerciseMainInfo}>
                                          <Text style={[styles.exerciseName, { color: colors.text }]}>
                                            • {exercise.id ? getExerciseName(t, exercise.id, exercise.name) : exercise.name}
                                          </Text>
                                          <View style={styles.exerciseTags}>
                                            <View
                                              style={[
                                                styles.muscleTag,
                                                exercise.targetMuscle === "가슴" && styles.chestTag,
                                                exercise.targetMuscle === "등" && styles.backTag,
                                                exercise.targetMuscle === "하체" && styles.legTag,
                                                exercise.targetMuscle === "코어" && styles.coreTag,
                                                exercise.targetMuscle === "삼두" && styles.tricepsTag,
                                              ]}
                                            >
                                              <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                                            </View>
                                            {exercise.difficulty && (
                                              <View
                                                style={[
                                                  styles.difficultyTag,
                                                  exercise.difficulty === "초급" && styles.beginnerTag,
                                                  exercise.difficulty === "중급" && styles.intermediateTag,
                                                  exercise.difficulty === "고급" && styles.advancedTag,
                                                ]}
                                              >
                                                <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                                              </View>
                                            )}
                                          </View>
                                        </View>
                                        <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
                                          {t("routines.setsRepsFormat", { sets: exercise.sets, reps: formatReps(exercise.repsMin, exercise.repsMax, exercise.durationSeconds) })}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              );
                            })}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* 운동을 루틴에 추가하는 모달 */}
      <Modal visible={showAddToRoutineModal} transparent animationType="slide" onRequestClose={() => setShowAddToRoutineModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddToRoutineModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedExerciseForAdd?.name} 추가</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAddToRoutineModal(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalOptions}>
                  <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.background }]} onPress={addToNewRoutine}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>새 루틴 만들기</Text>
                  </TouchableOpacity>

                  {filteredMyRoutines.length > 0 && (
                    <>
                      <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                      <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>기존 루틴에 추가</Text>
                      {filteredMyRoutines.map((routine) => (
                        <TouchableOpacity
                          key={routine.id}
                          style={[styles.modalOption, { backgroundColor: colors.background }]}
                          onPress={() => addToExistingRoutine(routine.id, routine.name)}
                        >
                          <Ionicons name="list" size={20} color={colors.textSecondary} />
                          <View style={styles.routineOptionContent}>
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>{routine.name}</Text>
                            <Text style={[styles.routineExerciseCount, { color: colors.textSecondary }]}>{routine.exercises.length}개 운동</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 커스텀 운동 추가/수정 모달 */}
      <Modal visible={showCustomExerciseModal} transparent animationType="fade" onRequestClose={closeCustomExerciseModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeCustomExerciseModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.customExerciseModalContent, { backgroundColor: colors.surface }]}>
                  <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{editingExerciseId ? t("routines.editCustomExercise") : t("routines.addCustomExercise")}</Text>

                    {/* 운동 이름 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.exerciseName")}</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={customExerciseName}
                      onChangeText={setCustomExerciseName}
                      placeholder={t("routines.exerciseNamePlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="next"
                    />

                    {/* 운동 부위 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.exerciseMuscleGroup")}</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={customExerciseMuscle}
                      onChangeText={setCustomExerciseMuscle}
                      placeholder={t("routines.exerciseMuscleGroupPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="done"
                    />

                    {/* 난이도 선택 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.difficulty")}</Text>
                    <View style={styles.categoryButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseDifficulty === "초급" && { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
                        ]}
                        onPress={() => setCustomExerciseDifficulty("초급")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseDifficulty === "초급" && { color: "#FFFFFF" }]}>
                          {t("difficulty.beginner")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseDifficulty === "중급" && { backgroundColor: "#FF9800", borderColor: "#FF9800" },
                        ]}
                        onPress={() => setCustomExerciseDifficulty("중급")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseDifficulty === "중급" && { color: "#FFFFFF" }]}>
                          {t("difficulty.intermediate")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseDifficulty === "고급" && { backgroundColor: "#F44336", borderColor: "#F44336" },
                        ]}
                        onPress={() => setCustomExerciseDifficulty("고급")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseDifficulty === "고급" && { color: "#FFFFFF" }]}>
                          {t("difficulty.advanced")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 카테고리 선택 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.category")}</Text>
                    <View style={styles.categoryButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseCategory === "bodyweight" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setCustomExerciseCategory("bodyweight")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "bodyweight" && { color: colors.buttonText }]}>
                          {t("category.bodyweight")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseCategory === "weights" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setCustomExerciseCategory("weights")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "weights" && { color: colors.buttonText }]}>
                          {t("category.weights")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalCategoryButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          customExerciseCategory === "cardio" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setCustomExerciseCategory("cardio")}
                      >
                        <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "cardio" && { color: colors.buttonText }]}>
                          {t("category.cardio")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 기본 세트 수 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.defaultSets")}</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={customExerciseDefaultSets}
                      onChangeText={setCustomExerciseDefaultSets}
                      placeholder="3"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />

                    {/* 기본 횟수 범위 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("routines.defaultReps")}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TextInput
                        style={[styles.modalInput, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={customExerciseDefaultRepsMin}
                        onChangeText={setCustomExerciseDefaultRepsMin}
                        placeholder={t("routines.minReps")}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        returnKeyType="next"
                      />
                      <TextInput
                        style={[styles.modalInput, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={customExerciseDefaultRepsMax}
                        onChangeText={setCustomExerciseDefaultRepsMax}
                        placeholder={t("routines.maxReps")}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        returnKeyType="next"
                      />
                    </View>

                    {/* 목표 무게 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {t("routines.targetWeight")} ({t("common.optional")})
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={customExerciseTargetWeight}
                      onChangeText={setCustomExerciseTargetWeight}
                      placeholder={t("routines.targetWeightPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />

                    {/* 버튼 */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={closeCustomExerciseModal}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleCreateCustomExercise}>
                        <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{editingExerciseId ? t("common.edit") : t("common.save")}</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </GestureHandlerRootView>
  );
}

const ExerciseCard = ({
  exercise,
  onPlay,
  onAdd,
  onLongPress,
}: {
  exercise: Exercise;
  onPlay: (e: Exercise) => void;
  onAdd: (e: Exercise) => void;
  onLongPress: (e: Exercise) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const CardComponent = exercise.isCustom ? TouchableOpacity : View;
  const cardProps = exercise.isCustom
    ? {
        activeOpacity: 0.7,
        onLongPress: () => onLongPress(exercise),
      }
    : {};

  return (
    <CardComponent key={exercise.id} style={[styles.exerciseLibraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} {...cardProps}>
      <View style={styles.exerciseLibraryInfo}>
        <View style={styles.exerciseNameRow}>
          <Text style={[styles.exerciseLibraryName, { color: colors.text }]}>{getExerciseName(t, exercise.id, exercise.name)}</Text>
          {exercise.isCustom && (
            <View style={[styles.customBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.customBadgeText, { color: colors.buttonText }]}>{t("customExercise.customBadge")}</Text>
            </View>
          )}
        </View>
        <View style={styles.exerciseTags}>
          {exercise.muscleGroups?.map((muscle) => (
            <View key={muscle} style={[styles.muscleTag, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(muscle)}`, muscle)}</Text>
            </View>
          ))}
          {exercise.difficulty && (
            <View style={[styles.difficultyTag, styles[`${getDifficultyKey(exercise.difficulty)}Tag` as keyof typeof styles]]}>
              <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.exerciseDefaultSets, { color: colors.textSecondary }]}>
          {t("routineBuilder.recommendedFormat", {
            sets: exercise.defaultSets || 3,
            reps: formatReps(t, exercise.defaultRepsMin, exercise.defaultRepsMax, exercise.defaultDurationSeconds), // 👈 이 부분을 수정했습니다!
          })}
        </Text>
      </View>
      <View style={styles.exerciseCardActions}>
        <TouchableOpacity style={styles.playIconButton} onPress={() => onPlay(exercise)}>
          <Ionicons name="play-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addToRoutineButton} onPress={() => onAdd(exercise)}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
        {exercise.isCustom && (
          <TouchableOpacity style={styles.actionButton} onPress={() => onLongPress(exercise)}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </CardComponent>
  );
};
