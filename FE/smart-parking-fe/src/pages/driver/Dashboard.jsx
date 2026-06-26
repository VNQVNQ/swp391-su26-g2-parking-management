import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vehicles: 0, activeSessions: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/v1/vehicles/my-vehicles');
        const vehicles = res.data.data ?? res.data ?? [];
        setStats(s => ({ ...s, vehicles: vehicles.length }));
      } catch {}
    };
    load();
  }, []);

  const quickActions = [
    { icon: '🚗', label: 'Đăng ký xe',  route: '/driver/register-vehicle', color: '#10b981' },
    { icon: '📋', label: 'Xe của tôi',   route: '/driver/my-vehicles',      color: '#3b82f6' },
    { icon: '🅿️', label: 'Xem slot',    route: '/driver/slots',            color: '#8b5cf6' },
    { icon: '📅', label: 'Đặt chỗ',     route: '/driver/booking',          color: '#f59e0b' },
  ];

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🏠 Dashboard</h2>
        <p>Xin chào! Quản lý xe và chỗ đỗ của bạn</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Xe đã đăng ký</span></div>
          <div className="stat-card-value" style={{ color: '#10b981' }}>{stats.vehicles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-label">Đang đỗ</span></div>
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>—</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-title">⚡ Thao tác nhanh</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.route)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                padding: '24px 16px', background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', transition: 'all 0.2s', color: a.color,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <span style={{ fontSize: 28 }}>{a.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
