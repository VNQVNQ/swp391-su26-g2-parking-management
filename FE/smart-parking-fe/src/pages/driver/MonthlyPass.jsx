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

  const [renewModal, setRenewModal] = useState(null); // { pass } or null
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState('');

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
      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const startDate = new Date();
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + form.duration, startDate.getDate());

      // Call real backend API
      const response = await api.post('/api/v1/monthly-passes', {
        vehicleId: form.vehicleId,
        fee: getPassPrice(vehicle?.vehicleType, form.duration),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const newPassData = response.data.data;

      const newPass = {
        id: newPassData.id,
        vehicleId: form.vehicleId,
        licensePlate: vehicle?.licensePlate,
        vehicleType: vehicle?.vehicleType,
        startDate: newPassData.startDate,
        endDate: newPassData.endDate,
        duration: form.duration,
        fee: newPassData.fee,
        status: newPassData.status || 'ACTIVE',
        isActive: newPassData.isActive,
        paymentMethod: form.paymentMethod
      };

      setPasses(prev => [...prev, newPass]);
      setPassId(newPass.id);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      // Map backend error messages to user-friendly Vietnamese
      const backendMsg = err.response?.data?.message || '';
      let displayMsg = 'Lỗi khi đăng ký pass. Vui lòng thử lại.';
      if (backendMsg.includes('đã có vé tháng') || backendMsg.includes('active') || backendMsg.includes('hiệu lực')) {
        displayMsg = 'Xe này đã có vé tháng còn hiệu lực. Vui lòng chọn xe khác hoặc đợi vé hiện tại hết hạn.';
      } else if (backendMsg) {
        displayMsg = backendMsg;
      }
      setError(displayMsg);
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!renewModal) return;
    setRenewLoading(true);
    setRenewError('');
    try {
      const pass = renewModal;
      const vehicleType = pass.vehicleType || 'CAR';
      const newFee = getPassPrice(vehicleType, renewDuration);

      // Calculate new end date from current end date (or today if expired)
      const currentEnd = pass.endDate ? new Date(pass.endDate) : new Date();
      const baseDate = currentEnd > new Date() ? currentEnd : new Date();
      const newEndDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + renewDuration, baseDate.getDate());

      await api.post(`/api/v1/monthly-passes/${pass.id}/renew`, {
        endDate: newEndDate.toISOString().split('T')[0],
        fee: newFee
      });

      // Reload all passes after renew
      const passesRes = await api.get('/api/v1/monthly-passes/my-passes');
      const passesData = passesRes.data.data ?? passesRes.data ?? [];
      setPasses(Array.isArray(passesData) ? passesData : []);

      setRenewModal(null);
      setRenewDuration(1);
      setRenewLoading(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi gia hạn. Vui lòng thử lại.';
      setRenewError(msg);
      setRenewLoading(false);
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {passes.map(pass => {
                const endDate = pass.endDate ? new Date(pass.endDate) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const remainingDays = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
                const isExpiringSoon = remainingDays >= 0 && remainingDays <= 7;
                const isExpired = remainingDays < 0;
                
                const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
                const vehicleOfPass = vehicles.find(v => v.id === pass.vehicleId || v.licensePlate === pass.licensePlate);
                const vehicleTypeStr = pass.vehicleType || vehicleOfPass?.vehicleType || 'CAR';

                return (
                  <div key={pass.id} className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', borderTop: isExpired ? '4px solid #ef4444' : isExpiringSoon ? '4px solid #f59e0b' : '4px solid #10b981' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                          {VEHICLE_ICON[vehicleTypeStr] || '🚗'}
                        </div>
                        <div>
                          <p style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.3rem', letterSpacing: '0.5px' }}>
                            {pass.licensePlate}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                            {vehicleTypeStr}
                          </p>
                        </div>
                      </div>
                      
                      <span style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        background: isExpired ? 'rgba(239,68,68,0.12)' : isExpiringSoon ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#10b981',
                        border: `1px solid ${isExpired ? 'rgba(239,68,68,0.3)' : isExpiringSoon ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      }}>
                        {isExpired ? 'Hết hạn' : isExpiringSoon ? `Còn ${remainingDays} ngày` : 'Đang hoạt động'}
                      </span>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Ngày bắt đầu', value: pass.startDate ? new Date(pass.startDate).toLocaleDateString('vi-VN') : '—' },
                        { label: 'Ngày hết hạn', value: endDate ? endDate.toLocaleDateString('vi-VN') : '—' },
                        { label: 'Phí đăng ký', value: `₫${(pass.fee || 0).toLocaleString()}` },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                      {(isExpired || isExpiringSoon) ? (
                        <button
                          onClick={() => { setRenewModal(pass); setRenewDuration(1); setRenewError(''); }}
                          style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 16, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          🔄 Gia hạn vé tháng
                        </button>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                           <div style={{ flex: 2, padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 16, fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                              <span style={{ fontSize: '1.2rem' }}>✓</span> Không giới hạn đỗ xe
                           </div>
                           <button
                              onClick={() => { setRenewModal(pass); setRenewDuration(1); setRenewError(''); }}
                              style={{ flex: 1, background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 16, color: 'var(--text-primary)', padding: '12px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                              🔄 Gia hạn
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Renew Modal */}
      {renewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 32, position: 'relative' }}>
            <button
              onClick={() => setRenewModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              ✕
            </button>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>🔄 Gia hạn vé tháng</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
              Xe: <strong>{renewModal.licensePlate}</strong> · Hết hạn: <strong>{renewModal.endDate ? new Date(renewModal.endDate).toLocaleDateString('vi-VN') : '—'}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Chọn thời gian gia hạn</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {MONTH_DURATIONS.map(d => (
                  <button
                    key={d.months}
                    onClick={() => setRenewDuration(d.months)}
                    style={{
                      padding: '14px 12px',
                      background: renewDuration === d.months ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                      border: renewDuration === d.months ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      color: renewDuration === d.months ? '#f59e0b' : 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: '0.9rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4, fontWeight: 700, color: '#f59e0b' }}>
                      ₫{getPassPrice(renewModal.vehicleType || 'CAR', d.months).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: '14px 16px', background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: 'var(--radius-md)', borderLeft: '3px solid #f59e0b',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Phí gia hạn:</span>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1rem' }}>₫{getPassPrice(renewModal.vehicleType || 'CAR', renewDuration).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hạn mới đến:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(() => {
                    const currentEnd = renewModal.endDate ? new Date(renewModal.endDate) : new Date();
                    const base = currentEnd > new Date() ? currentEnd : new Date();
                    const nd = new Date(base.getFullYear(), base.getMonth() + renewDuration, base.getDate());
                    return nd.toLocaleDateString('vi-VN');
                  })()}
                </span>
              </div>
            </div>

            {renewError && (
              <div className="error-banner" style={{ marginBottom: 16 }}>
                <span>⚠️ {renewError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setRenewModal(null)}
                disabled={renewLoading}
                style={{
                  flex: 1, padding: '12px', background: 'var(--bg-input)',
                  border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)', cursor: renewLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
                }}>
                Hủy
              </button>
              <button
                onClick={handleRenew}
                disabled={renewLoading}
                style={{
                  flex: 2, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: '#fff', cursor: renewLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                  opacity: renewLoading ? 0.7 : 1,
                }}>
                {renewLoading ? '⏳ Đang gia hạn...' : '🔄 Xác nhận gia hạn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
