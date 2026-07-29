import { createStore } from './store';
import { seedProducts, seedOrders } from '@/data/products';
import type { Product, Order, OrderStatus } from '@/types';

interface CommerceState {
  products: Product[];
  orders: Order[];
}

export const commerceStore = createStore<CommerceState>({
  products: seedProducts,
  orders: seedOrders,
});

export function findProduct(query: string): Product | undefined {
  const q = query.toLowerCase().replace(/\s/g, '');
  return commerceStore.getState().products.find((p) => {
    if (p.name.toLowerCase().replace(/\s/g, '').includes(q)) return true;
    if (p.aliases.some((a) => q.includes(a.toLowerCase()))) return true;
    return false;
  });
}

export function findProductByAlias(text: string): Product | undefined {
  const lower = text.toLowerCase();
  return commerceStore.getState().products.find((p) =>
    p.aliases.some((a) => lower.includes(a.toLowerCase()))
  );
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  if (!q) return commerceStore.getState().products;
  return commerceStore.getState().products.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q)) ||
    p.aliases.some((a) => q.includes(a.toLowerCase()))
  );
}

export function createOrder(customerId: string, customerName: string, items: Order['items']): Order {
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const order: Order = {
    id: `ORD-${5000 + commerceStore.getState().orders.length + 30}`,
    customerId,
    customerName,
    items,
    total,
    status: '생성',
    createdAt: Date.now(),
  };
  // 재고 차감
  commerceStore.setState((s) => ({
    orders: [order, ...s.orders],
    products: s.products.map((p) => {
      const item = items.find((it) => it.productId === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
    }),
  }));
  return order;
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return commerceStore.getState().orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function cancelOrder(id: string): Order | undefined {
  let cancelled: Order | undefined;
  commerceStore.setState((s) => ({
    orders: s.orders.map((o) => {
      if (o.id !== id || o.status === '배송중' || o.status === '완료' || o.status === '취소') return o;
      cancelled = { ...o, status: '취소' as OrderStatus };
      return cancelled;
    }),
  }));
  return cancelled;
}

export function advanceOrderStatus(id: string) {
  const flow: OrderStatus[] = ['생성', '결제완료', '배송중', '완료'];
  commerceStore.setState((s) => ({
    orders: s.orders.map((o) => {
      if (o.id !== id) return o;
      const idx = flow.indexOf(o.status);
      return { ...o, status: idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : o.status };
    }),
  }));
}
