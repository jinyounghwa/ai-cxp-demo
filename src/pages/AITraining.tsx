import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { trainingStore, verifySample, setSampleIntent, addManualSample, retrain } from '@/lib/trainingStore';
import { evaluateClassifier, classifyIntent } from '@/lib/intentEngine';
import type { IntentDef } from '@/types';
import { 
  GraduationCap, 
  RotateCw, 
  Target, 
  Brain, 
  FileText, 
  BookOpen, 
  Inbox, 
  PlusCircle, 
  BarChart3, 
  Activity, 
  Grid,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function AITraining() {
  const intents = useStore(trainingStore, (s) => s.intents);
  const samples = useStore(trainingStore, (s) => s.samples);
  const dictionary = useStore(trainingStore, (s) => s.dictionary);
  const retrainLog = useStore(trainingStore, (s) => s.retrainLog);
  const lastTrainedAt = useStore(trainingStore, (s) => s.lastTrainedAt);
  const [newText, setNewText] = useState('');
  const [newIntent, setNewIntent] = useState(intents[0]?.name ?? '');

  const unverified = samples.filter((s) => !s.verified);
  const verifiedSamples = samples.filter((s) => s.verified);

  // 검증된 샘플 기반 평가 (confusion matrix)
  const evalResult = evaluateClassifier(verifiedSamples.map((s) => ({ text: s.text, intent: s.intent })));
  const expectedIntentCounts: Record<string, number> = {};
  verifiedSamples.forEach((s) => { expectedIntentCounts[s.intent] = (expectedIntentCounts[s.intent] || 0) + 1; });

  const onAdd = () => {
    if (!newText.trim() || !newIntent) return;
    addManualSample(newText.trim(), newIntent);
    setNewText('');
  };

  return (
    <div className="page">
      <PageHeader
        icon={<GraduationCap className="text-primary" size={24} />}
        title="AI 인텐트/엔티티 학습"
        desc="신규 발화는 미검증 큐에 적재되고, 운영자가 인텐트/엔티티를 태깅·검증한 뒤 재학습을 트리거합니다. 분류기 정확도(confusion matrix)와 재학습 전후 변화를 확인하세요."
        actions={
          <div className="flex center gap-12">
            {lastTrainedAt && <span className="text-xs text-mute">마지막 재학습: {new Date(lastTrainedAt).toLocaleTimeString('ko-KR')}</span>}
            <button className="btn btn-primary flex center gap-4" onClick={() => retrain()}>
              <RotateCw size={14} className="animate-spin-slow" />
              <span>재학습 트리거</span>
            </button>
          </div>
        }
      />

      {/* 평가 지표 */}
      <div className="grid grid-4 mb-16">
        <div className="card stat relative overflow-hidden">
          <div className="flex between center">
            <div className="stat-label">분류 정확도</div>
            <Target size={18} className="text-green opacity-60" />
          </div>
          <div className="stat-value mt-8" style={{ color: 'var(--green)' }}>{Math.round(evalResult.accuracy * 100)}%</div>
          <div className="text-xs text-mute mt-4">{evalResult.correct}/{evalResult.total} (검증샘플)</div>
        </div>
        <div className="card stat relative overflow-hidden">
          <div className="flex between center">
            <div className="stat-label">정의된 인텐트</div>
            <Brain size={18} className="text-primary opacity-60" />
          </div>
          <div className="stat-value mt-8">{intents.length}</div>
          <div className="text-xs text-mute mt-4">목표 20~30개</div>
        </div>
        <div className="card stat relative overflow-hidden">
          <div className="flex between center">
            <div className="stat-label">학습 샘플</div>
            <div className="flex center"><FileText size={18} className="text-cyan opacity-60" /></div>
          </div>
          <div className="stat-value mt-8">{samples.length}</div>
          <div className="text-xs text-mute mt-4">검증 {verifiedSamples.length} / 미검증 {unverified.length}</div>
        </div>
        <div className="card stat relative overflow-hidden">
          <div className="flex between center">
            <div className="stat-label">엔티티 타입</div>
            <BookOpen size={18} className="text-accent opacity-60" />
          </div>
          <div className="stat-value mt-8">{dictionary.length}</div>
          <div className="text-xs text-mute mt-4">사전 기반 추출</div>
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        {/* 미검증 발화 큐 */}
        <div className="col" style={{ flex: 1.3 }}>
          <div className="card mb-12">
            <div className="card-title flex center between">
              <span className="flex center gap-8">
                <Inbox size={16} className="text-primary" />
                미검증 발화 큐
              </span>
              <span className="badge badge-yellow">{unverified.length}</span>
            </div>
            <p className="text-xs text-mute mb-12">챗봇/콜봇에서 저신뢰도 발화가 자동 적재됩니다. 인텐트를 확인하고 검증하세요.</p>
            {unverified.length === 0 ? (
              <div className="empty">미검증 발화가 없습니다. 챗봇에서 모호한 질문을 해보세요.</div>
            ) : (
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {unverified.map((s) => {
                  const predicted = classifyIntent(s.text);
                  const mismatch = predicted.intent !== s.intent;
                  return (
                    <div key={s.id} style={{ padding: '11px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, background: 'var(--bg-soft)' }}>
                      <div className="flex between center mb-8">
                        <span className="text-sm fw-600">“{s.text}”</span>
                        <span className="badge badge-gray">{s.source}</span>
                      </div>
                      <div className="flex gap-8 center mb-8" style={{ flexWrap: 'wrap' }}>
                        <span className="text-xs text-mute">예측:</span>
                        <span className={`badge flex center gap-4 ${mismatch ? 'badge-red' : 'badge-green'}`}>
                          {mismatch ? <AlertCircle size={10} /> : <Check size={10} />}
                          {predicted.intent} ({Math.round(predicted.confidence * 100)}%)
                        </span>
                        <span className="text-xs text-mute">→ 확정 인텐트:</span>
                        <select className="select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                          value={s.intent} onChange={(e) => setSampleIntent(s.id, e.target.value)}>
                          {intents.map((i) => <option key={i.id} value={i.name}>{i.label} ({i.name})</option>)}
                        </select>
                      </div>
                      <button className="btn btn-primary btn-sm flex center gap-2" onClick={() => verifySample(s.id)}>
                        <Check size={12} />
                        <span>검증 처리</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 수동 등록 */}
          <div className="card">
            <div className="card-title flex center gap-8">
              <PlusCircle size={16} className="text-primary" />
              학습 발화 수동 등록
            </div>
            <div className="flex gap-8 mb-8">
              <input className="input" placeholder="발화 예: 반품 어떻게 해요?" value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} />
              <select className="select" style={{ width: 'auto' }} value={newIntent} onChange={(e) => setNewIntent(e.target.value)}>
                {intents.map((i) => <option key={i.id} value={i.name}>{i.label}</option>)}
              </select>
              <button className="btn btn-primary flex center gap-2" onClick={onAdd}>
                <Plus size={14} />
                <span>추가</span>
              </button>
            </div>
          </div>
        </div>

        {/* Confusion matrix + 재학습 로그 */}
        <div className="col">
          <div className="card mb-12">
            <div className="card-title flex center gap-8">
              <BarChart3 size={16} className="text-primary" />
              인텐트별 분류 결과
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {Object.keys(expectedIntentCounts).map((gt) => {
                const row = evalResult.matrix[gt] || {};
                const total = expectedIntentCounts[gt];
                const correct = row[gt] || 0;
                const acc = total ? correct / total : 0;
                return (
                  <div key={gt} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex between center text-sm">
                      <span className="text-mono">{gt}</span>
                      <span className={acc === 1 ? 'badge badge-green' : 'badge badge-yellow'}>{correct}/{total}</span>
                    </div>
                    {Object.entries(row).filter(([k]) => k !== gt).map(([k, v]) => (
                      <div key={k} className="text-xs text-mute mt-8">→ 오분류 {k}: {v}건</div>
                    ))}
                  </div>
                );
              })}
              {Object.keys(expectedIntentCounts).length === 0 && <div className="empty">검증된 샘플이 없습니다</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-title flex center gap-8">
              <Activity size={16} className="text-primary" />
              재학습 로그
            </div>
            {retrainLog.length === 0 ? (
              <div className="empty">재학습 이력이 없습니다</div>
            ) : (
              retrainLog.slice(0, 8).map((r) => (
                <div key={r.id} className="flex gap-12" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <RotateCw size={14} className="text-mute mt-4" />
                  <div style={{ flex: 1 }}>
                    <div className="text-sm">{r.message}</div>
                    <div className="text-xs text-mute mt-4">{new Date(r.at).toLocaleString('ko-KR')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 인텐트 사전 */}
      <div className="card mt-16">
        <div className="card-title flex center gap-8">
          <Grid size={16} className="text-primary" />
          인텐트 정의 ({intents.length})
        </div>
        <div className="grid grid-3">
          {intents.map((i) => <IntentCard key={i.id} intent={i} />)}
        </div>
      </div>
    </div>
  );
}

function IntentCard({ intent }: { intent: IntentDef }) {
  return (
    <div style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div className="flex between center mb-8">
        <span className="fw-600 text-sm">{intent.label}</span>
        <span className="badge badge-gray">{intent.category}</span>
      </div>
      <div className="text-xs text-mono text-mute mb-8">{intent.name}</div>
      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        {intent.keywords.slice(0, 5).map((k) => <span key={k} className="tag">{k}</span>)}
      </div>
    </div>
  );
}

