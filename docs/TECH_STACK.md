# Set One - 기술 스택 및 구현 계획

## 🏗 현재 기술 스택

### Frontend
- **React Native** (0.81.4)
- **Expo** (~54.0.12)
- **Expo Router** (파일 기반 라우팅)
- **TypeScript**

### UI/UX
- **React Native Gesture Handler** (드래그 앤 드롭)
- **React Native Calendars** (캘린더)
- **React Native Chart Kit** (차트)
- **React Native SVG** (커스텀 그래프)
- **Ionicons** (아이콘)

### 상태 관리 & 저장소
- **AsyncStorage** (로컬 데이터)
- React Hooks (useState, useEffect, useCallback)
- Context API (테마)

---

## 🔄 추가 필요 기술 스택

### 1. 인증 (Authentication)

#### 옵션 A: Firebase (추천 ⭐)
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
```

**장점**
- 무료 시작 (월 50K MAU까지)
- Google, Apple, Email 로그인 통합
- 검증된 서비스
- 쉬운 구현

**단점**
- Google 종속
- 프라이버시 우려

#### 옵션 B: Supabase (오픈소스)
```bash
npm install @supabase/supabase-js
```

**장점**
- 오픈소스
- PostgreSQL 기반
- Firebase 대안
- 가격 저렴

**단점**
- Firebase보다 생태계 작음
- 소셜 로그인 설정 복잡

#### 옵션 C: Clerk (최신)
```bash
npm install @clerk/clerk-expo
```

**장점**
- 최신 솔루션
- UI 컴포넌트 제공
- 개발자 경험 우수

**단점**
- 비교적 비쌈
- 한국 시장 지원 부족

**최종 선택**: **Firebase** ✅

---

### 2. 백엔드 & 데이터베이스

#### 옵션 A: Firebase Firestore (추천 ⭐)
```bash
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage
```

**데이터 구조**
```
users/
  {userId}/
    profile/
    routines/
    records/
    settings/
```

**장점**
- 실시간 동기화
- 오프라인 지원
- 확장성 좋음

**단점**
- 쿼리 제한
- 비용 (읽기/쓰기 기준)

#### 옵션 B: Supabase (PostgreSQL)
```bash
npm install @supabase/supabase-js
```

**장점**
- 관계형 DB (복잡한 쿼리)
- 저렴한 가격
- Row Level Security

**단점**
- 오프라인 지원 약함
- 실시간 동기화 복잡

**최종 선택**: **Firebase Firestore** ✅

---

### 3. 결제 시스템

#### RevenueCat (강력 추천 ⭐⭐⭐)
```bash
npm install react-native-purchases
```

**장점**
- iOS/Android 결제 통합
- 구독 관리 자동화
- 분석 대시보드
- 무료 티어 (월 $2,500 수익까지)
- 웹훅 지원

**비용**
- 무료: 월 $2,500 수익까지
- 스타터: 월 $299 (무제한)
- 수수료 1%

**대안: 직접 구현**
```bash
npm install react-native-iap
```
- 무료지만 복잡함
- 서버 검증 필요
- 구독 관리 직접 구현

**최종 선택**: **RevenueCat** ✅

---

### 4. 푸시 알림

#### Expo Notifications (추천 ⭐)
```bash
npx expo install expo-notifications
```

**장점**
- Expo 통합
- 간단한 구현
- 무료

**기능**
- 운동 리마인더
- 목표 달성 알림
- 휴식일 추천

---

### 5. 이미지 처리

#### Expo Image Picker
```bash
npx expo install expo-image-picker
```

**기능**
- 운동 사진 첨부
- 진행 사진 비교
- 프로필 사진

---

### 6. 분석 (Analytics)

#### 옵션 A: Firebase Analytics (추천 ⭐)
```bash
npm install @react-native-firebase/analytics
```

**장점**
- 무료
- 상세한 분석
- Google Analytics 연동

#### 옵션 B: Mixpanel
```bash
npm install mixpanel-react-native
```

**장점**
- 사용자 행동 분석 우수
- 코호트 분석

**비용**
- 무료: 월 100K events
- 성장: $28/월

**최종 선택**: **Firebase Analytics** (초기) ✅

---

### 7. 에러 추적

#### Sentry (추천 ⭐)
```bash
npx expo install sentry-expo
```

**장점**
- 실시간 에러 추적
- 소스맵 지원
- 무료 티어 (월 5K errors)

**비용**
- 개발자: $26/월
- 팀: $80/월

---

## 📦 패키지 설치 계획

### Phase 1: 로그인 구현
```bash
# Firebase 설치
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage

# 소셜 로그인
npx expo install @react-native-google-signin/google-signin
# Kakao SDK (선택)
```

### Phase 2: 프리미엄 구현
```bash
# 결제 시스템
npm install react-native-purchases

# 푸시 알림
npx expo install expo-notifications
```

### Phase 3: 분석 & 최적화
```bash
# 분석
npm install @react-native-firebase/analytics

# 에러 추적
npx expo install sentry-expo

# 이미지 처리
npx expo install expo-image-picker
npx expo install expo-image-manipulator
```

---

## 🗄 데이터 마이그레이션 전략

### 로컬 → 클라우드

```typescript
// 1. 로컬 데이터 읽기
const localData = await AsyncStorage.getAllKeys();

// 2. 클라우드 업로드
for (const key of localData) {
  const data = await AsyncStorage.getItem(key);
  await firestore()
    .collection('users')
    .doc(userId)
    .collection(key)
    .set(JSON.parse(data));
}

// 3. 백업 완료 플래그
await AsyncStorage.setItem('cloudBackup', 'true');
```

### 동기화 전략

**Local-First 아키텍처**
```typescript
// 1. 로컬에 먼저 저장
await AsyncStorage.setItem(key, value);

// 2. 백그라운드에서 클라우드 동기화
try {
  await firestore().collection('users').doc(userId).set(value);
  await AsyncStorage.setItem(`${key}_synced`, 'true');
} catch (error) {
  // 실패 시 나중에 재시도
  await AsyncStorage.setItem(`${key}_pending`, 'true');
}
```

---

## 🔐 보안 고려사항

### 1. API 키 보호
```bash
# .env 파일 사용
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
REVENUECAT_API_KEY=xxx
```

### 2. 민감 데이터 암호화
```bash
npm install expo-secure-store
```

### 3. Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

---

## 💾 데이터 모델 설계

### Firestore 구조
```
users/
  {userId}/
    profile: {
      name, email, createdAt, premium, ...
    }

    routines/
      {routineId}: { ... }

    workoutRecords/
      {recordId}: { ... }

    settings/
      preferences: { ... }
      subscription: { ... }

    stats/
      cache: { ... } // 통계 캐시
```

### 인덱스 설계
```
workoutRecords:
  - date (desc)
  - createdAt (desc)
  - routineId + date (compound)
```

---

## 📊 성능 최적화

### 1. 이미지 최적화
```bash
npm install expo-image
```
- 자동 캐싱
- WebP 지원
- 블러 placeholder

### 2. 쿼리 최적화
```typescript
// 페이지네이션
const query = firestore()
  .collection('workoutRecords')
  .orderBy('date', 'desc')
  .limit(20);
```

### 3. 캐시 전략
```typescript
// React Query 사용
npm install @tanstack/react-query
```

---

## 🧪 테스트 전략

### 1. Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

### 2. E2E Tests
```bash
npm install --save-dev detox
```

### 3. 테스트 계정
- 무료 테스트 계정
- 프리미엄 테스트 계정
- Sandbox 결제 테스트

---

## 📱 배포 업데이트 전략

### OTA Updates (Expo)
```bash
npx expo publish
```
- 즉시 업데이트 (네이티브 코드 제외)
- 버그 핫픽스 빠름

### Full Build
```bash
eas build
```
- 네이티브 코드 변경 시
- 메이저 업데이트

---

## 💰 비용 예상 (월)

### 초기 (0-1,000 사용자)
- Firebase: 무료
- RevenueCat: 무료
- Sentry: 무료
- **총 비용**: $0

### 성장기 (1,000-10,000 사용자)
- Firebase: $25-50
- RevenueCat: 무료 or $299
- Sentry: $26
- **총 비용**: $51-375

### 확장기 (10,000+ 사용자)
- Firebase: $100-300
- RevenueCat: $299 (1%)
- Sentry: $80
- **총 비용**: $479-679

---

## 🎯 구현 순서

### Week 1-2: 로그인 구현
1. Firebase 프로젝트 생성
2. Firebase Auth 연동
3. Google 로그인
4. Apple 로그인 (iOS)
5. 로그인 UI/UX

### Week 3-4: 데이터 동기화
1. Firestore 연동
2. 로컬 → 클라우드 마이그레이션
3. 실시간 동기화
4. 충돌 해결

### Week 5-6: 결제 시스템
1. RevenueCat 설정
2. 구독 상품 생성
3. 결제 UI
4. 구독 상태 관리

### Week 7-8: 프리미엄 기능
1. 무료/유료 기능 분리
2. Paywall 구현
3. 프리미엄 기능 활성화
4. 테스트 및 디버깅

---

**작성일**: 2025-01-08
**최종 수정**: 2025-01-08
