import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { createVnPayUrl } from '../../services/vnpayApi';

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
                  <span style={{ fontSize: '0.8rem', background: v.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: v.isActive ? '#10b981' : '#ef4444', border: `1px solid ${v.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                    {v.isActive ? 'Đang hoạt động' : '⏳ Chưa thanh toán'}
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
                {!v.isActive ? (
                  <button 
                    onClick={async () => {
                      try {
                        const VEHICLE_FEES = { MOTORBIKE: 5000, CAR: 15000, TRUCK: 30000 };
                        const fee = VEHICLE_FEES[v.vehicleType] || 15000;
                        const paymentUrl = await createVnPayUrl({
                          amount: fee,
                          orderInfo: `Thanh toan phi dang ky xe ${v.licensePlate}`,
                          orderType: 'billpayment',
                          targetId: v.id,
                          targetType: 'VEHICLE'
                        });
                        if (paymentUrl) window.location.href = paymentUrl;
                      } catch (e) {
                        alert('Lỗi tạo cổng thanh toán: ' + (e.response?.data?.message || e.message));
                      }
                    }}
                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 16, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    💳 Thanh toán phí đăng ký VNPay
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/driver/monthly-pass', {
                      state: {
                        vehicleId: v.id,
                        vehicleType: v.vehicleType,
                        licensePlate: v.licensePlate,
                        hasMonthlyPass: v.hasMonthlyPass,
                        action: v.hasMonthlyPass ? 'renew' : 'register'
                      }
                    })}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: v.hasMonthlyPass
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : 'var(--bg-input)',
                      border: v.hasMonthlyPass ? 'none' : '1.5px solid var(--border-color)',
                      borderRadius: 14,
                      color: v.hasMonthlyPass ? '#ffffff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: v.hasMonthlyPass
                        ? '0 4px 14px rgba(99, 102, 241, 0.35)'
                        : 'none'
                    }}>
                    {v.hasMonthlyPass ? '✨ Gia hạn vé tháng' : '🎫 Đăng ký vé tháng'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
