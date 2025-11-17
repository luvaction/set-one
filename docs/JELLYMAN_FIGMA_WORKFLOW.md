# 젤리맨 캐릭터 제작 가이드 - Figma 워크플로우

**작성일:** 2025-01-09
**대상:** 주말 프로젝트로 젤리맨 운동 GIF 제작
**목표:** AI 생성의 일관성 문제 해결 → Figma로 체계적 관리

---

## 📋 현재 상황

### 문제점
- **AI 생성 (Gemini) 사용 시:**
  - 매번 다른 스타일로 생성 (얼굴, 몸통, 선 두께 등 불일치)
  - 일관성 유지 어려움
  - 수정 요청 반복 → 시간 낭비
  - 프레임별로 캐릭터가 달라짐

### 해결책: Figma
젤리맨은 **단순한 라인 아트**(네온 그린 아웃라인)이므로 Figma로 관리하기 최적

---

## ✅ 왜 Figma인가?

### Figma의 장점
- ✅ **완벽한 일관성** - 같은 몸통/얼굴 복사해서 팔다리만 회전
- ✅ **빠른 프레임 작업** - 5분이면 새 포즈 3개 만들 수 있음
- ✅ **단순한 라인 아트에 최적** - 현재 젤리맨은 선만 있어서 피그마 최적
- ✅ **주말 프로젝트에 딱** - 한 번 그려놓으면 계속 재사용
- ✅ **무료** - 개인 프로젝트는 완전 무료
- ✅ **웹 기반** - 설치 불필요, 어디서나 작업 가능
- ✅ **버전 관리** - 자동 저장, 히스토리 기능

### vs AI 생성
```
AI 생성 (Gemini):
❌ 일관성 없음
❌ 수정 반복
❌ 시간 소요 큼
✅ 초기 아이디어용으로 좋음

Figma:
✅ 100% 일관성
✅ 한 번만 수정
✅ 빠른 프레임 제작
✅ 완전한 통제권
```

---

## 🎨 Figma로 옮기는 방법

### 1단계: Figma에서 트레이싱 (30분)

```
1. Figma 무료 계정 만들기
   → figma.com 접속
   → 구글 계정으로 가입

2. 새 파일 생성
   → "New design file" 클릭

3. jellyman.png를 드래그해서 업로드
   → assets/images/jellyman/jellyman.png
   → 캔버스에 드래그 앤 드롭

4. 이미지 위에 벡터로 따라 그리기
   - Pen tool (P) 또는 Line tool (L) 사용
   - Stroke 색상: #00FF88 (네온 그린)
   - Stroke width: 3-4px
   - Fill: none (투명)
   - Style: solid
```

**팁:**
- 투명도 30%로 낮춰서 원본 이미지 위에 그리기
- 완벽하지 않아도 OK! 젤리맨은 말랑말랑한 캐릭터니까

---

### 2단계: 컴포넌트화 (10분)

**몸 파트별로 레이어 분리:**

```
📁 Jellyman_Base
  ├─ 🟢 Head
  │   ├─ Circle (머리 윤곽)
  │   ├─ Eye_Left
  │   ├─ Eye_Right
  │   └─ Mouth
  ├─ 🟢 Body (몸통)
  ├─ 🟢 Arm_Left
  │   ├─ Upper (상완)
  │   └─ Lower (하완)
  ├─ 🟢 Arm_Right
  │   ├─ Upper
  │   └─ Lower
  ├─ 🟢 Leg_Left
  ├─ 🟢 Leg_Right
  ├─ 🟢 Exercise_Mat
  └─ 🟢 Bubble (말풍선, 필요 시)
```

**왜 분리하나?**
- 팔만 회전시킬 수 있음
- 다리만 각도 바꿀 수 있음
- 얼굴 표정만 바꿀 수 있음

---

### 3단계: 포즈 만들기 (5분/포즈)

```
1. 기본 포즈 전체 선택 (Cmd+A)
2. 복사 (Cmd+C) → 붙여넣기 (Cmd+V)
3. 새 프레임으로 이동
4. 팔만 선택해서 회전 (R 단축키)
5. 다리만 선택해서 각도 조정
6. 새 포즈 완성!
7. Export → PNG (500x500px)
```

**반복:**
- 운동 동작마다 3-5 프레임 제작
- 각 프레임 PNG 내보내기
- ImageMagick으로 GIF 생성

---

## 💪 실전 예시

### 예시 1: 푸시업 3프레임 만들기

```
Frame 1: 팔 펴진 상태 (플랭크)
- Arm_Left, Arm_Right → 각도 0도
- Body → 바닥과 평행

Frame 2: 팔 90도 굽힘 (중간)
- Arm_Left.Upper → 45도 회전
- Arm_Right.Upper → 45도 회전

Frame 3: 팔 완전히 굽힘 (최하단)
- Arm_Left.Upper → 90도 회전
- Arm_Right.Upper → 90도 회전
- Body → 바닥에 가깝게
```

**GIF 생성:**
```bash
cd assets/images/jellyman/exercises/
magick -delay 40 -loop 0 pushup_1.png pushup_2.png pushup_3.png pushup_2.png pushup_1.png pushup.gif
```

---

### 예시 2: 스쿼트 3프레임

```
Frame 1: 서있는 자세
- Leg_Left, Leg_Right → 직선
- Body → 높이 최대

Frame 2: 무릎 살짝 굽힘
- Leg_Left.Upper → 30도
- Body → 중간 높이

Frame 3: 완전히 앉은 자세 (현재 jellyman.png)
- Leg_Left.Upper → 90도
- Body → 낮은 위치
```

---

### 예시 3: 성공 포즈 (정적 이미지)

```
Frame 1: 엄지 척!
- Arm_Right → 위로 들어 올림
- Hand → 엄지만 펼침
- Mouth → 큰 미소
- (작은 별 3개 주변에 배치)
```

---

## 📚 Figma 학습 리소스

### 기본만 알면 됨 (2시간)

**필수 도구:**
1. **Pen tool (P)** - 선 그리기
2. **Selection tool (V)** - 이동, 회전
3. **Layers panel** - 레이어 관리
4. **Export** - PNG 내보내기

**알면 좋은 것:**
- Frame tool (F) - 프레임별 구성
- Group (Cmd+G) - 여러 레이어 묶기
- Duplicate (Cmd+D) - 빠른 복사
- Rotate (R) - 회전 모드

---

### 추천 튜토리얼

**YouTube (무료):**
- "Figma for beginners" (10분짜리)
- "Figma Pen tool tutorial" (5분)

**Figma 공식 (무료):**
- Getting started guide
- figma.com/community (템플릿 참고)

**시간 없으면:**
- YouTube 10분 영상 1개만 보고 바로 시작
- 하면서 배우는 게 제일 빠름

---

## 🗓️ 제안 워크플로우

### 이번 주말 (2-3시간)

```
✅ Day 1 (1.5시간)
- [ ] Figma 계정 만들기 (5분)
- [ ] 기본 튜토리얼 시청 (10분)
- [ ] jellyman.png 트레이싱 (30분)
- [ ] 컴포넌트화 (레이어 분리) (30분)
- [ ] 첫 포즈 테스트 (15분)

✅ Day 2 (1시간)
- [ ] 푸시업 3프레임 만들기 (30분)
- [ ] PNG 내보내기 (5분)
- [ ] GIF 생성 (5분)
- [ ] 앱에 적용 테스트 (20분)
```

---

### 다음 주말부터 (주 1시간)

```
매주 토요일 30분:
- [ ] 새 운동 포즈 3개 추가
  - 스쿼트
  - 플랭크
  - 점핑잭
  - 런지
  - 등등

매주 일요일 30분:
- [ ] GIF 생성
- [ ] 앱에 적용
- [ ] 테스트
```

**3개월 후:**
- 36개 운동 GIF 완성
- 체계적인 라이브러리 구축
- 일관된 캐릭터 스타일

---

## 🚀 즉시 시작하기

### 지금 할 수 있는 것 (10분)

**Step 1: 계정 만들기**
```
1. figma.com 접속
2. "Get started for free" 클릭
3. 구글 계정으로 가입
```

**Step 2: 첫 파일 생성**
```
1. "New design file" 클릭
2. 파일명: "Jellyman_Character"
3. jellyman.png 드래그 업로드
```

**Step 3: 첫 선 그려보기**
```
1. Pen tool (P) 선택
2. 클릭 → 드래그 → 클릭 (곡선 그리기)
3. Stroke: #00FF88
4. Stroke width: 3
```

**완료!** 이제 트레이싱 시작하면 됨

---

## 🛠️ 기술 스택

### 현재 워크플로우

```
1. Figma (디자인)
   ↓ Export PNG

2. PNG 파일들 (프레임)
   ↓ ImageMagick

3. GIF 애니메이션
   ↓ React Native Image

4. 앱에 표시
```

### GIF 생성 자동화 스크립트

**파일: `scripts/generate_exercise_gif.sh`**

```bash
#!/bin/bash

# Usage: ./generate_exercise_gif.sh pushup 40
# $1: exercise name
# $2: delay (optional, default 50)

EXERCISE=$1
DELAY=${2:-50}
INPUT_DIR="assets/images/jellyman/exercises/${EXERCISE}"
OUTPUT_FILE="assets/images/jellyman/exercises/${EXERCISE}.gif"

if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Directory $INPUT_DIR not found"
  exit 1
fi

cd "$INPUT_DIR"
magick -delay $DELAY -loop 0 *.png "../${EXERCISE}.gif"

echo "✅ Created: $OUTPUT_FILE"
```

**사용법:**
```bash
chmod +x scripts/generate_exercise_gif.sh
./scripts/generate_exercise_gif.sh pushup 40
./scripts/generate_exercise_gif.sh squat 50
```

---

## 📐 디자인 가이드라인

### 일관성 유지 규칙

**색상:**
- Stroke: #00FF88 (네온 그린)
- Background: #000000 (검정)
- 다른 색상 사용 금지

**선 두께:**
- 캐릭터 아웃라인: 3-4px
- 얼굴 디테일 (눈, 입): 2-3px
- 운동 매트: 3px

**크기:**
- Export: 500x500px (정사각형)
- 캐릭터: 캔버스의 60-70%
- 여백: 적당히 유지 (너무 빡빡하지 않게)

**표정:**
- 기본: 미소 (편안하고 친근한 느낌)
- 운동 중: 약간 힘든 표정 (눈썹 살짝 찡그림)
- 완료: 큰 미소 + 반짝이

---

## 💡 팁 & 트릭

### Figma 단축키 (필수만)

```
V - 선택 도구
P - 펜 도구
L - 라인 도구
F - 프레임 도구
R - 회전 모드

Cmd+D - 복제
Cmd+G - 그룹
Cmd+/ - 빠른 검색

Shift+드래그 - 비율 유지
Alt+드래그 - 중심점 기준 변형
```

### 시간 절약 팁

1. **컴포넌트 활용**
   - 얼굴은 한 번만 그리고 재사용
   - 팔/다리 좌우 대칭 복사

2. **플러그인 사용**
   - "Figmotion" - 애니메이션 미리보기
   - "Remove BG" - 배경 제거 (필요 시)

3. **Auto Layout 활용**
   - 여러 프레임 자동 정렬
   - 간격 일정하게 유지

---

## 🎯 최종 목표

### 3개월 후 완성 모습

```
assets/images/jellyman/
├── jellyman.png (기본 포즈)
├── jellyman_handsup.png (손 올림)
├── jellyman_wave.gif (손 흔들기)
└── exercises/
    ├── pushup.gif
    ├── squat.gif
    ├── plank.gif
    ├── jumping_jack.gif
    ├── lunge.gif
    ├── burpee.gif
    ├── mountain_climber.gif
    ├── sit_up.gif
    └── ... (30+ exercises)
```

### 앱 적용 계획

**Phase 1 (1개월):**
- [ ] 로딩 스크린에 jellyman_wave.gif
- [ ] 온보딩에 기본 포즈들
- [ ] Empty State에 젤리맨

**Phase 2 (2개월):**
- [ ] 운동 설명에 GIF 추가 (3개/주)
- [ ] 상위 10개 운동 우선

**Phase 3 (3개월):**
- [ ] 모든 추천 루틴에 GIF
- [ ] 앱 아이콘 업데이트
- [ ] 앱스토어 스크린샷 리뉴얼

---

## ❓ FAQ

### Q: Figma 무료로 충분한가요?
**A:** 네! 개인 프로젝트는 무료 플랜으로 충분합니다.

### Q: 그림 못 그리는데 가능한가요?
**A:** 네! 단순한 선만 따라 그리면 됩니다. 예술 작품이 아니라 귀여운 캐릭터가 목표입니다.

### Q: 시간 얼마나 걸리나요?
**A:**
- 초기 셋업: 2-3시간
- 이후 새 포즈: 5-10분/개

### Q: iPad에서도 가능한가요?
**A:** 네! Figma는 iPad 앱도 있습니다. 애플 펜슬 사용 가능.

### Q: AI 생성은 완전히 버리나요?
**A:** 아니요! 초기 아이디어나 영감용으로는 여전히 유용합니다. 다만 최종 작업은 Figma로.

---

## 📞 도움이 필요할 때

### 막히는 부분이 있다면:

1. **Figma 기본 사용법**
   - YouTube "Figma tutorial" 검색
   - Figma 공식 Help Center

2. **GIF 생성 문제**
   - ImageMagick 명령어 문의
   - ezgif.com 온라인 도구 사용

3. **디자인 조언**
   - Figma Community에서 비슷한 캐릭터 참고
   - 다른 운동 앱들의 일러스트 레퍼런스

---

## 🎉 시작하기

**Ready?** 이번 주말에 시작해보세요!

1. ☕ 커피 한 잔 준비
2. 🎵 좋아하는 음악 틀기
3. 💻 Figma 열기
4. 🎨 첫 선 그리기

"나도 하는데, 너도 할 수 있어! 중요한 건 완벽한 자세가 아니라, 오늘 '원탭'으로 시작하는 용기야!"
- 젤리맨

---

**문서 최종 수정:** 2025-01-09
**다음 업데이트:** 첫 Figma 작업 완료 후
