# 다국어 지원 구현 완료 ✅

## 📦 다음 단계: 패키지 설치

아래 명령어를 실행하여 필요한 패키지를 설치하세요:

```bash
# i18n 패키지 설치
npm install i18next react-i18next

# Expo 로컬라이제이션
npx expo install expo-localization
```

---

## ✅ 이미 완료된 작업

### 1. 번역 파일 생성
- ✅ `locales/ko.json` - 한국어 번역
- ✅ `locales/en.json` - 영어 번역

### 2. i18n 설정
- ✅ `i18n/config.ts` - 자동 언어 감지 및 설정
  - 기기 언어가 한국어면 → 한국어
  - 그 외 모든 언어 → 영어 (fallback)

### 3. 앱에 i18n 통합
- ✅ `app/_layout.tsx` - i18n 초기화
- ✅ `app/(tabs)/_layout.tsx` - 탭 네비게이션 번역 적용

---

## 🎯 현재 적용된 화면

### 탭 네비게이션
- 홈, 루틴, 운동, 기록, 프로필 탭 타이틀

---

## 📝 남은 작업 (선택사항)

다른 화면들도 번역을 적용하려면 각 화면 파일에서 다음과 같이 변경하세요:

### 예시: 홈 화면

**Before:**
```typescript
<Text style={styles.greeting}>안녕하세요!</Text>
<Text style={styles.subGreeting}>오늘도 Set1부터 시작해볼까요?</Text>
```

**After:**
```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

<Text style={styles.greeting}>{t('home.greeting')}</Text>
<Text style={styles.subGreeting}>{t('home.subGreeting')}</Text>
```

---

## 🚀 실행 방법

### 1. 패키지 설치

```bash
npm install i18next react-i18next
npx expo install expo-localization
```

### 2. 앱 재시작

```bash
# 캐시 클리어 후 시작
npx expo start --clear
```

### 3. 언어 테스트

#### 기기 언어 변경
- **iOS**: Settings > General > Language & Region > iPhone Language
- **Android**: Settings > System > Languages & input > Languages

#### 코드로 테스트
```typescript
import { useTranslation } from "react-i18next";

const { i18n } = useTranslation();
i18n.changeLanguage('en'); // 영어
i18n.changeLanguage('ko'); // 한국어
```

---

## 📋 번역 키 참조

모든 번역 키는 `locales/ko.json` 및 `locales/en.json` 파일에 정의되어 있습니다.

### 자주 사용하는 키

```typescript
// 공통
t('common.cancel')     // "취소" / "Cancel"
t('common.save')       // "저장" / "Save"
t('common.delete')     // "삭제" / "Delete"

// 홈
t('home.greeting')     // "안녕하세요!" / "Hello!"
t('home.startWorkout') // "오늘의 운동 시작" / "Start Today's Workout"

// 루틴
t('routines.title')    // "루틴" / "Routines"
t('routines.createRoutine') // "새 루틴 만들기" / "Create New Routine"

// 프로필
t('profile.edit')      // "편집" / "Edit"
t('profile.save')      // "저장" / "Save"
```

---

## 🌐 추가 언어 지원 (향후)

일본어, 중국어 등 추가 언어를 지원하려면:

### 1. 번역 파일 추가
```bash
# 예: 일본어
cp locales/en.json locales/ja.json
# ja.json 파일을 일본어로 번역
```

### 2. i18n 설정 업데이트
```typescript
// i18n/config.ts
import ja from "../locales/ja.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja }, // 추가
  },
  // ...
});
```

---

## 🐛 트러블슈팅

### 번역이 표시되지 않는 경우

1. **패키지 설치 확인**
   ```bash
   npm list i18next react-i18next
   ```

2. **앱 재시작**
   ```bash
   npx expo start --clear
   ```

3. **import 확인**
   ```typescript
   // app/_layout.tsx에 다음이 있는지 확인
   import '../i18n/config';
   ```

### TypeScript 오류

현재 TypeScript 오류가 표시될 수 있지만, 패키지 설치 후 사라집니다.

---

## 📊 구현 현황

### Phase 1 (완료)
- [x] i18n 패키지 설치 가이드
- [x] 번역 파일 (ko, en)
- [x] i18n 설정
- [x] 앱에 통합
- [x] 탭 네비게이션

### Phase 2 (선택)
- [ ] 홈 화면 완전 번역
- [ ] 루틴 화면 완전 번역
- [ ] 운동 화면 완전 번역
- [ ] 기록 화면 완전 번역
- [ ] 통계 화면 완전 번역
- [ ] 프로필 화면 완전 번역

**참고**: Phase 2는 필수가 아닙니다. 핵심 화면만 번역해도 충분합니다!

---

## 💡 팁

### 부분 적용
모든 화면을 한 번에 번역할 필요 없습니다. 중요한 화면부터 하나씩 적용하세요.

### 번역 우선순위
1. 탭 네비게이션 ✅ (완료)
2. 홈 화면
3. 프로필 화면
4. 에러 메시지
5. 나머지 화면

---

**작성일**: 2025-01-08
**최종 수정**: 2025-01-08
