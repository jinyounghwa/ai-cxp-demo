// AI-CXP 공통 타입 정의
// SKILL.md의 데이터 모델(1.2, 2.1, 3.1, 4.2, 5.4)을 기준으로 작성

// ===== 공통 =====
export type Channel = 'chat' | 'call';
export type MessageRole = 'user' | 'bot' | 'agent';

export interface Entity {
  type: string; // product, quantity, phone, order_id ...
  value: string;
  raw: string;
}

export interface IntentResult {
  intent: string;
  confidence: number; // 0~1
  scores: Record<string, number>;
  entities: Entity[];
}

// ===== 1. 챗봇/콜봇 (SKILL 1.2) =====
export interface ConversationSession {
  id: string;
  userId: string;
  customerName: string;
  channel: Channel;
  startedAt: number;
  endedAt: number | null;
  status: 'active' | 'transferred' | 'ended';
  messageCount: number;
}

export interface BotMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  text: string;
  intent?: string;
  confidence?: number;
  entities?: Entity[];
  rag?: RagAnswer;
  createdAt: number;
}

// ===== 2. CRM (SKILL 2.1) =====
export type LeadStage = '신규' | '상담중' | '제안' | '계약' | '이탈';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'VIP' | 'GOLD' | 'SILVER' | '일반';
  createdAt: number;
  totalOrders: number;
  totalSpent: number;
}

export interface Lead {
  id: string;
  customerId: string;
  source: string;
  stage: LeadStage;
  owner: string;
  nextAction: string;
  value: number;
  updatedAt: number;
}

export type ActivityType = 'call' | 'chat' | 'memo' | 'meeting' | 'order';

export interface Activity {
  id: string;
  customerId: string;
  type: ActivityType;
  content: string;
  createdAt: number;
  relatedSessionId?: string;
}

// ===== 3. E-커머스 (SKILL 3.1) =====
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  tags: string[];
  aliases: string[]; // 챗봇 매칭용 별칭
}

export type OrderStatus = '생성' | '결제완료' | '배송중' | '완료' | '취소';

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}

// ===== 4. AI 인텐트/엔티티 학습 (SKILL 4.2) =====
export interface IntentSample {
  id: string;
  text: string;
  intent: string;
  entities: Entity[];
  verified: boolean;
  source: 'seed' | 'chat' | 'manual';
  createdAt: number;
}

export interface EntityDictionaryEntry {
  entityType: string;
  label: string;
  values: string[];
}

export interface IntentDef {
  id: string;
  name: string;
  label: string;
  category: string;
  keywords: string[];
  samples: string[];
  response: string;
}

// ===== 5. RAG / 환각검증 (SKILL 5.4) =====
export type HallucinationLabel = '신뢰' | '주의' | '오류';

export interface RagDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
}

export interface SentenceSpan {
  text: string;
  score: number; // 0~1 근거 일치도
  matchedDocId?: string;
  matchedSnippet?: string;
}

export interface RagAnswer {
  question: string;
  answer: string;
  retrievedDocs: RagDoc[];
  sentences: SentenceSpan[];
  embeddingScore: number; // 1차: 임베딩 유사도
  selfCheckScore: number; // 2차: self-check
  hallucinationScore: number; // 가중 평균
  label: HallucinationLabel;
}

export interface VerificationTestCase {
  id: string;
  question: string;
  expectedFact: string;
  category: string;
  isTrap: boolean; // 함정 질문(환각 유도)
}
