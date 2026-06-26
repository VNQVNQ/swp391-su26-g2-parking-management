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
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>🚗</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có xe nào được đăng ký</p>
          <button className="btn-primary" onClick={() => navigate('/driver/register-vehicle')}>
            ➕ Đăng ký xe ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vehicles.map(v => (
            <div key={v.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 32 }}>{VEHICLE_ICON[v.vehicleType] || '🚗'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                    {v.licensePlate}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    {v.vehicleType}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {v.hasMonthlyPass && v.monthlyPassExpiry && (
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      Pass đến {new Date(v.monthlyPassExpiry).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', background: v.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: v.isActive ? '#10b981' : '#94a3b8', border: `1px solid ${v.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`, padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {v.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
