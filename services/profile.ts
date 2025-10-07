import { UserProfile, CreateProfileData, STORAGE_KEYS } from "@/models";
import { storage } from "./storage/asyncStorage";

// UUID 생성 (간단한 버전)
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// 현재 시간 ISO 문자열
const now = (): string => new Date().toISOString();

// 프로필 서비스
export const profileService = {
  // 프로필 가져오기
  async getProfile(): Promise<UserProfile | null> {
    return await storage.getItem<UserProfile>(STORAGE_KEYS.PROFILE);
  },

  // 프로필 저장 (생성 또는 업데이트)
  async saveProfile(profileData: CreateProfileData): Promise<UserProfile> {
    const existingProfile = await this.getProfile();

    if (existingProfile) {
      // 업데이트
      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...profileData,
        updatedAt: now(),
      };
      await storage.setItem(STORAGE_KEYS.PROFILE, updatedProfile);
      return updatedProfile;
    } else {
      // 생성
      const newProfile: UserProfile = {
        id: generateId(),
        ...profileData,
        createdAt: now(),
        updatedAt: now(),
      };
      await storage.setItem(STORAGE_KEYS.PROFILE, newProfile);
      return newProfile;
    }
  },

  // 프로필 삭제
  async deleteProfile(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.PROFILE);
  },

  // 프로필 존재 여부 확인
  async hasProfile(): Promise<boolean> {
    const profile = await this.getProfile();
    return profile !== null;
  },
};
