import { useTheme } from "@/contexts/ThemeContext";
import { CreateRoutineData } from "@/models";
import { routineService } from "@/services/routine";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

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

// 번역 헬퍼 함수들
const getExerciseName = (t: any, exerciseId: string, exerciseName?: string) => {
  // 커스텀 운동이면 실제 이름 반환 (번역 불필요)
  if (exerciseId.startsWith('ex_custom_')) {
    return exerciseName || exerciseId;
  }
  // 기본 운동은 번역 키 사용
  return t(`exercises.${exerciseId}`);
};

const getMuscleGroupKey = (targetMuscle: string) => {
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

const getDifficultyKey = (difficulty: string) => {
  const map: Record<string, string> = {
    초급: "beginner",
    중급: "intermediate",
    고급: "advanced",
  };
  return map[difficulty] || difficulty;
};

// 문자열을 reps 객체로 파싱하는 헬퍼 함수
const parseReps = (reps: string): { min: number; max: number } | string => {
  // 숫자가 없으면 문자열 그대로 반환 (예: "30초")
  if (!/\d/.test(reps)) {
    return reps;
  }

  // "10-15" 형태
  if (reps.includes("-")) {
    const parts = reps.split("-").map((s) => parseInt(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { min: parts[0], max: parts[1] };
    }
  }

  // "10" 형태 (단일 숫자)
  const num = parseInt(reps);
  if (!isNaN(num)) {
    return { min: num, max: num };
  }

  // 파싱 실패 시 문자열 그대로 반환
  return reps;
};

// 운동 데이터 (routines.tsx에서 가져온 것과 동일)
const exercises = {
  // 푸시업 계열 (맨몸)
  regularPushup: { id: "regularPushup", name: "일반 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: { min: 10, max: 15 } },
  diamondPushup: {
    id: "diamondPushup",
    name: "다이아몬드 푸시업",
    category: "bodyweight",
    targetMuscle: "삼두",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: { min: 8, max: 12 },
  },
  widePushup: { id: "widePushup", name: "와이드 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: { min: 10, max: 15 } },
  inclinePushup: {
    id: "inclinePushup",
    name: "인클라인 푸시업",
    category: "bodyweight",
    targetMuscle: "가슴",
    difficulty: "초급",
    defaultSets: 3,
    defaultReps: { min: 15, max: 20 },
  },

  // 풀업/친업 계열 (맨몸)
  regularPullup: { id: "regularPullup", name: "풀업", category: "bodyweight", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: { min: 5, max: 10 } },
  chinup: { id: "chinup", name: "친업", category: "bodyweight", targetMuscle: "이두", difficulty: "중급", defaultSets: 3, defaultReps: { min: 6, max: 10 } },

  // 스쿼트 계열 (맨몸)
  bodyweightSquat: {
    id: "bodyweightSquat",
    name: "바디웨이트 스쿼트",
    category: "bodyweight",
    targetMuscle: "하체",
    difficulty: "초급",
    defaultSets: 3,
    defaultReps: { min: 15, max: 20 },
  },
  jumpSquat: { id: "jumpSquat", name: "점프 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "중급", defaultSets: 3, defaultReps: { min: 10, max: 15 } },

  // 플랭크 계열 (맨몸)
  regularPlank: { id: "regularPlank", name: "플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "초급", defaultSets: 3, defaultReps: "30-60초" },
  sidePlank: { id: "sidePlank", name: "사이드 플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "20-45초" },

  // 웨이트
  flatBenchPress: {
    id: "flatBenchPress",
    name: "플랫 벤치프레스",
    category: "weights",
    targetMuscle: "가슴",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: { min: 8, max: 12 },
  },
  inclineBenchPress: {
    id: "inclineBenchPress",
    name: "인클라인 벤치프레스",
    category: "weights",
    targetMuscle: "가슴 상부",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: { min: 8, max: 12 },
  },
  dumbbellFly: { id: "dumbbellFly", name: "덤벨 플라이", category: "weights", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: { min: 10, max: 15 } },
};

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetWeight?: number;
  targetMuscle: string;
  difficulty: string;
};

export default function RoutineBuilderScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const isEditing = !!params.routineId;

  const [routineName, setRoutineName] = useState((params.name as string) || "");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 수정 모드: 기존 루틴 데이터 불러오기
  useEffect(() => {
    if (isEditing && params.routineId) {
      loadRoutine();
    } else if (params.preSelectedExercise) {
      // 미리 선택된 운동이 있으면 추가
      try {
        const preSelected = JSON.parse(params.preSelectedExercise as string);
        setSelectedExercises([preSelected]);
      } catch (error) {
        console.error("Failed to parse preSelectedExercise:", error);
      }
    }
  }, [params.routineId, params.preSelectedExercise]);

  const loadRoutine = async () => {
    try {
      const routine = await routineService.getRoutineById(params.routineId as string);
      if (routine) {
        setRoutineName(routine.name);
        setSelectedExercises(
          routine.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: formatReps(ex.reps), // 객체를 문자열로 변환
            targetWeight: ex.targetWeight,
            targetMuscle: ex.targetMuscle || "", // Ensure targetMuscle is string
            difficulty: ex.difficulty || "", // Ensure difficulty is string
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load routine:", error);
      Alert.alert(t("workoutSession.error"), t("routineBuilder.loadRoutineFailed"));
    }
  };

  const exerciseList = Object.values(exercises);
  const filteredExercises = exerciseList.filter(
    (exercise) => exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) || exercise.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExercise = (exercise: (typeof exercises)[keyof typeof exercises]) => {
    const newExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      sets: exercise.defaultSets,
      reps: formatReps(exercise.defaultReps), // 객체를 문자열로 변환
      targetMuscle: exercise.targetMuscle,
      difficulty: exercise.difficulty,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExerciseLibrary(false);
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
    } else {
      updated[index].reps = value;
    }
    setSelectedExercises(updated);
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    const updated = [...selectedExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedExercises(updated);
  };

  const renderExerciseItem = ({ item, getIndex, drag, isActive }: RenderItemParams<Exercise>) => {
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
                value={item.reps}
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
    if (!routineName.trim()) {
      Alert.alert(t("workoutSession.error"), t("routineBuilder.enterRoutineName"));
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert(t("workoutSession.error"), t("routineBuilder.addAtLeastOneExercise"));
      return;
    }

    try {
      const routineData: CreateRoutineData = {
        name: routineName,
        exercises: selectedExercises.map((ex) => ({
          ...ex,
          reps: parseReps(ex.reps), // 문자열을 객체로 변환
          targetWeight: ex.targetWeight,
        })),
        isRecommended: false,
      };

      if (isEditing && params.routineId) {
        // 수정 모드
        await routineService.updateRoutine(params.routineId as string, routineData);
        Alert.alert(t("routineBuilder.saveComplete"), t("routineBuilder.routineUpdated"), [{ text: t("common.confirm"), onPress: () => router.back() }]);
      } else {
        // 새로 생성
        await routineService.createRoutine(routineData);
        Alert.alert(t("routineBuilder.saveComplete"), t("routineBuilder.routineSaved"), [{ text: t("common.confirm"), onPress: () => router.back() }]);
      }
    } catch (error) {
      console.error("Failed to save routine:", error);
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
                    <View
                      style={[
                        styles.muscleTag,
                        exercise.targetMuscle === "가슴" && styles.chestTag,
                        exercise.targetMuscle === "등" && styles.backTag,
                        exercise.targetMuscle === "하체" && styles.legTag,
                        exercise.targetMuscle === "코어" && styles.coreTag,
                        exercise.targetMuscle === "삼두" && styles.tricepsTag,
                        exercise.targetMuscle === "가슴 상부" && styles.chestTag,
                        exercise.targetMuscle === "이두" && styles.bicepsTag,
                      ]}
                    >
                      <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                    </View>
                    <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                  </View>
                  <Text style={[styles.defaultSets, { color: colors.textSecondary }]}>
                    {t("routineBuilder.recommendedFormat", { sets: exercise.defaultSets, reps: formatReps(exercise.defaultReps) })}
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

        <ScrollView style={styles.content}>
          {/* 루틴 이름 입력 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routines.routineName")}</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t("routines.routineNamePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={routineName}
              onChangeText={setRoutineName}
            />
          </View>

          {/* 운동 목록 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("routineBuilder.exerciseList", { count: selectedExercises.length })}</Text>
              <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: colors.primary + "20" }]} onPress={() => setShowExerciseLibrary(true)}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={[styles.addExerciseText, { color: colors.primary }]}>{t("routines.addExercise")}</Text>
              </TouchableOpacity>
            </View>

            {selectedExercises.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="fitness-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("routineBuilder.addExercisePrompt")}</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{t("routineBuilder.addExerciseDescription")}</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary, marginTop: 8 }]}>{t("routineBuilder.dragExerciseTip")}</Text>
              </View>
            ) : (
              <DraggableFlatList
                data={selectedExercises}
                onDragEnd={({ data }) => setSelectedExercises(data)}
                keyExtractor={(item, index) => `${item.id}_${index}`}
                renderItem={renderExerciseItem}
                containerStyle={styles.exerciseList}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 32,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  nameInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseText: {
    fontWeight: "500",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  exerciseList: {
    gap: 16,
  },
  exerciseItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dragHandle: {
    padding: 4,
    marginRight: 4,
  },
  exerciseHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    padding: 4,
  },
  exerciseControls: {
    flexDirection: "row",
    gap: 20,
  },
  controlGroup: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  numberButton: {
    padding: 12,
  },
  numberValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  repsInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  exerciseLibrary: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  muscleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chestTag: {
    backgroundColor: "#FF6B9D" + "20",
  },
  backTag: {
    backgroundColor: "#4ECDC4" + "20",
  },
  legTag: {
    backgroundColor: "#45B7D1" + "20",
  },
  coreTag: {
    backgroundColor: "#FFA07A" + "20",
  },
  tricepsTag: {
    backgroundColor: "#98D8C8" + "20",
  },
  bicepsTag: {
    backgroundColor: "#3498DB" + "20",
  },
  muscleTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  difficultyText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  defaultSets: {
    fontSize: 12,
  },
});
