import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Switch,
} from "react-native";
import { profileService } from "@/services/profile";
import { CreateProfileData } from "@/models";
import { useTheme } from "@/contexts/ThemeContext";

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
      // TODO: 에러 토스트 표시
    }
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

  const bmi = profile.height > 0 && profile.weight > 0
    ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : "0";

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
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "-"}
                  </Text>
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
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.goal ? goalText[profile.goal] : "-"}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>활동 레벨</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.activityLevel ? activityText[profile.activityLevel] : "-"}
                  </Text>
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
              <Text style={styles.setupButtonText}>프로필 설정</Text>
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
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 편집 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
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
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.gender === "male" && styles.optionButtonTextActive,
                    ]}
                  >
                    남성
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.gender === "female" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, gender: "female" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.gender === "female" && styles.optionButtonTextActive,
                    ]}
                  >
                    여성
                  </Text>
                </Pressable>
              </View>

              {/* 생년월일 */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>생년월일</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editingProfile.birthDate}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, birthDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
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
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.goal === "lose" && styles.optionButtonTextActive,
                    ]}
                  >
                    감량
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.goal === "gain" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "gain" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.goal === "gain" && styles.optionButtonTextActive,
                    ]}
                  >
                    증량
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.goal === "maintain" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "maintain" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.goal === "maintain" && styles.optionButtonTextActive,
                    ]}
                  >
                    유지
                  </Text>
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
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.activityLevel === "low" && styles.optionButtonTextActive,
                    ]}
                  >
                    낮음
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.activityLevel === "medium" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "medium" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.activityLevel === "medium" && styles.optionButtonTextActive,
                    ]}
                  >
                    보통
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    editingProfile.activityLevel === "high" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "high" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: colors.textSecondary },
                      editingProfile.activityLevel === "high" && styles.optionButtonTextActive,
                    ]}
                  >
                    높음
                  </Text>
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
                <Pressable
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "90%",
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
  optionButtonActive: {
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: "#FFFFFF",
  },
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
  saveButton: {
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
