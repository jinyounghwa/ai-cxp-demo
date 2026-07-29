import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/hooks';
import { crmStore, getCustomer, updateLeadStage } from '@/lib/crmStore';
import type { LeadStage, ActivityType } from '@/types';
import { 
  Users, 
  Search, 
  History, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  Briefcase, 
  ShoppingCart, 
  KanbanSquare, 
  ChevronRight,
  Mail,
  Calendar,
  Phone,
  DollarSign
} from 'lucide-react';

const STAGES: LeadStage[] = ['신규', '상담중', '제안', '계약', '이탈'];
const NEXT_STAGE: Record<LeadStage, LeadStage | null> = {
  신규: '상담중', 상담중: '제안', 제안: '계약', 계약: null, 이탈: null,
};

const ACT_ICONS: Record<ActivityType, React.ReactNode> = { 
  call: <PhoneCall size={14} className="text-primary" />, 
  chat: <MessageSquare size={14} className="text-cyan" />, 
  memo: <FileText size={14} className="text-yellow" />, 
  meeting: <Briefcase size={14} className="text-accent" />, 
  order: <ShoppingCart size={14} className="text-green" /> 
};

const TIER_COLOR: Record<string, string> = { VIP: 'badge-primary', GOLD: 'badge-yellow', SILVER: 'badge-gray', 일반: 'badge-gray' };

export default function CRM() {
  const customers = useStore(crmStore, (s) => s.customers);
  const leads = useStore(crmStore, (s) => s.leads);
  const activities = useStore(crmStore, (s) => s.activities);
  const [selectedId, setSelectedId] = useState<string | null>(customers[0]?.id ?? null);
  const [query, setQuery] = useState('');

  const selected = selectedId ? getCustomer(selectedId) : null;
  const customerLeads = leads.filter((l) => l.customerId === selectedId);
  const customerActs = activities.filter((a) => a.customerId === selectedId).slice(0, 12);
  const filteredCustomers = customers.filter(
    (c) => c.name.includes(query) || c.phone.includes(query) || c.email.includes(query)
  );

  return (
    <div className="page">
      <PageHeader
        icon={<Users className="text-primary" size={24} />}
        title="CRM · 영업관리"
        desc="고객·리드·상담이력·영업활동을 관리합니다. 챗봇/콜봇 세션은 자동으로 Activity에 적재되어, 영업과 커머스 데이터가 연결됩니다."
      />

      {/* 영업 파이프라인 칸반 */}
      <div className="card mb-16">
        <div className="card-title flex center between">
          <span className="flex center gap-8">
            <KanbanSquare size={16} className="text-primary" />
            영업 파이프라인
          </span>
          <span className="badge badge-primary">리드 {leads.length}건</span>
        </div>
        <div className="kanban">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            const totalValue = stageLeads.reduce((a, b) => a + b.value, 0);
            return (
              <div key={stage} className="kanban-col">
                <div className="kanban-col-title flex between center">
                  <span>{stage}</span>
                  <span className="badge badge-gray">{stageLeads.length}</span>
                </div>
                {stageLeads.map((l) => {
                  const cust = getCustomer(l.customerId);
                  return (
                    <div key={l.id} className="kanban-card" onClick={() => setSelectedId(l.customerId)}>
                      <div className="flex between center">
                        <div className="fw-600 text-sm">{cust?.name ?? '미확인'}</div>
                        {cust && <span className={`badge ${TIER_COLOR[cust.tier]}`}>{cust.tier}</span>}
                      </div>
                      <div className="text-xs text-mute mt-8">{l.source} · {l.owner}</div>
                      <div className="flex between center mt-8">
                        <span className="text-xs text-mono fw-600 text-primary">
                          {l.value ? `${(l.value / 10000).toFixed(0)}만원` : '-'}
                        </span>
                      </div>
                      <div className="text-xs text-dim mt-8 flex center gap-4">
                        <ChevronRight size={10} className="text-mute" />
                        <span>{l.nextAction}</span>
                      </div>
                      {NEXT_STAGE[stage] && (
                        <button className="btn btn-ghost btn-sm mt-12 flex center justify-center gap-2" style={{ width: '100%' }}
                          onClick={(e) => { e.stopPropagation(); updateLeadStage(l.id, NEXT_STAGE[stage]!); }}>
                          <span>{NEXT_STAGE[stage]} 단계 이동</span>
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {totalValue > 0 && (
                  <div className="text-xs text-mute mt-8 text-center fw-600">
                    가치 {Math.round(totalValue / 10000)}만원
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        {/* 고객 목록 */}
        <div className="card" style={{ flex: 1, maxWidth: 380 }}>
          <div className="card-title flex center between">
            <span className="flex center gap-8">
              <Users size={16} className="text-cyan" />
              고객 목록
            </span>
            <span className="badge badge-gray">{filteredCustomers.length}명</span>
          </div>
          <div className="relative mb-12">
            <input className="input" placeholder="이름/전화/이메일 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {filteredCustomers.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                className="crm-customer-item"
                style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: selectedId === c.id ? 'var(--primary-bg)' : 'transparent', marginBottom: 4 }}>
                <div className="flex between center">
                  <div className="fw-600 text-sm">{c.name}</div>
                  <span className={`badge ${TIER_COLOR[c.tier]}`}>{c.tier}</span>
                </div>
                <div className="text-xs text-mute mt-8">{c.phone} · 주문 {c.totalOrders}건 · {c.totalSpent.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        </div>

        {/* 고객 상세 */}
        <div className="col">
          {!selected ? (
            <div className="card empty">고객을 선택하세요</div>
          ) : (
            <>
              <div className="card mb-12">
                <div className="flex between center mb-8">
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    {selected.name} 
                    <span className="text-mute text-xs ml-8" style={{ fontFamily: 'var(--mono)' }}>{selected.id}</span>
                  </div>
                  <span className={`badge ${TIER_COLOR[selected.tier]}`}>{selected.tier}</span>
                </div>
                <div className="grid grid-3 text-sm mt-12 gap-12" style={{ padding: '12px 0' }}>
                  <InfoItem icon={<Phone size={14} className="text-mute" />} label="연락처" value={selected.phone} />
                  <InfoItem icon={<Mail size={14} className="text-mute" />} label="이메일" value={selected.email} />
                  <InfoItem icon={<ShoppingCart size={14} className="text-mute" />} label="누적 주문" value={`${selected.totalOrders}건`} />
                  <InfoItem icon={<DollarSign size={14} className="text-mute" />} label="누적 결제" value={`${selected.totalSpent.toLocaleString()}원`} />
                  <InfoItem icon={<Calendar size={14} className="text-mute" />} label="가입일" value={new Date(selected.createdAt).toLocaleDateString('ko-KR')} />
                  <InfoItem icon={<KanbanSquare size={14} className="text-mute" />} label="진행 리드" value={`${customerLeads.length}건`} />
                </div>
              </div>

              <div className="card">
                <div className="card-title flex center gap-8">
                  <History size={16} className="text-accent" />
                  상담/영업 활동 이력
                  <span className="badge badge-gray text-xs">{customerActs.length}건 · 챗/콜 자동기록</span>
                </div>
                {customerActs.length === 0 ? (
                  <div className="empty">활동 이력이 없습니다</div>
                ) : (
                  <div>
                    {customerActs.map((a) => (
                      <div key={a.id} className="flex gap-12" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className="flex center justify-center" style={{ width: 24, height: 24, background: 'var(--bg-soft)', borderRadius: '50%' }}>
                          {ACT_ICONS[a.type]}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="text-sm">{a.content}</div>
                          <div className="text-xs text-mute mt-4">
                            {a.relatedSessionId ? (
                              <span className="badge badge-cyan text-xs mr-8" style={{ padding: '1px 6px' }}>자동 기록</span>
                            ) : null}
                            {new Date(a.createdAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-8 center" style={{ background: 'var(--bg-soft)', padding: '10px 14px', borderRadius: 8 }}>
      <div className="flex center">{icon}</div>
      <div>
        <div className="text-xs text-mute" style={{ fontSize: 10 }}>{label}</div>
        <div className="text-sm fw-600 mt-2">{value}</div>
      </div>
    </div>
  );
}

