import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { commerceStore, searchProducts, advanceOrderStatus } from '@/lib/commerceStore';
import type { OrderStatus } from '@/types';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  FileText, 
  ChevronRight, 
  Headphones, 
  Watch, 
  Keyboard, 
  HardDrive, 
  Tv, 
  Box,
  DollarSign
} from 'lucide-react';

const STATUS_COLOR: Record<OrderStatus, string> = {
  생성: 'badge-gray', 결제완료: 'badge-cyan', 배송중: 'badge-yellow', 완료: 'badge-green', 취소: 'badge-red',
};

const CAT_ICON: Record<string, React.ReactNode> = {
  오디오: <Headphones size={24} className="text-primary" />,
  웨어러블: <Watch size={24} className="text-cyan" />,
  'PC주변기기': <Keyboard size={24} className="text-accent" />,
  저장장치: <HardDrive size={24} className="text-green" />,
  가구: <Box size={24} className="text-yellow" />,
  가전: <Tv size={24} className="text-red" />,
};

export default function Commerce() {
  const products = useStore(commerceStore, (s) => s.products);
  const orders = useStore(commerceStore, (s) => s.orders);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('전체');

  const categories = ['전체', ...Array.from(new Set(products.map((p) => p.category)))];
  const shown = searchProducts(query).filter((p) => cat === '전체' || p.category === cat);
  const totalRevenue = orders.reduce((a, b) => a + b.total, 0);

  return (
    <div className="page">
      <PageHeader
        icon={<ShoppingCart className="text-primary" size={24} />}
        title="E-커머스"
        desc="상품/주문/결제 데모입니다. 챗봇에서 '재고 있어?', '주문할게' 같은 발화가 상품 조회와 주문 생성으로 직접 연결되며, 주문 결과는 CRM Activity에도 동시 기록됩니다."
        actions={<span className="badge badge-primary flex center gap-4"><DollarSign size={12} /> 총 매출 {totalRevenue.toLocaleString()}원</span>}
      />

      {/* 상품 */}
      <div className="card mb-16">
        <div className="flex between center mb-12">
          <div className="card-title flex center gap-8" style={{ marginBottom: 0 }}>
            <Package size={16} className="text-primary" />
            상품
            <span className="badge badge-gray text-xs">{shown.length}개</span>
          </div>
          <input className="input" style={{ maxWidth: 240 }} placeholder="상품 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`}
              style={cat === c ? { background: 'var(--primary-bg)', color: 'var(--primary-soft)', borderColor: 'var(--primary)' } : {}}
              onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="grid grid-4">
          {shown.map((p) => (
            <div key={p.id} className="card commerce-product-card" style={{ padding: 14, transition: 'transform 0.15s, border-color 0.15s' }}>
              <div className="flex center justify-center mb-12" style={{ width: 44, height: 44, background: 'var(--bg-soft)', borderRadius: 10 }}>
                {CAT_ICON[p.category] || <Box size={24} className="text-primary" />}
              </div>
              <div className="fw-600 text-sm">{p.name}</div>
              <div className="text-xs text-mute mt-4" style={{ fontFamily: 'var(--mono)' }}>{p.id} · {p.category}</div>
              <div className="fw-700 mt-8 text-lg" style={{ color: 'var(--text)' }}>{p.price.toLocaleString()}원</div>
              <div className="flex between center mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs text-mute">재고</span>
                <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= 8 ? 'badge-yellow' : 'badge-green'}`}>
                  {p.stock === 0 ? '품절' : `${p.stock}개`}
                </span>
              </div>
            </div>
          ))}
          {shown.length === 0 && <div className="empty" style={{ gridColumn: 'span 4' }}>검색 결과가 없습니다</div>}
        </div>
      </div>

      {/* 주문 */}
      <div className="card">
        <div className="card-title flex center gap-8">
          <FileText size={16} className="text-primary" />
          주문 리스트
          <span className="badge badge-gray text-xs">{orders.length}건 · 상태 전이 데모</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>주문번호</th><th>고객</th><th>상품</th><th>결제금액</th><th>상태</th><th>주문일</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="text-mono text-xs">{o.id}</td>
                <td>{o.customerName}</td>
                <td className="text-sm">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                <td className="fw-600">{o.total.toLocaleString()}원</td>
                <td><span className={`badge ${STATUS_COLOR[o.status]}`}>{o.status}</span></td>
                <td className="text-xs text-mute">{new Date(o.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                  {o.status !== '완료' && o.status !== '취소' && (
                    <button className="btn btn-ghost btn-sm flex center gap-2" onClick={() => advanceOrderStatus(o.id)}>
                      <span>진행</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

