import { BaseEntity } from "./common";

export interface UserProfile extends BaseEntity {
  name: string;
  gender: "male" | "female" | "";
  birthDate: string;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  goal: "lose" | "gain" | "maintain" | "";
  activityLevel: "low" | "medium" | "high" | "";
  weeklyGoal: number; // 주간 운동 목표 횟수
}

// 프로필 생성 시 필요한 데이터 (BaseEntity 제외)
export type CreateProfileData = Omit<
  UserProfile,
  "id" | "createdAt" | "updatedAt"
>;

// 프로필 업데이트 시 필요한 데이터
export type UpdateProfileData = Partial<CreateProfileData>;
