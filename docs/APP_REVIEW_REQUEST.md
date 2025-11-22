# 앱 리뷰 요청 구현 가이드

**작성일:** 2025-01-17
**목적:** iOS/Android에서 자동으로 앱 리뷰 요청하기

---

## 1. 패키지 설치

```bash
npx expo install expo-store-review
```

**지원 플랫폼:**
- ✅ iOS (In-App Review)
- ✅ Android (In-App Review)
- ❌ Web (지원 안 됨)

---

## 2. 유틸리티 함수 생성

**파일:** `/utils/reviewHelper.ts`

```typescript
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

const REVIEW_REQUESTED_KEY = '@review_requested';
const REVIEW_COUNT_KEY = '@review_prompt_count';
const LAST_REVIEW_DATE_KEY = '@last_review_date';

// 앱스토어 URL (실제 앱 ID로 교체 필요)
const APP_STORE_URL = {
  ios: 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review',
  android: 'market://details?id=YOUR_PACKAGE_NAME',
};

/**
 * 리뷰 요청 조건 확인
 */
export const shouldRequestReview = async (): Promise<boolean> => {
  try {
    // 이미 리뷰 작성했는지 확인
    const hasReviewed = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
    if (hasReviewed === 'true') {
      return false;
    }

    // 리뷰 요청 횟수 확인 (최대 3회)
    const countStr = await AsyncStorage.getItem(REVIEW_COUNT_KEY);
    const count = countStr ? parseInt(countStr) : 0;
    if (count >= 3) {
      return false;
    }

    // 마지막 요청 날짜 확인 (최소 7일 간격)
    const lastDateStr = await AsyncStorage.getItem(LAST_REVIEW_DATE_KEY);
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr);
      const now = new Date();
      const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking review status:', error);
    return false;
  }
};

/**
 * In-App 리뷰 요청 (iOS/Android 네이티브)
 */
export const requestInAppReview = async (): Promise<boolean> => {
  try {
    // 디바이스에서 리뷰 가능한지 확인
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      // 네이티브 리뷰 다이얼로그 표시
      await StoreReview.requestReview();

      // 요청 기록
      await recordReviewRequest();
      return true;
    } else {
      // In-App Review 지원 안 하는 경우 외부 링크로
      return await openStoreReview();
    }
  } catch (error) {
    console.error('Error requesting review:', error);
    return false;
  }
};

/**
 * 앱스토어로 직접 이동
 */
export const openStoreReview = async (): Promise<boolean> => {
  try {
    const url = Platform.OS === 'ios' ? APP_STORE_URL.ios : APP_STORE_URL.android;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      await recordReviewRequest();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error opening store:', error);
    return false;
  }
};

/**
 * 리뷰 요청 기록
 */
const recordReviewRequest = async () => {
  try {
    // 요청 횟수 증가
    const countStr = await AsyncStorage.getItem(REVIEW_COUNT_KEY);
    const count = countStr ? parseInt(countStr) : 0;
    await AsyncStorage.setItem(REVIEW_COUNT_KEY, String(count + 1));

    // 마지막 요청 날짜 저장
    await AsyncStorage.setItem(LAST_REVIEW_DATE_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error recording review request:', error);
  }
};

/**
 * 사용자가 리뷰 작성 완료로 표시
 */
export const markAsReviewed = async () => {
  try {
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');
  } catch (error) {
    console.error('Error marking as reviewed:', error);
  }
};

/**
 * 리뷰 상태 초기화 (테스트용)
 */
export const resetReviewStatus = async () => {
  try {
    await AsyncStorage.removeItem(REVIEW_REQUESTED_KEY);
    await AsyncStorage.removeItem(REVIEW_COUNT_KEY);
    await AsyncStorage.removeItem(LAST_REVIEW_DATE_KEY);
  } catch (error) {
    console.error('Error resetting review status:', error);
  }
};
```

---

## 3. 리뷰 요청 타이밍 전략

### 전략 1: 운동 완료 후 (추천) ⭐

**조건:**
- 운동 완료 5회 이상
- 앱 사용 7일 이상
- 마지막 리뷰 요청 후 7일 경과

**구현 위치:** `app/(tabs)/workout.tsx`

```typescript
import { requestInAppReview, shouldRequestReview } from '@/utils/reviewHelper';

// 운동 완료 시
const handleFinishWorkout = async () => {
  // ... 기존 운동 완료 로직

  // 리뷰 요청 조건 확인
  const workoutCount = await getCompletedWorkoutCount();
  const daysSinceInstall = await getDaysSinceInstall();

  if (workoutCount >= 5 && daysSinceInstall >= 7) {
    const shouldRequest = await shouldRequestReview();
    if (shouldRequest) {
      // 2초 후 리뷰 요청 (축하 메시지 후)
      setTimeout(() => {
        requestInAppReview();
      }, 2000);
    }
  }
};
```

### 전략 2: 주간 목표 달성 시

**조건:**
- 주간 운동 목표 달성
- 2주 연속 달성
- 긍정적인 순간

**구현 위치:** `app/(tabs)/index.tsx`

```typescript
// 주간 목표 달성 확인
useEffect(() => {
  checkWeeklyGoal();
}, []);

const checkWeeklyGoal = async () => {
  const achieved = await isWeeklyGoalAchieved();

  if (achieved) {
    const shouldRequest = await shouldRequestReview();
    if (shouldRequest) {
      // 축하 메시지와 함께
      Alert.alert(
        '🎉 목표 달성!',
        '이번 주 목표를 달성했어요!',
        [
          { text: '좋아요!', onPress: () => {
            setTimeout(() => {
              requestInAppReview();
            }, 1000);
          }}
        ]
      );
    }
  }
};
```

### 전략 3: 프로필 화면 버튼 (수동)

**구현 위치:** `app/(tabs)/profile.tsx`

```typescript
import { openStoreReview } from '@/utils/reviewHelper';

// 프로필 화면 설정 섹션에 추가
<Pressable
  style={[styles.settingRow, { backgroundColor: colors.surface }]}
  onPress={openStoreReview}
>
  <View style={styles.settingLabelContainer}>
    <Ionicons name="star" size={20} color={colors.primary} />
    <Text style={[styles.settingLabel, { color: colors.text }]}>
      {t('profile.rateApp')}
    </Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
</Pressable>
```

---

## 4. 스마트 리뷰 요청 시스템

**파일:** `/utils/smartReview.ts`

```typescript
import { shouldRequestReview, requestInAppReview } from './reviewHelper';
import { workoutRecordService } from '@/services/workoutRecord';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_DATE_KEY = '@install_date';

/**
 * 앱 설치 날짜 저장 (최초 1회)
 */
export const recordInstallDate = async () => {
  try {
    const existing = await AsyncStorage.getItem(INSTALL_DATE_KEY);
    if (!existing) {
      await AsyncStorage.setItem(INSTALL_DATE_KEY, new Date().toISOString());
    }
  } catch (error) {
    console.error('Error recording install date:', error);
  }
};

/**
 * 설치 후 경과 일수
 */
export const getDaysSinceInstall = async (): Promise<number> => {
  try {
    const installDateStr = await AsyncStorage.getItem(INSTALL_DATE_KEY);
    if (!installDateStr) return 0;

    const installDate = new Date(installDateStr);
    const now = new Date();
    const diff = now.getTime() - installDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

/**
 * 완료한 운동 횟수
 */
export const getCompletedWorkoutCount = async (): Promise<number> => {
  try {
    const records = await workoutRecordService.getAllRecords();
    return records.filter(r => r.status === 'completed').length;
  } catch (error) {
    return 0;
  }
};

/**
 * 리뷰 요청 적절한 타이밍인지 확인
 */
export const checkAndRequestReview = async (): Promise<void> => {
  try {
    // 기본 조건 확인
    const canRequest = await shouldRequestReview();
    if (!canRequest) return;

    // 운동 횟수 확인
    const workoutCount = await getCompletedWorkoutCount();
    if (workoutCount < 5) return;

    // 설치 후 경과일 확인
    const daysSinceInstall = await getDaysSinceInstall();
    if (daysSinceInstall < 7) return;

    // 모든 조건 충족 시 리뷰 요청
    await requestInAppReview();
  } catch (error) {
    console.error('Error checking review:', error);
  }
};
```

---

## 5. 번역 추가

**locales/ko.json:**
```json
{
  "profile": {
    "rateApp": "앱 평가하기",
    "rateAppMessage": "Set1이 마음에 드시나요? 별점과 리뷰를 남겨주세요!"
  }
}
```

**locales/en.json:**
```json
{
  "profile": {
    "rateApp": "Rate the App",
    "rateAppMessage": "Enjoying Set1? Please rate us and leave a review!"
  }
}
```

---

## 6. 앱 ID 설정

### iOS App ID 확인

1. App Store Connect 접속
2. 앱 선택
3. 앱 정보 탭
4. Apple ID 확인 (예: `1234567890`)

**URL 형식:**
```
https://apps.apple.com/app/id1234567890?action=write-review
```

### Android Package Name 확인

**app.json:**
```json
{
  "expo": {
    "android": {
      "package": "com.yourname.set1"
    }
  }
}
```

**URL 형식:**
```
market://details?id=com.yourname.set1
```

### reviewHelper.ts 업데이트

```typescript
const APP_STORE_URL = {
  ios: 'https://apps.apple.com/app/id1234567890?action=write-review',
  android: 'market://details?id=com.yourname.set1',
};
```

---

## 7. 통합 예시

**App.tsx (또는 _layout.tsx):**
```typescript
import { recordInstallDate } from '@/utils/smartReview';

export default function App() {
  useEffect(() => {
    // 앱 시작 시 설치 날짜 기록
    recordInstallDate();
  }, []);

  return (
    // ... 앱 컴포넌트
  );
}
```

**운동 완료 화면:**
```typescript
import { checkAndRequestReview } from '@/utils/smartReview';

const handleWorkoutComplete = async () => {
  // 운동 기록 저장
  await saveWorkoutRecord();

  // 축하 메시지 표시
  Alert.alert('축하합니다!', '운동을 완료했습니다! 💪');

  // 리뷰 요청 조건 확인 및 실행
  setTimeout(() => {
    checkAndRequestReview();
  }, 2000);
};
```

---

## 8. 모범 사례

### DO ✅

```
1. 긍정적인 순간에 요청
   - 운동 완료 후
   - 목표 달성 후
   - PR 경신 후

2. 적절한 간격 유지
   - 최소 7일 간격
   - 최대 3회 요청
   - 이미 리뷰 작성 시 중단

3. 자연스러운 타이밍
   - 축하 메시지 후 2초 대기
   - 사용자가 긍정적인 감정일 때

4. 수동 옵션 제공
   - 프로필 화면에 "앱 평가하기" 버튼
   - 언제든 리뷰 가능
```

### DON'T ❌

```
1. 앱 시작 직후 요청
2. 에러 발생 시 요청
3. 너무 자주 요청 (1주일에 1회 이상)
4. 강제로 리뷰 유도
5. 리뷰 작성해야 기능 사용 가능
```

---

## 9. 테스트

### 개발 중 테스트

```typescript
import { resetReviewStatus, requestInAppReview } from '@/utils/reviewHelper';

// 테스트 버튼 추가 (개발 모드에서만)
{__DEV__ && (
  <View style={styles.devTools}>
    <Button
      title="리뷰 상태 초기화"
      onPress={resetReviewStatus}
    />
    <Button
      title="리뷰 요청 테스트"
      onPress={requestInAppReview}
    />
  </View>
)}
```

### iOS 시뮬레이터 제약

```
iOS 시뮬레이터에서는 In-App Review 작동 안 함
실제 기기에서 테스트 필요
또는 TestFlight 빌드로 테스트
```

### Android 에뮬레이터

```
Play Store 설치된 에뮬레이터 필요
Google Play Services 포함된 이미지 사용
```

---

## 10. 모니터링

### 리뷰 요청 통계 수집

```typescript
// utils/analytics.ts (선택사항)
export const trackReviewRequest = async (action: 'shown' | 'dismissed' | 'completed') => {
  // 분석 도구에 이벤트 전송
  // Firebase Analytics, Amplitude 등
  console.log('Review request:', action);
};

// reviewHelper.ts에서 사용
export const requestInAppReview = async (): Promise<boolean> => {
  try {
    await trackReviewRequest('shown');

    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
      await trackReviewRequest('completed');
      return true;
    }
  } catch (error) {
    await trackReviewRequest('dismissed');
    return false;
  }
};
```

---

## 11. 빠른 시작 체크리스트

```
설치:
- [ ] npx expo install expo-store-review

파일 생성:
- [ ] utils/reviewHelper.ts
- [ ] utils/smartReview.ts

설정:
- [ ] iOS App ID 업데이트
- [ ] Android Package Name 업데이트

번역:
- [ ] locales/ko.json에 번역 추가
- [ ] locales/en.json에 번역 추가

통합:
- [ ] App 시작 시 설치 날짜 기록
- [ ] 운동 완료 시 리뷰 요청
- [ ] 프로필에 수동 버튼 추가

테스트:
- [ ] 실제 기기에서 테스트
- [ ] 타이밍 확인
- [ ] 조건 확인 (5회, 7일)
```

---

## 12. FAQ

**Q: 얼마나 자주 요청해야 하나요?**
```
A: 최소 7일 간격, 최대 3회
   사용자가 작성 완료하면 중단
```

**Q: 리뷰 작성 여부를 어떻게 알 수 있나요?**
```
A: In-App Review는 작성 여부 확인 불가
   수동 버튼 클릭 시 "작성 완료" 버튼 제공
```

**Q: iOS와 Android 동작이 다른가요?**
```
A: 네이티브 다이얼로그는 동일
   하지만 디자인은 플랫폼마다 다름
   expo-store-review가 자동 처리
```

**Q: TestFlight에서 작동하나요?**
```
A: iOS: 작동 안 함 (프로덕션만)
   Android: 베타도 작동 가능
```

---

**문서 최종 수정:** 2025-01-17
**다음 리뷰:** 구현 완료 후
