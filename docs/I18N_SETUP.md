# 다국어 지원 (i18n) 설정 가이드

## 📦 패키지 설치

```bash
# i18n 패키지 설치
npm install i18next react-i18next

# Expo 로컬라이제이션
npx expo install expo-localization
```

---

## 🗂 파일 구조

```
Set1/
├── locales/
│   ├── en.json    # 영어 번역
│   └── ko.json    # 한국어 번역
├── i18n/
│   └── config.ts  # i18n 설정
└── app/
    └── _layout.tsx  # i18n 초기화
```

---

## 🔧 설정 완료 사항

### 1. 번역 파일 생성 ✅
- `locales/ko.json` - 한국어
- `locales/en.json` - 영어

### 2. i18n 설정 ✅
- `i18n/config.ts` - 자동 언어 감지
- 기기 언어가 한국어면 한국어, 아니면 영어

---

## 💻 사용 방법

### 기본 사용법

```typescript
import { useTranslation } from "react-i18next";

export default function MyScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('home.greeting')}</Text>
      <Text>{t('home.subGreeting')}</Text>
    </View>
  );
}
```

### 변수 포함

```typescript
// 번역 파일
{
  "home": {
    "workoutsRemaining": "{{count}}회 남았어요"
  }
}

// 컴포넌트
<Text>{t('home.workoutsRemaining', { count: 3 })}</Text>
// 결과: "3회 남았어요"
```

### 배열 인덱스

```typescript
// 번역 파일
{
  "common": {
    "days": ["일", "월", "화", "수", "목", "금", "토"]
  }
}

// 컴포넌트
<Text>{t('common.days.0')}</Text> // "일"
```

---

## 🌐 언어 변경

### 수동 언어 변경

```typescript
import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View>
      <Button onPress={() => changeLanguage('ko')} title="한국어" />
      <Button onPress={() => changeLanguage('en')} title="English" />
    </View>
  );
}
```

### 현재 언어 확인

```typescript
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'ko' or 'en'
```

---

## 📝 번역 키 네이밍 규칙

### 구조
```
{섹션}.{항목}
```

### 예시
```json
{
  "home": {
    "greeting": "안녕하세요!",
    "subGreeting": "오늘도 Set1부터 시작해볼까요?"
  },
  "profile": {
    "edit": "편집",
    "save": "저장"
  },
  "common": {
    "cancel": "취소",
    "confirm": "확인"
  }
}
```

---

## 🎯 적용 대상 화면

### 완료 예정
- [ ] 홈 (index.tsx)
- [ ] 루틴 (routines.tsx)
- [ ] 운동 (workout.tsx)
- [ ] 기록 (history.tsx)
- [ ] 통계 (statistics.tsx)
- [ ] 프로필 (profile.tsx)
- [ ] 탭 네비게이션 (_layout.tsx)

---

## 🔄 앱에 적용하기

### 1. _layout.tsx에 i18n import 추가

```typescript
import "../i18n/config"; // 최상단에 추가
```

### 2. 컴포넌트 변경 예시

**Before (하드코딩)**
```typescript
<Text style={styles.title}>루틴</Text>
```

**After (i18n)**
```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
<Text style={styles.title}>{t('routines.title')}</Text>
```

---

## 🐛 문제 해결

### 번역이 표시되지 않는 경우

1. **i18n import 확인**
   ```typescript
   import "../i18n/config";
   ```

2. **번역 키 확인**
   ```typescript
   console.log(t('home.greeting')); // 값이 출력되는지 확인
   ```

3. **앱 재시작**
   ```bash
   # 개발 서버 재시작
   npx expo start --clear
   ```

---

## 📱 테스트 방법

### iOS 시뮬레이터
```bash
# 시뮬레이터 언어 변경
Settings > General > Language & Region > iPhone Language
```

### Android 에뮬레이터
```bash
# 에뮬레이터 언어 변경
Settings > System > Languages & input > Languages
```

### 코드로 테스트
```typescript
import { useTranslation } from "react-i18next";

const { i18n } = useTranslation();
i18n.changeLanguage('en'); // 영어로 변경
i18n.changeLanguage('ko'); // 한국어로 변경
```

---

## 🚀 배포 시 주의사항

1. **모든 번역 완료 확인**
   - ko.json과 en.json의 키가 동일한지 확인

2. **테스트**
   - 양쪽 언어로 모든 화면 확인
   - 긴 텍스트가 UI를 깨트리지 않는지 확인

3. **추가 언어 지원**
   - 일본어, 중국어 등 추가 시:
   ```typescript
   // locales/ja.json 생성
   // i18n/config.ts에 추가
   ```

---

## 📊 번역 진행 상황

### Phase 1 (우선순위)
- [x] 번역 파일 생성 (ko.json, en.json)
- [x] i18n 설정 (config.ts)
- [ ] 탭 네비게이션
- [ ] 홈 화면
- [ ] 프로필 화면

### Phase 2
- [ ] 루틴 화면
- [ ] 운동 화면
- [ ] 기록 화면

### Phase 3
- [ ] 통계 화면
- [ ] 에러 메시지
- [ ] Alert 메시지

---

**작성일**: 2025-01-08
**최종 수정**: 2025-01-08
