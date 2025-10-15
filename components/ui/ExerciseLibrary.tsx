
import { useTheme } from "@/contexts/ThemeContext";
import { Exercise } from "@/models";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../../app/style/Routine.styles";

import { formatReps, getDifficultyKey, getExerciseName, getMuscleGroupKey } from "@/utils/translationHelpers";

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
              reps: formatReps(t, exercise.defaultRepsMin, exercise.defaultRepsMax, exercise.defaultDurationSeconds),
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

interface ExerciseLibraryProps {
  allExercises: Exercise[];
  onPlayExercise: (exercise: Exercise) => void;
  onAddExercise: (exercise: Exercise) => void;
  onLongPressExercise: (exercise: Exercise) => void;
  onAddCustomExercise: () => void;
}

export const ExerciseLibrary = ({
  allExercises,
  onPlayExercise,
  onAddExercise,
  onLongPressExercise,
  onAddCustomExercise,
}: ExerciseLibraryProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
      if (exercise.isCustom) return;

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

  return (
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
        <TouchableOpacity style={[styles.customExerciseButton, { backgroundColor: colors.primary }]} onPress={onAddCustomExercise}>
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
          <View style={styles.exerciseList}>
            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onPlay={onPlayExercise}
                  onAdd={onAddExercise}
                  onLongPress={onLongPressExercise}
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
                              onPlay={onPlayExercise}
                              onAdd={onAddExercise}
                              onLongPress={onLongPressExercise}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            ))}

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
                        onPlay={onPlayExercise}
                        onAdd={onAddExercise}
                        onLongPress={onLongPressExercise}
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
  );
};
