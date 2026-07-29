import type { Customer, Lead, Activity } from '@/types';

// CRM 더미 데이터 (SKILL 2.1)
export const seedCustomers: Customer[] = [
  {
    id: 'C-1001', name: '김지훈', phone: '010-1234-5678', email: 'jh.kim@example.com',
    tier: 'VIP', createdAt: Date.parse('2023-02-11'), totalOrders: 14, totalSpent: 4820000,
  },
  {
    id: 'C-1002', name: '박서연', phone: '010-2345-6789', email: 'seoyeon.park@example.com',
    tier: 'GOLD', createdAt: Date.parse('2023-05-08'), totalOrders: 7, totalSpent: 1890000,
  },
  {
    id: 'C-1003', name: '이도윤', phone: '010-3456-7890', email: 'dy.lee@example.com',
    tier: 'SILVER', createdAt: Date.parse('2023-09-21'), totalOrders: 3, totalSpent: 640000,
  },
  {
    id: 'C-1004', name: '최민아', phone: '010-4567-8901', email: 'mina.choi@example.com',
    tier: 'VIP', createdAt: Date.parse('2022-11-30'), totalOrders: 21, totalSpent: 7350000,
  },
  {
    id: 'C-1005', name: '정예린', phone: '010-5678-9012', email: 'yerin.jung@example.com',
    tier: '일반', createdAt: Date.parse('2024-01-15'), totalOrders: 1, totalSpent: 89000,
  },
  {
    id: 'C-1006', name: '강민호', phone: '010-6789-0123', email: 'mho.kang@example.com',
    tier: 'GOLD', createdAt: Date.parse('2023-07-19'), totalOrders: 9, totalSpent: 2410000,
  },
];

export const seedLeads: Lead[] = [
  {
    id: 'L-2001', customerId: 'C-1003', source: '웹폼', stage: '신규', owner: '영업팀 박대리',
    nextAction: '첫 상담 전화', value: 350000, updatedAt: Date.now() - 86400000,
  },
  {
    id: 'L-2002', customerId: 'C-1002', source: '챗봇', stage: '상담중', owner: '영업팀 박대리',
    nextAction: '견적서 발송', value: 890000, updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'L-2003', customerId: 'C-1005', source: '이벤트', stage: '상담중', owner: '영업팀 김과장',
    nextAction: '데모 일정 확정', value: 1200000, updatedAt: Date.now() - 3600000 * 26,
  },
  {
    id: 'L-2004', customerId: 'C-1006', source: '전환', stage: '제안', owner: '영업팀 김과장',
    nextAction: '계약 조건 협의', value: 2300000, updatedAt: Date.now() - 3600000 * 48,
  },
  {
    id: 'L-2005', customerId: 'C-1001', source: '추천', stage: '계약', owner: '영업팀 박대리',
    nextAction: '계약서 최종 서명', value: 5400000, updatedAt: Date.now() - 3600000 * 10,
  },
  {
    id: 'L-2006', customerId: 'C-1002', source: '웹폼', stage: '이탈', owner: '영업팀 김과장',
    nextAction: '리텐션 캠페인 발송', value: 0, updatedAt: Date.now() - 86400000 * 12,
  },
];

export const seedActivities: Activity[] = [
  {
    id: 'A-3001', customerId: 'C-1001', type: 'call', content: 'VIP 멤버십 갱신 안내 통화, 만족도 매우 높음',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'A-3002', customerId: 'C-1001', type: 'order', content: '노이즈캔슬링 헤드폰 1건 주문 (ORD-5021)',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'A-3003', customerId: 'C-1004', type: 'chat', content: '배송 문의 채팅 상담, 당일 해결',
    createdAt: Date.now() - 3600000 * 30,
  },
  {
    id: 'A-3004', customerId: 'C-1002', type: 'meeting', content: 'B2B 솔루션 미팅, 견적 요청 접수',
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'A-3005', customerId: 'C-1006', type: 'memo', content: '계약 조건 검토 중, 법무팀 확인 필요',
    createdAt: Date.now() - 3600000 * 48,
  },
];
