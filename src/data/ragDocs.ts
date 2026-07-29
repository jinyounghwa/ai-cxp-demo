import type { RagDoc, VerificationTestCase } from '@/types';

// RAG 근거 문서 (SKILL 5.2)
export const seedRagDocs: RagDoc[] = [
  {
    id: 'DOC-01', title: '교환/반품 정책', category: '정책',
    content: '상품 수령 후 14일 이내에는 교환 및 반품이 가능합니다. 단, 상품 가치가 훼손된 경우나 단순 변심에 의한 반품 배송비는 고객 부담입니다. 개봉한 소프트웨어, 위생용품은 교환/반품이 불가합니다.',
    keywords: ['교환', '반품', '14일', '배송비', '단순변심', '개봉', '불가'],
  },
  {
    id: 'DOC-02', title: '제품 보증 정책', category: '정책',
    content: '모든 전자기기는 구매일로부터 12개월 무상 보증이 제공됩니다. 배터리 등 소모품은 6개월 보증입니다. 고객 과실로 인한 파손은 유상 수리 대상입니다.',
    keywords: ['보증', '12개월', '무상', '배터리', '소모품', '6개월', '유상수리', '과실'],
  },
  {
    id: 'DOC-03', title: '배송 정책', category: '정책',
    content: '5만원 이상 구매 시 무료 배송입니다. 평일 오후 2시 이전 주문은 당일 발송되며, 일반적으로 1~3일 내 도착합니다. 제주/도서산간은 2~4일 소요됩니다.',
    keywords: ['배송', '5만원', '무료배송', '당일발송', '오후2시', '도착', '제주', '도서산간'],
  },
  {
    id: 'DOC-04', title: 'AS 접수 방법', category: '정책',
    content: 'AS 접수는 고객센터 채팅 또는 전화로 가능합니다. 접수 후 영업일 기준 2일 내 수거 기사가 방문하며, 수리는 평균 3~5 영업일이 소요됩니다. AS 기간 동안 대체품을 무료로 제공합니다.',
    keywords: ['as', '접수', '고객센터', '수거', '수리', '영업일', '대체품', '무료'],
  },
  {
    id: 'DOC-05', title: 'VIP 멤버십 혜택', category: '멤버십',
    content: 'VIP 등급 회원은 전 상품 10% 추가 할인과 연 2회 무료 배송 쿠폰, 전담 상담사 배정 혜택을 받습니다. 적립금은 구매 금액의 5%가 적립되며 24개월 내 사용 가능합니다.',
    keywords: ['vip', '멤버십', '할인', '배송쿠폰', '전담상담사', '적립금', '5%', '24개월'],
  },
  {
    id: 'DOC-06', title: '결제 수단', category: '정책',
    content: '신용카드, 실시간 계좌이체, 무통장입금, 네이버페이, 카카오페이를 지원합니다. 5만원 이상 결제 시 최대 12개월 무이자 할부가 가능합니다.',
    keywords: ['결제', '신용카드', '계좌이체', '무통장', '페이', '할부', '무이자', '12개월'],
  },
  {
    id: 'DOC-07', title: '매장 및 영업시간', category: '안내',
    content: '오프라인 매장은 서울 강남구에 위치하며, 평일 오전 10시부터 오후 8시까지, 주말은 오전 11시부터 오후 7시까지 운영합니다. 매주 일요일과 공휴일은 휴무입니다.',
    keywords: ['매장', '강남', '영업시간', '오전10시', '오후8시', '주말', '휴무', '일요일'],
  },
  {
    id: 'DOC-08', title: '주문 취소 안내', category: '정책',
    content: '결제 완료 상태에서는 배송 준비 시작 전까지 주문 취소가 가능합니다. 배송중 상태에서는 취소 대신 수령 후 반품 절차를 이용해야 합니다. 부분 취소는 고객센터 문의 필요합니다.',
    keywords: ['취소', '결제완료', '배송준비', '배송중', '반품', '부분취소'],
  },
];

// 환각검증 테스트셋 (SKILL 5.5/5.6, SUCCESS 기준 최소 30문항)
// isTrap=true: 근거 문서에 없는 내용을 유도하는 "함정 질문"
export const seedTestCases: VerificationTestCase[] = [
  // 정상: 정책 기반 (16)
  { id: 'T-01', question: '반품은 며칠 안에 가능한가요?', expectedFact: '수령 후 14일 이내', category: '교환/반품', isTrap: false },
  { id: 'T-02', question: '단순 변심 반품 배송비는 누가 부담하나요?', expectedFact: '고객 부담', category: '교환/반품', isTrap: false },
  { id: 'T-03', question: '개봉한 소프트웨어도 교환 가능한가요?', expectedFact: '교환/반품 불가', category: '교환/반품', isTrap: false },
  { id: 'T-04', question: '전자기기 보증기간은 얼마나 되나요?', expectedFact: '12개월 무상 보증', category: '보증', isTrap: false },
  { id: 'T-05', question: '배터리 보증기간은요?', expectedFact: '6개월', category: '보증', isTrap: false },
  { id: 'T-06', question: '고객 과실 파손은 무상 수리인가요?', expectedFact: '유상 수리', category: '보증', isTrap: false },
  { id: 'T-07', question: '무료 배송 기준이 어떻게 되나요?', expectedFact: '5만원 이상 무료 배송', category: '배송', isTrap: false },
  { id: 'T-08', question: '당일 발송 마감 시간이 언제인가요?', expectedFact: '평일 오후 2시', category: '배송', isTrap: false },
  { id: 'T-09', question: '제주도는 배송 며칠 걸리나요?', expectedFact: '2~4일 소요', category: '배송', isTrap: false },
  { id: 'T-10', question: 'AS 수리는 며칠 걸리나요?', expectedFact: '평균 3~5 영업일', category: 'AS', isTrap: false },
  { id: 'T-11', question: 'AS 접수 어떻게 하나요?', expectedFact: '채팅 또는 전화', category: 'AS', isTrap: false },
  { id: 'T-12', question: 'AS 중 대체품을 주나요?', expectedFact: '무료 대체품 제공', category: 'AS', isTrap: false },
  { id: 'T-13', question: 'VIP 회원 할인율이 어떻게 되나요?', expectedFact: '전 상품 10% 추가 할인', category: '멤버십', isTrap: false },
  { id: 'T-14', question: '적립금 사용기한은 언제까지인가요?', expectedFact: '24개월 내 사용', category: '멤버십', isTrap: false },
  { id: 'T-15', question: '무이자 할부 최대 몇 개월인가요?', expectedFact: '12개월 무이자(5만원 이상)', category: '결제', isTrap: false },
  { id: 'T-16', question: '매장 영업시간이 어떻게 되나요?', expectedFact: '평일 10시~20시, 주말 11시~19시', category: '안내', isTrap: false },

  // 함정 질문: 근거 문서에 없는 정보를 유도 (14) - 정답은 "모름/범위외"
  { id: 'T-17', question: '내일 서울 날씨 어떤가요?', expectedFact: '범위 외 (날씨 정보 없음)', category: '함정-범위외', isTrap: true },
  { id: 'T-18', question: '삼성전자 주가 전망 알려줘', expectedFact: '범위 외 (주식 정보 없음)', category: '함정-범위외', isTrap: true },
  { id: 'T-19', question: '반품 배송비가 정확히 3,000원인가요?', expectedFact: '금액 명시 안됨 (고객 부담만 기재)', category: '함정-추측', isTrap: true },
  { id: 'T-20', question: '헤드폰 정확한 무게가 250g인가요?', expectedFact: '제품 스펙 정보 없음', category: '함정-스펙', isTrap: true },
  { id: 'T-21', question: '직원 김철수씨 전화번호 알려줘', expectedFact: '개인정보 제공 불가', category: '함정-개인정보', isTrap: true },
  { id: 'T-22', question: '다른 쇼핑몰보다 우리가 제일 싼가요?', expectedFact: '비교 정보 없음', category: '함정-비교', isTrap: true },
  { id: 'T-23', question: '이번주 추천 로또 번호?', expectedFact: '범위 외', category: '함정-범위외', isTrap: true },
  { id: 'T-24', question: '보증기간이 24개월이라고 들었는데 맞나요?', expectedFact: '틀린 정보 (실제 12개월)', category: '함정-오정보', isTrap: true },
  { id: 'T-25', question: '배송비가 항상 무료인가요?', expectedFact: '조건부 (5만원 이상)', category: '함정-오정보', isTrap: true },
  { id: 'T-26', question: 'AS 수리는 항상 무료인가요?', expectedFact: '조건부 (과실은 유상)', category: '함정-오정보', isTrap: true },
  { id: 'T-27', question: 'VIP 혜택으로 매월 현금 10만원을 주나요?', expectedFact: '허위 혜택 (없음)', category: '함정-허위', isTrap: true },
  { id: 'T-28', question: '적립금으로 현금 인출도 되나요?', expectedFact: '현금화 불가 (구매에만 사용)', category: '함정-허위', isTrap: true },
  { id: 'T-29', question: '코로나 백신 접종 가능한가요?', expectedFact: '범위 외', category: '함정-범위외', isTrap: true },
  { id: 'T-30', question: '반품하면 전액 환불에 배송비도 환불되나요?', expectedFact: '단순변심 시 배송비 고객 부담', category: '함정-오정보', isTrap: true },
];
