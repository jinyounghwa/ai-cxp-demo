import { createStore, uid } from './store';
import { seedIntents, seedIntentSamples, seedEntityDictionary } from '@/data/intents';
import type { IntentDef, IntentSample, EntityDictionaryEntry, Entity } from '@/types';

interface TrainingState {
  intents: IntentDef[];
  samples: IntentSample[];
  dictionary: EntityDictionaryEntry[];
  retrainLog: { id: string; at: number; added: number; message: string }[];
  lastTrainedAt: number | null;
}

export const trainingStore = createStore<TrainingState>({
  intents: seedIntents,
  samples: seedIntentSamples,
  dictionary: seedEntityDictionary,
  retrainLog: [],
  lastTrainedAt: null,
});

export function getIntentDef(name: string): IntentDef | undefined {
  return trainingStore.getState().intents.find((i) => i.name === name);
}

export function addSample(sample: IntentSample) {
  trainingStore.setState((s) => ({ samples: [sample, ...s.samples] }));
}

export function verifySample(id: string) {
  trainingStore.setState((s) => ({
    samples: s.samples.map((x) => (x.id === id ? { ...x, verified: true } : x)),
  }));
}

export function setSampleIntent(id: string, intent: string) {
  trainingStore.setState((s) => ({
    samples: s.samples.map((x) => (x.id === id ? { ...x, intent } : x)),
  }));
}

export function addManualSample(text: string, intent: string) {
  const sample: IntentSample = {
    id: uid('S'), text, intent, entities: extractEntities(text),
    verified: false, source: 'manual', createdAt: Date.now(),
  };
  trainingStore.setState((s) => ({ samples: [sample, ...s.samples] }));
  return sample;
}

export function retrain() {
  const s = trainingStore.getState();
  const unverified = s.samples.filter((x) => !x.verified).length;
  const entry = {
    id: `R-${Date.now()}`,
    at: Date.now(),
    added: unverified,
    message: unverified > 0 ? `${unverified}건 미검증 샘플 반영` : '신규 샘플 없음 (재학습 스킵)',
  };
  trainingStore.setState((st) => ({
    retrainLog: [entry, ...st.retrainLog],
    lastTrainedAt: Date.now(),
    samples: st.samples.map((x) => ({ ...x, verified: true })),
  }));
  return entry;
}

// 텍스트로부터 엔티티 추출 (정규식 + 사전 기반, SKILL 4.1)
export function extractEntities(text: string, productHint?: string): Entity[] {
  const entities: Entity[] = [];
  const lower = text.toLowerCase();

  // 수량 (단위가 붙은 숫자만 인정 — 전화번호/주문번호 등 무관한 숫자 오인식 방지)
  const qtyMatch = text.match(/(\d+)\s*(개|개수|ea|EA|개품)/);
  if (qtyMatch) {
    entities.push({ type: 'quantity', value: qtyMatch[1], raw: qtyMatch[0] });
  }
  const koreanQty: Record<string, string> = { 한개: '1', 두개: '2', 세개: '3', 네개: '4' };
  for (const [k, v] of Object.entries(koreanQty)) {
    if (text.includes(k)) entities.push({ type: 'quantity', value: v, raw: k });
  }

  // 전화번호
  const phoneMatch = text.match(/01[016789][0-9]{3,4}[\- ]?[0-9]{4}/);
  if (phoneMatch) entities.push({ type: 'phone', value: phoneMatch[0], raw: phoneMatch[0] });

  // 주문번호
  const orderMatch = text.match(/ORD-?\d{3,5}/i);
  if (orderMatch) entities.push({ type: 'order_id', value: orderMatch[0].toUpperCase(), raw: orderMatch[0] });

  // 상품명 (사전 + 힌트)
  if (productHint) {
    entities.push({ type: 'product', value: productHint, raw: productHint });
  }
  for (const entry of trainingStore.getState().dictionary) {
    if (entry.entityType === 'product') {
      for (const v of entry.values) {
        if (lower.includes(v.toLowerCase()) && !entities.some((e) => e.type === 'product')) {
          entities.push({ type: 'product', value: v, raw: v });
        }
      }
    }
  }

  // 중복 제거
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
