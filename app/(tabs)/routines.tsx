import { useTheme } from "@/contexts/ThemeContext";
import { Routine } from "@/models";
import { routineService, workoutSessionService } from "@/services";
import { exerciseService } from "@/services/exercise";
import { convertExerciseToRoutine } from "@/utils/workoutHelpers";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator, ShadowDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

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

const categories = [
  { id: "all", nameKey: "categories.all", icon: "grid" },
  { id: "bodyweight", nameKey: "categories.bodyweight", icon: "body" },
  { id: "weights", nameKey: "categories.weights", icon: "barbell" },
  { id: "cardio", nameKey: "categories.cardio", icon: "heart" },
  { id: "stretch", nameKey: "categories.stretch", icon: "accessibility" },
];

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

// 세부 카테고리 구조 (라이브러리용)
const exerciseCategories = {
  bodyweight: {
    nameKey: "categories.bodyweight",
    icon: "body",
    subcategories: {
      chest: { nameKey: "muscleGroups.chest", exercises: ["regularPushup", "widePushup", "diamondPushup", "inclinePushup", "declinePushup"] },
      back: { nameKey: "muscleGroups.back", exercises: ["regularPullup", "chinup", "assistedPullup"] },
      legs: { nameKey: "muscleGroups.legs", exercises: ["bodyweightSquat", "jumpSquat", "pistolSquat", "bulgarianSplitSquat"] },
      core: { nameKey: "muscleGroups.core", exercises: ["regularPlank", "sidePlank", "plankUpDown"] },
      arms: { nameKey: "muscleGroups.arms", exercises: ["bodyweightDips", "assistedDips"] },
    },
  },
  weights: {
    nameKey: "categories.weights",
    icon: "barbell",
    subcategories: {
      chest: { nameKey: "muscleGroups.chest", exercises: ["flatBenchPress", "inclineBenchPress", "declineBenchPress", "dumbbellBenchPress", "dumbbellFly"] },
      back: { nameKey: "muscleGroups.back", exercises: ["conventionalDeadlift", "sumoDeadlift", "romanianDeadlift", "barbellRow", "dumbbellRow"] },
    },
  },
  cardio: {
    nameKey: "categories.cardio",
    icon: "heart",
    subcategories: {
      hiit: { nameKey: "subcategories.hiit", exercises: ["burpee", "mountainClimber", "jumpingJack", "highKnees"] },
    },
  },
  stretch: {
    nameKey: "categories.stretch",
    icon: "accessibility",
    subcategories: {
      flexibility: { nameKey: "subcategories.flexibility", exercises: ["hamstringStretch", "shoulderStretch", "chestStretch"] },
    },
  },
};

// 세분화된 개별 운동 정의
const exercises = {
  // 푸시업 계열 (맨몸)
  regularPushup: { id: "regularPushup", name: "일반 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  diamondPushup: { id: "diamondPushup", name: "다이아몬드 푸시업", category: "bodyweight", targetMuscle: "삼두", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  widePushup: { id: "widePushup", name: "와이드 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  inclinePushup: { id: "inclinePushup", name: "인클라인 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },
  declinePushup: { id: "declinePushup", name: "디클라인 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" }, // 풀업/친업 계열 (맨몸)

  regularPullup: { id: "regularPullup", name: "풀업", category: "bodyweight", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: "5-10" },
  chinup: { id: "chinup", name: "친업", category: "bodyweight", targetMuscle: "이두", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },
  assistedPullup: { id: "assistedPullup", name: "어시스트 풀업", category: "bodyweight", targetMuscle: "등", difficulty: "초급", defaultSets: 3, defaultReps: "8-12" }, // 스쿼트 계열 (맨몸)

  bodyweightSquat: { id: "bodyweightSquat", name: "바디웨이트 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },
  jumpSquat: { id: "jumpSquat", name: "점프 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" },
  pistolSquat: { id: "pistolSquat", name: "피스톨 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "고급", defaultSets: 3, defaultReps: "3-8" },
  bulgarianSplitSquat: {
    id: "bulgarianSplitSquat",
    name: "불가리안 스플릿 스쿼트",
    category: "bodyweight",
    targetMuscle: "하체",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: "8-12",
  }, // 벤치프레스 계열 (웨이트)

  flatBenchPress: { id: "flatBenchPress", name: "플랫 벤치프레스", category: "weights", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  inclineBenchPress: {
    id: "inclineBenchPress",
    name: "인클라인 벤치프레스",
    category: "weights",
    targetMuscle: "가슴 상부",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: "8-12",
  },
  declineBenchPress: {
    id: "declineBenchPress",
    name: "디클라인 벤치프레스",
    category: "weights",
    targetMuscle: "가슴 하부",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: "8-12",
  },
  dumbbellBenchPress: { id: "dumbbellBenchPress", name: "덤벨 벤치프레스", category: "weights", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" }, // 데드리프트 계열 (웨이트)

  conventionalDeadlift: {
    id: "conventionalDeadlift",
    name: "컨벤셔널 데드리프트",
    category: "weights",
    targetMuscle: "등/하체",
    difficulty: "중급",
    defaultSets: 3,
    defaultReps: "6-10",
  },
  sumoDeadlift: { id: "sumoDeadlift", name: "스모 데드리프트", category: "weights", targetMuscle: "등/하체", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },
  romanianDeadlift: { id: "romanianDeadlift", name: "루마니안 데드리프트", category: "weights", targetMuscle: "햄스트링", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" }, // 기타 웨이트

  dumbbellFly: { id: "dumbbellFly", name: "덤벨 플라이", category: "weights", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  barbellRow: { id: "barbellRow", name: "바벨 로우", category: "weights", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  dumbbellRow: { id: "dumbbellRow", name: "덤벨 로우", category: "weights", targetMuscle: "등", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" }, // 딥스 계열 (맨몸/웨이트)

  bodyweightDips: { id: "bodyweightDips", name: "바디웨이트 딥스", category: "bodyweight", targetMuscle: "삼두", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  assistedDips: { id: "assistedDips", name: "어시스트 딥스", category: "bodyweight", targetMuscle: "삼두", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" }, // 플랭크 계열 (맨몸)

  regularPlank: { id: "regularPlank", name: "플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "초급", defaultSets: 3, defaultReps: "30-60초" },
  sidePlank: { id: "sidePlank", name: "사이드 플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "20-45초" },
  plankUpDown: { id: "plankUpDown", name: "플랭크 업다운", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" }, // 유산소

  burpee: { id: "burpee", name: "버피", category: "cardio", targetMuscle: "전신", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  mountainClimber: { id: "mountainClimber", name: "마운틴클라이머", category: "cardio", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "30초" },
  jumpingJack: { id: "jumpingJack", name: "점핑잭", category: "cardio", targetMuscle: "전신", difficulty: "초급", defaultSets: 3, defaultReps: "30초" },
  highKnees: { id: "highKnees", name: "하이니", category: "cardio", targetMuscle: "하체", difficulty: "초급", defaultSets: 3, defaultReps: "30초" }, // 스트레칭

  hamstringStretch: { id: "hamstringStretch", name: "햄스트링 스트레칭", category: "stretch", targetMuscle: "햄스트링", difficulty: "초급", defaultSets: 1, defaultReps: "30초" },
  shoulderStretch: { id: "shoulderStretch", name: "어깨 스트레칭", category: "stretch", targetMuscle: "어깨", difficulty: "초급", defaultSets: 1, defaultReps: "30초" },
  chestStretch: { id: "chestStretch", name: "가슴 스트레칭", category: "stretch", targetMuscle: "가슴", difficulty: "초급", defaultSets: 1, defaultReps: "30초" },
};

// 라이브러리 루틴 (템플릿) - 세분화된 운동 사용
const routines = [
  {
    id: 1,
    name: "초보자 맨몸 루틴",
    category: "bodyweight",
    purpose: "beginner",
    exercises: [
      { ...exercises.regularPushup, sets: 3, reps: "10" },
      { ...exercises.bodyweightSquat, sets: 3, reps: "15" },
      { ...exercises.regularPlank, sets: 3, reps: "30초" },
      { ...exercises.inclinePushup, sets: 2, reps: "12" },
    ],
    duration: "20분",
    level: "초급",
  },
  {
    id: 2,
    name: "상체 집중 맨몸",
    category: "bodyweight",
    purpose: "muscle_gain",
    exercises: [
      { ...exercises.regularPushup, sets: 3, reps: "12" },
      { ...exercises.widePushup, sets: 2, reps: "10" },
      { ...exercises.regularPullup, sets: 3, reps: "8" },
      { ...exercises.bodyweightDips, sets: 3, reps: "10" },
      { ...exercises.regularPlank, sets: 3, reps: "45초" },
    ],
    duration: "25분",
    level: "중급",
  },
  {
    id: 3,
    name: "가슴 집중 웨이트",
    category: "weights",
    purpose: "muscle_gain",
    exercises: [
      { ...exercises.flatBenchPress, sets: 4, reps: "8-10" },
      { ...exercises.inclineBenchPress, sets: 3, reps: "10-12" },
      { ...exercises.dumbbellFly, sets: 3, reps: "12-15" },
      { ...exercises.bodyweightDips, sets: 3, reps: "10" },
    ],
    duration: "45분",
    level: "중급",
  },
  {
    id: 4,
    name: "등 + 이두 웨이트",
    category: "weights",
    purpose: "muscle_gain",
    exercises: [
      { ...exercises.conventionalDeadlift, sets: 4, reps: "6-8" },
      { ...exercises.barbellRow, sets: 3, reps: "8-10" },
      { ...exercises.regularPullup, sets: 3, reps: "8" },
      { ...exercises.dumbbellRow, sets: 3, reps: "10-12" },
    ],
    duration: "40분",
    level: "중급",
  },
  {
    id: 5,
    name: "다양한 스쿼트",
    category: "bodyweight",
    purpose: "muscle_gain",
    exercises: [
      { ...exercises.bodyweightSquat, sets: 3, reps: "20" },
      { ...exercises.jumpSquat, sets: 3, reps: "12" },
      { ...exercises.bulgarianSplitSquat, sets: 3, reps: "10" },
      { ...exercises.pistolSquat, sets: 2, reps: "5" },
    ],
    duration: "25분",
    level: "중급",
  },
  {
    id: 6,
    name: "HIIT 유산소",
    category: "cardio",
    purpose: "weight_loss",
    exercises: [
      { ...exercises.burpee, sets: 4, reps: "10" },
      { ...exercises.mountainClimber, sets: 4, reps: "30초" },
      { ...exercises.jumpingJack, sets: 4, reps: "30초" },
      { ...exercises.highKnees, sets: 4, reps: "30초" },
    ],
    duration: "15분",
    level: "고급",
  },
  {
    id: 7,
    name: "전신 스트레칭",
    category: "stretch",
    purpose: "flexibility",
    exercises: [
      { ...exercises.hamstringStretch, sets: 1, reps: "30초" },
      { ...exercises.shoulderStretch, sets: 1, reps: "30초" },
      { ...exercises.chestStretch, sets: 1, reps: "30초" },
    ],
    duration: "10분",
    level: "초급",
  },
];

// 내 루틴 (추천 루틴 2개 기본 포함) - 세분화된 운동 사용
// NOTE: 이 배열은 실제 상태 관리 대신 임시 데이터로 사용되었으므로, loadRoutines에서 설정되는 myRoutines 상태를 사용하도록 합니다.

// 번역 헬퍼 함수들
const getExerciseName = (t: any, exerciseId: string, exerciseName?: string) => {
  // 커스텀 운동이면 실제 이름 반환 (번역 불필요)
  if (exerciseId.startsWith('ex_custom_')) {
    return exerciseName || exerciseId;
  }
  // 기본 운동은 번역 키 사용
  return t(`exercises.${exerciseId}`);
};

const getMuscleGroupKey = (targetMuscle: string | undefined) => {
  if (!targetMuscle) return "fullBody";
  const map: Record<string, string> = {
    "가슴": "chest",
    "삼두": "triceps",
    "등": "back",
    "이두": "biceps",
    "하체": "legs",
    "코어": "core",
    "가슴 상부": "chestUpper",
    "가슴 하부": "chestLower",
    "등/하체": "backLegs",
    "햄스트링": "hamstring",
    "전신": "fullBody",
    "어깨": "shoulder",
  };
  return map[targetMuscle] || targetMuscle;
};

const getDifficultyKey = (difficulty: string) => {
  const map: Record<string, string> = {
    "초급": "beginner",
    "중급": "intermediate",
    "고급": "advanced",
  };
  return map[difficulty] || difficulty;
};

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<"library" | "my" | "recommended">("library");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPurpose, setSelectedPurpose] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all"); // 난이도 필터
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendedSearchQuery, setRecommendedSearchQuery] = useState("");
  const [myRoutineSearchQuery, setMyRoutineSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAddToRoutineModal, setShowAddToRoutineModal] = useState(false);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<any>(null); // 커스텀 운동 추가 모달

  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseCategory, setCustomExerciseCategory] = useState("bodyweight");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("");
  const [customExerciseDifficulty, setCustomExerciseDifficulty] = useState("초급");
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null); // 사용자 루틴 상태

  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [recommendedRoutinesList, setRecommendedRoutinesList] = useState<Routine[]>([]);
  const [customExercises, setCustomExercises] = useState<any[]>([]); // 화면이 포커스될 때마다 루틴 데이터 불러오기

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
      loadCustomExercises();
    }, [])
  );

  const loadRoutines = async () => {
    try {
      const [userRoutines, recommended] = await Promise.all([routineService.getUserRoutines(), routineService.getRecommendedRoutines()]);
      setMyRoutines(userRoutines);
      setRecommendedRoutinesList(recommended);
    } catch (error) {
      console.error("Failed to load routines:", error);
    }
  };

  const loadCustomExercises = async () => {
    try {
      const customExercisesOnly = await exerciseService.getCustomExercises();
      setCustomExercises(customExercisesOnly);
    } catch (error) {
      console.error("Failed to load custom exercises:", error);
    }
  };

  const handleCreateCustomExercise = async () => {
    if (!customExerciseName.trim()) {
      Alert.alert(t('workoutSession.error'), t('routines.enterExerciseName'));
      return;
    }
    if (!customExerciseMuscle.trim()) {
      Alert.alert(t('workoutSession.error'), t('routines.enterMuscleGroup'));
      return;
    }

    try {
      if (editingExerciseId) {
        // 수정 모드
        await exerciseService.updateExercise(editingExerciseId, {
          name: customExerciseName,
          category: customExerciseCategory,
          muscleGroups: [customExerciseMuscle],
        });
        Alert.alert(t('workout.completed'), t('customExercise.updated'));
      } else {
        // 추가 모드
        await exerciseService.createExercise({
          name: customExerciseName,
          category: customExerciseCategory,
          muscleGroups: [customExerciseMuscle],
          isCustom: true,
        });
        Alert.alert(t('workout.completed'), t('customExercise.added'));
      } // 모달 닫고 초기화

      setShowCustomExerciseModal(false);
      setCustomExerciseName("");
      setCustomExerciseMuscle("");
      setCustomExerciseCategory("bodyweight");
      setCustomExerciseDifficulty("초급");
      setEditingExerciseId(null); // 커스텀 운동 목록 다시 로드

      await loadCustomExercises();
    } catch (error) {
      console.error("Failed to save custom exercise:", error);
      Alert.alert(t('workoutSession.error'), t('customExercise.saveFailed'));
    }
  };

  const handleEditCustomExercise = (exercise: any) => {
    setEditingExerciseId(exercise.id);
    setCustomExerciseName(exercise.name);
    setCustomExerciseCategory(exercise.category);
    setCustomExerciseMuscle(exercise.muscleGroups?.[0] || "");
    setShowCustomExerciseModal(true);
  };

  const handleDeleteCustomExercise = (exerciseId: string) => {
    Alert.alert(t('customExercise.deleteTitle'), t('customExercise.deleteConfirm'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('common.delete'),
        style: "destructive",
        onPress: async () => {
          try {
            await exerciseService.deleteExercise(exerciseId);
            Alert.alert(t('workout.completed'), t('customExercise.deleted'));
            await loadCustomExercises();
          } catch (error) {
            console.error("Failed to delete custom exercise:", error);
            Alert.alert(t('workoutSession.error'), t('customExercise.deleteFailed'));
          }
        },
      },
    ]);
  };

  const handleCustomExerciseLongPress = (exercise: any) => {
    Alert.alert(t('customExercise.manage'), t('customExercise.manageMessage', { name: exercise.name }), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('common.edit'),
        onPress: () => handleEditCustomExercise(exercise),
      },
      {
        text: t('common.delete'),
        style: "destructive",
        onPress: () => handleDeleteCustomExercise(exercise.id),
      },
    ]);
  };

  const defaultExerciseList = Object.values(exercises).map((ex) => ({
    ...ex,
    isCustom: false,
  }));

  const customExerciseList = customExercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    targetMuscle: ex.muscleGroups?.[0] || "",
    difficulty: "초급",
    defaultSets: 3,
    defaultReps: "10-15",
    isCustom: true,
  }));

  const exerciseList = [...defaultExerciseList, ...customExerciseList];

  const filteredExercises = exerciseList.filter((exercise) => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || exercise.difficulty === selectedDifficulty;
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) || exercise.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  }); // 추천 루틴 필터링

  const filteredRecommendedRoutines = recommendedRoutinesList.filter((routine) => {
    const matchesSearch =
      routine.name.toLowerCase().includes(recommendedSearchQuery.toLowerCase()) ||
      routine.exercises.some((ex) => ex.name.toLowerCase().includes(recommendedSearchQuery.toLowerCase()));
    return matchesSearch;
  }); // 내 루틴 필터링

  const filteredMyRoutines = myRoutines.filter((routine) => {
    const matchesSearch =
      routine.name.toLowerCase().includes(myRoutineSearchQuery.toLowerCase()) || routine.exercises.some((ex) => ex.name.toLowerCase().includes(myRoutineSearchQuery.toLowerCase()));
    return matchesSearch;
  }); // 개별 운동 바로 시작

  const handlePlayExercise = async (exercise: any) => {
    try {
      const routine = convertExerciseToRoutine(exercise);
      await workoutSessionService.startSession(routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  }; // 내 루틴 바로 시작

  const handlePlayRoutine = async (routine: Routine) => {
    try {
      await workoutSessionService.startSession(routine);
      router.push("/(tabs)/workout");
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert("오류", "운동 시작에 실패했습니다.");
    }
  }; // 운동을 루틴에 추가하는 함수

  const handleAddExerciseToRoutine = (exercise: any) => {
    setSelectedExerciseForAdd(exercise);
    setShowAddToRoutineModal(true);
  };

  const addToNewRoutine = () => {
    router.push({
      pathname: "/routine-builder",
      params: {
        preSelectedExercise: JSON.stringify({
          id: selectedExerciseForAdd.id,
          name: selectedExerciseForAdd.name,
          sets: selectedExerciseForAdd.defaultSets,
          reps: selectedExerciseForAdd.defaultReps,
          targetMuscle: selectedExerciseForAdd.targetMuscle,
          difficulty: selectedExerciseForAdd.difficulty,
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
        sets: selectedExerciseForAdd.defaultSets,
        reps: selectedExerciseForAdd.defaultReps,
        targetMuscle: selectedExerciseForAdd.targetMuscle,
        difficulty: selectedExerciseForAdd.difficulty,
      });

      setShowAddToRoutineModal(false);
      await loadRoutines(); // 목록 새로고침
      Alert.alert("성공", `"${selectedExerciseForAdd.name}"을(를) "${routineName}" 루틴에 추가했습니다.`);
    } catch (error: any) {
      console.error("Failed to add exercise to routine:", error);
      Alert.alert("오류", error.message || "운동 추가에 실패했습니다.");
    }
  }; // 추천 루틴을 내 루틴으로 복사

  const handleCopyToUserRoutine = async (routine: any) => {
    try {
      const copiedRoutine = await routineService.copyToUserRoutine(routine.id);
      await loadRoutines(); // 목록 새로고침
      Alert.alert("성공", `"${copiedRoutine.name}"이(가) 내 루틴에 추가되었습니다.`);
    } catch (error) {
      console.error("Failed to copy routine:", error);
      Alert.alert("오류", "루틴 복사에 실패했습니다.");
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
            await loadRoutines(); // 목록 새로고침
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
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "library" && { color: colors.buttonText, fontWeight: "600" }]}>{t('routines.library')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.segmentButton, selectedTab === "recommended" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("recommended")}>
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "recommended" && { color: colors.buttonText, fontWeight: "600" }]}>{t('routines.recommended')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.segmentButton, selectedTab === "my" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("my")}>
        <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "my" && { color: colors.buttonText, fontWeight: "600" }]}>{t('routines.myRoutines')}</Text>
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
                <View style={styles.routineMeta}>
                  <Text style={[styles.lastUsed, { color: colors.icon }]}>마지막 사용: {routine.lastUsed || "사용한 적 없음"}</Text>
                  <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.duration || `${routine.exercises.length}개 운동`}</Text>
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
                    {t('routines.setsRepsFormat', { sets: exercise.sets, reps: formatReps(exercise.reps) })}
                  </Text>
                  <TouchableOpacity style={styles.removeExerciseButton}>
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: colors.primary + "10" }]} onPress={() => setSelectedTab("library")}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.addExerciseText, { color: colors.primary }]}>{t('routines.addExercise')}</Text>
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
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/routine-builder")}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 세그먼트 컨트롤 */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "library" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("library")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "library" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.library')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "recommended" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("recommended")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "recommended" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.recommended')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, (selectedTab as string) === "my" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("my")}>
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "my" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.myRoutines')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 검색창 */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('routines.searchMyRoutines')}
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
          />

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
          <Modal visible={showCustomExerciseModal} transparent animationType="fade" onRequestClose={() => setShowCustomExerciseModal(false)}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.customExerciseModalContent, { backgroundColor: colors.surface }]}>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      <Text style={[styles.modalTitle, { color: colors.text }]}>{editingExerciseId ? t('routines.editCustomExercise') : t('routines.addCustomExercise')}</Text>

                      {/* 운동 이름 */}
                      <Text style={[styles.inputLabel, { color: colors.text }]}>운동 이름</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={customExerciseName}
                        onChangeText={setCustomExerciseName}
                        placeholder="예: 사이타마 푸시업"
                        placeholderTextColor={colors.textSecondary}
                        returnKeyType="next"
                      />

                      {/* 운동 부위 */}
                      <Text style={[styles.inputLabel, { color: colors.text }]}>운동 부위</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={customExerciseMuscle}
                        onChangeText={setCustomExerciseMuscle}
                        placeholder="예: 가슴, 등, 하체, 코어 등"
                        placeholderTextColor={colors.textSecondary}
                        returnKeyType="done"
                      />

                      {/* 카테고리 선택 */}
                      <Text style={[styles.inputLabel, { color: colors.text }]}>카테고리</Text>
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
                            맨몸
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
                          <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "weights" && { color: colors.buttonText }]}>웨이트</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalCategoryButton,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            customExerciseCategory === "cardio" && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setCustomExerciseCategory("cardio")}
                        >
                          <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "cardio" && { color: colors.buttonText }]}>유산소</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 버튼 */}
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                          onPress={() => {
                            setShowCustomExerciseModal(false);
                            setEditingExerciseId(null);
                            setCustomExerciseName("");
                            setCustomExerciseMuscle("");
                            setCustomExerciseCategory("bodyweight");
                            Keyboard.dismiss();
                          }}
                        >
                          <Text style={[styles.cancelButtonText, { color: colors.text }]}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleCreateCustomExercise}>
                          <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{editingExerciseId ? "수정" : "저장"}</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
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
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/routine-builder")}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 세그먼트 컨트롤 */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "library" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("library")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "library" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.library')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, (selectedTab as string) === "recommended" && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedTab("recommended")}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "recommended" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.recommended')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, (selectedTab as string) === "my" && { backgroundColor: colors.primary }]} onPress={() => setSelectedTab("my")}>
              <Text style={[styles.segmentText, { color: colors.textSecondary }, (selectedTab as string) === "my" && { color: colors.buttonText, fontWeight: "600" }]}>
                {t('routines.myRoutines')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 라이브러리 탭 - 트리 구조 */}
          {selectedTab === "library" && (
            <>
              {/* 검색창 */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t('routines.searchExercises')}
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
                  <Text style={[styles.customExerciseButtonText, { color: colors.buttonText }]}>{t('routines.addCustomExercise')}</Text>
                </TouchableOpacity>
              </View>

              {/* 난이도 필터 */}
              <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "all" && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("all")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "all" ? colors.buttonText : colors.text }]}>{t('difficulty.all')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "초급" && styles.beginnerFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("초급")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "초급" ? "#FFFFFF" : colors.text }]}>{t('difficulty.beginner')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "중급" && styles.intermediateFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("중급")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "중급" ? "#FFFFFF" : colors.text }]}>{t('difficulty.intermediate')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, selectedDifficulty === "고급" && styles.advancedFilterActive, { borderColor: colors.border }]}
                    onPress={() => setSelectedDifficulty("고급")}
                  >
                    <Text style={[styles.filterButtonText, { color: selectedDifficulty === "고급" ? "#FFFFFF" : colors.text }]}>{t('difficulty.advanced')}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* 트리 구조 카테고리 또는 검색 결과 */}
              <View style={styles.exerciseLibrary}>
                {searchQuery.length > 0 ? (
                  // 검색 중일 때는 필터링된 결과만 평평하게 표시
                  <View style={styles.exerciseList}>
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((exercise) => {
                        // TypeScript 에러 해결을 위해 exercise에 isCustom이 있다고 명시
                        const typedExercise = exercise as typeof exercise & { isCustom?: boolean };
                        const CardComponent = typedExercise.isCustom ? TouchableOpacity : View;
                        const cardProps = typedExercise.isCustom
                          ? {
                              activeOpacity: 0.7,
                              onLongPress: () => {
                                const customEx = customExercises.find((ex) => ex.id === typedExercise.id);
                                if (customEx) handleCustomExerciseLongPress(customEx);
                              },
                            }
                          : {};

                        return (
                          <CardComponent
                            key={typedExercise.id}
                            style={[styles.exerciseLibraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            {...cardProps}
                          >
                            <View style={styles.exerciseLibraryInfo}>
                              <View style={styles.exerciseNameRow}>
                                <Text style={[styles.exerciseLibraryName, { color: colors.text }]}>{typedExercise.name}</Text>
                                {typedExercise.isCustom && (
                                  <View style={[styles.customBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.customBadgeText, { color: colors.buttonText }]}>커스텀</Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.exerciseTags}>
                                <View
                                  style={[
                                    styles.muscleTag,
                                    typedExercise.targetMuscle === "가슴" && styles.chestTag,
                                    typedExercise.targetMuscle === "등" && styles.backTag,
                                    typedExercise.targetMuscle === "하체" && styles.legTag,
                                    typedExercise.targetMuscle === "코어" && styles.coreTag,
                                    typedExercise.targetMuscle === "삼두" && styles.tricepsTag,
                                    typedExercise.targetMuscle === "가슴 상부" && styles.chestTag,
                                    typedExercise.targetMuscle === "가슴 하부" && styles.chestTag,
                                    typedExercise.targetMuscle === "등/하체" && styles.backTag,
                                    typedExercise.targetMuscle === "햄스트링" && styles.legTag,
                                    typedExercise.targetMuscle === "어깨" && styles.shoulderTag,
                                    typedExercise.targetMuscle === "전신" && styles.fullBodyTag,
                                    typedExercise.targetMuscle === "이두" && styles.bicepsTag,
                                  ]}
                                >
                                  <Text style={[styles.muscleTagText, { color: colors.text }]}>{typedExercise.targetMuscle}</Text>
                                </View>
                                <View
                                  style={[
                                    styles.difficultyTag,
                                    typedExercise.difficulty === "초급" && styles.beginnerTag,
                                    typedExercise.difficulty === "중급" && styles.intermediateTag,
                                    typedExercise.difficulty === "고급" && styles.advancedTag,
                                  ]}
                                >
                                  <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{typedExercise.difficulty}</Text>
                                </View>
                              </View>
                              <Text style={[styles.exerciseDefaultSets, { color: colors.textSecondary }]}>
                                {t('routineBuilder.recommendedFormat', { sets: typedExercise.defaultSets, reps: typedExercise.defaultReps })}
                              </Text>
                            </View>
                            <View style={styles.exerciseCardActions}>
                              <TouchableOpacity style={styles.playIconButton} onPress={() => handlePlayExercise(typedExercise)}>
                                <Ionicons name="play-circle" size={28} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.addToRoutineButton} onPress={() => handleAddExerciseToRoutine(typedExercise)}>
                                <Ionicons name="add-circle" size={24} color={colors.primary} />
                              </TouchableOpacity>
                              {typedExercise.isCustom && (
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => {
                                    const customEx = customExercises.find((ex) => ex.id === typedExercise.id);
                                    if (customEx) handleCustomExerciseLongPress(customEx);
                                  }}
                                >
                                  <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                              )}
                            </View>
                          </CardComponent>
                        );
                      })
                    ) : (
                      <View style={styles.emptySearchResult}>
                        <Ionicons name="search-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>{t('routines.noSearchResults')}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // 검색하지 않을 때는 트리 구조 표시
                  Object.entries(exerciseCategories).map(([categoryKey, categoryData]) => (
                    <View key={categoryKey}>
                      {/* 메인 카테고리 헤더 */}
                      <TouchableOpacity
                        style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [categoryKey]: !prev[categoryKey],
                          }))
                        }
                      >
                        <View style={styles.categoryHeaderContent}>
                          <Ionicons name={categoryData.icon as any} size={20} color={colors.primary} />
                          <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{t(categoryData.nameKey)}</Text>
                        </View>
                        <Ionicons name={expandedCategories[categoryKey] ? "chevron-down" : "chevron-forward"} size={20} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 서브카테고리 및 운동 목록 */}
                      {expandedCategories[categoryKey] && (
                        <View style={styles.subcategoryContainer}>
                          {Object.entries(categoryData.subcategories).map(([subKey, subData]) => (
                            <View key={subKey}>
                              <TouchableOpacity
                                style={[styles.subcategoryHeader, { backgroundColor: colors.surface + "80", borderColor: colors.border + "50" }]}
                                onPress={() =>
                                  setExpandedCategories((prev) => ({
                                    ...prev,
                                    [`${categoryKey}_${subKey}`]: !prev[`${categoryKey}_${subKey}`],
                                  }))
                                }
                              >
                                <Text style={[styles.subcategoryHeaderText, { color: colors.text }]}>{t(subData.nameKey)}</Text>
                                <Ionicons name={expandedCategories[`${categoryKey}_${subKey}`] ? "chevron-down" : "chevron-forward"} size={16} color={colors.textSecondary} />
                              </TouchableOpacity>

                              {/* 운동 목록 */}
                              {expandedCategories[`${categoryKey}_${subKey}`] && (
                                <View style={styles.exerciseList}>
                                  {subData.exercises.map((exerciseId) => {
                                    const exercise = exercises[exerciseId as keyof typeof exercises];
                                    if (!exercise) return null;

                                    return (
                                      <View key={exercise.id} style={[styles.exerciseLibraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.exerciseLibraryInfo}>
                                          <Text style={[styles.exerciseLibraryName, { color: colors.text }]}>{getExerciseName(t, exercise.id, exercise.name)}</Text>
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
                                                exercise.targetMuscle === "가슴 하부" && styles.chestTag,
                                                exercise.targetMuscle === "등/하체" && styles.backTag,
                                                exercise.targetMuscle === "햄스트링" && styles.legTag,
                                                exercise.targetMuscle === "어깨" && styles.shoulderTag,
                                                exercise.targetMuscle === "전신" && styles.fullBodyTag,
                                                exercise.targetMuscle === "이두" && styles.bicepsTag,
                                              ]}
                                            >
                                              <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                                            </View>
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
                                          </View>
                                          <Text style={[styles.exerciseDefaultSets, { color: colors.textSecondary }]}>
                                            {t('routineBuilder.recommendedFormat', { sets: exercise.defaultSets, reps: exercise.defaultReps })}
                                          </Text>
                                        </View>
                                        <View style={styles.exerciseCardActions}>
                                          <TouchableOpacity style={styles.playIconButton} onPress={() => handlePlayExercise(exercise)}>
                                            <Ionicons name="play-circle" size={28} color={colors.primary} />
                                          </TouchableOpacity>
                                          <TouchableOpacity style={styles.addToRoutineButton} onPress={() => handleAddExerciseToRoutine(exercise)}>
                                            <Ionicons name="add-circle" size={24} color={colors.primary} />
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* 커스텀 운동 섹션 */}
                {!searchQuery && customExercises.length > 0 && (
                  <View>
                    <TouchableOpacity
                      style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() =>
                        setExpandedCategories((prev) => ({
                          ...prev,
                          custom: !prev.custom,
                        }))
                      }
                    >
                      <View style={styles.categoryHeaderContent}>
                        <Ionicons name="star" size={20} color={colors.primary} />
                        <Text style={[styles.categoryHeaderText, { color: colors.text }]}>커스텀 운동</Text>
                      </View>
                      <Ionicons name={expandedCategories.custom ? "chevron-down" : "chevron-forward"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {expandedCategories.custom && (
                      <View style={styles.exerciseList}>
                        {customExercises.map((ex) => {
                          const exercise = {
                            id: ex.id,
                            name: ex.name,
                            category: ex.category,
                            targetMuscle: ex.muscleGroups?.[0] || "",
                            difficulty: "초급",
                            defaultSets: 3,
                            defaultReps: "10-15",
                            isCustom: true,
                          };

                          return (
                            <TouchableOpacity
                              key={exercise.id}
                              style={[styles.exerciseLibraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              activeOpacity={0.7}
                              onLongPress={() => handleCustomExerciseLongPress(ex)}
                            >
                              <View style={styles.exerciseLibraryInfo}>
                                <View style={styles.exerciseNameRow}>
                                  <Text style={[styles.exerciseLibraryName, { color: colors.text }]}>{exercise.name}</Text>
                                  <View style={[styles.customBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.customBadgeText, { color: colors.buttonText }]}>커스텀</Text>
                                  </View>
                                </View>
                                <View style={styles.exerciseTags}>
                                  {exercise.targetMuscle && (
                                    <View style={[styles.muscleTag, { backgroundColor: colors.primary + "20" }]}>
                                      <Text style={[styles.muscleTagText, { color: colors.text }]}>{t(`muscleGroups.${getMuscleGroupKey(exercise.targetMuscle)}`)}</Text>
                                    </View>
                                  )}
                                  <View style={[styles.difficultyTag, styles.beginnerTag]}>
                                    <Text style={[styles.difficultyTagText, { color: "#FFFFFF" }]}>{t(`difficulty.${getDifficultyKey(exercise.difficulty)}`)}</Text>
                                  </View>
                                </View>
                                <Text style={[styles.exerciseDefaultSets, { color: colors.textSecondary }]}>
                                  {t('routineBuilder.recommendedFormat', { sets: exercise.defaultSets, reps: exercise.defaultReps })}
                                </Text>
                              </View>
                              <View style={styles.exerciseCardActions}>
                                <TouchableOpacity style={styles.playIconButton} onPress={() => handlePlayExercise(exercise)}>
                                  <Ionicons name="play-circle" size={28} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addToRoutineButton} onPress={() => handleAddExerciseToRoutine(exercise)}>
                                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={() => handleCustomExerciseLongPress(ex)}>
                                  <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
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
                  placeholder={t('routines.searchRoutines')}
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
                              <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                              <View style={styles.routineMeta}>
                                <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.exercises.length}개 운동</Text>
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
                                  <Text style={[styles.exerciseName, { color: colors.text }]}>• {exercise.id ? getExerciseName(t, exercise.id, exercise.name) : exercise.name}</Text>
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
                                  {t('routines.setsRepsFormat', { sets: exercise.sets, reps: formatReps(exercise.reps) })}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptySearchResult}>
                        <Ionicons name="search-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>{t('routines.noSearchResults')}</Text>
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
                                      <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                                      <View style={styles.routineMeta}>
                                        <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.exercises.length}개 운동</Text>
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
                                          <Text style={[styles.exerciseName, { color: colors.text }]}>• {exercise.id ? getExerciseName(t, exercise.id, exercise.name) : exercise.name}</Text>
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
                                          {t('routines.setsRepsFormat', { sets: exercise.sets, reps: formatReps(exercise.reps) })}
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
      <Modal visible={showCustomExerciseModal} transparent animationType="fade" onRequestClose={() => setShowCustomExerciseModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.customExerciseModalContent, { backgroundColor: colors.surface }]}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{editingExerciseId ? "커스텀 운동 수정" : "커스텀 운동 추가"}</Text>

                  {/* 운동 이름 */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>운동 이름</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={customExerciseName}
                    onChangeText={setCustomExerciseName}
                    placeholder="예: 사이타마 푸시업"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                  />

                  {/* 운동 부위 */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>운동 부위</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={customExerciseMuscle}
                    onChangeText={setCustomExerciseMuscle}
                    placeholder="예: 가슴, 등, 하체, 코어 등"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="done"
                  />

                  {/* 카테고리 선택 */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>카테고리</Text>
                  <View style={styles.categoryButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalCategoryButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        customExerciseCategory === "bodyweight" && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setCustomExerciseCategory("bodyweight")}
                    >
                      <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "bodyweight" && { color: colors.buttonText }]}>맨몸</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalCategoryButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        customExerciseCategory === "weights" && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setCustomExerciseCategory("weights")}
                    >
                      <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "weights" && { color: colors.buttonText }]}>웨이트</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalCategoryButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        customExerciseCategory === "cardio" && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setCustomExerciseCategory("cardio")}
                    >
                      <Text style={[styles.modalCategoryButtonText, { color: colors.text }, customExerciseCategory === "cardio" && { color: colors.buttonText }]}>유산소</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 버튼 */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        setShowCustomExerciseModal(false);
                        setEditingExerciseId(null);
                        setCustomExerciseName("");
                        setCustomExerciseMuscle("");
                        setCustomExerciseCategory("bodyweight");
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.text }]}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleCreateCustomExercise}>
                      <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{editingExerciseId ? "수정" : "저장"}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    padding: 4,
  },
  segmentContainer: {
    flexDirection: "row",

    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentButtonActive: {},
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  segmentTextActive: {
    fontWeight: "600",
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  routinesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  routineCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,

    gap: 12,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  routineMainInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dragHandle: {
    padding: 4,
    marginRight: 4,
  },
  routineInfo: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  routineName: {
    fontSize: 16,
    fontWeight: "600",
  },
  routineMeta: {
    flexDirection: "column",
    gap: 4,
    flexWrap: "wrap",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBeginner: {
    backgroundColor: "#4CAF50" + "20",
  },
  levelIntermediate: {
    backgroundColor: "#FF9800" + "20",
  },
  levelAdvanced: {
    backgroundColor: "#F44336" + "20",
  },
  levelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  routineDuration: {
    fontSize: 11,
  },
  routineDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  addToMyButton: {
    padding: 8,
    borderRadius: 8,
  },
  routineActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  lastUsed: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",

    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,

    textAlign: "center",
    lineHeight: 20,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  exerciseMainInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 14,

    fontWeight: "500",
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
  muscleTagText: {
    fontSize: 10,

    fontWeight: "600",
  },
  difficultyText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  difficultyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  beginnerTag: {
    backgroundColor: "#4CAF50",
  },
  intermediateTag: {
    backgroundColor: "#FF9800",
  },
  advancedTag: {
    backgroundColor: "#F44336",
  },
  exerciseDetails: {
    fontSize: 12,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeExerciseButton: {
    padding: 2,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,

    borderRadius: 8,
    marginTop: 4,
  },
  addExerciseText: {
    fontSize: 12,

    fontWeight: "500",
  },
  recommendedCard: {},
  routineNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "600",
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
    padding: 0,
    marginLeft: 8,
  },
  exerciseLibrary: {
    paddingHorizontal: 20,
    gap: 8,
  },
  exerciseLibraryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseLibraryInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseLibraryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseDefaultSets: {
    fontSize: 12,
  },
  addToRoutineButton: {
    padding: 4,
  },
  exerciseCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playIconButton: {
    padding: 4,
  },
  playButton: {
    padding: 8,
    borderRadius: 8,
  },
  shoulderTag: {
    backgroundColor: "#9B59B6" + "20",
  },
  fullBodyTag: {
    backgroundColor: "#E67E22" + "20",
  },
  bicepsTag: {
    backgroundColor: "#3498DB" + "20",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",

    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  categoryHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  categoryHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryHeaderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  subcategoryContainer: {
    marginLeft: 16,
    marginBottom: 12,
    gap: 12,
  },
  subcategoryHeader: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subcategoryHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  groupHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  groupDescription: {
    fontSize: 14,

    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  customExerciseModalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    padding: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  routineOptionContent: {
    flex: 1,
    gap: 4,
  },
  routineExerciseCount: {
    fontSize: 12,
  },
  modalDivider: {
    height: 1,

    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  beginnerFilterActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  intermediateFilterActive: {
    backgroundColor: "#FF9800",
    borderColor: "#FF9800",
  },
  advancedFilterActive: {
    backgroundColor: "#F44336",
    borderColor: "#F44336",
  },
  emptySearchResult: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 16,
  },
  emptySearchText: {
    fontSize: 16,
  },
  customExerciseButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  customExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  customExerciseButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  categoryButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  modalCategoryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modalCategoryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1.5,
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
});
