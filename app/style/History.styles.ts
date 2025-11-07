import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  calendarHeaderWrapper: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recordStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  recordDuration: {
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    marginTop: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 13,
    marginBottom: 4,
  },
  setsDetailContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setDetail: {
    fontSize: 12,
  },
  recordMemo: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  memoInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    maxWidth: 50,
  },
  cancelButton: {
    borderWidth: 1,
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {},
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statisticsTabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  statisticsCard: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 16,
  },
  statisticsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statisticsTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  statisticsDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  statisticsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  statisticsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
