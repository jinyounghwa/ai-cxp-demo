// 콜봇 데모용 통화 이력 mock 데이터 (통화기록/응답분석 패널을 빈 화면 없이 바로 보여주기 위함)
import { runRag } from '@/lib/ragOrchestrator';
import { seedCustomers } from './customers';
import { seedProducts } from './products';
import type { ConversationSession, BotMessage } from '@/types';

const custVip = seedCustomers.find((c) => c.id === 'C-1001')!; // 김지훈 VIP
const custGold = seedCustomers.find((c) => c.id === 'C-1002')!; // 박서연 GOLD
const custVip2 = seedCustomers.find((c) => c.id === 'C-1004')!; // 최민아 VIP

const headphone = seedProducts.find((p) => p.id === 'P-501')!; // 노이즈캔슬링 헤드폰 X1

const now = Date.now();
const H = 3600000;

// ── 통화 1: 상품 재고 확인 → 주문 완료 (종료) ──
const CALL_1_ID = 'CALL-9001';
const call1Start = now - 3 * H;
const call1: ConversationSession = {
  id: CALL_1_ID, userId: custVip.id, customerName: custVip.name, channel: 'call',
  startedAt: call1Start, endedAt: call1Start + 95000, status: 'ended', messageCount: 6,
};
const call1Msgs: BotMessage[] = [
  { id: 'CM-9001', sessionId: CALL_1_ID, role: 'bot', text: `안녕하세요 ${custVip.name}님, AI-CXP 콜봇에 연결되었습니다. 말씀해 주시면 상담을 도와드리겠습니다.`, createdAt: call1Start, intent: 'greeting', confidence: 1 },
  { id: 'CM-9002', sessionId: CALL_1_ID, role: 'user', text: '헤드폰 재고 있어?', createdAt: call1Start + 12000 },
  { id: 'CM-9003', sessionId: CALL_1_ID, role: 'bot', text: `『${headphone.name}』 현재 ${headphone.stock}개 재고가 있습니다. 😊`, createdAt: call1Start + 14000, intent: 'stock_check', confidence: 0.91, entities: [{ type: 'product', value: '헤드폰', raw: '헤드폰' }] },
  { id: 'CM-9004', sessionId: CALL_1_ID, role: 'user', text: '그럼 1개 주문할게', createdAt: call1Start + 45000 },
  { id: 'CM-9005', sessionId: CALL_1_ID, role: 'bot', text: `${custVip.name}님, 『${headphone.name}』 1개 주문이 완료되었습니다. ✅\n주문번호: ORD-5033 / 결제금액: ${headphone.price.toLocaleString()}원\n영업 Activity에도 자동 기록되었습니다.`, createdAt: call1Start + 48000, intent: 'order_request', confidence: 0.94, entities: [{ type: 'product', value: '헤드폰', raw: '헤드폰' }, { type: 'quantity', value: '1', raw: '1개' }] },
  { id: 'CM-9006', sessionId: CALL_1_ID, role: 'user', text: '감사합니다', createdAt: call1Start + 90000 },
];

// ── 통화 2: 결제 오류 불만 접수 → 상담사 이관 ──
const CALL_2_ID = 'CALL-9002';
const call2Start = now - 26 * H;
const call2: ConversationSession = {
  id: CALL_2_ID, userId: custGold.id, customerName: custGold.name, channel: 'call',
  startedAt: call2Start, endedAt: call2Start + 78000, status: 'transferred', messageCount: 5,
};
const call2Msgs: BotMessage[] = [
  { id: 'CM-9101', sessionId: CALL_2_ID, role: 'bot', text: `안녕하세요 ${custGold.name}님, AI-CXP 콜봇에 연결되었습니다. 말씀해 주시면 상담을 도와드리겠습니다.`, createdAt: call2Start, intent: 'greeting', confidence: 1 },
  { id: 'CM-9102', sessionId: CALL_2_ID, role: 'user', text: '결제가 계속 오류나요 너무 화나네요', createdAt: call2Start + 15000 },
  { id: 'CM-9103', sessionId: CALL_2_ID, role: 'bot', text: '불편을 드려 죄송합니다. 접수해 드리고 담당자가 신속히 확인하겠습니다. 🙏 (민원 접수 완료)', createdAt: call2Start + 17000, intent: 'complaint', confidence: 0.68, entities: [] },
  { id: 'CM-9104', sessionId: CALL_2_ID, role: 'user', text: '직접 상담사랑 얘기하고 싶어요', createdAt: call2Start + 40000 },
  { id: 'CM-9105', sessionId: CALL_2_ID, role: 'bot', text: '상담사에게 연결해 드리겠습니다. 잠시만 기다려 주세요. 🔄 (상담 이력이 자동 전달됩니다)', createdAt: call2Start + 42000, intent: 'transfer_agent', confidence: 0.91, entities: [] },
];

// ── 통화 3 (최신): 교환/반품 정책 문의 → RAG 환각검증 결과 시연 (종료) ──
const CALL_3_ID = 'CALL-9003';
const call3Start = now - 22 * 60000;
const ragResult = runRag('교환/반품 정책이 어떻게 되나요?', 'safe');
const call3: ConversationSession = {
  id: CALL_3_ID, userId: custVip2.id, customerName: custVip2.name, channel: 'call',
  startedAt: call3Start, endedAt: call3Start + 33000, status: 'ended', messageCount: 3,
};
const call3Msgs: BotMessage[] = [
  { id: 'CM-9201', sessionId: CALL_3_ID, role: 'bot', text: `안녕하세요 ${custVip2.name}님, AI-CXP 콜봇에 연결되었습니다. 말씀해 주시면 상담을 도와드리겠습니다.`, createdAt: call3Start, intent: 'greeting', confidence: 1 },
  { id: 'CM-9202', sessionId: CALL_3_ID, role: 'user', text: '교환/반품 정책이 어떻게 되나요?', createdAt: call3Start + 10000 },
  { id: 'CM-9203', sessionId: CALL_3_ID, role: 'bot', text: ragResult.answer, createdAt: call3Start + 12000, intent: 'rag_faq', confidence: 0.88, entities: [], rag: ragResult },
];

export const seedCallSessions: ConversationSession[] = [call3, call1, call2].sort((a, b) => b.startedAt - a.startedAt);
export const seedCallMessages: Record<string, BotMessage[]> = {
  [CALL_1_ID]: call1Msgs,
  [CALL_2_ID]: call2Msgs,
  [CALL_3_ID]: call3Msgs,
};
