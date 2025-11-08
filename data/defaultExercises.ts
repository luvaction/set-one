import { Exercise } from "@/models";

// prettier-ignore
const DEFAULT_EXERCISES_RECORD: Record<string, Omit<Exercise, "id" | "isCustom" | "createdAt" | "updatedAt">> = {
  regularPushup: { name: "일반 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  diamondPushup: { name: "다이아몬드 푸시업", category: "bodyweight", muscleGroups: ["삼두"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  widePushup: { name: "와이드 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  inclinePushup: { name: "인클라인 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  declinePushup: { name: "디클라인 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  regularPullup: { name: "풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 10 },
  chinup: { name: "친업", category: "bodyweight", muscleGroups: ["이두"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  assistedPullup: { name: "어시스트 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  bodyweightSquat: { name: "바디웨이트 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  jumpSquat: { name: "점프 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  pistolSquat: { name: "피스톨 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 3, defaultRepsMax: 8 },
  bulgarianSplitSquat: { name: "불가리안 스플릿 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  flatBenchPress: { name: "플랫 벤치프레스", category: "weights", muscleGroups: ["가슴"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  inclineBenchPress: { name: "인클라인 벤치프레스", category: "weights", muscleGroups: ["가슴 상부"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  declineBenchPress: { name: "디클라인 벤치프레스", category: "weights", muscleGroups: ["가슴 하부"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  dumbbellBenchPress: { name: "덤벨 벤치프레스", category: "weights", muscleGroups: ["가슴"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  conventionalDeadlift: { name: "컨벤셔널 데드리프트", category: "weights", muscleGroups: ["등/하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  sumoDeadlift: { name: "스모 데드리프트", category: "weights", muscleGroups: ["등/하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  romanianDeadlift: { name: "루마니안 데드리프트", category: "weights", muscleGroups: ["햄스트링"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  dumbbellFly: { name: "덤벨 플라이", category: "weights", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  barbellRow: { name: "바벨 로우", category: "weights", muscleGroups: ["등"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  dumbbellRow: { name: "덤벨 로우", category: "weights", muscleGroups: ["등"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  bodyweightDips: { name: "바디웨이트 딥스", category: "bodyweight", muscleGroups: ["삼두"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  assistedDips: { name: "어시스트 딥스", category: "bodyweight", muscleGroups: ["삼두"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  regularPlank: { name: "플랭크", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultDurationSeconds: 60 },
  sidePlank: { name: "사이드 플랭크", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultDurationSeconds: 45 },
  plankUpDown: { name: "플랭크 업다운", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  burpee: { name: "버피", category: "cardio", muscleGroups: ["전신"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  mountainClimber: { name: "마운틴클라이머", category: "cardio", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultDurationSeconds: 30 },
  jumpingJack: { name: "점핑잭", category: "cardio", muscleGroups: ["전신"], difficulty: "초급", defaultSets: 3, defaultDurationSeconds: 30 },
  highKnees: { name: "하이니", category: "cardio", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultDurationSeconds: 30 },
  hamstringStretch: { name: "햄스트링 스트레칭", category: "stretch", muscleGroups: ["햄스트링"], difficulty: "초급", defaultSets: 1, defaultDurationSeconds: 30 },
  shoulderStretch: { name: "어깨 스트레칭", category: "stretch", muscleGroups: ["어깨"], difficulty: "초급", defaultSets: 1, defaultDurationSeconds: 30 },
  chestStretch: { name: "가슴 스트레칭", category: "stretch", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 1, defaultDurationSeconds: 30 },

  // 푸시업 변형 (고급)
  archerPushup: { name: "아처 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 10 },
  supermanPushup: { name: "슈퍼맨 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8 },
  spidermanPushup: { name: "스파이더맨 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  oneArmPushup: { name: "원암 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 3, defaultRepsMax: 8 },
  typewriterPushup: { name: "타이핑 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  clapPushup: { name: "클랩 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 10 },
  pikePushup: { name: "파이크 푸시업", category: "bodyweight", muscleGroups: ["어깨"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  pseudoPlanchePushup: { name: "슈도 플란체 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 10 },
  hinduPushup: { name: "힌두 푸시업", category: "bodyweight", muscleGroups: ["전신"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 15 },
  kneePushup: { name: "무릎 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 20 },

  // 풀업/로우 변형
  australianPullup: { name: "오스트레일리안 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  wideGripPullup: { name: "와이드 그립 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 10 },
  commandoPullup: { name: "커맨도 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8 },
  lSitPullup: { name: "L-싯 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 3, defaultRepsMax: 8 },
  typewriterPullup: { name: "타이핑 풀업", category: "bodyweight", muscleGroups: ["등"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 4, defaultRepsMax: 8 },

  // 스쿼트/하체 변형
  sissySquat: { name: "시시 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  cossackSquat: { name: "코사크 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  walkingLunge: { name: "워킹 런지", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  reverseLunge: { name: "리버스 런지", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  sideLunge: { name: "사이드 런지", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  singleLegDeadlift: { name: "싱글 레그 데드리프트", category: "bodyweight", muscleGroups: ["햄스트링"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  gluteBridge: { name: "글루트 브릿지", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  singleLegGluteBridge: { name: "싱글 레그 글루트 브릿지", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  calfRaise: { name: "카프 레이즈", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 25 },
  singleLegCalfRaise: { name: "싱글 레그 카프 레이즈", category: "bodyweight", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 20 },

  // 코어 운동
  legRaises: { name: "레그 레이즈", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  hangingLegRaises: { name: "행잉 레그 레이즈", category: "bodyweight", muscleGroups: ["코어"], difficulty: "고급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  hangingKneeRaises: { name: "행잉 니 레이즈", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  russianTwist: { name: "러시안 트위스트", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  bicycleCrunches: { name: "바이시클 크런치", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 25 },
  vSit: { name: "V-싯", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  hollowBodyHold: { name: "할로우 바디 홀드", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultDurationSeconds: 30 },
  supermanHold: { name: "슈퍼맨 홀드", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultDurationSeconds: 30 },
  birdDog: { name: "버드독", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  deadBug: { name: "데드버그", category: "bodyweight", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },

  // 팔/어깨 운동
  benchDips: { name: "벤치 딥스", category: "bodyweight", muscleGroups: ["삼두"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  handstandHold: { name: "핸드스탠드 홀드", category: "bodyweight", muscleGroups: ["어깨"], difficulty: "고급", defaultSets: 3, defaultDurationSeconds: 20 },
  wallHandstand: { name: "월 핸드스탠드", category: "bodyweight", muscleGroups: ["어깨"], difficulty: "중급", defaultSets: 3, defaultDurationSeconds: 30 },
  pikeShoulderPress: { name: "파이크 숄더 프레스", category: "bodyweight", muscleGroups: ["어깨"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  tricepDips: { name: "트라이셉 딥스", category: "bodyweight", muscleGroups: ["삼두"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 15 },

  // 전신/복합/HIIT
  boxJump: { name: "박스 점프", category: "cardio", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  jumpLunge: { name: "점프 런지", category: "cardio", muscleGroups: ["하체"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  bearCrawl: { name: "베어 크롤", category: "cardio", muscleGroups: ["전신"], difficulty: "중급", defaultSets: 3, defaultDurationSeconds: 30 },
  crabWalk: { name: "크랩 워크", category: "cardio", muscleGroups: ["전신"], difficulty: "초급", defaultSets: 3, defaultDurationSeconds: 30 },
  inchworm: { name: "인치웜", category: "bodyweight", muscleGroups: ["전신"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  teasers: { name: "티저", category: "bodyweight", muscleGroups: ["코어"], difficulty: "중급", defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },

  // 책상/사무실 운동
  wallPushup: { name: "벽 푸시업", category: "bodyweight", muscleGroups: ["가슴"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  chairSquat: { name: "의자 스쿼트", category: "bodyweight", muscleGroups: ["하체"], difficulty: "초급", defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  neckStretch: { name: "목 스트레칭", category: "stretch", muscleGroups: ["목"], difficulty: "초급", defaultSets: 2, defaultDurationSeconds: 30 },
  seatedTwist: { name: "앉아서 몸통 비틀기", category: "stretch", muscleGroups: ["코어"], difficulty: "초급", defaultSets: 2, defaultRepsMin: 10, defaultRepsMax: 15 },
  wristCircles: { name: "손목 돌리기", category: "stretch", muscleGroups: ["팔"], difficulty: "초급", defaultSets: 2, defaultRepsMin: 10, defaultRepsMax: 10 },
};

export const DEFAULT_EXERCISES: Omit<Exercise, "createdAt" | "updatedAt">[] = Object.entries(DEFAULT_EXERCISES_RECORD).map(([id, exerciseData]) => ({
  id,
  ...exerciseData,
  isCustom: false,
}));