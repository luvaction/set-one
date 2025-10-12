import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingTop: 20,
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
  descriptionInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: "top",
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
    marginHorizontal: 20,
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
