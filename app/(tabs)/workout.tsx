import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="fitness-outline" size={80} color={Colors.dark.primary} />
        <Text style={styles.title}>운동 시작하기</Text>
        <Text style={styles.description}>홈이나 루틴 탭에서{"\n"}운동을 선택해주세요</Text>

        <TouchableOpacity style={styles.startButton}>
          <Ionicons name="play-circle" size={24} color={Colors.dark.background} />
          <Text style={styles.buttonText}>빠른 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
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
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: Colors.dark.primary,
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
    color: Colors.dark.background,
  },
});
