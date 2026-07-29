# SKILL.md — AI-CXP 데모 상세 구현 가이드

CLAUDE.md의 목표/스코프를 전제로 한 실행 문서. 5대 모듈 + 공통 인프라 순서로 기술.

---

## 0. 전체 아키텍처

```
[챗봇 UI / 콜봇 STT-TTS]
        │  WebSocket / REST
        ▼
   [Conversation Gateway] (NestJS)
        │
        ├─► [Intent/Entity Engine] ── 학습데이터 DB
        │
        ├─► [RAG Orchestrator] ── Vector DB ── 환각검증 모듈
        │
        ├─► [CRM Service] ── PostgreSQL(CRM)
        │
        └─► [Commerce Service] ── PostgreSQL(Commerce)
```

- 모든 서비스는 NestJS 모듈로 분리하되 단일 모노레포(Nx 또는 npm workspaces)로 관리
- 프론트는 React+Vite 단일 SPA, 라우트만 분리 (챗봇/콜봇 콘솔, CRM, 커머스, AI 학습, 환각검증 대시보드)
- `npm ci --ignore-scripts` 원칙 유지, 설치는 쉘 스크립트로 격리

---

## 1. 챗봇/콜봇 모듈

### 1.1 대화 엔진 공통화
- 챗봇(텍스트)과 콜봇(음성)이 동일한 `ConversationSession` 엔티티와 `MessageHandler` 파이프라인 공유
- 콜봇은 `STT → 텍스트 정규화 → 동일 파이프라인 → TTS` 구조로 텍스트 챗봇 위에 얹는 방식
- STT/TTS는 오픈소스(Whisper 계열, Coqui 등) 또는 브라우저 Web Speech API로 데모 대체

### 1.2 데이터 모델
```
ConversationSession { id, userId, channel(chat|call), startedAt, endedAt, status }
Message { id, sessionId, role(user|bot|agent), text, intent, entities[], createdAt }
```

### 1.3 처리 플로우
1. 사용자 발화 수신 (텍스트 또는 STT 결과)
2. Intent/Entity Engine 호출 → 의도 + 개체 추출
3. 의도에 따라 CRM 조회 / 커머스 액션 / RAG 질의 중 라우팅
4. 응답 생성 → (콜봇이면) TTS 변환 → 클라이언트 전송
5. 상담사 이관 조건(신뢰도 낮음, 명시적 요청) 감지 시 CRM의 상담이력에 핸드오프 기록

### 1.4 테스트
- 시나리오 테스트: "상품 문의 → 재고확인 → 주문" 등 5개 이상의 E2E 시나리오 스크립트화
- 콜봇은 음성 없이도 텍스트 입력으로 동일 파이프라인 검증 가능하도록 Mock STT 제공

---

## 2. CRM (영업관리/영업지원) 모듈

### 2.1 핵심 엔티티
```
Customer { id, name, phone, email, tier, createdAt }
Lead { id, customerId, source, stage(신규|상담중|제안|계약|이탈), owner, nextAction, updatedAt }
Activity { id, customerId, type(call|chat|memo|meeting), content, createdAt, relatedSessionId }
```

### 2.2 기능
- 고객/리드 목록, 상세, 영업 파이프라인(칸반형 stage 뷰)
- 챗봇/콜봇 세션이 자동으로 `Activity`에 기록 (상담이력 자동 적재)
- "다음 액션 추천"은 룰 기반(스테이지별 기본 액션) + 데모용 AI 코멘트로 단순화

### 2.3 챗봇 연동 지점
- 인텐트가 "계정조회/주문조회/상담이력" 계열이면 CRM Service 직접 호출
- 상담 종료 시 세션 요약을 Activity로 자동 저장

---

## 3. E-커머스 모듈

### 3.1 핵심 엔티티
```
Product { id, name, category, price, stock, description }
Order { id, customerId, items[], status(생성|결제완료|배송중|완료), createdAt }
```

### 3.2 기능
- 상품 목록/검색/재고조회 API
- 주문 생성 Mock (실 PG 연동 없이 상태값만 전이)
- 챗봇에서 "이 상품 재고 있어?", "이걸로 주문해줘" 같은 발화 → Product/Order 서비스 직접 호출

### 3.3 챗봇 연동 지점
- 인텐트 "상품문의/재고확인/주문요청"이 Commerce Service로 라우팅
- 주문 생성 결과를 CRM Activity에도 동시 기록 (영업-커머스 데이터 연결 시연 포인트)

---

## 4. AI 인텐트/엔티티 학습 모듈

### 4.1 구조
- 인텐트 분류기: 경량 분류 모델(sLLM 프롬프트 기반 또는 임베딩+분류기 하이브리드)
- 엔티티 추출: 정규식+사전 기반 + sLLM 보조 추출 혼합 (데모 수준에서는 정확도보다 설명가능성 우선)

### 4.2 데이터 모델
```
IntentSample { id, text, intent, entities[], verified(bool), createdAt }
EntityDictionary { id, entityType, values[] }
```

### 4.3 학습 관리 화면
- 신규 발화 로그 → "미분류/저신뢰" 발화 큐 제공
- 운영자가 인텐트/엔티티 태깅 후 "재학습" 버튼 → 배치 재학습 트리거 (데모에서는 파이프라인 실행 로그로 시연)
- 인텐트별 정확도, 발화량 추이 대시보드

### 4.4 테스트
- 학습셋 20~30개 인텐트 기준 confusion matrix 형태로 정확도 리포트
- 신규 발화 추가 → 재학습 → 정확도 변화 전/후 비교 화면 제공 (데모 임팩트 포인트)

---

## 5. RAG/sLLM 환각검증 모듈

### 5.1 목적
챗봇/콜봇이 RAG로 생성한 답변이 근거 문서에 실제로 기반했는지 자동+수동으로 검증하고,
그 결과를 화면에 노출해 "신뢰 가능한 AI"임을 시연.

### 5.2 파이프라인
```
질의 → Vector DB 검색(top-k 문서) → sLLM 답변 생성
     → [환각검증기] : 답변 문장 단위로 근거 문서와의 일치도 스코어링
     → 결과: 신뢰(근거 일치) / 주의(부분 일치) / 오류(근거 없음)
```

### 5.3 환각검증기 구현 방식 (데모 수준)
- 1차: 답변 문장 ↔ 검색된 문서 chunk 간 임베딩 유사도 스코어
- 2차: sLLM에 "이 답변이 아래 근거로 뒷받침되는가"를 재질의(self-check) 하는 검증 프롬프트
- 최종 스코어 = 두 방식 가중 평균, 임계값별로 신뢰/주의/오류 라벨링

### 5.4 데이터 모델
```
RagQuery { id, question, retrievedDocs[], answer, hallucinationScore, label, createdAt }
VerificationTestCase { id, question, expectedFact, category, lastResult }
```

### 5.5 검증 테스트 화면 (핵심 데모 화면)
- 좌: 질문/답변 표시, 답변 문장별로 근거 하이라이트(색상: 초록=일치, 노랑=부분, 빨강=근거없음)
- 우: 검색된 원본 문서 chunk 나열, 답변과 매칭된 부분 하이라이트
- 하단: 테스트셋(최소 30문항) 일괄 실행 → 정확도/환각률/카테고리별 실패 유형 리포트

### 5.6 테스트 진행 방식
1. 사실기반 질문 세트(정답이 명확한 것) 구성
2. 의도적으로 근거 문서에 없는 내용을 유도하는 "함정 질문" 세트 포함 (환각 유발 테스트)
3. 자동 스코어링 결과와 사람 검수 결과를 비교해 검증기 자체의 정확도도 별도 리포트

---

## 6. 공통 인프라 / 배포

- 로컬/데모 환경: Docker Compose로 PostgreSQL, Redis, Vector DB(예: Qdrant/Chroma) 구성
- 인증: 데모용 간단 JWT (실서비스 수준 보안은 스코프 밖, 단 `npm ci --ignore-scripts` 등 기본 보안 원칙은 준수)
- 배포 데모: 단일 서버(Nest 백엔드 + Vite 빌드 결과 정적 서빙) 구성으로 충분

## 7. 테스트 전략 요약
| 모듈 | 테스트 방식 |
|---|---|
| 챗봇/콜봇 | E2E 시나리오 스크립트 5개+ |
| CRM | 세션→Activity 자동 기록 검증 |
| 커머스 | 주문 상태 전이 단위 테스트 |
| 인텐트/엔티티 | confusion matrix, 재학습 전/후 비교 |
| RAG 환각검증 | 테스트셋 30문항, 정확도/환각률 리포트 |

## 8. 스프린트 분리 제안 (Sprint Plan은 별도 문서로)
1. Sprint 1: 공통 인프라 + 챗봇 기본 대화
2. Sprint 2: CRM 연동 + 커머스 연동
3. Sprint 3: 인텐트/엔티티 학습 화면
4. Sprint 4: RAG 파이프라인 + 환각검증 화면
5. Sprint 5: 콜봇(STT/TTS) 통합 + 전체 E2E 데모 리허설
