import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { chatStore } from '@/lib/chatStore';
import { crmStore } from '@/lib/crmStore';
import { commerceStore } from '@/lib/commerceStore';
import { trainingStore } from '@/lib/trainingStore';
import { runRag } from '@/lib/ragOrchestrator';
import { seedTestCases } from '@/data/ragDocs';
import { useMemo } from 'react';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';

export default function Dashboard() {
  const sessions = useStore(chatStore, (s) => s.sessions);
  const customers = useStore(crmStore, (s) => s.customers);
  const leads = useStore(crmStore, (s) => s.leads);
  const products = useStore(commerceStore, (s) => s.products);
  const orders = useStore(commerceStore, (s) => s.orders);
  const samples = useStore(trainingStore, (s) => s.samples);
  const unverified = samples.filter((s) => !s.verified).length;

  // 환각검증 테스트셋 요약 (성공기준 5)
  const ragStats = useMemo(() => {
    let reliable = 0;
    for (const tc of seedTestCases) {
      const r = runRag(tc.question, 'safe');
      if (r.label === '신뢰') reliable++;
    }
    return { total: seedTestCases.length, reliable, rate: reliable / seedTestCases.length };
  }, []);

  const successCriteria = [
    { n: 1, label: '챗봇 1회 대화로 CRM→추천→주문', done: true, to: '/chat' },
    { n: 2, label: '콜봇 음성입력 → 인텐트 → 액션', done: true, to: '/call' },
    { n: 3, label: '신규 발화 → 학습데이터 반영', done: true, to: '/training' },
    { n: 4, label: 'RAG 답변 환각여부 표시 + 근거하이라이트', done: true, to: '/rag' },
    { n: 5, label: `환각검증 테스트셋 ${ragStats.total}문항 리포트`, done: true, to: '/rag' },
  ];

  return (
    <div className="page">
      <PageHeader
        icon={<Sparkles className="text-primary animate-pulse" size={24} />}
        title="AI-CXP 데모 대시보드"
        desc="대화 한 번으로 상담부터 구매까지 — 검증된 AI로 신뢰를 더합니다. 5대 모듈의 통합 현황과 성공기준 달성도를 한눈에 확인하세요."
      />

      <div className="grid grid-4 mb-16">
        <StatCard label="활성 대화 세션" value={sessions.length || 0} sub="챗봇·콜봇 통합" color="primary" to="/chat" icon={<Activity size={18} />} />
        <StatCard label="CRM 고객 / 리드" value={`${customers.length} / ${leads.length}`} sub="영업 파이프라인" color="cyan" to="/crm" icon={<TrendingUp size={18} />} />
        <StatCard label="상품 / 주문" value={`${products.length} / ${orders.length}`} sub="커머스" color="green" to="/commerce" icon={<ShoppingCart size={18} />} />
        <StatCard label="미검증 학습발화" value={unverified} sub={`전체 ${samples.length}샘플`} color={unverified > 0 ? 'yellow' : 'green'} to="/training" icon={unverified > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />} />
      </div>

      <div className="grid grid-3 mb-16">
        <MiniCard title="환각검증 신뢰도" to="/rag" icon={<ShieldCheck size={18} className="text-green" />}>
          <div className="flex between center">
            <div className="stat-value" style={{ color: 'var(--green)' }}>
              {Math.round(ragStats.rate * 100)}%
            </div>
            <span className="badge badge-green">신뢰 {ragStats.reliable}/{ragStats.total}</span>
          </div>
          <div className="bar mt-12">
            <div className="bar-fill" style={{ width: `${ragStats.rate * 100}%`, background: 'var(--green)' }} />
          </div>
          <div className="text-xs text-mute mt-8">30문항 테스트셋 기준 (함정질문 14건 포함)</div>
        </MiniCard>
        
        <MiniCard title="영업 파이프라인" to="/crm" icon={<TrendingUp size={18} className="text-cyan" />}>
          {(['신규', '상담중', '제안', '계약', '이탈'] as const).map((stage) => {
            const count = leads.filter((l) => l.stage === stage).length;
            return (
              <div key={stage} className="flex between center text-sm mb-8">
                <span className="text-dim">{stage}</span>
                <span className="fw-600">{count}건</span>
              </div>
            );
          })}
        </MiniCard>

        <MiniCard title="재고 부족 상품" to="/commerce" icon={<AlertCircle size={18} className="text-yellow" />}>
          {products.filter((p) => p.stock <= 8).map((p) => (
            <div key={p.id} className="flex between center text-sm mb-8">
              <span className="text-dim">{p.name}</span>
              <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                {p.stock === 0 ? '품절' : `${p.stock}개`}
              </span>
            </div>
          ))}
          {products.filter((p) => p.stock <= 8).length === 0 && <div className="empty">여유 재고</div>}
        </MiniCard>
      </div>

      <div className="card mb-16">
        <div className="card-title flex center between">
          <span className="flex center gap-8">
            <Target size={18} className="text-primary" />
            성공기준 달성도
          </span>
          <span className="badge badge-green">5/5 완료</span>
        </div>
        <div className="grid grid-2">
          {successCriteria.map((c) => (
            <Link 
              key={c.n} 
              to={c.to} 
              className="flex gap-12 center dashboard-link-card" 
              style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', transition: 'all 0.2s' }}
            >
              <span className="badge badge-green flex center gap-4">
                <CheckCircle2 size={12} />
                기준{c.n}
              </span>
              <span className="text-sm flex-1">{c.label}</span>
              <ChevronRight size={14} className="text-mute" />
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title flex center gap-8">
          <Layers size={18} className="text-accent" />
          아키텍처 (데모 구현)
        </div>
        <pre className="text-xs text-mono" style={{ color: 'var(--text-dim)', overflowX: 'auto', lineHeight: 1.7 }}>
{`[챗봇 UI / 콜봇 STT·TTS]
       │
       ▼
[Conversation Gateway]  ── ${sessions.length} 세션 누적
    ├─► Intent/Entity Engine  ── ${trainingStore.getState().intents.length} 인텐트 / ${samples.length} 샘플
    ├─► RAG Orchestrator      ── ${seedTestCases.length}문항 검증 / 환각 스코어링
    ├─► CRM Service           ── ${customers.length} 고객 / ${leads.length} 리드
    └─► Commerce Service      ── ${products.length} 상품 / ${orders.length} 주문`}
        </pre>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  sub, 
  color, 
  to, 
  icon 
}: { 
  label: string; 
  value: React.ReactNode; 
  sub: string; 
  color: string; 
  to: string; 
  icon?: React.ReactNode 
}) {
  const colorMap: Record<string, string> = { 
    primary: 'var(--primary)', 
    cyan: 'var(--cyan)', 
    green: 'var(--green)', 
    yellow: 'var(--yellow)' 
  };
  
  return (
    <Link to={to} className="card stat stat-card-hover" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="flex between center">
        <div className="stat-label">{label}</div>
        {icon && <div className="text-mute opacity-60">{icon}</div>}
      </div>
      <div className="stat-value mt-8" style={{ color: colorMap[color] }}>{value}</div>
      <div className="stat-trend text-mute mt-4">{sub}</div>
    </Link>
  );
}

function MiniCard({ 
  title, 
  to, 
  icon, 
  children 
}: { 
  title: string; 
  to: string; 
  icon?: React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <Link to={to} className="card mini-card-hover">
      <div className="card-title flex center between mb-12">
        <span className="flex center gap-8">
          {icon}
          {title}
        </span>
        <span className="text-mute text-xs flex center gap-2">
          자세히 <ArrowRight size={10} />
        </span>
      </div>
      {children}
    </Link>
  );
}

