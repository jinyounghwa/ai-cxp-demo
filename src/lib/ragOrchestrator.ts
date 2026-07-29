import { seedRagDocs } from '@/data/ragDocs';
import type { RagDoc, RagAnswer, SentenceSpan, HallucinationLabel } from '@/types';
import { tokenize } from './intentEngine';

const SAFE_THRESHOLD = 0.18; // 검색 점수가 이 값 미만이면 안전 모드에서 거부
export const VERIFICATION_WEIGHT = { embedding: 0.6, selfCheck: 0.4 } as const;

// 문서 검색 (Vector DB를 대체하는 질문-커버리지 기반 유사도, SKILL 5.2)
export function retrieveDocs(question: string, topK = 3): { doc: RagDoc; score: number }[] {
  const qTokens = Array.from(new Set(tokenize(question)));
  if (qTokens.length === 0) return [];
  const scored = seedRagDocs.map((doc) => {
    const docTokens = new Set([...tokenize(doc.title), ...doc.keywords.flatMap(tokenize), ...tokenize(doc.content)]);
    // 1) 질문 토큰이 문서에 얼마나 커버되는가 (질문이 짧을수록 잘 잡힘)
    let hit = 0;
    for (const t of qTokens) if (docTokens.has(t)) hit++;
    const coverage = hit / qTokens.length;
    // 2) 문서 키워드가 질문에 직접 포함되는 가중치
    const normQ = question.toLowerCase().replace(/\s/g, '');
    let kwBonus = 0;
    for (const kw of doc.keywords) {
      if (normQ.includes(kw.toLowerCase().replace(/\s/g, ''))) kwBonus += 0.12;
    }
    return { doc, score: Math.min(1, coverage * 0.7 + kwBonus) };
  });
  return scored
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// 문서를 문장 단위로 분할
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|(?<=습니다)\s+|(?<=니다)\s+|(?<=합니다)\s+|(?<=가능합니다)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

// 답변 문장과 근거 문서 chunk 간 유사도 매칭 (SKILL 5.3, 1차 임베딩 유사도 대체)
function matchSentenceToDocs(sentence: string, docs: RagDoc[]): SentenceSpan {
  const sentTokens = tokenize(sentence);
  let best: { doc: RagDoc; snippet: string; score: number } | null = null;
  for (const doc of docs) {
    const sentences = splitSentences(doc.content);
    for (const s of sentences) {
      const sa = new Set(sentTokens), sb = new Set(tokenize(s));
      let inter = 0;
      for (const t of sa) if (sb.has(t)) inter++;
      const union = new Set([...sentTokens, ...sb]).size || 1;
      const score = inter / union;
      if (!best || score > best.score) best = { doc, snippet: s, score };
    }
  }
  return {
    text: sentence,
    score: best ? Math.round(best.score * 100) / 100 : 0,
    matchedDocId: best?.doc.id,
    matchedSnippet: best?.snippet,
  };
}

// self-check (SKILL 5.3, 2차): 답변의 명사성 토큰이 근거 문서에 포함되는 비율
function selfCheck(answer: string, docs: RagDoc[]): number {
  const ansTokens = tokenize(answer).filter((t) => t.length >= 2);
  if (ansTokens.length === 0) return 0;
  const docCorpus = new Set(docs.flatMap((d) => [...tokenize(d.title), ...tokenize(d.content), ...d.keywords]));
  let hit = 0;
  for (const t of ansTokens) if (docCorpus.has(t)) hit++;
  return Math.round((hit / ansTokens.length) * 100) / 100;
}

export function labelFromScore(score: number): HallucinationLabel {
  if (score >= 0.7) return '신뢰';
  if (score >= 0.4) return '주의';
  return '오류';
}

export type RagMode = 'safe' | 'force';

// RAG 파이프라인 실행 (SKILL 5.2 ~ 5.3)
export function runRag(question: string, mode: RagMode = 'safe'): RagAnswer {
  const retrieved = retrieveDocs(question, 3);
  const topScore = retrieved[0]?.score ?? 0;
  const docs = retrieved.map((r) => r.doc);

  // 안전 모드: 근거가 부족하면 거부 응답 (환각 방지)
  const refusalPhrases = [
    '해당 정보는 안내해 드릴 수 없습니다.',
    '고객센터(채팅/전화)로 문의해 주시면 정확히 안내해 드리겠습니다.',
  ];

  let answer: string;
  if (mode === 'safe' && (docs.length === 0 || topScore < SAFE_THRESHOLD)) {
    answer = `죄송합니다만, ${refusalPhrases[0]} 질문하신 내용에 대한 명확한 근거 자료가 현재 없습니다. ${refusalPhrases[1]}`;
  } else if (docs.length === 0) {
    // force 모드인데 문서가 아예 없는 경우 (강제 생성 → 환각 위험)
    answer = `질문하신 "${question}"에 대해 안내해 드리겠습니다. 일반적으로 관련 정책은 고객에게 유리하게 적용되며, 자세한 내용은 고객센터로 문의해 주시기 바랍니다.`;
  } else {
    // top 문서에서 질문과 가장 관련성 높은 문장 발췌
    const topDoc = docs[0];
    const qTokens = new Set(tokenize(question));
    const sentences = splitSentences(topDoc.content);
    let best = sentences[0] ?? topDoc.content;
    let bestOverlap = -1;
    for (const s of sentences) {
      const st = new Set(tokenize(s));
      let inter = 0;
      for (const t of qTokens) if (st.has(t)) inter++;
      if (inter > bestOverlap) { bestOverlap = inter; best = s; }
    }
    const refLabel = topDoc.category === '정책' ? '정책' : topDoc.category;
    answer = `${best} (${refLabel}: ${topDoc.title})`;
  }

  // 환각 검증
  const sentences = splitSentences(answer).map((s) => matchSentenceToDocs(s, docs));
  const embeddingScore = sentences.length
    ? Math.round((sentences.reduce((a, b) => a + b.score, 0) / sentences.length) * 100) / 100
    : 0;
  const selfCheckScore = selfCheck(answer, docs);

  // 거부 응답(근거 기반 안전 응답)은 환각 아님 → 높은 신뢰
  const isRefusal = answer.includes('안내해 드릴 수 없습니다');
  let hallucinationScore: number;
  if (isRefusal) {
    hallucinationScore = 0.92; // 안전한 거부
  } else {
    hallucinationScore =
      Math.round((VERIFICATION_WEIGHT.embedding * embeddingScore + VERIFICATION_WEIGHT.selfCheck * selfCheckScore) * 100) / 100;
  }

  return {
    question,
    answer,
    retrievedDocs: docs,
    sentences,
    embeddingScore: isRefusal ? 0.9 : embeddingScore,
    selfCheckScore: isRefusal ? 0.9 : selfCheckScore,
    hallucinationScore,
    label: labelFromScore(hallucinationScore),
  };
}
