import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { uid } from '@/lib/store';
import { chatStore, startSession, addMessage } from '@/lib/chatStore';
import { handleUtterance, pushUserMessage, resolveDemoCustomer } from '@/lib/conversationEngine';
import type { BotMessage, ConversationSession } from '@/types';
import type { HandleResult } from '@/lib/conversationEngine';
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  Brain, 
  Shuffle, 
  Volume2, 
  Send,
  Settings,
  History,
  Bot,
  User,
  ShieldCheck,
  ShieldAlert,
  Search,
  Info,
  Clock,
  Play,
  MessageSquare
} from 'lucide-react';

// Web Speech API 타입 (브라우저 미지원 시 폴백)
type SR = any;
const getSpeechRecognition = (): SR | null => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

type Stage = 'idle' | 'stt' | 'intent' | 'action' | 'tts';

const ACTION_LABEL: Record<string, string> = {
  ordered: '커머스 · 주문 생성',
  cancelled: '커머스 · 주문 취소',
  rag: 'RAG · 환각검증 파이프라인',
  transferred: '상담사 이관',
  complaint: 'CRM · 민원 접수',
};

const ACTION_ICON: Record<string, React.ReactNode> = {
  ordered: <Shuffle size={14} className="text-green" />,
  cancelled: <Shuffle size={14} className="text-red" />,
  rag: <ShieldCheck size={14} className="text-green" />,
  transferred: <PhoneCall size={14} className="text-yellow" />,
  complaint: <Info size={14} className="text-cyan" />,
};

const METER_BARS = 14;

export default function Callbot() {
  const sessions = useStore(chatStore, (s) => s.sessions);
  const activeId = useStore(chatStore, (s) => s.activeSessionId);
  const messagesMap = useStore(chatStore, (s) => s.messages);

  const [callActive, setCallActive] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [partial, setPartial] = useState('');
  const [manual, setManual] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<HandleResult | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<BotMessage | null>(null);
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // TTS 음성 설정
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>('');
  const [rate, setRate] = useState(1.05);
  const [pitch, setPitch] = useState(1);

  // 오디오 레벨 미터
  const [meterLevels, setMeterLevels] = useState<number[]>(Array(METER_BARS).fill(0));
  const meterRafRef = useRef<number | null>(null);
  const meterFallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recognitionRef = useRef<SR | null>(null);
  const sessionRef = useRef<ConversationSession | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 이벤트 콜백 안에서 최신 stage 값을 읽기 위한 ref
  const stageRef = useRef<Stage>('idle');
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const listening = stage === 'stt';
  const callSession = sessions.find((s) => s.id === activeId && s.channel === 'call') || null;
  sessionRef.current = callSession;
  const callHistory = sessions.filter((s) => s.channel === 'call').sort((a, b) => b.startedAt - a.startedAt);
  const transcriptSession = (viewSessionId && sessions.find((s) => s.id === viewSessionId)) || callSession;
  const messages = transcriptSession ? (messagesMap[transcriptSession.id] || []) : [];
  const viewingPast = !!transcriptSession && transcriptSession.id !== callSession?.id;
  const lastBotMsg = [...messages].reverse().find((m) => m.role === 'bot') || null;
  const inspected = selectedMsg || lastBotMsg;

  useEffect(() => {
    setSttSupported(!!getSpeechRecognition());
  }, []);

  // 음성 목록 로드 (Chrome은 비동기로 채워짐)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const list = speechSynthesis.getVoices();
      setVoices(list);
      if (!voiceURI && list.length) {
        const ko = list.find((v) => v.lang?.toLowerCase().startsWith('ko'));
        setVoiceURI((ko || list[0]).voiceURI);
      }
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [callActive]);

  useEffect(() => () => { stopMeter(); }, []);

  // 진행 중인 통화가 없으면 최근 통화 이력을 기본으로 보여준다 (통화기록/응답분석 빈 화면 방지)
  useEffect(() => {
    if (!callSession && !viewSessionId && callHistory.length > 0) {
      setViewSessionId(callHistory[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSession, callHistory.length]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── 오디오 레벨 미터 ──────────────────────────────
  const startMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const chunk = Math.floor(data.length / METER_BARS) || 1;
        const bars = Array.from({ length: METER_BARS }, (_, i) => {
          const slice = data.slice(i * chunk, i * chunk + chunk);
          const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
          return Math.min(1, avg / 160);
        });
        setMeterLevels(bars);
        meterRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // 마이크 접근 불가(권한 거부 등) → 장식용 애니메이션으로 대체
      meterFallbackRef.current = setInterval(() => {
        setMeterLevels(Array.from({ length: METER_BARS }, () => Math.random() * 0.7));
      }, 110);
    }
  };

  const stopMeter = () => {
    if (meterRafRef.current) { cancelAnimationFrame(meterRafRef.current); meterRafRef.current = null; }
    if (meterFallbackRef.current) { clearInterval(meterFallbackRef.current); meterFallbackRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setMeterLevels(Array(METER_BARS).fill(0));
  };

  // ── TTS ──────────────────────────────
  const speak = (text: string) => {
    setStage('tts');
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text.replace(/[😒✅🔄🙏😊🛒🛡️🎧📝👋]/gu, ''));
      const v = voices.find((x) => x.voiceURI === voiceURI);
      if (v) u.voice = v;
      u.lang = v?.lang || 'ko-KR';
      u.rate = rate;
      u.pitch = pitch;
      u.onend = () => { setStage('idle'); startListening(); };
      u.onerror = () => { setStage('idle'); };
      speechSynthesis.speak(u);
    } else {
      setStage('idle');
    }
  };

  // ── STT ──────────────────────────────
  const startListening = () => {
    const SR = getSpeechRecognition();
    if (!SR || !sessionRef.current) {
      setStage('idle');
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => { setStage('stt'); setLastError(null); startMeter(); };
    rec.onresult = (e: any) => {
      let text = '';
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      setPartial(text);
      if (isFinal && text.trim()) {
        stopMeter();
        processUtterance(text.trim());
      }
    };
    rec.onerror = (e: any) => {
      stopMeter();
      setStage('idle');
      setLastError(`STT 오류: ${e?.error || '알 수 없는 오류'} — 마이크 권한을 확인하거나 아래 텍스트 입력을 이용하세요.`);
    };
    rec.onend = () => { if (stageRef.current === 'stt') { stopMeter(); setStage('idle'); } };
    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  };

  const processUtterance = (text: string) => {
    const session = sessionRef.current;
    if (!session) return;
    pushUserMessage(session, text);
    setPartial('');
    setStage('intent');
    setTimeout(() => {
      setStage('action');
      setTimeout(() => {
        const result = handleUtterance(session, text);
        setLastResult(result);
        setSelectedMsg(null);
        if (result.message) speak(result.message.text);
        const fresh = chatStore.getState().sessions.find((x) => x.id === session.id);
        if (fresh && fresh.status !== 'active') setCallActive(false);
      }, 320);
    }, 320);
  };

  const startCall = () => {
    const cust = resolveDemoCustomer();
    const session = startSession('call', cust.name, cust.id);
    sessionRef.current = session;
    setCallActive(true);
    setCallDuration(0);
    setViewSessionId(null);
    setLastResult(null);
    setSelectedMsg(null);
    setLastError(null);
    const greet = `안녕하세요 ${cust.name}님, AI-CXP 콜봇에 연결되었습니다. 말씀해 주시면 상담을 도와드리겠습니다.`;
    addMessage({
      id: uid('M'), sessionId: session.id, role: 'bot', text: greet,
      createdAt: Date.now(), intent: 'greeting', confidence: 1,
    });
    setTimeout(() => speak(greet), 500);
  };

  const endCall = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* noop */ } }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    stopMeter();
    setCallActive(false);
    setStage('idle');
    setPartial('');
    if (sessionRef.current) chatStore.setState((s) => ({
      sessions: s.sessions.map((x) => x.id === sessionRef.current!.id ? { ...x, status: 'ended', endedAt: Date.now() } : x),
    }));
  };

  const stageCopy: Record<Stage, string> = {
    idle: '마이크를 눌러 말씀하세요',
    stt: '듣고 있습니다… 말씀하세요',
    intent: '인텐트/엔티티 분석 중…',
    action: 'CRM · 커머스 · RAG 라우팅 중…',
    tts: '응답 음성 재생 중…',
  };
  const stageIcon: Record<Stage, React.ReactNode> = { 
    idle: <Mic size={28} className="text-white" />, 
    stt: <Mic size={28} className="text-white animate-pulse" />, 
    intent: <Brain size={28} className="text-white" />, 
    action: <Shuffle size={28} className="text-white" />, 
    tts: <Volume2 size={28} className="text-white animate-bounce" /> 
  };

  return (
    <div className="page">
      <PageHeader
        icon={<PhoneCall className="text-primary" size={24} />}
        title="콜봇 (STT / TTS)"
        desc="챗봇과 동일한 대화 엔진을 공유하며, STT로 음성을 텍스트로, TTS로 응답을 음성으로 변환합니다. 브라우저가 음성 인식을 지원하지 않으면 텍스트 입력(Mock STT)으로 동일 파이프라인을 검증할 수 있습니다."
        actions={callActive && <span className="badge badge-green flex center gap-4">● 통화 중 {fmtTime(callDuration)}</span>}
      />

      {/* 실시간 처리 파이프라인 */}
      <div className="card mb-16">
        <div className="card-title flex center gap-8">
          <Clock size={16} className="text-primary" />
          실시간 처리 파이프라인
        </div>
        <div className="pipeline">
          <PipelineStep active={stage === 'stt'} done={stage !== 'idle' && stage !== 'stt'} icon={<Mic size={18} />} label="STT 음성인식" />
          <div className="pipeline-arrow">→</div>
          <PipelineStep active={stage === 'intent'} done={stage === 'action' || stage === 'tts'} icon={<Brain size={18} />} label="인텐트/엔티티 분류" />
          <div className="pipeline-arrow">→</div>
          <PipelineStep active={stage === 'action'} done={stage === 'tts'} icon={<Shuffle size={18} />} label="CRM/커머스/RAG 라우팅" />
          <div className="pipeline-arrow">→</div>
          <PipelineStep active={stage === 'tts'} done={false} icon={<Volume2 size={18} />} label="TTS 음성합성" />
        </div>
        <div className="pipeline-detail flex center gap-6">
          {lastResult?.action && ACTION_ICON[lastResult.action]}
          <span>
            {lastResult
              ? `마지막 처리: 인텐트 "${lastResult.message.intent}" (신뢰도 ${Math.round((lastResult.message.confidence ?? 0) * 100)}%) → ${ACTION_LABEL[lastResult.action ?? ''] ?? '일반 응답'}`
              : '통화를 시작하고 말씀하시면 처리 단계가 실시간으로 표시됩니다.'}
          </span>
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        {/* 좌: 통화 제어 + 음성 설정 + 통화 이력 */}
        <div className="col" style={{ flex: 1, maxWidth: 360 }}>
          <div className="card">
            {!callActive ? (
              <div className="recorder">
                <button className="mic-btn flex center justify-center" onClick={startCall}>
                  <PhoneCall size={32} className="text-white" />
                </button>
                <div className="fw-600">전화 걸기</div>
                <div className="text-sm text-mute">데모 고객 {resolveDemoCustomer().name}님(VIP)과 통화 시작</div>
              </div>
            ) : (
              <div className="recorder">
                <button
                  className={`mic-btn flex center justify-center ${listening ? 'recording' : ''}`}
                  onClick={listening ? undefined : startListening}
                  disabled={stage === 'intent' || stage === 'action' || stage === 'tts'}
                  style={listening ? {} : { background: stage === 'idle' ? 'var(--primary)' : 'var(--text-mute)' }}
                >
                  {stageIcon[stage]}
                </button>
                <div className="fw-600">{stageCopy[stage]}</div>
                <div className="meter">
                  {meterLevels.map((lvl, i) => (
                    <div key={i} className={`meter-bar ${listening ? '' : 'idle-bar'}`} style={{ height: `${4 + lvl * 30}px` }} />
                  ))}
                </div>
                {partial && <div className="text-sm text-mono" style={{ background: 'var(--bg-soft)', padding: '8px 12px', borderRadius: 8, maxWidth: 300 }}>“{partial}”</div>}
                {lastError && <div className="err-banner">{lastError}</div>}
                <div className="flex gap-8 mt-8">
                  <button className="btn btn-ghost btn-sm flex center gap-4" onClick={endCall}>
                    <PhoneOff size={12} className="text-red" />
                    <span>통화 종료</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!sttSupported && callActive && (
            <div className="card mt-12">
              <div className="card-title flex center gap-6"><Info size={14} className="text-yellow" /> Mock STT (텍스트 입력)</div>
              <div className="text-xs text-mute mb-12">이 브라우저는 Web Speech API를 지원하지 않습니다. 텍스트로 발화를 입력해 동일 파이프라인을 검증하세요.</div>
              <div className="flex gap-8">
                <input className="input" placeholder="예) 마우스 재고 있어?" value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && manual.trim()) { processUtterance(manual.trim()); setManual(''); } }} />
                <button className="btn btn-primary flex center gap-2" onClick={() => { if (manual.trim()) { processUtterance(manual.trim()); setManual(''); } }}>
                  <Send size={12} />
                  <span>전송</span>
                </button>
              </div>
            </div>
          )}

          <div className="card mt-12">
            <div className="card-title flex center gap-8">
              <Settings size={16} className="text-accent" />
              STT/TTS 엔진 설정
            </div>
            <div className="flex between center text-sm mb-8">
              <span className="text-mute">STT 엔진</span><span>{sttSupported ? 'Web Speech API' : 'Mock(텍스트)'}</span>
            </div>
            <div className="flex between center text-sm mb-12">
              <span className="text-mute">TTS 엔진</span><span>{'speechSynthesis' in window ? '브라우저 TTS' : '미지원'}</span>
            </div>
            {'speechSynthesis' in window && (
              <>
                <div className="field-label"><span>음성 선택</span></div>
                <select className="select mb-12" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
                  {voices.length === 0 && <option value="">기본 음성</option>}
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>
                <div className="field-label"><span>말하기 속도</span><span>{rate.toFixed(2)}x</span></div>
                <input className="slider mb-12" type="range" min={0.6} max={1.8} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                <div className="field-label"><span>음높이(pitch)</span><span>{pitch.toFixed(2)}</span></div>
                <input className="slider mb-12" type="range" min={0.5} max={2} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                <button className="btn btn-ghost btn-sm flex center gap-4" style={{ width: '100%' }}
                  onClick={() => speak('안녕하세요, 음성 설정 테스트입니다. AI-CXP 콜봇입니다.')}>
                  <Volume2 size={12} />
                  <span>음성 미리듣기</span>
                </button>
              </>
            )}
          </div>

          <div className="card mt-12">
            <div className="card-title flex center between">
              <span className="flex center gap-8">
                <History size={16} className="text-cyan" />
                통화 이력
              </span>
              <span className="badge badge-gray">{callHistory.length}건</span>
            </div>
            {callHistory.length === 0 ? (
              <div className="empty">아직 통화 기록이 없습니다.</div>
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {callHistory.map((s) => {
                  const dur = Math.round(((s.endedAt ?? Date.now()) - s.startedAt) / 1000);
                  return (
                    <div key={s.id} className={`history-item ${transcriptSession?.id === s.id ? 'active' : ''}`}
                      onClick={() => setViewSessionId(s.id === callSession?.id ? null : s.id)}>
                      <div className="flex between center">
                        <span className="text-sm fw-600">{s.customerName}</span>
                        <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'transferred' ? 'badge-yellow' : 'badge-gray'}`}>
                          {s.status === 'active' ? '● 통화중' : s.status === 'transferred' ? '↗ 이관' : '■ 종료'}
                        </span>
                      </div>
                      <div className="text-xs text-mute mt-8">
                        {new Date(s.startedAt).toLocaleString('ko-KR')} · {fmtTime(dur)} · 메시지 {s.messageCount}건
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 통화 기록(대화 내용) */}
        <div className="col" style={{ flex: 1.5 }}>
          <div className="card">
            <div className="card-title flex center between">
              <span className="flex center gap-8">
                <MessageSquare size={16} className="text-primary" />
                {viewingPast ? '통화 기록 조회 (지난 통화)' : '통화 기록'} {transcriptSession ? `(${messages.length})` : ''}
              </span>
              {viewingPast && callActive && (
                <button className="btn btn-ghost btn-sm" onClick={() => setViewSessionId(null)}>현재 통화로 돌아가기 →</button>
              )}
            </div>
            {!transcriptSession ? (
              <div className="empty">전화를 걸면 통화 기록이 여기에 표시됩니다.</div>
            ) : (
              <div style={{ maxHeight: '62vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
                {messages.map((m) => (
                  <CallMsg key={m.id} msg={m} onClick={() => m.role === 'bot' && setSelectedMsg(m)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우: 실시간 분석 패널 */}
        <div className="col" style={{ flex: 1, maxWidth: 360 }}>
          <AnalysisPanel session={transcriptSession} msg={inspected} />
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ active, done, icon, label }: { active: boolean; done: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`pipeline-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <div className="ic flex center justify-center" style={{ height: 24, marginBottom: 6 }}>{icon}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function CallMsg({ msg, onClick }: { msg: BotMessage; onClick: () => void }) {
  const conf = msg.confidence ?? 0;
  const confBadge = conf >= 0.7 ? 'badge-green' : conf >= 0.4 ? 'badge-yellow' : 'badge-red';
  return (
    <div className={`msg ${msg.role}`}>
      <div className="msg-avatar flex center justify-center">
        {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
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
          <Row label="채널" value="음성 콜봇" />
          <Row label="고객" value={`${session.customerName} (${session.userId})`} />
          <Row label="메시지 수" value={String(session.messageCount)} />
          <Row label="상태" value={session.status === 'active' ? '통화 중' : session.status === 'transferred' ? '상담사 이관' : '종료'} />
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

