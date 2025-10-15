import { useTheme } from "@/contexts/ThemeContext";
import { CreateRoutineData, Exercise, RoutineExercise } from "@/models";
import { exerciseService } from "@/services";
import { routineService } from "@/services/routine";
import { getOrCreateUserId } from "@/utils/userIdHelper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./style/RoutineBuilder.styles";

// reps를 표시용 문자열로 변환하는 헬퍼 함수
const formatReps = (repsMin?: number, repsMax?: number, durationSeconds?: number): string => {
  if (durationSeconds) {
    return `${durationSeconds}초`;
  }
  if (repsMin && repsMax) {
    if (repsMin === repsMax) {
      return `${repsMin}`;
    }
    return `${repsMin}-${repsMax}`;
  }
  return ""; // Fallback
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

// 문자열을 reps 객체로 파싱하는 헬퍼 함수
interface ParsedReps {
  repsMin?: number;
  repsMax?: number;
  durationSeconds?: number;
}

const parseRepsInput = (input: string): ParsedReps => {
  const trimmedInput = input.trim();

  // 시간 기반 (예: "30초", "30s")
  const durationMatch = trimmedInput.match(/^(\d+)(초|s)$/);
  if (durationMatch) {
    return { durationSeconds: parseInt(durationMatch[1], 10) };
  }

  // 범위 (예: "10-15")
  const rangeMatch = trimmedInput.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return { repsMin: parseInt(rangeMatch[1], 10), repsMax: parseInt(rangeMatch[2], 10) };
  }

  // 단일 숫자 (예: "10")
  const singleNum = parseInt(trimmedInput, 10);
  if (!isNaN(singleNum)) {
    return { repsMin: singleNum, repsMax: singleNum };
  }

  return {}; // Fallback for unparseable input
};

type SelectedExercise = {
  id: string;
  name: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  durationSeconds?: number;
  targetWeight?: number;
  targetMuscle?: string;
  difficulty?: string;
  restTime?: number;
  sequence?: number;
};

export default function RoutineBuilderScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const isEditing = !!params.routineId;

  const routineNameRef = useRef((params.name as string) || "");
  const routineDescriptionRef = useRef("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const loadAllExercises = async () => {
      try {
        const exercisesFromDb = await exerciseService.getAllExercises();
        setAllExercises(exercisesFromDb);
      } catch (error) {
        console.error("Failed to load all exercises:", error);
      }
    };
    loadAllExercises();
  }, []);

  // 수정 모드: 기존 루틴 데이터 불러오기
  // This effect handles adding a pre-selected exercise when navigating from another screen.
  // It should only run when `preSelectedExercise` changes.
  useEffect(() => {
    if (params.preSelectedExercise) {
      try {
        const preSelected = JSON.parse(params.preSelectedExercise as string);
        // To prevent adding it multiple times, we check if the list is empty.
        // This assumes we only pre-select for a new routine.
        if (selectedExercises.length === 0) {
          setSelectedExercises([preSelected]);
        }
      } catch (error) {
        console.error("Failed to parse preSelectedExercise:", error);
      }
    }
  }, [params.preSelectedExercise]);

  useFocusEffect(
    useCallback(() => {
      // This effect runs every time the screen is focused.
      // It's used to reload the routine data when editing to see the latest changes.
      if (isEditing && params.routineId) {
        loadRoutine();
      }
    }, [isEditing, params.routineId])
  );

  const loadRoutine = async () => {
    try {
      const routine = await routineService.getRoutineById(params.routineId as string);
      if (routine) {
        routineNameRef.current = routine.name;
        routineDescriptionRef.current = routine.description || "";
        const sortedExercises = routine.exercises.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        setSelectedExercises(
          sortedExercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            repsMin: ex.repsMin, // New
            repsMax: ex.repsMax, // New
            durationSeconds: ex.durationSeconds, // New
            targetWeight: ex.targetWeight,
            targetMuscle: ex.targetMuscle || "",
            difficulty: ex.difficulty || "",
            restTime: ex.restTime, // New
            sequence: ex.sequence,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load routine:", error);
      Alert.alert(t("workoutSession.error"), t("routineBuilder.loadRoutineFailed"));
    }
  };

  const filteredExercises = allExercises.filter((exercise) => {
    const translatedName = getExerciseName(t, exercise.id, exercise.name);
    const muscleGroups = exercise.muscleGroups?.map((m) => t(`muscleGroups.${getMuscleGroupKey(m)}`)).join(", ") || "";
    return translatedName.toLowerCase().includes(searchQuery.toLowerCase()) || muscleGroups.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const addExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      id: exercise.id,
      name: exercise.name,
      sets: exercise.defaultSets || 3,
      repsMin: exercise.defaultRepsMin,
      repsMax: exercise.defaultRepsMax,
      durationSeconds: exercise.defaultDurationSeconds,
      targetMuscle: exercise.muscleGroups?.[0],
      difficulty: exercise.difficulty,
      restTime: exercise.restTime,
    };
    const updatedExercises = [...selectedExercises, newExercise];
    setSelectedExercises(updatedExercises);
    setShowExerciseLibrary(false);
    setSearchQuery("");
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: "sets" | "reps" | "targetWeight", value: string) => {
    const updated = [...selectedExercises];
    if (field === "sets") {
      updated[index].sets = parseInt(value) || 1;
    } else if (field === "targetWeight") {
      const weight = parseFloat(value);
      updated[index].targetWeight = isNaN(weight) ? undefined : weight;
    } else if (field === "reps") {
      // Handle reps field
      const parsed = parseRepsInput(value);
      updated[index].repsMin = parsed.repsMin;
      updated[index].repsMax = parsed.repsMax;
      updated[index].durationSeconds = parsed.durationSeconds;
    }
    setSelectedExercises(updated);
    console.log("updateExercise: updated selectedExercises", updated);
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    const updated = [...selectedExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedExercises(updated);
  };

  const renderExerciseItem = ({ item, getIndex, drag, isActive }: RenderItemParams<SelectedExercise>) => {
    const index = getIndex();
    const safeIndex = index ?? -1; // null 또는 undefined인 경우 -1 사용 (배열 인덱스 오류 방지)
    const displayIndex = safeIndex !== -1 ? safeIndex + 1 : 1;

    return (
      <ScaleDecorator>
        <View style={[styles.exerciseItem, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && { opacity: 0.7 }]}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseHeaderLeft}>
              <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
                <Ionicons name="menu" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.exerciseItemName, { color: colors.text }]}>
                {displayIndex}. {item.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeExercise(safeIndex)}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseControls}>
            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t("routines.sets")}</Text>
              <View style={[styles.numberInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.numberButton} onPress={() => updateExercise(safeIndex, "sets", String(Math.max(1, item.sets - 1)))}>
                  <Ionicons name="remove" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.numberValue, { color: colors.text }]}>{item.sets}</Text>
                <TouchableOpacity style={styles.numberButton} onPress={() => updateExercise(safeIndex, "sets", String(item.sets + 1))}>
                  <Ionicons name="add" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t("routineBuilder.repsOrTime")}</Text>
              <TextInput
                style={[styles.repsInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={formatReps(item.repsMin, item.repsMax, item.durationSeconds)}
                onChangeText={(value) => updateExercise(safeIndex, "reps", value)}
                placeholder={t("routineBuilder.repsPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.controlGroup, { marginTop: 12 }]}>
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t("routineBuilder.targetWeight")} (kg)</Text>
            <TextInput
              style={[styles.repsInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={item.targetWeight !== undefined ? String(item.targetWeight) : ""}
              onChangeText={(value) => updateExercise(safeIndex, "targetWeight", value)}
              placeholder={t("routineBuilder.targetWeightPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const saveRoutine = async () => {
    console.log("saveRoutine called successfully."); // Added log
    if (!routineNameRef.current.trim()) {
      console.log("saveRoutine: Routine name is empty."); // Added log
      Alert.alert(t("workoutSession.error"), t("routineBuilder.enterRoutineName"));
      return;
    }
    if (selectedExercises.length === 0) {
      console.log("saveRoutine: No exercises selected."); // Added log
      Alert.alert(t("workoutSession.error"), t("routineBuilder.addAtLeastOneExercise"));
      return;
    }

    try {
      const userId = await getOrCreateUserId();
      console.log("selectedExercises before mapping:", selectedExercises); // Added log

      const routineData: CreateRoutineData = {
        name: routineNameRef.current,
        description: routineDescriptionRef.current,
        exercises: selectedExercises.map((ex, index) => {
          const routineExercise: RoutineExercise = {
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            durationSeconds: ex.durationSeconds,
            targetWeight: ex.targetWeight,
            targetMuscle: ex.targetMuscle,
            difficulty: getDifficultyKey(ex.difficulty),
            restTime: ex.restTime,
            sequence: index,
          };
          return routineExercise;
        }),
        isRecommended: false,
      };
      console.log("Saving routine with exercises:", routineData.exercises); // Changed to log

      if (isEditing && params.routineId) {
        // 수정 모드
        await routineService.updateRoutine(params.routineId as string, routineData);
        Alert.alert(t("routineBuilder.saveComplete"), t("routineBuilder.routineUpdated"), [{ text: t("common.confirm"), onPress: () => router.back() }]);
      } else {
        // 새로 생성
        await routineService.createRoutine(userId, routineData);
        Alert.alert(t("routineBuilder.saveComplete"), t("routineBuilder.routineSaved"), [{ text: t("common.confirm"), onPress: () => router.back() }]);
      }
    } catch (error) {
      console.error("Failed to save routine:", error); // Original error log
      Alert.alert(t("workoutSession.error"), t("routineBuilder.saveRoutineFailed"));
    }
  };

  if (showExerciseLibrary) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setShowExerciseLibrary(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("routineBuilder.selectExercise")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t("routineBuilder.searchExercise")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.exerciseLibrary}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => addExercise(exercise)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{getExerciseName(t, exercise.id, exercise.name)}</Text>
                  <View style={styles.exerciseTags}>
                    {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                      <View
                        style={[
                          styles.muscleTag,
                          // You can add more specific styling based on muscle group if needed
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Text style={[styles.muscleTagText, { color: colors.text }]}>
                          {exercise.muscleGroups.map((m) => t(`muscleGroups.${getMuscleGroupKey(m)}`)).join(", ")}
                        </Text>
                      </View>
                    )}
                    {exercise.difficulty && (
                      <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                    )}
                  </View>
                  <Text style={[styles.defaultSets, { color: colors.textSecondary }]}>
                    {t("routineBuilder.recommendedFormat", {
                      sets: exercise.defaultSets || 3,
                      reps: formatReps(exercise.defaultRepsMin, exercise.defaultRepsMax, exercise.defaultDurationSeconds),
                    })}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const renderHeader = () => (
    <View style={styles.content}>
      {/* 루틴 이름 입력 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routines.routineName")}</Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t("routines.routineNamePlaceholder")}
          placeholderTextColor={colors.textSecondary}
          defaultValue={routineNameRef.current}
          onChangeText={(text) => (routineNameRef.current = text)}
        />
      </View>

      {/* 루틴 설명 입력 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routineBuilder.routineDescription")}</Text>
        <TextInput
          style={[styles.descriptionInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t("routineBuilder.routineDescriptionPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          defaultValue={routineDescriptionRef.current}
          onChangeText={(text) => (routineDescriptionRef.current = text)}
          multiline
        />
      </View>

      {/* 운동 목록 헤더 */}
      <View style={[styles.section, { marginBottom: 16 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routineBuilder.exerciseList", { count: selectedExercises.length })}</Text>
          <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: colors.primary + "20" }]} onPress={() => setShowExerciseLibrary(true)}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addExerciseText, { color: colors.primary }]}>{t("routines.addExercise")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 20 }]}>
      <Ionicons name="fitness-outline" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("routineBuilder.addExercisePrompt")}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{t("routineBuilder.addExerciseDescription")}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary, marginTop: 8 }]}>{t("routineBuilder.dragExerciseTip")}</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? t("routineBuilder.editRoutine") : t("routineBuilder.newRoutine")}</Text>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveRoutine}>
            <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{t("common.save")}</Text>
          </TouchableOpacity>
        </View>

        <DraggableFlatList
          data={selectedExercises}
          onDragEnd={({ data }) => setSelectedExercises(data)}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={renderExerciseItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={{ paddingBottom: 100 }}
          activationDistance={20}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
