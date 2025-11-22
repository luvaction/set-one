# Set1 수익화 전략

**작성일:** 2025-01-17
**목적:** 앱의 철학을 유지하면서 지속 가능한 수익 모델 구축

---

## 핵심 원칙

### 절대 지키기 ⚠️

```
❌ 배너 광고 (사용성 파괴)
❌ 전면 광고 (짜증 유발)
❌ 기능 제한 강요 ("3회만 무료")
❌ 성가신 프리미엄 유도

✅ 무료도 충분히 사용 가능
✅ 프리미엄은 보너스
✅ 강요 없이 자연스럽게
✅ 가치에 합당한 가격
```

### Set1의 정체성 유지

```
"광고 없음, 완전 무료"
→ 기본 기능은 영구 무료
→ 프리미엄은 선택사항
→ 무료 사용자도 1등급 시민
```

---

## 수익 모델 비교

### 1. Freemium (무료 + 프리미엄) ⭐ 최고 추천

**기본 기능: 완전 무료**
- 운동 기록
- 기본 통계 (PR, 주간 비교, 스트릭)
- 루틴 관리
- 체중 기록
- 광고 없음
- 영구 무료 사용

**프리미엄 기능: $9.99 (일회성) 또는 $2.99/월**
- 클라우드 백업 (기기 변경 시 복원)
- 고급 통계 (1RM 계산, 장기 추세 분석)
- 운동 가이드 GIF 전체
- 커스텀 테마 색상
- 향후 모든 프리미엄 기능 포함

**장점:**
- 진입 장벽 없음 (무료로 시작)
- 가치를 경험한 사용자만 구매
- 높은 전환율

**단점:**
- 초기 개발 부담
- 무료/프리미엄 경계 설정 필요

### 2. 팁 jar (선택적 후원)

**구현 방식:**
```
프로필 화면 하단:
"Set1이 도움이 되셨나요?
개발자에게 커피 한 잔 사주세요!"

[$1] [$3] [$5] [Custom]
```

**장점:**
- 강요 없음
- 사용자 선택
- 철학 유지

**단점:**
- 수익 불안정
- 전환율 매우 낮음 (1-3%)

### 3. 프리미엄 일회성 구매 🏆 안정적

**가격 구조:**
```
Tier 1: $2.99 (라이트)
- 클라우드 백업
- 고급 통계

Tier 2: $9.99 (프로) ⭐ 추천
- 모든 프리미엄 기능
- 평생 사용
- 향후 기능 모두 포함

Tier 3: $19.99 (얼리서포터)
- 프로 기능 전부
- 이름 크레딧 기재
- 신규 기능 베타 테스트 우선권
```

**장점:**
- 단순 명확
- 심리적 부담 적음 ("한 번만 결제")
- 수익 예측 가능

**단점:**
- 지속 수익 없음
- 구독보다 총 수익 낮음

### 4. 하이브리드 모델 (추천) ⚡

**무료 (영구)**
- 현재 모든 핵심 기능

**일회성 $9.99**
- 프리미엄 기능 평생 사용

**구독 $2.99/월 (또는 $24.99/년)**
- 일회성과 동일한 기능
- AI 기능 추가 (향후)
- 우선 지원

**전략:**
```
사용자 선택권 제공
"한 번만 내고 평생 쓰기" vs "매달 조금씩"
```

---

## 수익 예상 (현실적)

### 시나리오 1: 프리미엄 일회성 ($9.99)

**사용자 1,000명 기준:**
```
전환율 5% (낙관적) = 50명 구매
수익: 50 × $9.99 = $499.50
애플 수수료 30% 제외 = $349.65
```

**사용자 10,000명 기준:**
```
전환율 3% (현실적) = 300명
수익: 300 × $9.99 = $2,997
수수료 제외 = $2,097.90
```

### 시나리오 2: 구독 ($2.99/월)

**사용자 1,000명 기준:**
```
전환율 2% = 20명 구독
월 수익: 20 × $2.99 = $59.80
수수료 제외 = $41.86/월
연간 = $502.32
```

**사용자 10,000명 기준:**
```
전환율 1% = 100명 구독
월 수익: 100 × $2.99 = $299
수수료 제외 = $209.30/월
연간 = $2,511.60
```

### 시나리오 3: 하이브리드

**사용자 5,000명 기준:**
```
일회성 구매: 3% = 150명 × $9.99 = $1,498.50
월 구독: 1% = 50명 × $2.99 = $149.50/월
총 수익 (첫 해):
- 일회성: $1,048.95 (수수료 제외)
- 구독 연간: $1,255.80 (수수료 제외)
- 합계: $2,304.75
```

---

## 로드맵

### Phase 1: 현재 (사용자 <100명)

**목표: 성장에 집중**

```
✅ 완전 무료 유지
✅ 사용자 확보가 최우선
✅ 수익화 코드 구조만 준비

실행:
- 아무것도 하지 않기
- 기능 개선에만 집중
- 사용자 피드백 수집
```

### Phase 2: 준비기 (사용자 100-500명)

**목표: 프리미엄 기능 개발**

**Week 1-2: 기능 설계**
```markdown
features.md 작성:

무료 기능:
- 현재 모든 기능 유지

프리미엄 기능:
- [ ] 클라우드 백업 (Firebase/AWS)
- [ ] 1RM 계산기
- [ ] 장기 통계 (6개월, 1년 추세)
- [ ] 운동 GIF 전체
- [ ] 커스텀 테마
```

**Week 3-4: 코드 구조**
```typescript
// utils/premium.ts
export const isPremiumUser = async () => {
  const purchases = await checkPurchases();
  return purchases.premium || false;
};

export const PREMIUM_FEATURES = {
  cloudBackup: false,
  advancedStats: false,
  exerciseGifs: false,
  customThemes: false,
};

// 사용 예시
if (await isPremiumUser()) {
  // 프리미엄 기능
} else {
  // 무료 기능
}
```

**Week 5-6: UI 준비**
```
프로필 화면 하단:
┌─────────────────────────┐
│  Premium (곧 출시)      │
│                         │
│  🔒 클라우드 백업        │
│  📊 고급 통계           │
│  🎨 커스텀 테마         │
│                         │
│  [관심 있어요] 버튼     │
└─────────────────────────┘

→ 관심 사용자 카운트
→ 가격 의견 수렴
```

### Phase 3: 출시 (사용자 500-1,000명)

**목표: 프리미엄 기능 출시**

**Week 1-2: 클라우드 백업 구현**
```bash
# Firebase 설정
npm install @react-native-firebase/app
npm install @react-native-firebase/firestore

기능:
- 자동 백업 (일 1회)
- 수동 백업 버튼
- 기기 간 동기화
- 복원 기능
```

**Week 3: In-App Purchase**
```bash
expo install expo-in-app-purchases

상품 등록 (App Store Connect):
1. Premium Lifetime - $9.99
2. Premium Monthly - $2.99
```

**Week 4: 출시 및 마케팅**
```
앱 업데이트:
- 프리미엄 기능 활성화
- 결제 시스템 연동

마케팅:
- "출시 기념 50% 할인!" ($4.99)
- 첫 100명 한정
- 앱스토어 설명 업데이트

프로모션 텍스트:
"무료로도 완벽합니다!
더 많은 기능이 필요하다면 프리미엄을 선택하세요.
평생 사용 $9.99"
```

### Phase 4: 최적화 (사용자 1,000+)

**목표: 전환율 향상**

**A/B 테스트:**
```
가격:
- $9.99 vs $7.99 vs $12.99

구독:
- $2.99/월 vs $1.99/월
- $24.99/년 (월 $2.08) 추가

메시지:
- "평생 사용" vs "한 번만 결제"
- "얼리서포터" vs "프리미엄"
```

**추가 기능:**
```
1순위: AI 루틴 추천
2순위: 운동 자세 분석 (카메라 활용)
3순위: 커뮤니티 기능 (루틴 공유)
```

---

## 구현 가이드

### 1. 프리미엄 기능 구분

**파일 구조:**
```
utils/
  premium.ts          # 프리미엄 로직
  premiumFeatures.ts  # 기능 정의

services/
  purchase.ts         # 결제 처리
  cloudBackup.ts      # 백업 서비스

components/
  PremiumBadge.tsx    # 프리미엄 표시
  PremiumModal.tsx    # 결제 화면
```

**premium.ts 구현:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@premium_status';

export const isPremiumUser = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PREMIUM_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

export const setPremiumStatus = async (status: boolean) => {
  await AsyncStorage.setItem(PREMIUM_KEY, String(status));
};

// 실제로는 In-App Purchase 영수증 검증
export const verifyPurchase = async () => {
  // TODO: 영수증 검증 로직
};
```

**premiumFeatures.ts:**
```typescript
export const FEATURES = {
  FREE: {
    workoutRecording: true,
    basicStats: true,
    routineManagement: true,
    weightTracking: true,
    weeklyComparison: true,
    personalRecords: true,
  },
  PREMIUM: {
    cloudBackup: true,
    advancedStats: true,      // 1RM, 장기 추세
    exerciseGifs: true,
    customThemes: true,
    exportData: true,
  },
};

export const PREMIUM_PRICE = {
  LIFETIME: 9.99,
  MONTHLY: 2.99,
  YEARLY: 24.99,
};
```

### 2. UI 컴포넌트

**PremiumBadge.tsx:**
```typescript
export const PremiumBadge = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>PRO</Text>
    </View>
  );
};
```

**PremiumModal.tsx:**
```typescript
export const PremiumModal = ({ visible, onClose }) => {
  const handlePurchase = async (productId: string) => {
    // In-App Purchase 처리
  };

  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        <Text style={styles.title}>프리미엄으로 업그레이드</Text>

        <View style={styles.features}>
          <Feature icon="cloud" text="클라우드 백업" />
          <Feature icon="chart" text="고급 통계" />
          <Feature icon="palette" text="커스텀 테마" />
        </View>

        <View style={styles.pricing}>
          <PriceOption
            title="평생 사용"
            price="$9.99"
            subtitle="한 번만 결제"
            onPress={() => handlePurchase('premium_lifetime')}
          />
          <PriceOption
            title="월 구독"
            price="$2.99/월"
            subtitle="언제든 취소 가능"
            onPress={() => handlePurchase('premium_monthly')}
          />
        </View>
      </View>
    </Modal>
  );
};
```

### 3. 기능 게이팅

**통계 화면 예시:**
```typescript
export const StatisticsScreen = () => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremium();
  }, []);

  const checkPremium = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  return (
    <View>
      {/* 기본 통계 (무료) */}
      <BasicStats />

      {/* 고급 통계 (프리미엄) */}
      {isPremium ? (
        <AdvancedStats />
      ) : (
        <PremiumTeaser
          title="더 많은 통계를 보고 싶으신가요?"
          features={['1RM 계산', '장기 추세', '부위별 비교']}
          onUpgrade={() => showPremiumModal()}
        />
      )}
    </View>
  );
};
```

---

## 마케팅 전략

### 앱스토어 설명 업데이트

**프로모션 텍스트:**
```
무료로도 완벽합니다!
더 많은 기능이 필요하다면 프리미엄을 선택하세요.
평생 사용 $9.99
```

**앱 설명 추가:**
```
Set1은 운동 기록이 가장 쉬운 앱입니다.

무료 기능:
✓ 원탭 운동 기록
✓ 루틴 관리
✓ 기본 통계 및 PR
✓ 광고 없음
✓ 영구 무료

프리미엄 기능 ($9.99, 평생 사용):
• 클라우드 백업 및 동기화
• 1RM 계산 및 고급 통계
• 운동 가이드 영상
• 커스텀 테마
• 향후 모든 프리미엄 기능 포함

무료 버전만으로도 충분히 사용 가능합니다!
```

### 출시 프로모션

**Phase 1: 소프트 런치 (첫 100명)**
```
할인가: $4.99 (50% OFF)
기간: 2주
대상: 얼리어답터

메시지:
"얼리서포터 특별 할인!
평생 사용 $4.99 (원가 $9.99)
선착순 100명 한정"
```

**Phase 2: 정식 출시**
```
정가: $9.99
기간: 상시
할인: 특별 이벤트 시에만

메시지:
"평생 사용 단 $9.99
스타벅스 2잔 값으로 운동 기록 걱정 끝!"
```

### SNS 및 커뮤니티

**Reddit 전략:**
```
r/fitness, r/bodyweightfitness:
"무료 운동 기록 앱 만들었습니다
광고 없고, 기록이 제일 쉬워요
프리미엄 기능도 있지만 무료만으로 충분합니다"

→ 정직한 어필
→ 강요 없음
→ 가치 전달
```

---

## 성공 지표

### 1개월 목표 (프리미엄 출시 후)

```
- [ ] 프리미엄 기능 구현 완료
- [ ] 결제 시스템 안정화
- [ ] 전환율 1% 달성
- [ ] 첫 구매자 10명
```

### 3개월 목표

```
- [ ] 전환율 3% 달성
- [ ] 월 수익 $100+
- [ ] 프리미엄 사용자 50명+
- [ ] 환불율 5% 이하
```

### 6개월 목표

```
- [ ] 전환율 5% 달성
- [ ] 월 수익 $500+
- [ ] 프리미엄 사용자 200명+
- [ ] 추가 프리미엄 기능 2개 출시
```

---

## 주의사항

### 피해야 할 패턴

**1. 무료 기능 축소**
```
❌ "이제 루틴 3개까지만 무료"
❌ "통계는 프리미엄 전용"
❌ "기록은 7일만 보관"

→ 무료 기능은 절대 줄이지 말 것
→ 프리미엄은 "추가" 기능
```

**2. 성가신 팝업**
```
❌ 앱 실행 시마다 "프리미엄 가입하세요"
❌ 기능 사용 시마다 "이건 프리미엄 기능입니다"
❌ 강제 대기 후 "광고 보거나 프리미엄 가입"

→ 자연스러운 노출만
→ 1일 1회 이하
```

**3. 불명확한 가치**
```
❌ "프리미엄 기능 사용 가능"
❌ "더 많은 기능"

✅ "클라우드 백업으로 데이터 안전"
✅ "1RM 계산으로 과학적 운동"

→ 구체적인 가치 제시
```

### 지켜야 할 원칙

**1. 투명성**
```
✅ 무료/프리미엄 기능 명확히 구분
✅ 가격 명시
✅ 환불 정책 공개
```

**2. 공정성**
```
✅ 무료 사용자도 존중
✅ 프리미엄 가치에 합당한 가격
✅ 숨겨진 비용 없음
```

**3. 지속성**
```
✅ 일회성 구매 후 기능 유지
✅ 가격 인상 시 기존 사용자 보호
✅ 약속 지키기
```

---

## 최종 권장사항

### 즉시 실행

```
1. 아무것도 하지 마세요
2. 사용자 100명까지 성장에만 집중
3. 이 문서 참고하여 준비만
```

### 사용자 100명 달성 시

```
1. 클라우드 백업 구현 시작
2. 프리미엄 UI 준비
3. 사용자 의견 수렴
```

### 사용자 500명 달성 시

```
1. 프리미엄 출시
2. $4.99 얼리버드 할인
3. 피드백 수집 및 개선
```

### 사용자 1,000명 달성 시

```
1. 정가 $9.99 전환
2. 구독 옵션 추가 고려
3. 추가 프리미엄 기능 개발
```

---

**문서 최종 수정:** 2025-01-17
**다음 리뷰:** 사용자 100명 달성 시

---

## 부록: 빠른 참고

### 가격 정리

```
무료: 영구
일회성: $9.99 (평생)
월 구독: $2.99
연 구독: $24.99 (월 $2.08)
얼리버드: $4.99 (50% OFF, 선착순 100명)
```

### 프리미엄 기능 요약

```
핵심:
- 클라우드 백업

추가:
- 고급 통계 (1RM, 장기 추세)
- 운동 가이드 GIF
- 커스텀 테마

향후:
- AI 루틴 추천
- 운동 자세 분석
- 커뮤니티 기능
```

### 개발 체크리스트

```
Phase 1 (준비):
- [ ] premium.ts 구현
- [ ] PremiumModal 컴포넌트
- [ ] 기능 게이팅 적용

Phase 2 (기능):
- [ ] 클라우드 백업 구현
- [ ] 1RM 계산기
- [ ] 운동 GIF 추가

Phase 3 (결제):
- [ ] In-App Purchase 연동
- [ ] 영수증 검증
- [ ] 환불 처리

Phase 4 (출시):
- [ ] 프리미엄 활성화
- [ ] 마케팅 메시지 업데이트
- [ ] 사용자 피드백 수집
```
