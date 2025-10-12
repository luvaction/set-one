import { StyleSheet } from "react-native";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      flex: 1,
    },
    titleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
    },
    statsCardsContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    statIcon: {
      fontSize: 32,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 13,
      fontWeight: "500",
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    filterButtons: {
      flexDirection: "row",
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: "600",
    },
    mockButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
    },
    mockButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    filterContainer: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12,
    },
    checkboxContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    checkboxItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.primary + "10",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxLabel: {
      fontSize: 13,
      fontWeight: "500",
    },
    exerciseStatsContainer: {
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    exerciseStatItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    exerciseStatHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    exerciseStatName: {
      fontSize: 16,
      fontWeight: "700",
    },
    exerciseStatWorkouts: {
      fontSize: 12,
    },
    exerciseStatGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 8,
    },
    exerciseStatCell: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    exerciseStatValue: {
      fontSize: 16,
      fontWeight: "700",
    },
    exerciseStatLabel: {
      fontSize: 11,
    },
    exerciseStatFooter: {
      marginTop: 4,
    },
    exerciseStatDetail: {
      fontSize: 12,
      textAlign: "center",
    },
    emptyText: {
      textAlign: "center",
      padding: 20,
      fontSize: 14,
    },
    emptyContainer: {
      padding: 20,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    chartContainer: {
      padding: 20,
      borderRadius: 12,
      marginTop: 12,
      alignItems: "center",
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    chartTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    emptyChartContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 12,
    },
    emptyChartText: {
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
    },
    emptyChartSubtext: {
      fontSize: 12,
      textAlign: "center",
    },
    comparisonCard: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    comparisonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    comparisonItem: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    comparisonLabel: {
      fontSize: 13,
      fontWeight: "500",
    },
    comparisonValue: {
      fontSize: 19,
      fontWeight: "700",
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    changeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    comparisonHint: {
      fontSize: 11,
      textAlign: "center",
    },
    yearStatsCard: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    yearStatRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    yearStatItem: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    yearStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    yearStatValue: {
      fontSize: 24,
      fontWeight: "700",
    },
    yearStatLabel: {
      fontSize: 13,
      fontWeight: "500",
    },
    insightCard: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
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
    prContainer: {
      padding: 16,
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4, // For Android
    },
    prItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    prRank: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + "10",
      alignItems: "center",
      justifyContent: "center",
    },
    prRankText: {
      fontSize: 14,
      fontWeight: "700",
    },
    prContent: {
      flex: 1,
      gap: 2,
    },
    prExercise: {
      fontSize: 15,
      fontWeight: "600",
    },
    prDate: {
      fontSize: 12,
    },
    prStats: {
      alignItems: "flex-end",
      gap: 2,
    },
    prValue: {
      fontSize: 16,
      fontWeight: "700",
    },
    prTotal: {
      fontSize: 12,
      fontWeight: "500",
    },
    // 모달 스타일
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
      maxWidth: 400,
      maxHeight: "80%",
      padding: 24,
      borderRadius: 20,
      alignItems: "center",
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    modalExerciseName: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    modalLabel: {
      fontSize: 14,
      marginBottom: 12,
      textAlign: "center",
    },
    modalValue: {
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 24,
      textAlign: "center",
    },
    modalItemName: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },
    modalItemValue: {
      fontSize: 18,
      fontWeight: "700",
    },
    modalCloseButton: {
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    modalCloseButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
