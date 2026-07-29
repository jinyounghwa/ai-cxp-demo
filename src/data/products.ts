import type { Product, Order } from '@/types';

// 커머스 더미 데이터 (SKILL 3.1)
export const seedProducts: Product[] = [
  {
    id: 'P-501', name: '노이즈캔슬링 무선 헤드폰 X1', category: '오디오', price: 349000, stock: 24,
    description: '하이브리드 노이즈 캔슬링, 최대 40시간 재생, 고해상도 사운드를 제공하는 프리미엄 헤드폰입니다.',
    tags: ['헤드폰', '오디오', '블루투스', '노이즈캔슬링'], aliases: ['헤드폰', '헤드폰x1', '노이즈캔슬링', 'x1'],
  },
  {
    id: 'P-502', name: '스마트 워치 핏 Pro', category: '웨어러블', price: 299000, stock: 8,
    description: '심박수·수면·스트레스 측정, GPS 내장, 7일 배터리. 건강 관리에 최적화된 스마트워치입니다.',
    tags: ['스마트워치', '워치', '건강', '피트니스'], aliases: ['스마트워치', '워치', '워치프로', '핏프로'],
  },
  {
    id: 'P-503', name: '무선 기계식 키보드 K2', category: 'PC주변기기', price: 159000, stock: 0,
    description: '텐키리스 75% 배열, 갈축, 화이트 LED. 코딩과 사무용에 적합한 기계식 키보드입니다.',
    tags: ['키보드', '기계식', '무선'], aliases: ['키보드', '기계식키보드', 'k2'],
  },
  {
    id: 'P-504', name: '4K 웹캠 라이트캠', category: 'PC주변기기', price: 129000, stock: 15,
    description: '4K UHD, 자동 화이트밸런스, 링 조명 내장. 화상 회의와 스트리밍용 웹캠입니다.',
    tags: ['웹캠', '화상회의', '카메라'], aliases: ['웹캠', '라이트캠', '카메라'],
  },
  {
    id: 'P-505', name: '휴대용 SSD 1TB 플래시', category: '저장장치', price: 139000, stock: 42,
    description: 'USB-C, 읽기 1050MB/s, 내충격 설계. 빠르고 안전한 휴대 저장장치입니다.',
    tags: ['SSD', '저장장치', 'usb'], aliases: ['ssd', '저장장치', '외장하드', '플래시'],
  },
  {
    id: 'P-506', name: '인체공학 게이밍 의자 G-시트', category: '가구', price: 459000, stock: 6,
    description: '요추 지지, 4D 팔걸이, 통기성 메쉬. 장시간 사용에도 편안한 게이밍 의자입니다.',
    tags: ['의자', '게이밍', '인체공학'], aliases: ['의자', '게이밍의자', 'g시트', 'g-시트'],
  },
  {
    id: 'P-507', name: '무선 마우스 에어플릭 M3', category: 'PC주변기기', price: 89000, stock: 30,
    description: '초경량 58g, 4000DPI, USB-C 충전. 휴대성 좋은 무선 마우스입니다.',
    tags: ['마우스', '무선'], aliases: ['마우스', '에어플릭', 'm3'],
  },
  {
    id: 'P-508', name: '로봇청소기 스마트 R7', category: '가전', price: 689000, stock: 3,
    description: 'Lidar 매핑, 물걸레 겸용, 앱 제어. 스마트한 자동 청소를 제공합니다.',
    tags: ['로봇청소기', '가전', '청소'], aliases: ['로봇청소기', '청소기', 'r7'],
  },
];

export const seedOrders: Order[] = [
  {
    id: 'ORD-5021', customerId: 'C-1001', customerName: '김지훈',
    items: [{ productId: 'P-501', name: '노이즈캔슬링 무선 헤드폰 X1', qty: 1, price: 349000 }],
    total: 349000, status: '배송중', createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'ORD-5019', customerId: 'C-1004', customerName: '최민아',
    items: [{ productId: 'P-502', name: '스마트 워치 핏 Pro', qty: 1, price: 299000 }],
    total: 299000, status: '완료', createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'ORD-5025', customerId: 'C-1002', customerName: '박서연',
    items: [
      { productId: 'P-505', name: '휴대용 SSD 1TB 플래시', qty: 2, price: 139000 },
      { productId: 'P-507', name: '무선 마우스 에어플릭 M3', qty: 1, price: 89000 },
    ],
    total: 367000, status: '결제완료', createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'ORD-5028', customerId: 'C-1006', customerName: '강민호',
    items: [{ productId: 'P-504', name: '4K 웹캠 라이트캠', qty: 1, price: 129000 }],
    total: 129000, status: '생성', createdAt: Date.now() - 3600000 * 3,
  },
];
