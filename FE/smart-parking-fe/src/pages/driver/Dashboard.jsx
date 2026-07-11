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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#10b981' }}>🚗</div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xe đã đăng ký</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{stats.vehicles}</div>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#3b82f6' }}>🅿️</div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đang đỗ</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>—</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>⚡ Thao tác nhanh</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.route)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                padding: '32px 20px', background: 'var(--bg-input)',
                border: '1px solid var(--border-color)', borderRadius: 20,
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', color: a.color,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.borderColor = a.color; 
                e.currentTarget.style.transform = 'translateY(-6px)'; 
                e.currentTarget.style.boxShadow = `0 12px 24px ${a.color}20`; 
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.borderColor = 'var(--border-color)'; 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                e.currentTarget.style.background = 'var(--bg-input)';
              }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 8 }}>
                {a.icon}
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
