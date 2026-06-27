import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../services/api';

const MONTH_DURATIONS = [
  { months: 1, label: '1 Tháng' },
  { months: 3, label: '3 Tháng' },
  { months: 6, label: '6 Tháng' },
  { months: 12, label: '1 Năm' }
];

export default function MonthlyPass() {
  const [tab, setTab] = useState('available');
  const [vehicles, setVehicles] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [passId, setPassId] = useState('');
  const [error, setError] = useState('');
  const [pricing] = useState({
    MOTORBIKE: { price1: 500000, price3: 1350000, price6: 2400000, price12: 4200000 },
    CAR: { price1: 2500000, price3: 6800000, price6: 12000000, price12: 20000000 },
    TRUCK: { price1: 3500000, price3: 9450000, price6: 16800000, price12: 29400000 }
  });

  const [form, setForm] = useState({
    vehicleId: '',
    vehicleType: 'CAR',
    duration: 1,
    paymentMethod: 'CASH'
  });

  // Load vehicles and passes on mount
  useEffect(() => {
    const load = async () => {
      setVehiclesLoading(true);
      try {
        const [vehiclesRes, passesRes] = await Promise.all([
          api.get('/api/v1/vehicles/my-vehicles'),
          api.get('/api/v1/monthly-passes/my-passes')
        ]);
        const vehiclesData = vehiclesRes.data.data ?? vehiclesRes.data ?? [];
        const passesData = passesRes.data.data ?? passesRes.data ?? [];
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setPasses(Array.isArray(passesData) ? passesData : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    load();
  }, []);

  const getPassPrice = (vehicleType, months) => {
    const prices = pricing[vehicleType] || pricing.CAR;
    return prices[`price${months}`] || 0;
  };

  const handleRegister = async () => {
    if (!form.vehicleId) {
      setError('Vui lòng chọn xe');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));

      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const startDate = new Date();
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + form.duration, startDate.getDate());

      const newPass = {
        id: `PASS-${Date.now()}`,
        vehicleId: form.vehicleId,
        licensePlate: vehicle?.licensePlate,
        vehicleType: vehicle?.vehicleType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration: form.duration,
        fee: getPassPrice(vehicle?.vehicleType, form.duration),
        status: 'ACTIVE',
        paymentMethod: form.paymentMethod
      };

      setPasses(prev => [...prev, newPass]);
      setPassId(newPass.id);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đăng ký pass');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-full">
        <div className="page-header"><h2>🎫 Đăng ký Pass Hàng Tháng</h2></div>
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: 40 }}>
          <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Đăng ký Pass thành công!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Pass hàng tháng đã được kích hoạt</p>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16, textAlign: 'left' }}>
            {[
              { label: 'Mã Pass', value: passId },
              { label: 'Xe', value: vehicles.find(v => v.id === form.vehicleId)?.licensePlate || '—' },
              { label: 'Loại xe', value: form.vehicleType },
              { label: 'Thời hạn', value: `${form.duration} tháng` },
              { label: 'Phí', value: `₫${getPassPrice(form.vehicleType, form.duration).toLocaleString()}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#10b981' }}>
            ℹ️ Pass của bạn sẽ hết hạn vào <strong>{new Date(new Date().getFullYear(), new Date().getMonth() + form.duration, new Date().getDate()).toLocaleDateString('vi-VN')}</strong>
          </div>
          <button className="btn-primary" onClick={() => { setSuccess(false); setForm({ vehicleId: '', vehicleType: 'CAR', duration: 1, paymentMethod: 'CASH' }); }}>
            <span>🎫 Đăng ký thêm</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🎫 Đăng ký Pass Hàng Tháng</h2>
        <p>Đăng ký pass để đỗ xe không giới hạn trong tháng</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'available' ? 'active' : ''}`} onClick={() => setTab('available')}>
          Đăng ký Pass
        </button>
        <button className={`tab-btn ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Pass đang hoạt động ({passes.length})
        </button>
      </div>

      {/* Tab: Available Packages */}
      {tab === 'available' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Motorbike Packages */}
          <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '2rem' }}>🏍️</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe máy</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Motorbike</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MONTH_DURATIONS.map(d => (
                <button
                  key={d.months}
                  onClick={() => {
                    setForm({ vehicleId: '', vehicleType: 'MOTORBIKE', duration: d.months, paymentMethod: 'CASH' });
                    setTab('register');
                  }}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{d.label}</span>
                    <span style={{ fontWeight: 700, color: '#8b5cf6' }}>₫{getPassPrice('MOTORBIKE', d.months).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Car Packages */}
          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '2rem' }}>🚗</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Ô tô</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Car</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MONTH_DURATIONS.map(d => (
                <button
                  key={d.months}
                  onClick={() => {
                    setForm({ vehicleId: '', vehicleType: 'CAR', duration: d.months, paymentMethod: 'CASH' });
                    setTab('register');
                  }}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{d.label}</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>₫{getPassPrice('CAR', d.months).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Truck Packages */}
          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '2rem' }}>🚛</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe tải</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Truck</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MONTH_DURATIONS.map(d => (
                <button
                  key={d.months}
                  onClick={() => {
                    setForm({ vehicleId: '', vehicleType: 'TRUCK', duration: d.months, paymentMethod: 'CASH' });
                    setTab('register');
                  }}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{d.label}</span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>₫{getPassPrice('TRUCK', d.months).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Register Form */}
      {tab === 'register' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 24 }}>Hoàn tất đăng ký Pass</h3>

          {/* Vehicle Selection */}
          <div className="form-group">
            <label className="form-label">Chọn xe <span className="required">*</span></label>
            {vehiclesLoading ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)' }}>Đang tải danh sách xe...</div>
            ) : vehicles.length > 0 ? (
              <select
                className="form-select"
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">-- Chọn xe --</option>
                {vehicles
                  .filter(v => v.vehicleType === form.vehicleType)
                  .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate}
                    </option>
                  ))}
              </select>
            ) : (
              <div style={{ padding: '12px', color: 'var(--text-muted)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                ℹ️ Bạn chưa đăng ký xe nào. <a href="/vehicle-register" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Đăng ký xe ngay</a>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Thời hạn</label>
            <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <strong>{form.duration} tháng</strong>
            </div>
          </div>

          {/* Price Summary */}
          <div className="form-group">
            <label className="form-label">Tổng tiền</label>
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid #10b981',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#10b981'
            }}>
              ₫{getPassPrice(form.vehicleType, form.duration).toLocaleString()}
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Phương thức thanh toán</label>
            <select
              className="form-select"
              value={form.paymentMethod}
              onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="CASH">Tiền mặt</option>
              <option value="CARD">Thẻ ngân hàng</option>
              <option value="TRANSFER">Chuyển khoản</option>
            </select>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setTab('available'); setError(''); }}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
            >
              ← Quay lại
            </button>
            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={loading || !form.vehicleId}
              style={{ flex: 1 }}>
              <span>{loading ? 'Đang xử lý...' : '🎫 Xác nhận đăng ký'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Active Passes */}
      {tab === 'active' && (
        <>
          {passes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>🎫</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Bạn chưa có pass nào đang hoạt động</p>
              <button className="btn-primary" onClick={() => setTab('available')}>
                <span>🎫 Đăng ký Pass</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {passes.map(pass => (
                <div key={pass.id} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{pass.licensePlate}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mã: {pass.id}</p>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Loại xe', value: pass.vehicleType },
                      { label: 'Ngày bắt đầu', value: new Date(pass.startDate).toLocaleDateString('vi-VN') },
                      { label: 'Ngày hết hạn', value: new Date(pass.endDate).toLocaleDateString('vi-VN') },
                      { label: 'Phí', value: `₫${pass.fee.toLocaleString()}` },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#10b981', textAlign: 'center' }}>
                    ✓ Có thể đỗ xe không giới hạn
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

