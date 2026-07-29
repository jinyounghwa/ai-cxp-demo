import { trainingStore, extractEntities } from './trainingStore';
import type { IntentResult, Entity } from '@/types';

// 토큰화 (한글은 형태소 분석 대신 음절/공백 기반 n-gram 토큰화 사용)
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase().replace(/[^가-힣a-z0-9\s]/g, ' ').trim();
  const words = lower.split(/\s+/).filter(Boolean);
  // 음절 바이그램 보조 토큰 (한국어 부분 매칭 강화)
  const bigrams: string[] = [];
  for (const w of words) {
    if (/[가-힣]/.test(w) && w.length >= 2) {
      for (let i = 0; i < w.length - 1; i++) bigrams.push(w.slice(i, i + 2));
    }
  }
  return [...words, ...bigrams];
}

// 두 토큰 집합의 Jaccard 유사도
function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = new Set([...a, ...b]).size || 1;
  return inter / union;
}

// 인텐트 분류 (SKILL 4.1, 경량 분류기)
export function classifyIntent(text: string): IntentResult {
  const { intents } = trainingStore.getState();
  const norm = text.toLowerCase().replace(/\s+/g, '');
  const tokens = tokenize(text);
  const scores: Record<string, number> = {};

  for (const intent of intents) {
    let score = 0;
    // 1) 키워드 매칭 (정확도 가중)
    for (const kw of intent.keywords) {
      const kwLower = kw.toLowerCase();
      if (norm.includes(kwLower.replace(/\s+/g, ''))) score += 2.0;
      else if (tokens.some((t) => t.length >= 2 && kwLower.includes(t))) score += 0.3;
    }
    // 2) 학습 샘플과의 유사도
    let bestSim = 0;
    for (const sample of intent.samples) {
      const sim = jaccard(tokens, tokenize(sample));
      if (sim > bestSim) bestSim = sim;
    }
    score += bestSim * 3.0;
    scores[intent.name] = Math.round(score * 100) / 100;
  }

  // 상위 인텐트 정렬
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  const bestScore = top?.[1] ?? 0;
  const secondScore = second?.[1] ?? 0;

  // 신뢰도: 점수가 아예 없으면 매우 낮게, 상위/차상위 비율 기반 부드러운 정규화
  let confidence: number;
  if (bestScore <= 0.3) {
    confidence = 0.2; // 사실상 미분류
  } else {
    const ratio = bestScore / (bestScore + secondScore + 0.0001);
    confidence = Math.min(0.98, 0.4 + ratio * 0.5 + Math.min(bestScore / 12, 0.1));
  }

  // 상품 힌트로 엔티티 보강
  let entities: Entity[] = [];
  const productHintMatch = norm.match(/(헤드폰|워치|스마트워치|키보드|웹캠|ssd|의자|마우스|청소기|카메라)/);
  entities = extractEntities(text, productHintMatch?.[1]);

  return {
    intent: top?.[0] ?? 'fallback',
    confidence: Math.round(confidence * 100) / 100,
    scores,
    entities,
  };
}

// 분류기를 평가 (SKILL 4.4, confusion matrix용)
export function evaluateClassifier(samples: { text: string; intent: string }[]) {
  const matrix: Record<string, Record<string, number>> = {};
  let correct = 0;
  for (const s of samples) {
    const result = classifyIntent(s.text);
    matrix[s.intent] = matrix[s.intent] || {};
    matrix[s.intent][result.intent] = (matrix[s.intent][result.intent] || 0) + 1;
    if (result.intent === s.intent) correct++;
  }
  return {
    matrix,
    accuracy: samples.length ? correct / samples.length : 0,
    total: samples.length,
    correct,
  };
}
