import { storage } from "@/services";

const USER_ID_KEY = '@user_id';

/**
 * 사용자 고유 ID를 가져오거나 생성합니다.
 * 처음 호출 시 랜덤 ID를 생성하여 AsyncStorage에 저장하고,
 * 이후 호출에서는 저장된 ID를 반환합니다.
 *
 * 나중에 서버 연동 시 실제 인증 시스템의 userId로 대체될 예정입니다.
 *
 * @returns {Promise<string>} 사용자 고유 ID
 */
export const getOrCreateUserId = async (): Promise<string> => {
  try {
    let userId = await storage.getItem<string>(USER_ID_KEY);
    if (userId === null) {
      // 새로운 고유 ID 생성
      userId = `user_${Math.random().toString(36).substring(2, 15)}`;
      await storage.setItem(USER_ID_KEY, userId);
      console.log('Created new user ID:', userId);
    }
    return userId;
  } catch (e) {
    console.error("Failed to get or create user ID:", e);
    // 오류 발생 시 임시 ID 반환
    return `user_temp_${Date.now()}`;
  }
};

/**
 * 현재 저장된 사용자 ID를 반환합니다. (없으면 null)
 *
 * @returns {Promise<string | null>} 저장된 사용자 ID 또는 null
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    return await storage.getItem<string>(USER_ID_KEY);
  } catch (e) {
    console.error("Failed to get user ID:", e);
    return null;
  }
};

/**
 * 사용자 ID를 명시적으로 설정합니다.
 * (주로 서버 인증 후 실제 userId를 저장할 때 사용)
 *
 * @param {string} userId - 설정할 사용자 ID
 */
export const setUserId = async (userId: string): Promise<void> => {
  try {
    await storage.setItem(USER_ID_KEY, userId);
    console.log('User ID set to:', userId);
  } catch (e) {
    console.error("Failed to set user ID:", e);
    throw e;
  }
};

/**
 * 저장된 사용자 ID를 삭제합니다.
 * (주로 로그아웃이나 테스트 시 사용)
 */
export const clearUserId = async (): Promise<void> => {
  try {
    await storage.removeItem(USER_ID_KEY);
    console.log('User ID cleared');
  } catch (e) {
    console.error("Failed to clear user ID:", e);
    throw e;
  }
};
