import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function WorkoutScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Ionicons name="fitness-outline" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>운동 시작하기</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>홈이나 루틴 탭에서{"\n"}운동을 선택해주세요</Text>

        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="play-circle" size={24} color={colors.background} />
          <Text style={[styles.buttonText, { color: colors.background }]}>빠른 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
