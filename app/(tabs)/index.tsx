import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* 인사말 */}
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요!</Text>
        <Text style={styles.subGreeting}>오늘도 Set1부터 시작해볼까요?</Text>
      </View>

      {/* 빠른 시작 버튼 */}
      <TouchableOpacity style={styles.quickStartButton}>
        <View style={styles.quickStartContent}>
          <Ionicons name="play-circle" size={32} color={Colors.dark.primary} />
          <View style={styles.quickStartText}>
            <Text style={styles.quickStartTitle}>빠른 시작</Text>
            <Text style={styles.quickStartSubtitle}>마지막 루틴 계속하기</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.dark.textSecondary} />
      </TouchableOpacity>

      {/* 오늘의 통계 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>완료한 세트</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0분</Text>
          <Text style={styles.statLabel}>운동 시간</Text>
        </View>
      </View>

      {/* 추천 루틴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>추천 루틴</Text>
        <TouchableOpacity style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineTitle}>초보자 맨몸 운동</Text>
            <View style={styles.routineBadge}>
              <Text style={styles.routineBadgeText}>맨몸</Text>
            </View>
          </View>
          <Text style={styles.routineDescription}>푸시업, 스쿼트, 플랭크 등 5가지 운동</Text>
          <Text style={styles.routineDuration}>⏱ 약 20분</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineTitle}>가슴 집중 웨이트</Text>
            <View style={[styles.routineBadge, styles.routineBadgeWeight]}>
              <Text style={styles.routineBadgeText}>웨이트</Text>
            </View>
          </View>
          <Text style={styles.routineDescription}>벤치프레스, 덤벨 플라이, 푸시업</Text>
          <Text style={styles.routineDuration}>⏱ 약 40분</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  quickStartButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    color: Colors.dark.text,
  },
  quickStartSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
  },
  routineCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  routineBadge: {
    backgroundColor: Colors.dark.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routineBadgeWeight: {
    backgroundColor: "#FF6B00" + "20",
  },
  routineBadgeText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  routineDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  routineDuration: {
    fontSize: 12,
    color: Colors.dark.icon,
  },
});
