import { useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { runRag, type RagMode } from '@/lib/ragOrchestrator';
import { seedTestCases } from '@/data/ragDocs';
import type { SentenceSpan } from '@/types';
import { 
  ShieldAlert, 
  Search, 
  MessageSquare, 
  BookOpen, 
  ListChecks, 
  Play, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

function scoreClass(score: number): string {
  if (score >= 0.7) return 'hl-green';
  if (score >= 0.4) return 'hl-yellow';
  return 'hl-red';
}

function labelBadge(label: string): string {
  return label === '신뢰' ? 'badge-green' : label === '주의' ? 'badge-yellow' : 'badge-red';
}

export default function RagVerification() {
  const [mode, setMode] = useState<RagMode>('safe');
  const [singleQ, setSingleQ] = useState(seedTestCases[0].question);
  const singleResult = useMemo(() => runRag(singleQ, mode), [singleQ, mode]);

  // 일괄 테스트 (30문항) — 사용자가 "전체 실행"을 눌러야 리포트가 채워짐
  const [ran, setRan] = useState(false);
  const results = useMemo(() => {
    if (!ran) return [];
    return seedTestCases.map((tc) => ({ tc, rag: runRag(tc.question, mode) }));
  }, [mode, ran]);

  // 요약 통계
  const stats = useMemo(() => {
    const normal = results.filter((r) => !r.tc.isTrap);
    const trap = results.filter((r) => r.tc.isTrap);
    const normalReliable = normal.filter((r) => r.rag.label === '신뢰').length;
    const trapSafe = trap.filter((r) => r.rag.label === '신뢰').length; // 거부 응답 = 안전
    const byLabel = { 신뢰: 0, 주의: 0, 오류: 0 };
    results.forEach((r) => { byLabel[r.rag.label]++; });
    return {
      total: results.length,
      reliable: byLabel['신뢰'],
      attention: byLabel['주의'],
      error: byLabel['오류'],
      hallucinationRate: results.length ? (byLabel['주의'] + byLabel['오류']) / results.length : 0,
      normalAccuracy: normal.length ? normalReliable / normal.length : 0,
      trapSafety: trap.length ? trapSafe / trap.length : 0,
    };
  }, [results]);

  const runBatch = () => setRan(true);

  return (
    <div className="page">
      <PageHeader
        icon={<ShieldAlert className="text-primary" size={24} />}
        title="RAG / sLLM 환각검증"
        desc="RAG 답변이 근거 문서에 실제로 기반했는지 자동 검증합니다. 답변 문장별로 근거 일치도를 하이라이트하고, 30문항 테스트셋으로 정확도/환각률을 리포트합니다. (함정 질문 14건 포함)"
        actions={
          <div className="flex gap-8 center">
            <span className="text-xs text-mute">응답 모드:</span>
            <div className="flex gap-6">
              <button className={`btn btn-sm ${mode === 'safe' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('safe')}>안전(거부가능)</button>
              <button className={`btn btn-sm ${mode === 'force' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('force')}>강제생성(환각위험)</button>
            </div>
          </div>
        }
      />

      {/* 단일 검증 */}
      <div className="card mb-16">
        <div className="card-title flex center gap-8">
          <Search size={16} className="text-primary" />
          단일 질의 검증
        </div>
        <div className="flex gap-8 mb-12">
          <input className="input" value={singleQ} onChange={(e) => setSingleQ(e.target.value)} placeholder="질문을 입력하거나 아래 테스트셋에서 선택하세요" />
          <button className="btn btn-ghost flex center gap-2" onClick={() => setSingleQ(seedTestCases[Math.floor(Math.random() * seedTestCases.length)].question)}>
            <RefreshCw size={12} />
            <span>랜덤 질문</span>
          </button>
        </div>

        <div className="row" style={{ alignItems: 'flex-start' }}>
          {/* 좌: 답변 + 문장 하이라이트 */}
          <div className="col">
            <div className="section-label flex center gap-4">
              <MessageSquare size={12} />
              생성된 답변 (문장별 근거 일치도)
            </div>
            <div className="card" style={{ background: 'var(--bg-soft)' }}>
              <div className="flex between center mb-12">
                <span className="text-sm fw-600">판정</span>
                <span className={`badge flex center gap-4 ${labelBadge(singleResult.label)}`}>
                  {singleResult.label === '신뢰' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                  {singleResult.label} · 환각점수 {Math.round(singleResult.hallucinationScore * 100)}
                </span>
              </div>
              <div style={{ lineHeight: 2 }}>
                {singleResult.sentences.map((s, i) => (
                  <SentenceSpanView key={i} span={s} />
                ))}
              </div>
              <div className="divider" />
              <div className="grid grid-2 text-xs gap-16">
                <ScoreLine label="임베딩 유사도(1차)" value={singleResult.embeddingScore} />
                <ScoreLine label="Self-check(2차)" value={singleResult.selfCheckScore} />
              </div>
              <Legend />
            </div>
          </div>

          {/* 우: 검색된 근거 문서 */}
          <div className="col">
            <div className="section-label flex center gap-4">
              <BookOpen size={12} />
              검색된 근거 문서 ({singleResult.retrievedDocs.length})
            </div>
            {singleResult.retrievedDocs.length === 0 ? (
              <div className="card empty">검색된 근거 문서가 없습니다 → 안전 모드에서는 거부 응답으로 환각을 방지합니다.</div>
            ) : (
              singleResult.retrievedDocs.map((d) => (
                <div key={d.id} className="card mb-8" style={{ padding: 12 }}>
                  <div className="flex between center mb-8">
                    <span className="fw-600 text-sm">{d.title}</span>
                    <span className="badge badge-gray">{d.category}</span>
                  </div>
                  <div className="text-xs text-dim">{d.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 일괄 테스트 */}
      <div className="card">
        <div className="card-title flex center between">
          <span className="flex center gap-8">
            <ListChecks size={16} className="text-primary" />
            테스트셋 일괄 실행 ({seedTestCases.length}문항)
          </span>
          <div className="flex gap-8 center">
            <span className={`badge ${mode === 'safe' ? 'badge-primary' : 'badge-yellow'}`}>{mode === 'safe' ? '안전 모드' : '강제 모드'}</span>
            <button className="btn btn-primary btn-sm flex center gap-2" onClick={runBatch}>
              <Play size={12} fill="white" />
              <span>전체 실행</span>
            </button>
          </div>
        </div>

        {!ran ? (
          <div className="empty">▶ 전체 실행을 누르면 {seedTestCases.length}문항에 대한 정확도/환각률 리포트가 생성됩니다.</div>
        ) : (
          <>
            {/* 요약 */}
            <div className="grid grid-4 mb-16">
              <Metric label="전체 신뢰율" value={`${Math.round((stats.reliable / stats.total) * 100)}%`} color="var(--green)" sub={`${stats.reliable}/${stats.total}`} icon={<ShieldCheck size={18} />} />
              <Metric label="환각률 (주의+오류)" value={`${Math.round(stats.hallucinationRate * 100)}%`} color="var(--red)" sub={`주의 ${stats.attention} · 오류 ${stats.error}`} icon={<AlertTriangle size={18} />} />
              <Metric label="정상질문 정답률" value={`${Math.round(stats.normalAccuracy * 100)}%`} color="var(--cyan)" sub="근거기반 정답" icon={<ShieldCheck size={18} />} />
              <Metric label="함정질문 안전거부율" value={`${Math.round(stats.trapSafety * 100)}%`} color="var(--primary)" sub="지어내지 않음" icon={<HelpCircle size={18} />} />
            </div>

            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>ID</th><th>질문</th><th>예상 사실</th>
                    <th style={{ width: 90 }}>판정</th><th style={{ width: 70 }}>환각점수</th><th style={{ width: 60 }}>유형</th>
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(({ tc, rag }) => (
                    <tr key={tc.id} style={{ cursor: 'pointer' }} onClick={() => setSingleQ(tc.question)}>
                      <td className="text-mono text-xs">{tc.id}</td>
                      <td className="text-sm">{tc.question}</td>
                      <td className="text-xs text-mute">{tc.expectedFact}</td>
                      <td><span className={`badge ${labelBadge(rag.label)}`}>{rag.label}</span></td>
                      <td className="text-mono text-xs">{Math.round(rag.hallucinationScore * 100)}</td>
                      <td>{tc.isTrap ? <span className="badge badge-yellow">함정</span> : <span className="badge badge-gray">정상</span>}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm flex center gap-2" onClick={(e) => { e.stopPropagation(); setSingleQ(tc.question); }}>
                          <span>검증</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-mute mt-12">행을 클릭하면 상단 단일 검증 패널에서 문장별 하이라이트를 확인할 수 있습니다. 모드를 바꾸면 결과가 자동으로 다시 계산됩니다.</div>
          </>
        )}
      </div>
    </div>
  );
}

function SentenceSpanView({ span }: { span: SentenceSpan }) {
  return (
    <span className={`hl ${scoreClass(span.score)}`} title={span.matchedSnippet ? `근거: ${span.matchedSnippet}` : '근거 없음'}>
      {span.text}{' '}
    </span>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.7 ? 'var(--green)' : value >= 0.4 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div>
      <div className="flex between center"><span className="text-mute">{label}</span><span className="fw-600" style={{ color }}>{pct}%</span></div>
      <div className="bar mt-8"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-12 mt-12 text-xs">
      <span className="flex gap-6 center"><span className="hl hl-green">&nbsp;&nbsp;</span> 일치(신뢰)</span>
      <span className="flex gap-6 center"><span className="hl hl-yellow">&nbsp;&nbsp;</span> 부분일치(주의)</span>
      <span className="flex gap-6 center"><span className="hl hl-red">&nbsp;&nbsp;</span> 근거없음(오류)</span>
    </div>
  );
}

function Metric({ 
  label, 
  value, 
  color, 
  sub,
  icon
}: { 
  label: string; 
  value: string; 
  color: string; 
  sub: string;
  icon?: React.ReactNode
}) {
  return (
    <div className="card stat" style={{ padding: 14 }}>
      <div className="flex between center">
        <div className="stat-label">{label}</div>
        {icon && <div className="text-mute opacity-60">{icon}</div>}
      </div>
      <div className="stat-value mt-8" style={{ color, fontSize: 22 }}>{value}</div>
      <div className="text-xs text-mute mt-4">{sub}</div>
    </div>
  );
}

