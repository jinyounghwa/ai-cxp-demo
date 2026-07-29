# AI-CXP · AI 통합 고객경험 플랫폼 데모

> **"대화 한 번으로 상담부터 구매까지 — 검증된 AI로 신뢰를 더하다"**

CLAUDE.md / SKILL.md에 정의된 5대 모듈(챗봇·콜봇, CRM, 커머스, 인텐트 학습, RAG 환각검증)을
End-to-End로 시연하는 웹 데모입니다. 외부 서버/DB 없이 **단일 React SPA**로 동작하며,
백엔드 로직(인텐트 분류·RAG 파이프라인·환각검증·CRM/커머스 액션)은 TypeScript 모듈로 시뮬레이션합니다.

## 🚀 실행

```bash
npm install --ignore-scripts      # SKILL.md 보안 원칙
npm run dev                       # http://localhost:5173
```

빌드: `npm run build` → `npm run preview`

## 🧭 데모 시연 시나리오 (성공기준 5종)

| # | 기준 | 경로 |
|---|------|------|
| 1 | 챗봇 1회 대화로 CRM조회 → 추천 → 주문 | 챗봇 콘솔에서 순서대로: `내 정보 보여줘` → `상품 추천해줘` → `헤드폰 1개 주문할게` |
| 2 | 콜봇 음성입력 → 인텐트 분류 → 액션 | 콜봇에서 📞 통화 시작 → 🎙️ 마이스로 말하기 (미지원 브라우저는 텍스트 입력) |
| 3 | 신규 발화 → 학습데이터 반영 → 재학습 | 인텘트/엔티티 학습 → 미검증 큐에서 검증 → 🔄 재학습 트리거 |
| 4 | RAG 답변 환각여부 표시 + 근거 하이라이트 | RAG 환각검증 → 단일 질의 실행 (문장별 초록/노랑/빨강 하이라이트) |
| 5 | 환각검증 테스트셋 30문항 리포트 | RAG 환각검증 → ▶ 전체 실행 (정확도/환각률/카테고리) |

**환각 데모 포인트**: RAG 화면 우상단 모드 토글
- `안전(거부가능)`: 근거 부족 시 "안내 불가"로 거부 → **환각률 0%**
- `강제생성(환각위험)`: 무리하게 답변 생성 → 함정 질문에서 **환각(오류) 발생**

## 🏗️ 구조

```
src/
├── types/index.ts              # 5대 모듈 엔티티 (SKILL 데이터모델 기준)
├── data/                       # 더미 데이터 + 학습셋 + RAG 문서 + 검증테스트셋(30문항)
│   ├── customers.ts  products.ts  intents.ts  ragDocs.ts
├── lib/                        # "백엔드" 로직 (React-free, 테스트 가능)
│   ├── store.ts                # 경량 observable store (useSyncExternalStore)
│   ├── hooks.ts                # React 바인딩 (useStore)
│   ├── intentEngine.ts         # 인텐트 분류 + 엔티티 추출 + 평가(confusion matrix)
│   ├── ragOrchestrator.ts      # RAG 검색 → 답변생성 → 환각검증(임베딩+self-check)
│   ├── conversationEngine.ts   # 인텐트→CRM/커머스/RAG 라우팅 파이프라인
│   ├── crmStore.ts  commerceStore.ts  trainingStore.ts  chatStore.ts
├── components/                 # Layout, Sidebar, PageHeader
└── pages/                      # 7개 화면 (대시보드/챗봇/콜봇/CRM/커머스/학습/RAG검증)
```

## 🧪 로직 검증

`src/lib`은 React 의존성이 없어 node로 직접 검증 가능합니다:

```bash
npx esbuild <(echo '...테스트코드...') --bundle --format=esm --platform=node --alias:@=./src | node
```

검증 항목: 인텐트 분류 정확도, E2E 주문 플로우, Activity 자동 적재, RAG 신뢰 판정, 함정 질문 안전거부, 30문항 환각률 0%.

## 📌 데모 범위 (CLAUDE.md 스코프 준수)
- 실결제/실통화 연동 ❌ (Mock) · 실제 개인정보 ❌ (더미)
- STT/TTS: 브라우저 Web Speech API, 미지원 시 텍스트 입력(Mock) 폴백
- RAG/sLLM: 임베딩·self-check를 토큰 오버랩 기반으로 모사 (오픈소스 엔진 교체 지점 명확)
