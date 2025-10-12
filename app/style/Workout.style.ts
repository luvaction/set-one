import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  totalTimerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  restTimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  restTimerContent: {
    flex: 1,
  },
  restTimerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  restTimerValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  setInfo: {
    flex: 1,
    gap: 2,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  targetReps: {
    fontSize: 12,
  },
  setControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setTimerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  setTimerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  setButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  completeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  restTimeText: {
    fontSize: 12,
    marginTop: 4,
  },
  restBetweenSets: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginVertical: 4,
    gap: 8,
  },
  restBetweenSetsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  routinesList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  setCompleteModal: {
    width: "85%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitleSmall: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  modalLabel: {
    // ⬅️ 이 스타일을 추가하여 오류를 해결했습니다.
    fontSize: 14,
    marginBottom: 8, // 참고 코드에서 가져옴
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20, // Add margin to separate from input
  },
  modalCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
