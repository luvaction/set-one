import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
  },
  progressCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  quickStartButton: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickStartText: {
    gap: 4,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  quickStartSubtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
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
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  recentDate: {
    fontSize: 12,
  },
  recentStats: {
    flexDirection: "row",
    gap: 12,
  },
  recentStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentStatText: {
    fontSize: 12,
  },
  routineCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  routineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routineBadgeWeight: {
    backgroundColor: "#FF6B00" + "20",
  },
  routineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  routineDescription: {
    fontSize: 14,
  },
  routineDuration: {
    fontSize: 12,
  },
  insightsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: "center",
    gap: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
