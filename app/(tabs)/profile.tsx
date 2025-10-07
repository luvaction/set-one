import { Colors } from "@/constants/theme";
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
} from "react-native";
import { profileService } from "@/services/profile";
import { CreateProfileData } from "@/models";

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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>프로필</Text>
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.editButtonText}>편집</Text>
          </Pressable>
        </View>

        {/* 프로필 정보 */}
        {profile.name ? (
          <>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>이름</Text>
                  <Text style={styles.infoValue}>{profile.name}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>성별</Text>
                  <Text style={styles.infoValue}>
                    {profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "-"}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>생년월일</Text>
                  <Text style={styles.infoValue}>{profile.birthDate || "-"}</Text>
                </View>
              </View>
            </View>

            {/* 신체 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>신체 정보</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>키</Text>
                  <Text style={styles.infoValue}>{profile.height} cm</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>현재 체중</Text>
                  <Text style={styles.infoValue}>{profile.weight} kg</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>목표 체중</Text>
                  <Text style={styles.infoValue}>{profile.targetWeight} kg</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>BMI</Text>
                  <Text style={styles.infoValue}>{bmi}</Text>
                </View>
              </View>
            </View>

            {/* 운동 목표 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>운동 목표</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>목표</Text>
                  <Text style={styles.infoValue}>
                    {profile.goal ? goalText[profile.goal] : "-"}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>활동 레벨</Text>
                  <Text style={styles.infoValue}>
                    {profile.activityLevel ? activityText[profile.activityLevel] : "-"}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>주간 목표</Text>
                  <Text style={styles.infoValue}>주 {profile.weeklyGoal}회</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={Colors.dark.icon} />
            <Text style={styles.emptyText}>프로필을 설정해주세요</Text>
            <Pressable style={styles.setupButton} onPress={handleEdit}>
              <Text style={styles.setupButtonText}>프로필 설정</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* 편집 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>프로필 편집</Text>

              {/* 이름 */}
              <Text style={styles.inputLabel}>이름</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.name}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, name: text })}
                placeholder="이름을 입력하세요"
                placeholderTextColor={Colors.dark.textSecondary}
              />

              {/* 성별 */}
              <Text style={styles.inputLabel}>성별</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.gender === "male" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, gender: "male" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.gender === "male" && styles.optionButtonTextActive,
                    ]}
                  >
                    남성
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.gender === "female" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, gender: "female" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.gender === "female" && styles.optionButtonTextActive,
                    ]}
                  >
                    여성
                  </Text>
                </Pressable>
              </View>

              {/* 생년월일 */}
              <Text style={styles.inputLabel}>생년월일</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.birthDate}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, birthDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.dark.textSecondary}
              />

              {/* 키 */}
              <Text style={styles.inputLabel}>키 (cm)</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.height > 0 ? String(editingProfile.height) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, height: Number(text) || 0 })}
                placeholder="170"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />

              {/* 체중 */}
              <Text style={styles.inputLabel}>현재 체중 (kg)</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.weight > 0 ? String(editingProfile.weight) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, weight: Number(text) || 0 })}
                placeholder="70"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />

              {/* 목표 체중 */}
              <Text style={styles.inputLabel}>목표 체중 (kg)</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.targetWeight > 0 ? String(editingProfile.targetWeight) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, targetWeight: Number(text) || 0 })}
                placeholder="65"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />

              {/* 목표 */}
              <Text style={styles.inputLabel}>운동 목표</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.goal === "lose" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "lose" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.goal === "lose" && styles.optionButtonTextActive,
                    ]}
                  >
                    감량
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.goal === "gain" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "gain" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.goal === "gain" && styles.optionButtonTextActive,
                    ]}
                  >
                    증량
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.goal === "maintain" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, goal: "maintain" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.goal === "maintain" && styles.optionButtonTextActive,
                    ]}
                  >
                    유지
                  </Text>
                </Pressable>
              </View>

              {/* 활동 레벨 */}
              <Text style={styles.inputLabel}>활동 레벨</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.activityLevel === "low" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "low" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.activityLevel === "low" && styles.optionButtonTextActive,
                    ]}
                  >
                    낮음
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.activityLevel === "medium" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "medium" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.activityLevel === "medium" && styles.optionButtonTextActive,
                    ]}
                  >
                    보통
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    editingProfile.activityLevel === "high" && styles.optionButtonActive,
                  ]}
                  onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "high" })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editingProfile.activityLevel === "high" && styles.optionButtonTextActive,
                    ]}
                  >
                    높음
                  </Text>
                </Pressable>
              </View>

              {/* 주간 목표 */}
              <Text style={styles.inputLabel}>주간 운동 목표 (회)</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.weeklyGoal > 0 ? String(editingProfile.weeklyGoal) : ""}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, weeklyGoal: Number(text) || 0 })}
                placeholder="3"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />

              {/* 버튼 */}
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
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
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    color: Colors.dark.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    color: Colors.dark.primary,
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
    color: Colors.dark.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: "#000000",
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
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: "#000000",
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
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
