import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { uid } from '@/lib/store';
import { chatStore, startSession, addMessage } from '@/lib/chatStore';
import { handleUtterance, pushUserMessage, resolveDemoCustomer } from '@/lib/conversationEngine';
import type { BotMessage, ConversationSession } from '@/types';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Headphones, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Info,
  CheckCircle2
} from 'lucide-react';

const QUICK = [
  '내 정보 보여줘',
  '상품 추천해줘',
  '헤드폰 재고 있어?',
  '헤드폰 1개 주문할게',
  '교환 정책 알려줘',
  '내 주문 어디야?',
  '주문 취소해줘',
  '쿠폰 있나요?',
  '상담사 연결해줘',
  '내일 날씨 어때?',
];

export default function Chatbot() {
  const sessions = useStore(chatStore, (s) => s.sessions);
  const activeId = useStore(chatStore, (s) => s.activeSessionId);
  const messagesMap = useStore(chatStore, (s) => s.messages);
  const [input, setInput] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<BotMessage | null>(null);
  const initRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId) || null;
  const messages = activeId ? (messagesMap[activeId] || []) : [];
  const lastBot = [...messages].reverse().find((m) => m.role === 'bot') || null;

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const cust = resolveDemoCustomer();
    startSession('chat', cust.name, cust.id);
  }, []);

  // 세션 시작 직후 환영 메시지 한 번 추가
  useEffect(() => {
    if (!activeSession) return;
    if (messages.length === 0) {
      addMessage({
        id: uid('M'), sessionId: activeSession.id, role: 'bot',
        text: `안녕하세요 ${activeSession.customerName}님! AI-CXP 상담봇입니다. 😊\n상품 문의, 주문, 배송, 정책 등 무엇이든 편하게 말씀해 주세요.`,
        createdAt: Date.now(), intent: 'greeting', confidence: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = (text: string) => {
    if (!activeSession || !text.trim()) return;
    if (activeSession.status !== 'active') return;
    pushUserMessage(activeSession, text);
    setTimeout(() => {
      handleUtterance(activeSession, text);
    }, 250);
    setInput('');
  };

  const inspected = selectedMsg || lastBot;

  return (
    <div className="page">
      <PageHeader
        icon={<MessageSquare className="text-primary" size={24} />}
        title="챗봇 콘솔"
        desc="텍스트 기반 대화로 CRM 조회 → 상품 추천 → 주문 생성까지 한 흐름에서 처리합니다. 우측 패널에서 인텐트 분류·엔티티·RAG 검증 결과를 실시간으로 확인하세요."
        actions={
          activeSession && (
            <span className={`badge ${activeSession.status === 'active' ? 'badge-green' : activeSession.status === 'transferred' ? 'badge-yellow' : 'badge-gray'}`}>
              {activeSession.status === 'active' ? '● 상담 중' : activeSession.status === 'transferred' ? '↗ 상담사 이관' : '■ 종료'}
            </span>
          )
        }
      />

      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="col" style={{ flex: 1.6 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="quick-chips">
              {QUICK.map((q) => (
                <button key={q} className="chip" onClick={() => send(q)} disabled={activeSession?.status !== 'active'}>
                  {q}
                </button>
              ))}
            </div>
            <div className="chat-window">
              <div className="chat-messages">
                {messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} onClick={() => m.role === 'bot' && setSelectedMsg(m)} />
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input">
                <input
                  className="input"
                  placeholder={activeSession?.status === 'active' ? '메시지를 입력하세요… (예: 마우스 2개 주문할게)' : '세션이 종료되었습니다'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                  disabled={activeSession?.status !== 'active'}
                />
                <button className="btn btn-primary" onClick={() => send(input)} disabled={activeSession?.status !== 'active'}>
                  <Send size={14} />
                  <span>전송</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col" style={{ flex: 1, maxWidth: 420 }}>
          <AnalysisPanel session={activeSession} msg={inspected} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onClick }: { msg: BotMessage; onClick: () => void }) {
  const conf = msg.confidence ?? 0;
  const confBadge =
    conf >= 0.7 ? 'badge-green' : conf >= 0.4 ? 'badge-yellow' : 'badge-red';
  return (
    <div className={`msg ${msg.role}`}>
      <div className="msg-avatar flex center justify-center">
        {msg.role === 'bot' ? (
          <Bot size={16} />
        ) : msg.role === 'agent' ? (
          <Headphones size={16} />
        ) : (
          <User size={16} />
        )}
      </div>
      <div>
        <div className="msg-bubble" onClick={onClick} style={msg.role === 'bot' ? { cursor: 'pointer' } : {}}>
          {msg.text}
          {msg.rag && (
            <div className="mt-8 flex gap-6">
              <span className={`badge flex center gap-4 ${msg.rag.label === '신뢰' ? 'badge-green' : msg.rag.label === '주의' ? 'badge-yellow' : 'badge-red'}`}>
                {msg.rag.label === '신뢰' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {msg.rag.label} · 환각점수 {Math.round(msg.rag.hallucinationScore * 100)}
              </span>
            </div>
          )}
        </div>
        {msg.role === 'bot' && msg.intent && (
          <div className="msg-meta">
            <span>intent: <b>{msg.intent}</b></span>
            <span className={`badge ${confBadge}`}>신뢰도 {Math.round(conf * 100)}%</span>
            {msg.entities && msg.entities.length > 0 && (
              <span>entity: {msg.entities.map((e) => `${e.type}=${e.value}`).join(', ')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisPanel({ session, msg }: { session: ConversationSession | null; msg: BotMessage | null }) {
  return (
    <div style={{ position: 'sticky', top: 20 }}>
      <div className="card mb-12">
        <div className="card-title flex center gap-8">
          <Search size={16} className="text-primary" />
          <span>응답 분석</span>
        </div>
        {!msg ? (
          <div className="empty">봇 응답을 클릭하면 상세 분석이 표시됩니다.</div>
        ) : (
          <div className="text-sm">
            <Row label="분류된 인텐트" value={msg.intent || '-'} />
            <Row label="신뢰도" value={`${Math.round((msg.confidence ?? 0) * 100)}%`} />
            {msg.entities && msg.entities.length > 0 ? (
              <div className="flex gap-8 mt-8" style={{ flexWrap: 'wrap' }}>
                {msg.entities.map((e, i) => (
                  <span key={i} className="badge badge-primary">{e.type}: {e.value}</span>
                ))}
              </div>
            ) : <div className="text-mute mt-8 text-xs">추출된 엔티티 없음</div>}
          </div>
        )}
      </div>

      {msg?.rag && (
        <div className="card mb-12">
          <div className="card-title flex center gap-8">
            <ShieldCheck size={16} className="text-green" />
            <span>RAG 환각검증 결과</span>
          </div>
          <Row label="최종 판정" value={
            <span className={`badge flex center gap-4 ${msg.rag.label === '신뢰' ? 'badge-green' : msg.rag.label === '주의' ? 'badge-yellow' : 'badge-red'}`}>
              {msg.rag.label === '신뢰' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {msg.rag.label}
            </span>
          } />
          <ScoreRow label="임베딩 유사도(1차)" value={msg.rag.embeddingScore} />
          <ScoreRow label="Self-check(2차)" value={msg.rag.selfCheckScore} />
          <ScoreRow label="환각점수(가중평균)" value={msg.rag.hallucinationScore} />
          <div className="section-label mt-12">검색된 근거 문서 ({msg.rag.retrievedDocs.length})</div>
          {msg.rag.retrievedDocs.map((d) => (
            <div key={d.id} className="text-xs text-dim mb-8" style={{ padding: '8px', background: 'var(--bg-soft)', borderRadius: 6 }}>
              <b style={{ color: 'var(--text)' }}>{d.title}</b> · {d.category}
              <div className="mt-8">{d.content.slice(0, 80)}…</div>
            </div>
          ))}
        </div>
      )}

      {session && (
        <div className="card">
          <div className="card-title flex center gap-8">
            <Info size={16} className="text-cyan" />
            <span>세션 정보</span>
          </div>
          <Row label="세션ID" value={<span className="text-mono text-xs">{session.id}</span>} />
          <Row label="채널" value={session.channel === 'chat' ? '텍스트 챗봇' : '음성 콜봇'} />
          <Row label="고객" value={`${session.customerName} (${session.userId})`} />
          <Row label="메시지 수" value={String(session.messageCount)} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex between center" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="text-mute">{label}</span>
      <span className="fw-600">{value}</span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.7 ? 'var(--green)' : value >= 0.4 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ padding: '7px 0' }}>
      <div className="flex between center text-sm">
        <span className="text-mute">{label}</span>
        <span className="fw-600" style={{ color }}>{pct}%</span>
      </div>
      <div className="bar mt-8"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

