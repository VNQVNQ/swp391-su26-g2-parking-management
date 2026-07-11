import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function MyVehicles() {
  const navigate  = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/v1/vehicles/my-vehicles');
        const data = res.data.data ?? res.data ?? [];
        setVehicles(Array.isArray(data) ? data : []);
      } catch {
        setError('Không thể tải danh sách xe');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="page-full">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🚗 Xe của tôi</h2>
          <p>Danh sách xe đã đăng ký trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/driver/register-vehicle')}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
          ➕ Đăng ký xe mới
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, borderRadius: 24 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 80, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '3rem' }}>🚗</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '1.1rem' }}>Bạn chưa có xe nào được đăng ký trong hệ thống</p>
          <button className="btn-primary" onClick={() => navigate('/driver/register-vehicle')} style={{ padding: '12px 24px', borderRadius: '100px', fontWeight: 600 }}>
            ➕ Đăng ký xe ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {vehicles.map(v => (
            <div key={v.id} className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  {VEHICLE_ICON[v.vehicleType] || '🚗'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.3rem', letterSpacing: '0.5px' }}>
                    {v.licensePlate}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {v.vehicleType}
                  </p>
                </div>
              </div>
              
              <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trạng thái:</span>
                  <span style={{ fontSize: '0.8rem', background: v.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: v.isActive ? '#10b981' : '#94a3b8', border: `1px solid ${v.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                    {v.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                  </span>
                </div>
                {v.hasMonthlyPass && v.monthlyPassExpiry && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vé tháng:</span>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                      Hạn: {new Date(v.monthlyPassExpiry).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button 
                  onClick={() => navigate('/driver/monthly-pass')}
                  style={{ flex: 1, padding: '12px', background: v.hasMonthlyPass ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-input)', border: v.hasMonthlyPass ? 'none' : '1.5px solid var(--border-color)', borderRadius: 16, color: v.hasMonthlyPass ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                  {v.hasMonthlyPass ? '🔄 Gia hạn vé tháng' : '🎫 Đăng ký vé tháng'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
