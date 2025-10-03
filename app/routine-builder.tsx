import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 운동 데이터 (routines.tsx에서 가져온 것과 동일)
const exercises = {
  // 푸시업 계열 (맨몸)
  regularPushup: { id: "regularPushup", name: "일반 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  diamondPushup: { id: "diamondPushup", name: "다이아몬드 푸시업", category: "bodyweight", targetMuscle: "삼두", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  widePushup: { id: "widePushup", name: "와이드 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  inclinePushup: { id: "inclinePushup", name: "인클라인 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },

  // 풀업/친업 계열 (맨몸)
  regularPullup: { id: "regularPullup", name: "풀업", category: "bodyweight", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: "5-10" },
  chinup: { id: "chinup", name: "친업", category: "bodyweight", targetMuscle: "이두", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },

  // 스쿼트 계열 (맨몸)
  bodyweightSquat: { id: "bodyweightSquat", name: "바디웨이트 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },
  jumpSquat: { id: "jumpSquat", name: "점프 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" },

  // 플랭크 계열 (맨몸)
  regularPlank: { id: "regularPlank", name: "플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "초급", defaultSets: 3, defaultReps: "30-60초" },
  sidePlank: { id: "sidePlank", name: "사이드 플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "20-45초" },

  // 웨이트
  flatBenchPress: { id: "flatBenchPress", name: "플랫 벤치프레스", category: "weights", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  inclineBenchPress: { id: "inclineBenchPress", name: "인클라인 벤치프레스", category: "weights", targetMuscle: "가슴 상부", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  dumbbellFly: { id: "dumbbellFly", name: "덤벨 플라이", category: "weights", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
};

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetMuscle: string;
  difficulty: string;
};

export default function RoutineBuilderScreen() {
  const params = useLocalSearchParams();
  const isEditing = !!params.routineId;

  const [routineName, setRoutineName] = useState(params.name as string || "");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 미리 선택된 운동이 있으면 추가
  useEffect(() => {
    if (params.preSelectedExercise) {
      try {
        const preSelected = JSON.parse(params.preSelectedExercise as string);
        setSelectedExercises([preSelected]);
      } catch (error) {
        console.error("Failed to parse preSelectedExercise:", error);
      }
    }
  }, [params.preSelectedExercise]);

  const exerciseList = Object.values(exercises);
  const filteredExercises = exerciseList.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExercise = (exercise: typeof exercises[keyof typeof exercises]) => {
    const newExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      targetMuscle: exercise.targetMuscle,
      difficulty: exercise.difficulty,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExerciseLibrary(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: 'sets' | 'reps', value: string) => {
    const updated = [...selectedExercises];
    if (field === 'sets') {
      updated[index].sets = parseInt(value) || 1;
    } else {
      updated[index].reps = value;
    }
    setSelectedExercises(updated);
  };

  const saveRoutine = () => {
    if (!routineName.trim()) {
      Alert.alert("오류", "루틴 이름을 입력해주세요.");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("오류", "최소 하나의 운동을 추가해주세요.");
      return;
    }

    // TODO: 실제 저장 로직 구현
    Alert.alert("저장 완료", "루틴이 저장되었습니다.", [
      { text: "확인", onPress: () => router.back() }
    ]);
  };

  if (showExerciseLibrary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowExerciseLibrary(false)}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운동 선택</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="운동 검색..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.exerciseLibrary}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => addExercise(exercise)}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseTags}>
                  <View style={[styles.muscleTag,
                    exercise.targetMuscle === "가슴" && styles.chestTag,
                    exercise.targetMuscle === "등" && styles.backTag,
                    exercise.targetMuscle === "하체" && styles.legTag,
                    exercise.targetMuscle === "코어" && styles.coreTag,
                    exercise.targetMuscle === "삼두" && styles.tricepsTag,
                    exercise.targetMuscle === "가슴 상부" && styles.chestTag,
                    exercise.targetMuscle === "이두" && styles.bicepsTag,
                  ]}>
                    <Text style={styles.muscleTagText}>{exercise.targetMuscle}</Text>
                  </View>
                  <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                </View>
                <Text style={styles.defaultSets}>
                  권장: {exercise.defaultSets}세트 × {exercise.defaultReps}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={Colors.dark.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "루틴 수정" : "새 루틴"}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveRoutine}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 루틴 이름 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>루틴 이름</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="루틴 이름을 입력하세요"
            placeholderTextColor={Colors.dark.textSecondary}
            value={routineName}
            onChangeText={setRoutineName}
          />
        </View>

        {/* 운동 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>운동 목록 ({selectedExercises.length}개)</Text>
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => setShowExerciseLibrary(true)}
            >
              <Ionicons name="add" size={20} color={Colors.dark.primary} />
              <Text style={styles.addExerciseText}>운동 추가</Text>
            </TouchableOpacity>
          </View>

          {selectedExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color={Colors.dark.textSecondary} />
              <Text style={styles.emptyTitle}>운동을 추가해보세요</Text>
              <Text style={styles.emptyDescription}>
                위 운동 추가 버튼을 눌러 루틴에 운동을 추가할 수 있습니다.
              </Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {selectedExercises.map((exercise, index) => (
                <View key={`${exercise.id}_${index}`} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeExercise(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.exerciseControls}>
                    <View style={styles.controlGroup}>
                      <Text style={styles.controlLabel}>세트</Text>
                      <View style={styles.numberInput}>
                        <TouchableOpacity
                          style={styles.numberButton}
                          onPress={() => updateExercise(index, 'sets', String(Math.max(1, exercise.sets - 1)))}
                        >
                          <Ionicons name="remove" size={16} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.numberValue}>{exercise.sets}</Text>
                        <TouchableOpacity
                          style={styles.numberButton}
                          onPress={() => updateExercise(index, 'sets', String(exercise.sets + 1))}
                        >
                          <Ionicons name="add" size={16} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.controlGroup}>
                      <Text style={styles.controlLabel}>횟수/시간</Text>
                      <TextInput
                        style={styles.repsInput}
                        value={exercise.reps}
                        onChangeText={(value) => updateExercise(index, 'reps', value)}
                        placeholder="10회"
                        placeholderTextColor={Colors.dark.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  headerSpacer: {
    width: 32,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.dark.background,
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
    color: Colors.dark.text,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseText: {
    color: Colors.dark.primary,
    fontWeight: "500",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
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
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  numberButton: {
    padding: 12,
  },
  numberValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  repsInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
  },
  exerciseLibrary: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    color: Colors.dark.text,
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
    backgroundColor: Colors.dark.textSecondary + "20",
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
    color: Colors.dark.text,
    fontWeight: "600",
  },
  difficultyText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontStyle: "italic",
  },
  defaultSets: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});