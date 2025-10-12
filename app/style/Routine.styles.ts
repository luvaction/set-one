import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  routineDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
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
  routineDuration: {
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
    justifyContent: "center",
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
    width: "95%",
    maxHeight: "85%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToRoutineModalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "70%",
    borderRadius: 20,
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
