import type { IntentDef, EntityDictionaryEntry, IntentSample } from '@/types';

// 인텐트 정의 (SKILL 4.1, SUCCESS 기준 20~30개 인텐트)
// 데모 수준: 키워드 + 정규화 점수 기반 경량 분류기
export const seedIntents: IntentDef[] = [
  {
    id: 'INT-greeting', name: 'greeting', label: '인사', category: '일반',
    keywords: ['안녕', '안녕하세요', '반갑', '시작', 'hello'],
    samples: ['안녕하세요', '반갑습니다', '시작할게요'],
    response: '안녕하세요! AI-CXP 상담봇입니다. 상품 문의, 주문, 배송, AS 등 무엇을 도와드릴까요?',
  },
  {
    id: 'INT-product', name: 'product_inquiry', label: '상품 문의', category: '커머스',
    keywords: ['상품', '제품', '알려줘', '뭐있어', '추천', '찾아', '궁금'],
    samples: ['상품 알려줘', '키보드 있어?', '마우스 뭐있어?'],
    response: '',
  },
  {
    id: 'INT-stock', name: 'stock_check', label: '재고 확인', category: '커머스',
    keywords: ['재고', '있어', '남았', '품절', '언제', '입고', '수량'],
    samples: ['재고 있어?', '남았어?', '품절인가요?', '언제 들어와요?'],
    response: '',
  },
  {
    id: 'INT-order', name: 'order_request', label: '주문 요청', category: '커머스',
    keywords: ['주문', '살', '구매', '결제', '장바구니', '넣어', '사고싶'],
    samples: ['이거 주문할게', '구매할래', '주문해줘', '2개 주문'],
    response: '',
  },
  {
    id: 'INT-order-status', name: 'order_status', label: '주문 조회', category: '커머스',
    keywords: ['주문조회', '주문상태', '배송', '언제와', '도착', '오더', '어디'],
    samples: ['내 주문 어디야', '배송 언제 와?', '주문 상태 확인'],
    response: '',
  },
  {
    id: 'INT-account', name: 'account_lookup', label: '고객 정보 조회', category: 'CRM',
    keywords: ['내정보', '회원', '등급', '마이페이지', '내계정', 'vip', '멤버십'],
    samples: ['내 정보 보여줘', '내 등급이 뭐야', '내 계정 조회'],
    response: '',
  },
  {
    id: 'INT-history', name: 'consultation_history', label: '상담 이력', category: 'CRM',
    keywords: ['이력', '기록', '상담내용', '예전', '지난번', '히스토리'],
    samples: ['상담 이력 보여줘', '지난 상담 기록', '예전에 문의한 거'],
    response: '',
  },
  {
    id: 'INT-return', name: 'return_request', label: '반품/AS 요청', category: '커머스',
    keywords: ['반품', '교환', 'as', 'a/s', '고장', '불량', '환불', '수리'],
    samples: ['반품하고싶어', '교환 가능?', 'as 받아야해', '고장났어'],
    response: '',
  },
  {
    id: 'INT-payment', name: 'payment_inquiry', label: '결제 문의', category: '커머스',
    keywords: ['결제수단', '할부', '카드', '결제문제', '결제오류', '영수증'],
    samples: ['결제 수단 뭐있어?', '할부 되나요?', '결제가 안돼요'],
    response: '',
  },
  {
    id: 'INT-shipping', name: 'shipping_inquiry', label: '배송 문의', category: '커머스',
    keywords: ['배송비', '무료배송', '배송지', '택배', '오늘도착', '배송시간'],
    samples: ['배송비 얼마?', '무료배송 되나요?', '오늘 도착해?'],
    response: '',
  },
  {
    id: 'INT-recommend', name: 'recommendation', label: '상품 추천', category: '커머스',
    keywords: ['추천', '추천해', '뭐사지', '어떤거', '고를', '고민'],
    samples: ['추천해줘', '어떤 게 좋아?', '선물 추천'],
    response: '',
  },
  {
    id: 'INT-transfer', name: 'transfer_agent', label: '상담사 이관', category: '상담',
    keywords: ['상담사', '직원', '사람', '이관', '연결', '담당자', '직접'],
    samples: ['상담사 연결해줘', '사람이랑 얘기하고싶어', '담당자 바꿔줘'],
    response: '',
  },
  {
    id: 'INT-complaint', name: 'complaint', label: '불만 접수', category: '상담',
    keywords: ['불만', '화나', '짜증', '문제', '이상', '접수', '클레임'],
    samples: ['불만 접수해요', '너무 화나요', '문제가 있어요'],
    response: '',
  },
  {
    id: 'INT-thanks', name: 'thanks', label: '감사', category: '일반',
    keywords: ['감사', '고마워', 'thanks', '굿'],
    samples: ['감사합니다', '고마워요', '너무 좋아요'],
    response: '감사합니다! 더 필요하신 게 있으면 언제든 말씀해 주세요. 😊',
  },
  {
    id: 'INT-faq', name: 'rag_faq', label: 'FAQ/정책 (RAG)', category: 'RAG',
    keywords: ['정책', '규정', '보증', '매장', '영업시간', '멤버십', '포인트', '사용기간', '방법'],
    samples: ['교환 정책 알려줘', '보증기간 어떻게돼?', '매장 위치가?', '영업시간?'],
    response: '',
  },
  {
    id: 'INT-trap', name: 'trap_out_of_scope', label: '범위외/함정', category: 'RAG',
    keywords: ['날씨', '주식', '로또', '연애', '정치', '내일뭐', '노래'],
    samples: ['내일 날씨 어때?', '로또 번호 알려줘', '주식 추천해줘'],
    response: '죄송합니다만, 해당 질문은 저희 쇼핑몰 서비스 범위를 벗어나 안전하게 답변할 수 없습니다. 상품/주문/정책 관련 질문만 도와드릴 수 있어요.',
  },
  {
    id: 'INT-cancel', name: 'cancel_order', label: '주문 취소', category: '커머스',
    keywords: ['주문취소', '취소해줘', '주문을 취소', '결제취소', '주문 취소'],
    samples: ['주문 취소해줘', '방금 주문 취소할래', '결제 취소 가능해?'],
    response: '',
  },
  {
    id: 'INT-address', name: 'delivery_address_change', label: '배송지 변경', category: '커머스',
    keywords: ['배송지변경', '주소변경', '배송지 바꿔', '주소 바꿔', '배송지'],
    samples: ['배송지 변경하고 싶어요', '주소 바꿀 수 있나요?', '배송지 바꿔주세요'],
    response: '',
  },
  {
    id: 'INT-coupon', name: 'coupon_inquiry', label: '쿠폰/할인 문의', category: '커머스',
    keywords: ['쿠폰', '할인코드', '프로모션', '할인 어떻게', '적립금 할인'],
    samples: ['쿠폰 있나요?', '할인코드 알려줘', '지금 프로모션 뭐 있어요?'],
    response: '',
  },
  {
    id: 'INT-review', name: 'review_request', label: '리뷰 작성', category: '커머스',
    keywords: ['리뷰', '후기', '별점', '리뷰쓰고', '리뷰 남길'],
    samples: ['리뷰 쓰고 싶어요', '후기 남길게요', '별점 줄게요'],
    response: '',
  },
  {
    id: 'INT-goodbye', name: 'goodbye', label: '종료 인사', category: '일반',
    keywords: ['수고', '끊을게', '종료', '안녕히', '다음에', '나갈게'],
    samples: ['수고하세요', '이만 끊을게요', '다음에 또 올게요'],
    response: '이용해 주셔서 감사합니다. 좋은 하루 보내세요! 👋',
  },
];

// 엔티티 사전 (SKILL 4.2)
export const seedEntityDictionary: EntityDictionaryEntry[] = [
  { entityType: 'product', label: '상품명', values: ['헤드폰', '스마트워치', '워치', '키보드', '웹캠', 'SSD', '의자', '마우스', '청소기', '카메라'] },
  { entityType: 'quantity', label: '수량', values: ['1개', '2개', '3개', '한개', '두개', '세개'] },
  { entityType: 'tier', label: '등급', values: ['VIP', 'GOLD', 'SILVER', '일반'] },
];

// 초기 학습 샘플 (SKILL 4.2, seed 일부)
export const seedIntentSamples: IntentSample[] = [
  { id: 'S-1', text: '안녕하세요', intent: 'greeting', entities: [], verified: true, source: 'seed', createdAt: Date.now() },
  { id: 'S-2', text: '재고 남았나요?', intent: 'stock_check', entities: [], verified: true, source: 'seed', createdAt: Date.now() },
  { id: 'S-3', text: '헤드폰 1개 주문할게', intent: 'order_request', entities: [{ type: 'product', value: '헤드폰', raw: '헤드폰' }, { type: 'quantity', value: '1', raw: '1개' }], verified: true, source: 'seed', createdAt: Date.now() },
  { id: 'S-4', text: '내 주문 어디까지 왔어?', intent: 'order_status', entities: [], verified: true, source: 'seed', createdAt: Date.now() },
  { id: 'S-5', text: '교환 정책이 어떻게 돼요?', intent: 'rag_faq', entities: [], verified: true, source: 'seed', createdAt: Date.now() },
  { id: 'S-6', text: '상담사 연결해주세요', intent: 'transfer_agent', entities: [], verified: false, source: 'chat', createdAt: Date.now() },
  { id: 'S-7', text: '추천 좀 해줘', intent: 'recommendation', entities: [], verified: false, source: 'chat', createdAt: Date.now() },
];
