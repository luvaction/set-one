# Set1 - 운동 루틴 관리 앱

Set1부터 시작하는 나만의 운동 루틴! 맨몸운동부터 웨이트 트레이닝까지 체계적으로 관리할 수 있는 React Native 운동 앱입니다.

## 🏋️ 주요 기능

### 📚 운동 라이브러리
- **세분화된 운동 분류**: 푸시업 → 일반/다이아몬드/와이드/인클라인 등
- **트리 구조 UI**: 맨몸운동/웨이트별 카테고리 접기/펼치기
- **상세 정보**: 타겟 근육, 난이도, 기본 세트/횟수 제공
- **직관적 추가**: + 버튼으로 바로 루틴에 운동 추가

### 🎯 추천 루틴
- **목적별 분류**: 초보자, 근력증가, 다이어트, 유연성
- **다양한 루틴**: 맨몸운동부터 HIIT까지
- **즉시 시작**: 추천 루틴으로 바로 운동 시작 가능

### ⚙️ 나만의 루틴 만들기
- **CRUD 기능**: 루틴 생성/수정/삭제
- **실시간 편집**: 운동별 세트/횟수 조정
- **순서 변경**: 드래그 앤 드롭으로 운동 순서 조정
- **로컬 저장**: 내 루틴들 안전하게 보관

### 💪 운동 실행
- **진행률 표시**: 현재 세트/전체 세트 확인
- **타이머 기능**: 휴식 시간 관리
- **기록 저장**: 운동 완료 후 자동 기록

### 📊 운동 기록
- **운동 히스토리**: 완료한 운동들 기록 관리
- **통계 확인**: 주간/월간 운동 현황
- **성장 추적**: 운동량 증가 추이 확인

## 🛠️ 기술 스택

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Icons**: Ionicons
- **Storage**: AsyncStorage (예정)
- **State Management**: React Hooks

## 📱 화면 구성

- **홈**: 빠른 시작, 오늘의 통계, 추천 루틴
- **루틴**: 운동 라이브러리, 추천 루틴, 내 루틴 관리
- **운동**: 실제 운동 진행 화면
- **기록**: 운동 히스토리 및 통계

## 🚀 시작하기

### 필수 요구사항
- Node.js 16+
- Expo CLI
- React Native 개발 환경

### 설치 및 실행
```bash
# 의존성 설치
npm install

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹에서 실행
npm run web
```

### 개발 도구
```bash
# 린트 검사
npm run lint

# 프로젝트 리셋
npm run reset-project
```

## 📋 개발 상태

### ✅ 완료된 기능
- [x] 기본 UI/UX 디자인
- [x] 네비게이션 구조
- [x] 운동 라이브러리 UI
- [x] 루틴 빌더 UI
- [x] SafeArea 전역 적용

### 🚧 개발 중인 기능
- [ ] 운동 추가/편집 기능
- [ ] 데이터 영속성 (AsyncStorage)
- [ ] 검색 및 필터링
- [ ] 루틴 실행 기능
- [ ] 운동 기록 관리

### 📅 향후 계획
- [ ] 사용자 설정 (단위, 테마 등)
- [ ] 운동 영상/이미지 가이드
- [ ] 소셜 기능 (루틴 공유)
- [ ] 푸시 알림 (운동 리마인더)
- [ ] 웨어러블 연동

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: 브랜드 메인 컬러
- **Background**: 다크 테마 기반
- **Surface**: 카드/모달 배경
- **Text**: 계층별 텍스트 컬러

### 타이포그래피
- **제목**: 20-28px, Bold
- **부제목**: 16-18px, SemiBold
- **본문**: 14-16px, Regular
- **캡션**: 12px, Regular

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 언제든 연락주세요!

---

**Set1부터 시작하는 당신의 운동 여정을 응원합니다! 💪**
