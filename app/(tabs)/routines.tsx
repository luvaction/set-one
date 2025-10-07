import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from "react-native";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const categories = [
  { id: "all", name: "전체", icon: "grid" },
  { id: "bodyweight", name: "맨몸운동", icon: "body" },
  { id: "weights", name: "웨이트", icon: "barbell" },
  { id: "cardio", name: "유산소", icon: "heart" },
  { id: "stretch", name: "스트레칭", icon: "accessibility" },
];

// 추천 루틴 그룹 구조
const recommendedRoutineGroups = {
  beginner: {
    name: "초보자용",
    icon: "school",
    description: "운동을 처음 시작하는 분들을 위한 루틴",
    routines: ["초보자 맨몸 루틴"]
  },
  muscle_gain: {
    name: "근력 증가",
    icon: "fitness",
    description: "근력과 근육량 증가를 위한 루틴",
    routines: ["상체 집중 맨몸", "가슴 집중 웨이트", "등 + 이두 웨이트", "다양한 스쿼트"]
  },
  weight_loss: {
    name: "체중 감량",
    icon: "flame",
    description: "칼로리 소모와 체지방 감소를 위한 루틴",
    routines: ["HIIT 유산소"]
  },
  flexibility: {
    name: "유연성",
    icon: "leaf",
    description: "몸의 유연성과 회복을 위한 루틴",
    routines: ["전신 스트레칭"]
  }
};

// 세부 카테고리 구조 (라이브러리용)
const exerciseCategories = {
  bodyweight: {
    name: "맨몸운동",
    icon: "body",
    subcategories: {
      chest: { name: "가슴", exercises: ["regularPushup", "widePushup", "diamondPushup", "inclinePushup", "declinePushup"] },
      back: { name: "등", exercises: ["regularPullup", "chinup", "assistedPullup"] },
      legs: { name: "하체", exercises: ["bodyweightSquat", "jumpSquat", "pistolSquat", "bulgarianSplitSquat"] },
      core: { name: "코어", exercises: ["regularPlank", "sidePlank", "plankUpDown"] },
      arms: { name: "팔", exercises: ["bodyweightDips", "assistedDips"] },
    }
  },
  weights: {
    name: "웨이트 트레이닝",
    icon: "barbell",
    subcategories: {
      chest: { name: "가슴", exercises: ["flatBenchPress", "inclineBenchPress", "declineBenchPress", "dumbbellBenchPress", "dumbbellFly"] },
      back: { name: "등", exercises: ["conventionalDeadlift", "sumoDeadlift", "romanianDeadlift", "barbellRow", "dumbbellRow"] },
    }
  },
  cardio: {
    name: "유산소",
    icon: "heart",
    subcategories: {
      hiit: { name: "HIIT", exercises: ["burpee", "mountainClimber", "jumpingJack", "highKnees"] },
    }
  },
  stretch: {
    name: "스트레칭",
    icon: "accessibility",
    subcategories: {
      flexibility: { name: "유연성", exercises: ["hamstringStretch", "shoulderStretch", "chestStretch"] },
    }
  }
};

// 세분화된 개별 운동 정의
const exercises = {
  // 푸시업 계열 (맨몸)
  regularPushup: { id: "regularPushup", name: "일반 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  diamondPushup: { id: "diamondPushup", name: "다이아몬드 푸시업", category: "bodyweight", targetMuscle: "삼두", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  widePushup: { id: "widePushup", name: "와이드 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  inclinePushup: { id: "inclinePushup", name: "인클라인 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },
  declinePushup: { id: "declinePushup", name: "디클라인 푸시업", category: "bodyweight", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },

  // 풀업/친업 계열 (맨몸)
  regularPullup: { id: "regularPullup", name: "풀업", category: "bodyweight", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: "5-10" },
  chinup: { id: "chinup", name: "친업", category: "bodyweight", targetMuscle: "이두", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },
  assistedPullup: { id: "assistedPullup", name: "어시스트 풀업", category: "bodyweight", targetMuscle: "등", difficulty: "초급", defaultSets: 3, defaultReps: "8-12" },

  // 스쿼트 계열 (맨몸)
  bodyweightSquat: { id: "bodyweightSquat", name: "바디웨이트 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "초급", defaultSets: 3, defaultReps: "15-20" },
  jumpSquat: { id: "jumpSquat", name: "점프 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" },
  pistolSquat: { id: "pistolSquat", name: "피스톨 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "고급", defaultSets: 3, defaultReps: "3-8" },
  bulgarianSplitSquat: { id: "bulgarianSplitSquat", name: "불가리안 스플릿 스쿼트", category: "bodyweight", targetMuscle: "하체", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },

  // 벤치프레스 계열 (웨이트)
  flatBenchPress: { id: "flatBenchPress", name: "플랫 벤치프레스", category: "weights", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  inclineBenchPress: { id: "inclineBenchPress", name: "인클라인 벤치프레스", category: "weights", targetMuscle: "가슴 상부", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  declineBenchPress: { id: "declineBenchPress", name: "디클라인 벤치프레스", category: "weights", targetMuscle: "가슴 하부", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  dumbbellBenchPress: { id: "dumbbellBenchPress", name: "덤벨 벤치프레스", category: "weights", targetMuscle: "가슴", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" },

  // 데드리프트 계열 (웨이트)
  conventionalDeadlift: { id: "conventionalDeadlift", name: "컨벤셔널 데드리프트", category: "weights", targetMuscle: "등/하체", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },
  sumoDeadlift: { id: "sumoDeadlift", name: "스모 데드리프트", category: "weights", targetMuscle: "등/하체", difficulty: "중급", defaultSets: 3, defaultReps: "6-10" },
  romanianDeadlift: { id: "romanianDeadlift", name: "루마니안 데드리프트", category: "weights", targetMuscle: "햄스트링", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },

  // 기타 웨이트
  dumbbellFly: { id: "dumbbellFly", name: "덤벨 플라이", category: "weights", targetMuscle: "가슴", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },
  barbellRow: { id: "barbellRow", name: "바벨 로우", category: "weights", targetMuscle: "등", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  dumbbellRow: { id: "dumbbellRow", name: "덤벨 로우", category: "weights", targetMuscle: "등", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },

  // 딥스 계열 (맨몸/웨이트)
  bodyweightDips: { id: "bodyweightDips", name: "바디웨이트 딥스", category: "bodyweight", targetMuscle: "삼두", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  assistedDips: { id: "assistedDips", name: "어시스트 딥스", category: "bodyweight", targetMuscle: "삼두", difficulty: "초급", defaultSets: 3, defaultReps: "10-15" },

  // 플랭크 계열 (맨몸)
  regularPlank: { id: "regularPlank", name: "플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "초급", defaultSets: 3, defaultReps: "30-60초" },
  sidePlank: { id: "sidePlank", name: "사이드 플랭크", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "20-45초" },
  plankUpDown: { id: "plankUpDown", name: "플랭크 업다운", category: "bodyweight", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "10-15" },

  // 유산소
  burpee: { id: "burpee", name: "버피", category: "cardio", targetMuscle: "전신", difficulty: "중급", defaultSets: 3, defaultReps: "8-12" },
  mountainClimber: { id: "mountainClimber", name: "마운틴클라이머", category: "cardio", targetMuscle: "코어", difficulty: "중급", defaultSets: 3, defaultReps: "30초" },
  jumpingJack: { id: "jumpingJack", name: "점핑잭", category: "cardio", targetMuscle: "전신", difficulty: "초급", defaultSets: 3, defaultReps: "30초" },
  highKnees: { id: "highKnees", name: "하이니", category: "cardio", targetMuscle: "하체", difficulty: "초급", defaultSets: 3, defaultReps: "30초" },

  // 스트레칭
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
const myRoutines = [
  {
    id: 1,
    name: "추천: 기초 상체 루틴",
    exercises: [
      { ...exercises.inclinePushup, sets: 3, reps: "12" },
      { ...exercises.assistedDips, sets: 2, reps: "10" },
      { ...exercises.regularPlank, sets: 3, reps: "30초" },
    ],
    duration: "15분",
    lastUsed: "사용한 적 없음",
    isRecommended: true,
  },
  {
    id: 2,
    name: "추천: 벤치프레스 입문",
    exercises: [
      { ...exercises.dumbbellBenchPress, sets: 3, reps: "10" },
      { ...exercises.dumbbellFly, sets: 3, reps: "12" },
      { ...exercises.regularPushup, sets: 2, reps: "15" },
    ],
    duration: "20분",
    lastUsed: "사용한 적 없음",
    isRecommended: true,
  },
];

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<"library" | "my" | "recommended">("library");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPurpose, setSelectedPurpose] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendedSearchQuery, setRecommendedSearchQuery] = useState("");
  const [myRoutineSearchQuery, setMyRoutineSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAddToRoutineModal, setShowAddToRoutineModal] = useState(false);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<any>(null);

  // 라이브러리용 개별 운동 필터링
  const exerciseList = Object.values(exercises);
  const filteredExercises = exerciseList.filter(exercise => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 추천 루틴 필터링
  const filteredRecommendedRoutines = routines.filter(routine => {
    const matchesCategory = selectedCategory === "all" || routine.category === selectedCategory;
    const matchesPurpose = selectedPurpose === "all" || routine.purpose === selectedPurpose;
    const matchesSearch = routine.name.toLowerCase().includes(recommendedSearchQuery.toLowerCase()) ||
                         routine.exercises.some(ex => ex.name.toLowerCase().includes(recommendedSearchQuery.toLowerCase()));
    return matchesCategory && matchesPurpose && matchesSearch;
  });

  // 내 루틴 필터링
  const filteredMyRoutines = myRoutines.filter(routine => {
    const matchesSearch = routine.name.toLowerCase().includes(myRoutineSearchQuery.toLowerCase()) ||
                         routine.exercises.some(ex => ex.name.toLowerCase().includes(myRoutineSearchQuery.toLowerCase()));
    return matchesSearch;
  });

  // 운동을 루틴에 추가하는 함수
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
        })
      }
    });
    setShowAddToRoutineModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>루틴</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/routine-builder")}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 세그먼트 컨트롤 */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.segmentButton, selectedTab === "library" && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTab("library")}
          >
            <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "library" && styles.segmentTextActive]}>
              라이브러리
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, selectedTab === "recommended" && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTab("recommended")}
          >
            <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "recommended" && styles.segmentTextActive]}>
              추천 루틴
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, selectedTab === "my" && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTab("my")}
          >
            <Text style={[styles.segmentText, { color: colors.textSecondary }, selectedTab === "my" && styles.segmentTextActive]}>
              내 루틴
            </Text>
          </TouchableOpacity>
        </View>

        {/* 라이브러리 탭 - 트리 구조 */}
        {selectedTab === "library" && (
          <>
            {/* 검색창 */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <Text style={[styles.searchInput, { color: colors.textSecondary }]}>운동 이름이나 근육 부위로 검색...</Text>
            </View>

            {/* 트리 구조 카테고리 */}
            <View style={styles.exerciseLibrary}>
              {Object.entries(exerciseCategories).map(([categoryKey, categoryData]) => (
                <View key={categoryKey}>
                  {/* 메인 카테고리 헤더 */}
                  <TouchableOpacity
                    style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setExpandedCategories(prev => ({
                      ...prev,
                      [categoryKey]: !prev[categoryKey]
                    }))}
                  >
                    <View style={styles.categoryHeaderContent}>
                      <Ionicons name={categoryData.icon as any} size={20} color={colors.primary} />
                      <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{categoryData.name}</Text>
                    </View>
                    <Ionicons
                      name={expandedCategories[categoryKey] ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* 서브카테고리 및 운동 목록 */}
                  {expandedCategories[categoryKey] && (
                    <View style={styles.subcategoryContainer}>
                      {Object.entries(categoryData.subcategories).map(([subKey, subData]) => (
                        <View key={subKey}>
                          <TouchableOpacity
                            style={[styles.subcategoryHeader, { backgroundColor: colors.surface + "80", borderColor: colors.border + "50" }]}
                            onPress={() => setExpandedCategories(prev => ({
                              ...prev,
                              [`${categoryKey}_${subKey}`]: !prev[`${categoryKey}_${subKey}`]
                            }))}
                          >
                            <Text style={[styles.subcategoryHeaderText, { color: colors.text }]}>{subData.name}</Text>
                            <Ionicons
                              name={expandedCategories[`${categoryKey}_${subKey}`] ? "chevron-down" : "chevron-forward"}
                              size={16}
                              color={colors.textSecondary}
                            />
                          </TouchableOpacity>

                          {/* 운동 목록 */}
                          {expandedCategories[`${categoryKey}_${subKey}`] && (
                            <View style={styles.exerciseList}>
                              {subData.exercises.map((exerciseId) => {
                                const exercise = exercises[exerciseId as keyof typeof exercises];
                                if (!exercise) return null;

                                return (
                                  <TouchableOpacity key={exercise.id} style={[styles.exerciseLibraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={styles.exerciseLibraryInfo}>
                                      <Text style={[styles.exerciseLibraryName, { color: colors.text }]}>{exercise.name}</Text>
                                      <View style={styles.exerciseTags}>
                                        <View style={[styles.muscleTag,
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
                                        ]}>
                                          <Text style={[styles.muscleTagText, { color: colors.text }]}>{exercise.targetMuscle}</Text>
                                        </View>
                                        <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>{exercise.difficulty}</Text>
                                      </View>
                                      <Text style={[styles.exerciseDefaultSets, { color: colors.textSecondary }]}>
                                        권장: {exercise.defaultSets}세트 × {exercise.defaultReps}
                                      </Text>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.addToRoutineButton}
                                      onPress={() => handleAddExerciseToRoutine(exercise)}
                                    >
                                      <Ionicons name="add-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* 추천 루틴 탭 - 트리 구조 */}
        {selectedTab === "recommended" && (
          <>
            {/* 검색창 */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <Text style={[styles.searchInput, { color: colors.textSecondary }]}>루틴 이름이나 운동명으로 검색...</Text>
            </View>

            {/* 목적별 그룹 트리 구조 */}
            <View style={styles.exerciseLibrary}>
              {Object.entries(recommendedRoutineGroups).map(([groupKey, groupData]) => (
                <View key={groupKey}>
                  {/* 목적별 그룹 헤더 */}
                  <TouchableOpacity
                    style={[styles.categoryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setExpandedCategories(prev => ({
                      ...prev,
                      [`recommended_${groupKey}`]: !prev[`recommended_${groupKey}`]
                    }))}
                  >
                    <View style={styles.categoryHeaderContent}>
                      <Ionicons name={groupData.icon as any} size={20} color={colors.primary} />
                      <View style={styles.groupHeaderInfo}>
                        <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{groupData.name}</Text>
                        <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>{groupData.description}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={expandedCategories[`recommended_${groupKey}`] ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* 루틴 목록 */}
                  {expandedCategories[`recommended_${groupKey}`] && (
                    <View style={styles.subcategoryContainer}>
                      {groupData.routines.map((routineName) => {
                        const routine = routines.find(r => r.name === routineName);
                        if (!routine) return null;

                        return (
                          <TouchableOpacity key={routine.id} style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.routineHeader}>
                              <View style={styles.routineInfo}>
                                <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                                <View style={styles.routineMeta}>
                                  <View style={[styles.levelBadge,
                                    routine.level === "초급" && styles.levelBeginner,
                                    routine.level === "중급" && styles.levelIntermediate,
                                    routine.level === "고급" && styles.levelAdvanced
                                  ]}>
                                    <Text style={[styles.levelText, { color: colors.text }]}>{routine.level}</Text>
                                  </View>
                                  <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.duration}</Text>
                                </View>
                              </View>
                              <TouchableOpacity style={[styles.addToMyButton, { backgroundColor: colors.primary + "20" }]}>
                                <Ionicons name="add" size={20} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.exerciseList}>
                              {routine.exercises.map((exercise, index) => (
                                <View key={index} style={styles.exerciseItem}>
                                  <View style={styles.exerciseMainInfo}>
                                    <Text style={[styles.exerciseName, { color: colors.text }]}>• {exercise.name}</Text>
                                    <View style={styles.exerciseTags}>
                                      <View style={[styles.muscleTag,
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
                                      ]}>
                                        <Text style={[styles.muscleTagText, { color: colors.text }]}>{exercise.targetMuscle}</Text>
                                      </View>
                                      <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>{exercise.difficulty}</Text>
                                    </View>
                                  </View>
                                  <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>{exercise.sets}세트 × {exercise.reps}</Text>
                                </View>
                              ))}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* 내 루틴 탭 */}
        {selectedTab === "my" && (
          <>
            {/* 검색창 */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <Text style={[styles.searchInput, { color: colors.textSecondary }]}>내 루틴 검색...</Text>
            </View>

            <View style={styles.routinesList}>
              {filteredMyRoutines.map((routine) => (
              <TouchableOpacity key={routine.id} style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }, routine.isRecommended && { borderColor: colors.primary + "40", backgroundColor: colors.primary + "05" }]}>
                <View style={styles.routineHeader}>
                  <View style={styles.routineInfo}>
                    <View style={styles.routineNameRow}>
                      <Text style={[styles.routineName, { color: colors.text }]}>{routine.name}</Text>
                      {routine.isRecommended && (
                        <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.recommendedText, { color: colors.background }]}>추천</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.routineMeta}>
                      <Text style={[styles.lastUsed, { color: colors.icon }]}>마지막 사용: {routine.lastUsed}</Text>
                      <Text style={[styles.routineDuration, { color: colors.icon }]}>⏱ {routine.duration}</Text>
                    </View>
                  </View>
                  <View style={styles.routineActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push({
                        pathname: "/routine-builder",
                        params: {
                          routineId: routine.id,
                          name: routine.name,
                          isEditing: "true"
                        }
                      })}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.exerciseList}>
                  {routine.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseMainInfo}>
                        <Text style={[styles.exerciseName, { color: colors.text }]}>• {exercise.name}</Text>
                        <View style={styles.exerciseTags}>
                          <View style={[styles.muscleTag,
                            exercise.targetMuscle === "가슴" && styles.chestTag,
                            exercise.targetMuscle === "등" && styles.backTag,
                            exercise.targetMuscle === "하체" && styles.legTag,
                            exercise.targetMuscle === "코어" && styles.coreTag,
                            exercise.targetMuscle === "삼두" && styles.tricepsTag,
                          ]}>
                            <Text style={[styles.muscleTagText, { color: colors.text }]}>{exercise.targetMuscle}</Text>
                          </View>
                          <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>{exercise.difficulty}</Text>
                        </View>
                      </View>
                      <View style={styles.exerciseActions}>
                        <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>{exercise.sets}세트 × {exercise.reps}</Text>
                        <TouchableOpacity style={styles.removeExerciseButton}>
                          <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: colors.primary + "10" }]}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <Text style={[styles.addExerciseText, { color: colors.primary }]}>운동 추가</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 운동을 루틴에 추가하는 모달 */}
      <Modal
        visible={showAddToRoutineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddToRoutineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedExerciseForAdd?.name} 추가
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddToRoutineModal(false)}
              >
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
                      onPress={() => {
                        // TODO: 기존 루틴에 추가하는 로직
                        setShowAddToRoutineModal(false);
                      }}
                    >
                      <Ionicons name="list" size={20} color={colors.textSecondary} />
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>{routine.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
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
  segmentButtonActive: {
    
  },
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
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    
  },
  categoryButtonActive: {
    
    
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    
  },
  categoryTextActive: {
    
    fontWeight: "600",
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
  },
  routineInfo: {
    flex: 1,
    gap: 8,
  },
  routineName: {
    fontSize: 16,
    fontWeight: "600",
    
  },
  routineMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 12,
    
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
    fontSize: 12,
    
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
  recommendedCard: {
    
    
  },
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
    padding: 8,
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
  },
  modalContent: {
    
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    
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
  modalDivider: {
    height: 1,
    
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    
    marginBottom: 12,
  },
});
