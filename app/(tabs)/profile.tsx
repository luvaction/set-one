import { useTheme } from "@/contexts/ThemeContext";
import { saveLanguage } from "@/i18n/config";
import { CreateProfileData } from "@/models";
import { exerciseService, storage } from "@/services";
import { profileService } from "@/services/profile";
import { workoutRecordService } from "@/services/workoutRecord";
import { weightRecordService } from "@/services/weightRecord";
import { getOrCreateUserId } from "@/utils/userIdHelper";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants"; // Added import
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { styles } from "../style/Profile.styles";

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
  userId: "",
};

export default function ProfileScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<CreateProfileData>(emptyProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CreateProfileData>(profile);
  const [loading, setLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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
        console.log("Loaded profile weeklyGoal:", savedProfile.weeklyGoal);
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
      const profileToSave = { ...editingProfile };
      const savedProfile = await profileService.saveProfile(profileToSave);
      setProfile(savedProfile);

      // 체중이 입력되어 있으면 (0보다 크면) weight_records에 기록
      // 같은 날에 여러 번 저장하면 마지막 값으로 업데이트됨
      if (editingProfile.weight > 0) {
        try {
          const userId = await getOrCreateUserId();
          const today = new Date().toISOString().split("T")[0];
          const hasRecord = await weightRecordService.hasWeightRecordForDate(userId, today);

          if (hasRecord) {
            await weightRecordService.updateWeightRecordForDate(userId, today, editingProfile.weight);
          } else {
            await weightRecordService.createWeightRecord(userId, editingProfile.weight, "profile");
          }
        } catch (weightError) {
          console.error("Failed to save weight record:", weightError);
        }
      }

      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert(t("errors.generic"), t("profile.saveProfileFailed"));
    }
  };

  const handleClearAllData = () => {
    Alert.alert(t("profile.deleteAllData"), t("profile.deleteAllDataConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await storage.clear(); // Clear key_value_store
            await workoutRecordService.clearAllWorkoutRecords(); // Clear all workout records
            setProfile(emptyProfile);
            Alert.alert(t("common.confirm"), t("profile.allDataDeleted"));
          } catch (error) {
            console.error("Failed to clear data:", error);
            Alert.alert(t("errors.generic"), t("errors.deleteFailed"));
          }
        },
      },
    ]);
  };

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageName = () => {
    return i18n.language === "ko" ? "한국어" : "English";
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

      Alert.alert(t("common.confirm"), t("profile.storageDataViewed"));
    } catch (error) {
      console.error("Failed to show storage data:", error);
      Alert.alert(t("errors.generic"), t("profile.viewStorageDataFailed"));
    }
  };

  const handleClearCustomExercises = async () => {
    Alert.alert(t("profile.resetCustomExercises"), t("profile.resetCustomExercisesConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.reset"),
        style: "destructive",
        onPress: async () => {
          try {
            // 커스텀 운동 스토리지 비우기
            await exerciseService.deleteAllCustomExercises();

            Alert.alert(t("common.confirm"), t("profile.resetCustomExercisesSuccess"));
          } catch (error) {
            console.error("Failed to clear custom exercises:", error);
            Alert.alert(t("errors.generic"), t("profile.resetCustomExercisesFailed"));
          }
        },
      },
    ]);
  };

  const goalText = {
    lose: t("profile.goalLose"),
    gain: t("profile.goalGain"),
    maintain: t("profile.goalMaintain"),
  };

  const activityText = {
    low: t("profile.activityLow"),
    medium: t("profile.activityMedium"),
    high: t("profile.activityHigh"),
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
          {/* <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text> */}
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>{t("profile.edit")}</Text>
          </Pressable>
        </View>

        {/* 프로필 정보 */}
        {profile.name ? (
          <>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.basicInfo")}</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.name")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.name}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.gender")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.gender === "male" ? t("profile.male") : profile.gender === "female" ? t("profile.female") : "-"}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.birthDate")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.birthDate || "-"}</Text>
                </View>
              </View>
            </View>

            {/* 신체 정보 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.bodyInfo")}</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.height")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.height} {t("profile.heightUnit")}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.weight")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.weight} {t("profile.weightUnit")}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.targetWeight")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.targetWeight} {t("profile.weightUnit")}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.bmi")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{bmi}</Text>
                </View>
              </View>
            </View>

            {/* 운동 목표 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.exerciseGoal")}</Text>

              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.goal")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.goal ? goalText[profile.goal] : "-"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.activityLevel")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.activityLevel ? activityText[profile.activityLevel] : "-"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.weeklyGoal")}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{t("profile.weeklyGoalTimes", { count: profile.weeklyGoal })}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t("profile.setupPrompt")}</Text>
            <Pressable style={[styles.setupButton, { backgroundColor: colors.primary }]} onPress={handleEdit}>
              <Text style={[styles.setupButtonText, { color: colors.buttonText }]}>{t("profile.setupProfile")}</Text>
            </Pressable>
          </View>
        )}

        {/* 설정 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.settings")}</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="moon" size={20} color={colors.text} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>{t("profile.darkMode")}</Text>
              </View>
              <Switch value={theme === "dark"} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={() => setShowLanguageModal(true)}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="language" size={20} color={colors.text} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Language / 언어</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{getCurrentLanguageName()}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 기타 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.other")}</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t("profile.appVersion")}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{Constants.expoConfig?.version ?? 'N/A'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/*             <Pressable style={styles.infoRow} onPress={handleShowStorageData}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="code-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>{t("profile.viewStorageData")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable> */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={handleClearCustomExercises}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="refresh-outline" size={20} color="#FF9800" />
                <Text style={[styles.infoLabel, { color: "#FF9800" }]}>{t("profile.resetCustomExercises")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.infoRow} onPress={handleClearAllData}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.infoLabel, { color: "#F44336" }]}>{t("profile.deleteAllData")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 편집 모달 */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t("profile.editProfile")}</Text>

                    {/* 이름 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.name")}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={editingProfile.name}
                      onChangeText={(text) => setEditingProfile({ ...editingProfile, name: text })}
                      placeholder={t("profile.namePlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                    />

                    {/* 성별 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.gender")}</Text>
                    <View style={styles.buttonGroup}>
                      <Pressable
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          editingProfile.gender === "male" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setEditingProfile({ ...editingProfile, gender: "male" })}
                      >
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.gender === "male" && { color: colors.buttonText }]}>
                          {t("profile.male")}
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
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.gender === "female" && { color: colors.buttonText }]}>
                          {t("profile.female")}
                        </Text>
                      </Pressable>
                    </View>

                    {/* 생년월일 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.birthDate")}</Text>
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
                      placeholder={t("profile.birthDateFormat")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={10}
                    />

                    {/* 키 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {t("profile.height")} ({t("profile.heightUnit")})
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={String(editingProfile.height)}
                      onChangeText={(text) => setEditingProfile({ ...editingProfile, height: Number(text) || 0 })}
                      placeholder={t("profile.heightPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />

                    {/* 체중 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {t("profile.weight")} ({t("profile.weightUnit")})
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={String(editingProfile.weight)}
                      onChangeText={(text) => setEditingProfile({ ...editingProfile, weight: Number(text) || 0 })}
                      placeholder={t("profile.weightPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />

                    {/* 목표 체중 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {t("profile.targetWeight")} ({t("profile.weightUnit")})
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={String(editingProfile.targetWeight)}
                      onChangeText={(text) => setEditingProfile({ ...editingProfile, targetWeight: Number(text) || 0 })}
                      placeholder={t("profile.targetWeightPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />

                    {/* 목표 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.goal")}</Text>
                    <View style={styles.buttonGroup}>
                      <Pressable
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          editingProfile.goal === "lose" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setEditingProfile({ ...editingProfile, goal: "lose" })}
                      >
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "lose" && { color: colors.buttonText }]}>
                          {t("profile.goalLoseShort")}
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
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "gain" && { color: colors.buttonText }]}>
                          {t("profile.goalGainShort")}
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
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.goal === "maintain" && { color: colors.buttonText }]}>
                          {t("profile.goalMaintainShort")}
                        </Text>
                      </Pressable>
                    </View>

                    {/* 활동 레벨 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.activityLevel")}</Text>
                    <View style={styles.buttonGroup}>
                      <Pressable
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          editingProfile.activityLevel === "low" && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setEditingProfile({ ...editingProfile, activityLevel: "low" })}
                      >
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "low" && { color: colors.buttonText }]}>
                          {t("profile.activityLowShort")}
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
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "medium" && { color: colors.buttonText }]}>
                          {t("profile.activityMediumShort")}
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
                        <Text style={[styles.optionButtonText, { color: colors.textSecondary }, editingProfile.activityLevel === "high" && { color: colors.buttonText }]}>
                          {t("profile.activityHighShort")}
                        </Text>
                      </Pressable>
                    </View>

                    {/* 주간 목표 */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t("profile.weeklyGoalLabel")}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={String(editingProfile.weeklyGoal)}
                      onChangeText={(text) => setEditingProfile({ ...editingProfile, weeklyGoal: Number(text) || 0 })}
                      placeholder={t("profile.weeklyGoalPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />

                    {/* 버튼 */}
                    <View style={styles.modalButtons}>
                      <Pressable
                        style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowEditModal(false)}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t("common.cancel")}</Text>
                      </Pressable>
                      <Pressable style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                        <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{t("common.save")}</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 언어 선택 모달 */}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.languageModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Language / 언어</Text>

            <Pressable
              style={[styles.languageOption, { borderColor: colors.border }, i18n.language === "ko" && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}              onPress={() => changeLanguage("ko")}
            >
              <Text style={[styles.languageText, { color: colors.text }, i18n.language === "ko" && { color: colors.primary, fontWeight: "600" }]}>한국어</Text>
              {i18n.language === "ko" && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </Pressable>

            <Pressable
              style={[styles.languageOption, { borderColor: colors.border }, i18n.language === "en" && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}              onPress={() => changeLanguage("en")}
            >
              <Text style={[styles.languageText, { color: colors.text }, i18n.language === "en" && { color: colors.primary, fontWeight: "600" }]}>English</Text>
              {i18n.language === "en" && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
