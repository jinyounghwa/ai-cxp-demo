import { classifyIntent } from './intentEngine';
import { runRag } from './ragOrchestrator';
import {
  findProductByAlias, createOrder, getOrdersByCustomer, searchProducts, cancelOrder,
} from './commerceStore';
import { getCustomer, addActivity, crmStore } from './crmStore';
import { addSample, trainingStore } from './trainingStore';
import { endSession, addMessage } from './chatStore';
import { uid } from './store';
import type { ConversationSession, BotMessage, Entity, RagAnswer, Customer } from '@/types';

export interface HandleResult {
  message: BotMessage;
  rag?: RagAnswer;
  action?: string;
  customer?: Customer;
}

const DEMO_CUSTOMER_ID = 'C-1001'; // 데모 기본 사용자: 김지훈(VIP)

export function resolveDemoCustomer(): Customer {
  return getCustomer(DEMO_CUSTOMER_ID)!;
}

function entity(entities: Entity[], type: string): string | undefined {
  return entities.find((e) => e.type === type)?.value;
}

// 대화 처리 (SKILL 1.3 처리 플로우)
export function handleUtterance(session: ConversationSession, text: string): HandleResult {
  const intent = classifyIntent(text);
  const customer = getCustomer(session.userId) || resolveDemoCustomer();
  let replyText = '';
  let rag: RagAnswer | undefined;
  let action: string | undefined;

  const qty = Number(entity(intent.entities, 'quantity') || 1);

  switch (intent.intent) {
    case 'greeting':
    case 'thanks': {
      replyText = trainingStore.getState().intents.find((i) => i.name === intent.intent)?.response ?? '안녕하세요!';
      break;
    }
    case 'product_inquiry': {
      const product = findProductByAlias(text);
      if (product) {
        replyText = `『${product.name}』(${product.category})을(를) 안내해 드릴게요. 가격 ${product.price.toLocaleString()}원, 재고 ${product.stock}개. ${product.description}`;
      } else {
        const items = searchProducts('').slice(0, 4);
        replyText = `대표 상품 ${items.length}개를 안내해 드려요:\n${items.map((p) => `• ${p.name} — ${p.price.toLocaleString()}원 (재고 ${p.stock})`).join('\n')}\n원하는 상품이 있으면 말씀해 주세요.`;
      }
      break;
    }
    case 'stock_check': {
      const product = findProductByAlias(text);
      if (product) {
        replyText = product.stock > 0
          ? `『${product.name}』 현재 ${product.stock}개 재고가 있습니다. 😊`
          : `『${product.name}』 현재 품절입니다. 입고 알림을 받으려면 말씀해 주세요.`;
      } else {
        replyText = '어떤 상품의 재고를 확인할까요? 상품명을 알려주세요.';
      }
      break;
    }
    case 'order_request': {
      const product = findProductByAlias(text);
      if (product) {
        const order = createOrder(customer.id, customer.name, [
          { productId: product.id, name: product.name, qty, price: product.price },
        ]);
        replyText = `${customer.name}님, 『${product.name}』 ${qty}개 주문이 완료되었습니다. ✅\n주문번호: ${order.id} / 결제금액: ${order.total.toLocaleString()}원\n영업 Activity에도 자동 기록되었습니다.`;
        action = 'ordered';
        addActivity({
          id: uid('A'), customerId: customer.id, type: 'order',
          content: `${product.name} ${qty}개 주문 (${order.id}, ${order.total.toLocaleString()}원) - 챗봇 자동`,
          createdAt: Date.now(), relatedSessionId: session.id,
        });
      } else {
        replyText = '주문하실 상품을 확인해 주세요. 예) "헤드폰 1개 주문할게"';
      }
      break;
    }
    case 'order_status': {
      const orders = getOrdersByCustomer(customer.id);
      if (orders.length === 0) {
        replyText = '최근 주문 내역이 없습니다.';
      } else {
        replyText = `${customer.name}님의 최근 주문:\n${orders.slice(0, 3).map((o) => `• ${o.id} — ${o.items.map((i) => i.name).join(', ')} [${o.status}] ${o.total.toLocaleString()}원`).join('\n')}`;
      }
      break;
    }
    case 'account_lookup': {
      replyText = `${customer.name}님 (${customer.id}) / 등급: ${customer.tier} / 누적 주문 ${customer.totalOrders}건 / 누적 결제 ${customer.totalSpent.toLocaleString()}원`;
      break;
    }
    case 'consultation_history': {
      const acts = crmStore.getState().activities.filter((a) => a.customerId === customer.id).slice(0, 4);
      replyText = `${customer.name}님의 최근 상담 이력:\n${acts.length ? acts.map((a) => `• [${a.type}] ${a.content}`).join('\n') : '이력이 없습니다.'}`;
      break;
    }
    case 'recommendation': {
      const recs = crmStore.getState() && searchProducts('').filter((p) => p.stock > 0).slice(0, 3);
      replyText = customer.tier === 'VIP'
        ? `${customer.tier} 등급을 위한 추천:\n${recs!.map((p) => `• ${p.name} — ${p.price.toLocaleString()}원`).join('\n')}`
        : `인기 상품 추천:\n${recs!.map((p) => `• ${p.name} — ${p.price.toLocaleString()}원`).join('\n')}`;
      break;
    }
    case 'rag_faq':
    case 'return_request':
    case 'payment_inquiry':
    case 'shipping_inquiry':
    case 'coupon_inquiry': {
      rag = runRag(text, 'safe');
      replyText = rag.answer;
      action = 'rag';
      break;
    }
    case 'cancel_order': {
      const orders = getOrdersByCustomer(customer.id);
      const target = orders.find((o) => o.status === '생성' || o.status === '결제완료');
      if (target) {
        const cancelled = cancelOrder(target.id);
        replyText = cancelled
          ? `${customer.name}님, 주문번호 ${cancelled.id} (${cancelled.total.toLocaleString()}원)이 취소되었습니다. ✅`
          : '해당 주문은 이미 배송이 시작되어 취소할 수 없습니다. 수령 후 반품 절차를 이용해 주세요.';
        action = 'cancelled';
        addActivity({
          id: uid('A'), customerId: customer.id, type: 'order',
          content: `주문 취소 요청 (${target.id}) - 챗봇 자동`, createdAt: Date.now(), relatedSessionId: session.id,
        });
      } else {
        replyText = '취소 가능한 주문(생성/결제완료 상태)이 없습니다. 배송 중인 주문은 수령 후 반품을 이용해 주세요.';
      }
      break;
    }
    case 'delivery_address_change': {
      replyText = '배송지 변경은 배송 준비 시작 전까지 가능합니다. 변경하실 새 주소를 말씀해 주시면 반영해 드릴게요. (데모: 상담 이력에 요청 기록)';
      addActivity({
        id: uid('A'), customerId: customer.id, type: 'chat',
        content: '배송지 변경 요청 접수 - 챗봇 자동', createdAt: Date.now(), relatedSessionId: session.id,
      });
      break;
    }
    case 'review_request': {
      replyText = `${customer.name}님, 소중한 리뷰 감사합니다! 마이페이지에서 최근 주문에 대한 리뷰를 작성하실 수 있어요. (데모: 상담 이력에 기록)`;
      addActivity({
        id: uid('A'), customerId: customer.id, type: 'memo',
        content: '리뷰 작성 의사 확인 - 챗봇 자동', createdAt: Date.now(), relatedSessionId: session.id,
      });
      break;
    }
    case 'goodbye': {
      replyText = trainingStore.getState().intents.find((i) => i.name === 'goodbye')?.response ?? '이용해 주셔서 감사합니다!';
      break;
    }
    case 'trap_out_of_scope': {
      rag = runRag(text, 'safe'); // 거부 응답 + 환각검증(신뢰)
      replyText = trainingStore.getState().intents.find((i) => i.name === 'trap_out_of_scope')?.response ?? rag.answer;
      action = 'rag';
      break;
    }
    case 'transfer_agent': {
      replyText = '상담사에게 연결해 드리겠습니다. 잠시만 기다려 주세요. 🔄 (상담 이력이 자동 전달됩니다)';
      action = 'transferred';
      endSession(session.id, 'transferred');
      addActivity({
        id: uid('A'), customerId: customer.id, type: 'chat',
        content: '상담사 이관 요청 (신뢰도/명시적 요청)', createdAt: Date.now(), relatedSessionId: session.id,
      });
      break;
    }
    case 'complaint': {
      replyText = '불편을 드려 죄송합니다. 접수해 드리고 담당자가 신속히 확인하겠습니다. 🙏 (민원 접수 완료)';
      action = 'complaint';
      addActivity({
        id: uid('A'), customerId: customer.id, type: 'memo',
        content: `고객 불만 접수: "${text}"`, createdAt: Date.now(), relatedSessionId: session.id,
      });
      break;
    }
    default: {
      // fallback: 저신뢰 → 상담사 이관 제안
      if (intent.confidence < 0.4) {
        replyText = `잘 이해하지 못했어요(신뢰도 ${Math.round(intent.confidence * 100)}%). 주문, 배송, 재고, 정책 등에 대해 물어보시거나, 상담사 연결을 원하시면 말씀해 주세요.`;
      } else {
        replyText = '죄송합니다만, 정확한 안내를 위해 조금 더 구체적으로 말씀해 주시겠어요?';
      }
    }
  }

  // 미검증 발화는 학습 큐에 자동 적재 (SKILL 4.3)
  if (intent.confidence < 0.55 && intent.intent !== 'fallback') {
    addSample({
      id: uid('S'), text, intent: intent.intent, entities: intent.entities,
      verified: false, source: 'chat', createdAt: Date.now(),
    });
  }

  const message: BotMessage = {
    id: uid('M'), sessionId: session.id, role: 'bot', text: replyText,
    createdAt: Date.now(),
    intent: intent.intent, confidence: intent.confidence, entities: intent.entities,
    rag,
  };
  addMessage(message);

  return { message, rag, action, customer };
}

// 사용자 메시지 기록 (화면 표시용)
export function pushUserMessage(session: ConversationSession, text: string) {
  addMessage({
    id: uid('M'), sessionId: session.id, role: 'user', text, createdAt: Date.now(),
  });
}
