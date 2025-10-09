import { BaseEntity } from "./common";

export interface UserProfile extends BaseEntity {
  name: string;
  gender: "male" | "female" | "";
  birthDate: string;
  height: number; // cm (always stored in metric)
  weight: number; // kg (always stored in metric)
  targetWeight: number; // kg (always stored in metric)
  goal: "lose" | "gain" | "maintain" | "";
  activityLevel: "low" | "medium" | "high" | "";
  weeklyGoal: number; // 주간 운동 목표 횟수
  unitSystem?: "metric" | "imperial"; // 단위 시스템 (기본값: metric)
}

// 프로필 생성 시 필요한 데이터 (BaseEntity 제외)
export type CreateProfileData = Omit<
  UserProfile,
  "id" | "createdAt" | "updatedAt"
>;

// 프로필 업데이트 시 필요한 데이터
export type UpdateProfileData = Partial<CreateProfileData>;
