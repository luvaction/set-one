import { UserProfile, CreateProfileData } from "@/models";
import { getSingleItem, runSql } from "./db/sqlite";

// UUID 생성 (간단한 버전)
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// 현재 시간 타임스탬프 (밀리초)
const nowTimestamp = (): number => Date.now();

// DB row를 UserProfile로 변환
interface ProfileRow {
  id: string;
  user_id: string;
  name: string | null;
  gender: string | null;
  birth_date: string | null;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  goal: string | null;
  activity_level: string | null;
  weekly_goal: number | null;
  unit_system: string | null;
  created_at: number;
  updated_at: number;
}

const rowToProfile = (row: ProfileRow): UserProfile => {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || '',
    gender: (row.gender as "male" | "female" | "") || '',
    birthDate: row.birth_date || '',
    height: row.height || 0,
    weight: row.weight || 0,
    targetWeight: row.target_weight || 0,
    goal: (row.goal as "lose" | "gain" | "maintain" | "") || '',
    activityLevel: (row.activity_level as "low" | "medium" | "high" | "") || '',
    weeklyGoal: row.weekly_goal || 0,
    unitSystem: (row.unit_system as "metric" | "imperial") || 'metric',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
};

// 프로필 서비스
export const profileService = {
  // 프로필 가져오기
  async getProfile(): Promise<UserProfile | null> {
    const row = await getSingleItem<ProfileRow>(
      'SELECT * FROM profiles LIMIT 1'
    );
    return row ? rowToProfile(row) : null;
  },

  // 프로필 저장 (생성 또는 업데이트)
  async saveProfile(profileData: CreateProfileData): Promise<UserProfile> {
    const existingProfile = await this.getProfile();

    if (existingProfile) {
      // 업데이트
      const updatedAt = nowTimestamp();
      await runSql(
        `UPDATE profiles SET
          user_id = ?, name = ?, gender = ?, birth_date = ?,
          height = ?, weight = ?, target_weight = ?, goal = ?,
          activity_level = ?, weekly_goal = ?, unit_system = ?, updated_at = ?
        WHERE id = ?`,
        [
          profileData.userId,
          profileData.name,
          profileData.gender,
          profileData.birthDate,
          profileData.height,
          profileData.weight,
          profileData.targetWeight,
          profileData.goal,
          profileData.activityLevel,
          profileData.weeklyGoal,
          profileData.unitSystem || 'metric',
          updatedAt,
          existingProfile.id,
        ]
      );

      return {
        ...existingProfile,
        ...profileData,
        updatedAt: new Date(updatedAt).toISOString(),
      };
    } else {
      // 생성
      const id = generateId();
      const createdAt = nowTimestamp();
      const updatedAt = createdAt;

      await runSql(
        `INSERT INTO profiles (
          id, user_id, name, gender, birth_date,
          height, weight, target_weight, goal,
          activity_level, weekly_goal, unit_system, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          profileData.userId,
          profileData.name,
          profileData.gender,
          profileData.birthDate,
          profileData.height,
          profileData.weight,
          profileData.targetWeight,
          profileData.goal,
          profileData.activityLevel,
          profileData.weeklyGoal,
          profileData.unitSystem || 'metric',
          createdAt,
          updatedAt,
        ]
      );

      return {
        id,
        ...profileData,
        unitSystem: profileData.unitSystem || 'metric',
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(updatedAt).toISOString(),
      };
    }
  },

  // 프로필 삭제
  async deleteProfile(): Promise<void> {
    await runSql('DELETE FROM profiles');
  },

  // 프로필 존재 여부 확인
  async hasProfile(): Promise<boolean> {
    const profile = await this.getProfile();
    return profile !== null;
  },
};