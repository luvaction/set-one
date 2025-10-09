import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import ko from "../locales/ko.json";

const LANGUAGE_STORAGE_KEY = "app_language";

// 지원하는 언어인지 확인
const supportedLanguages = ["en", "ko"];
const fallbackLanguage = "en";

// AsyncStorage에서 저장된 언어 불러오기
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to load language from storage:", error);
    return null;
  }
};

// AsyncStorage에 언어 저장하기
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error("Failed to save language to storage:", error);
  }
};

// i18n 초기화 함수
const initializeI18n = async () => {
  // 1. 저장된 언어 확인
  const storedLanguage = await getStoredLanguage();

  // 2. 기기 언어 감지
  const deviceLanguage = Localization.getLocales()[0].languageCode || "en";

  // 3. 언어 우선순위: 저장된 언어 > 기기 언어 > fallback
  let initialLanguage = fallbackLanguage;
  if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
    initialLanguage = storedLanguage;
  } else if (supportedLanguages.includes(deviceLanguage)) {
    initialLanguage = deviceLanguage;
  }

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: initialLanguage,
    fallbackLng: fallbackLanguage,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: "v4", // i18next v21+ compatibility
  });
};

// i18n 초기화 실행
initializeI18n();

export default i18n;
