import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Phone, 
  Users, 
  ShoppingCart, 
  GraduationCap, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const NAV = [
  { 
    section: '개요', 
    items: [{ to: '/', icon: <LayoutDashboard size={18} />, label: '대시보드' }] 
  },
  {
    section: '대화 채널',
    items: [
      { to: '/chat', icon: <MessageSquare size={18} />, label: '챗봇 콘솔' },
      { to: '/call', icon: <Phone size={18} />, label: '콜봇 (STT/TTS)' },
    ],
  },
  {
    section: '비즈니스',
    items: [
      { to: '/crm', icon: <Users size={18} />, label: 'CRM · 영업관리' },
      { to: '/commerce', icon: <ShoppingCart size={18} />, label: 'E-커머스' },
    ],
  },
  {
    section: 'AI · 신뢰',
    items: [
      { to: '/training', icon: <GraduationCap size={18} />, label: '인텐트/엔티티 학습' },
      { to: '/rag', icon: <ShieldAlert size={18} />, label: 'RAG 환각검증' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <div className="brand-title">AI-CXP</div>
          <div className="brand-sub">통합 고객경험 플랫폼</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="ic">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        버전 0.1 데모<span className="demo-tag">MOCK</span>
        <div className="mt-8 text-mute">대화 한 번으로 상담부터 구매까지</div>
      </div>
    </aside>
  );
}

