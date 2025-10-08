import { useTheme } from "@/contexts/ThemeContext";
import { CreateProfileData } from "@/models";
import { profileService } from "@/services/profile";
import { storage } from "@/services/storage/asyncStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

const emptyProfile: CreateProfileData = {
  name: "",
  gender: "",
  birthDate: "",
  height: 0,
  weight: 0,
  targetWeight: 0,
  goal: "",
  activityLevel: "",
  weeklyGoal: 0,
};

export default function ProfileScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<CreateProfileData>(emptyProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CreateProfileData>(profile);
  const [loading, setLoading] = useState(true);

  // 프로필 로드
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const savedProfile = await profileService.getProfile();
      if (savedProfile) {
        setProfile(savedProfile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditingProfile(profile);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      const savedProfile = await profileService.saveProfile(editingProfile);
      setProfile(savedProfile);
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("오류", "프로필 저장에 실패했습니다.");
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "모든 데이터 삭제",
      "모든 운동 기록, 루틴, 프로필 데이터가 삭제됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.clear();
              setProfile(emptyProfile);
              Alert.alert("완료", "모든 데이터가 삭제되었습니다.");
            } catch (error) {
              console.error("Failed to clear data:", error);
              Alert.alert("오류", "데이터 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const handleShowStorageData = async () => {
    try {
      const STORAGE_KEYS = {
        PROFILE: "@set1/profile",
        CUSTOM_EXERCISES: "@set1/custom_exercises",
        HIDDEN_EXERCISE_IDS: "@set1/hidden_exercise_ids",
        USER_ROUTINES: "@set1/user_routines",
        ACTIVE_WORKOUT_SESSION: "@set1/active_session",
        WORKOUT_RECORDS: "@set1/workout_records",
        SETTINGS: "@set1/settings",
      };

      console.log("\n========== AsyncStorage Data ==========");

      for (const [name, key] of Object.entries(STORAGE_KEYS)) {
        const data = await storage.getItem(key);
        console.log(`\n[${name}] (${key}):`);
        console.log(JSON.stringify(data, null, 2));
      }

      console.log("\n=======================================\n");

      Alert.alert("완료", "저장소 데이터를 콘솔에 출력했습니다.\n개발자 도구를 확인하세요.");
    } catch (error) {
      console.error("Failed to show storage data:", error);
      Alert.alert("오류", "저장소 데이터 조회에 실패했습니다.");
    }
  };

  const handleClearCustomExercises = async () => {
    Alert.alert("커스텀 운동 초기화", "커스텀 운동을 모두 삭제하고 '사이타마 푸시업'만 추가하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "초기화",
        style: "destructive",
        onPress: async () => {
          try {
            // 커스텀 운동 스토리지 비우기
            await storage.removeItem("@set1/custom_exercises");

            // 사이타마 푸시업만 추가
            const saitamaPushup = {
              id: `ex_custom_${Date.now()}_saitama`,
              name: "사이타마 푸시업",
              category: "bodyweight",
              muscleGroups: ["가슴", "삼두", "어깨"],
              isCustom: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await storage.setArray("@set1/custom_exercises", [saitamaPushup]);
            Alert.alert("완료", "커스텀 운동이 초기화되었습니다.\n💪 사이타마 푸시업 100개!\n\n루틴 탭에서 확인하세요.");
          } catch (error) {
            console.error("Failed to clear custom exercises:", error);
            Alert.alert("오류", "커스텀 운동 초기화에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const goalText = {
    lose: "체중 감량",
    gain: "근육 증가",
    maintain: "체중 유지",
  };

  const activityText = {
    low: "낮음 (주 1-2회)",
    medium: "보통 (주 3-4회)",
    high: "높음 (주 5회 이상)",
  };

  const bmi = profile.height > 0 && profile.weight > 0 ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "0";

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>MY</Text>
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>편집</Text>
          </Pressable>
        </View>

        {/* 프로필 정보 */}
        {profile.name ? (
          <>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>기본 정보</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>이름</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.name}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>성별</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "-"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>생년월일</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.birthDate || "-"}</Text>
                </View>
              </View>
            </View>

            {/* 신체 정보 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>신체 정보</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>키</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.height} cm</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>현재 체중</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.weight} kg</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>목표 체중</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.targetWeight} kg</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>BMI</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{bmi}</Text>
                </View>
              </View>
            </View>

            {/* 운동 목표 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>운동 목표</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>목표</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.goal ? goalText[profile.goal] : "-"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>활동 레벨</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.activityLevel ? activityText[profile.activityLevel] : "-"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주간 목표</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>주 {profile.weeklyGoal}회</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>프로필을 설정해주세요</Text>
            <Pressable style={[styles.setupButton, { backgroundColor: colors.primary }]} onPress={handleEdit}>
              <Text style={[styles.setupButtonText, { color: colors.buttonText }]}>프로필 설정</Text>
            </Pressable>
          </View>
        )}

        {/* 설정 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>설정</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="moon" size={20} color={colors.text} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>다크 모드</Text>
              </View>
              <Switch value={theme === "dark"} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* 기타 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>기타</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>앱 버전</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={handleShowStorageData}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="code-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>저장소 데이터 보기</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={handleClearCustomExercises}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="refresh-outline" size={20} color="#FF9800" />
                <Text style={[styles.infoLabel, { color: "#FF9800" }]}>커스텀 운동 초기화</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={handleClearAllData}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.infoLabel, { color: "#F44336" }]}>모든 데이터 삭제</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 편집 모달 */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, { color: colors.text }]}>프로필 편집</Text>

              {/* 이름 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>이름</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.name}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, name: text })}
                placeholder="이름을 입력하세요"
                placeholderTextColor={colors.textSecondary}
              />

              {/* 성별 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>성별</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.gender === "male" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, gender: "male" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.gender === "male" && { color: colors.buttonText }]}>남성</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.gender === "female" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, gender: "female" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.gender === "female" && { color: colors.buttonText }]}>여성</Text>
                </Pressable>
              </View>

              {/* 생년월일 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>생년월일</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.birthDate}
                onChangeText={(text) => {
                  // 숫자만 추출
                  const numbers = text.replace(/[^0-9]/g, "");
                  let formatted = "";

                  // 최대 8자리 숫자만 허용
                  if (numbers.length <= 8) {
                    // YYYY-MM-DD 형식으로 포맷
                    if (numbers.length <= 4) {
                      formatted = numbers;
                    } else if (numbers.length <= 6) {
                      formatted = numbers.slice(0, 4) + "-" + numbers.slice(4);
                    } else {
                      formatted = numbers.slice(0, 4) + "-" + numbers.slice(4, 6) + "-" + numbers.slice(6, 8);
                    }
                    setEditingProfile({ ...editingProfile, birthDate: formatted });
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* 키 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>키 (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.height > 0 ? String(editingProfile.height) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, height: Number(text) || 0 })}
                placeholder="170"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />

              {/* 체중 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>현재 체중 (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.weight > 0 ? String(editingProfile.weight) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, weight: Number(text) || 0 })}
                placeholder="70"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />

              {/* 목표 체중 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>목표 체중 (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.targetWeight > 0 ? String(editingProfile.targetWeight) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, targetWeight: Number(text) || 0 })}
                placeholder="65"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />

              {/* 목표 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>운동 목표</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.goal === "lose" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "lose" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "lose" && { color: colors.buttonText }]}>감량</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.goal === "gain" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "gain" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "gain" && { color: colors.buttonText }]}>증량</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.goal === "maintain" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "maintain" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "maintain" && { color: colors.buttonText }]}>유지</Text>
                </Pressable>
              </View>

              {/* 활동 레벨 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>활동 레벨</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.activityLevel === "low" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "low" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "low" && { color: colors.buttonText }]}>낮음</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.activityLevel === "medium" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "medium" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "medium" && { color: colors.buttonText }]}>보통</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.activityLevel === "high" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "high" })}
                >
                  <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "high" && { color: colors.buttonText }]}>높음</Text>
                </Pressable>
              </View>

              {/* 주간 목표 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>주간 운동 목표 (회)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.weeklyGoal > 0 ? String(editingProfile.weeklyGoal) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, weeklyGoal: Number(text) || 0 })}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />

              {/* 버튼 */}
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>취소</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                  <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>저장</Text>
                </Pressable>
              </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  setupButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    width: "90%",
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    maxHeight: "75%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  optionButtonActive: {},
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionButtonTextActive: {},
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
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
});
