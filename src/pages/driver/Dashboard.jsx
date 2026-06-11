import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Ticket, BookOpen, MapPin, Calendar } from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <Ticket size={28} />,        label: 'Đăng ký vé',  route: '/driver/register-ticket', color: '#10b981' },
    { icon: <BookOpen size={28} />,      label: 'Xem vé',       route: '/driver/my-tickets',      color: '#3b82f6' },
    { icon: <MapPin size={28} />,        label: 'Xem slot',     route: '/driver/slots',           color: '#8b5cf6' },
    { icon: <Calendar size={28} />,      label: 'Đặt chỗ',      route: '/driver/booking',         color: '#f59e0b' },
  ];

  const stats = [
    { label: 'Vé đang dùng',   value: '0', color: '#10b981' },
    { label: 'Đặt chỗ',        value: '0', color: '#3b82f6' },
    { label: 'Lịch sử đỗ xe',  value: '0', color: '#8b5cf6' },
    { label: 'Slot yêu thích', value: '0', color: '#f59e0b' },
  ];

  const displayName = user?.fullName || user?.name || 'Driver';

  return (
    <div className="page-full">
      {/* Page header */}
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Xin chào, <strong style={{ color: 'var(--accent-primary)' }}>{displayName}</strong></p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{s.label}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <LayoutDashboard size={20} />
          Thao tác nhanh
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.route)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: '24px 16px',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              color: a.color,
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = a.color;
                e.currentTarget.style.background = 'var(--bg-card-hover)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              {a.icon}
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-title">
          <BookOpen size={20} />
          Hoạt động gần đây
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>Chưa có hoạt động nào</p>
        </div>
      </div>
    </div>
  );
}
