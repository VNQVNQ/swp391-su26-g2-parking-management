import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import api from '../../services/api';
import { createVnPayUrl } from '../../services/vnpayApi';

const MONTH_DURATIONS = [
  { months: 1, label: '1 Tháng' },
  { months: 3, label: '3 Tháng' },
  { months: 6, label: '6 Tháng' },
  { months: 12, label: '1 Năm' }
];

export default function MonthlyPass() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(() => {
    if (location?.state?.action === 'renew' || location?.state?.hasMonthlyPass) {
      return 'active';
    }
    if (location?.state?.action === 'register' || location?.state?.vehicleId) {
      return 'register';
    }
    return 'available';
  });
  const [vehicles, setVehicles] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [passId, setPassId] = useState('');
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState({
    MOTORBIKE: { price1: 500000, price3: 1350000, price6: 2400000, price12: 4200000 },
    CAR: { price1: 2500000, price3: 6800000, price6: 12000000, price12: 20000000 },
    TRUCK: { price1: 3500000, price3: 9450000, price6: 16800000, price12: 29400000 }
  });

  const [renewModal, setRenewModal] = useState(null); // { pass } or null
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('VNPAY');

  const [form, setForm] = useState(() => ({
    vehicleId: location?.state?.vehicleId || '',
    vehicleType: location?.state?.vehicleType || 'CAR',
    duration: 1,
    paymentMethod: 'VNPAY'
  }));

  // Load vehicles, passes and pricing rules on mount
  useEffect(() => {
    const load = async () => {
      setVehiclesLoading(true);
      try {
        const [vehiclesRes, passesRes, pricingRes] = await Promise.all([
          api.get('/api/v1/vehicles/my-vehicles'),
          api.get('/api/v1/monthly-passes/my-passes'),
          api.get('/api/v1/pricing-rules/ticket-type/MONTHLY').catch(() => ({ data: [] }))
        ]);
        const vehiclesData = vehiclesRes.data.data ?? vehiclesRes.data ?? [];
        const passesData = passesRes.data.data ?? passesRes.data ?? [];
        const rulesData = pricingRes.data?.data ?? pricingRes.data ?? [];

        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setPasses(Array.isArray(passesData) ? passesData : []);

        if (location?.state?.action === 'renew' || location?.state?.hasMonthlyPass) {
          const vId = location.state.vehicleId;
          const lPlate = location.state.licensePlate;
          const passesList = Array.isArray(passesData) ? passesData : [];
          const passToRenew = passesList.find(p => p.vehicleId === vId || p.licensePlate === lPlate || (p.vehicle && p.vehicle.id === vId));
          if (passToRenew) {
            setRenewModal(passToRenew);
            setRenewDuration(1);
            setRenewError('');
          }
        }

        const updatedPricing = {
          MOTORBIKE: { price1: 500000, price3: 1350000, price6: 2400000, price12: 4200000 },
          CAR: { price1: 2500000, price3: 6800000, price6: 12000000, price12: 20000000 },
          TRUCK: { price1: 3500000, price3: 9450000, price6: 16800000, price12: 29400000 }
        };

        if (Array.isArray(rulesData)) {
          rulesData.forEach(rule => {
            if (rule && rule.vehicleType && rule.monthlyFee && Number(rule.monthlyFee) > 0) {
              const base = Number(rule.monthlyFee);
              const vType = rule.vehicleType.toUpperCase();
              updatedPricing[vType] = {
                price1: base,
                price3: Math.round(base * 3 * 0.9),
                price6: Math.round(base * 6 * 0.8),
                price12: Math.round(base * 12 * 0.7)
              };
            }
          });
        }
        setPricing(updatedPricing);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    load();
  }, []);

  const activePasses = useMemo(() => {
    const map = new Map();
    passes
      .filter(p => p.isActive !== false && p.paymentStatus !== 'UNPAID')
      .forEach(p => {
        const key = p.vehicleId || p.licensePlate || (p.vehicle && (p.vehicle.id || p.vehicle.licensePlate));
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, p);
        } else {
          // If duplicate passes exist for the same vehicle, keep the one with the latest endDate
          const existing = map.get(key);
          const existingEnd = new Date(existing.endDate || 0);
          const currentEnd = new Date(p.endDate || 0);
          if (currentEnd > existingEnd) {
            map.set(key, p);
          }
        }
      });
    return Array.from(map.values());
  }, [passes]);

  const getPassPrice = (vehicleType, months) => {
    const vType = (vehicleType || 'CAR').toUpperCase();
    const prices = pricing[vType] || pricing.CAR;
    return prices[`price${months}`] || (prices.price1 * months) || 0;
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
        endDate: endDate.toISOString().split('T')[0],
        paymentMethod: form.paymentMethod
      });

      const newPassData = response.data.data;

      if (form.paymentMethod === 'VNPAY') {
        const paymentUrl = await createVnPayUrl({
          amount: newPassData.fee || getPassPrice(vehicle?.vehicleType, form.duration),
          orderInfo: `Thanh toan ve thang xe ${vehicle?.licensePlate || ''}`,
          orderType: 'billpayment',
          targetId: newPassData.id,
          targetType: 'MONTHLY_PASS'
        });
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
      }

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
        paymentMethod: form.paymentMethod,
        paymentStatus: newPassData.paymentStatus
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
      const vehicleType = pass.vehicleType || vehicles.find(v => v.id === pass.vehicleId)?.vehicleType || 'CAR';
      const newFee = getPassPrice(vehicleType, renewDuration);

      if (renewPaymentMethod === 'VNPAY') {
        const paymentUrl = await createVnPayUrl({
          amount: newFee,
          orderInfo: `Gia han ve thang xe ${pass.licensePlate || ''} them ${renewDuration} thang`,
          orderType: 'billpayment',
          targetId: `${pass.id}_${renewDuration}`,
          targetType: 'RENEWPASS'
        });
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
      }

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
          <button className="btn-primary" onClick={() => { setSuccess(false); setForm({ vehicleId: '', vehicleType: 'CAR', duration: 1, paymentMethod: 'VNPAY' }); }}>
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
          Pass đang hoạt động ({activePasses.length})
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
                    setForm({ vehicleId: '', vehicleType: 'MOTORBIKE', duration: d.months, paymentMethod: 'VNPAY' });
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
                    setForm({ vehicleId: '', vehicleType: 'CAR', duration: d.months, paymentMethod: 'VNPAY' });
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
                    setForm({ vehicleId: '', vehicleType: 'TRUCK', duration: d.months, paymentMethod: 'VNPAY' });
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

      {/* Tab: Register Form - 2 Column Layout */}
      {tab === 'register' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 28,
          alignItems: 'start',
          maxWidth: 1100,
          margin: '0 auto'
        }}>
          {/* LEFT COLUMN: REGISTRATION FORM */}
          <div className="card" style={{ padding: '32px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
              <span style={{ fontSize: '1.8rem' }}>✍️</span>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Hoàn tất đăng ký Pass</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Vui lòng chọn thông tin xe và gói thời hạn</p>
              </div>
            </div>

            {location?.state?.licensePlate && (
              <div style={{ padding: '14px 16px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.6rem' }}>🚗</span>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2563eb' }}>
                    Đang đăng ký vé tháng cho biển số: {location.state.licensePlate}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Loại xe: {location.state.vehicleType === 'MOTORBIKE' ? 'Xe máy' : location.state.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'}
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Selection */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Chọn xe <span className="required">*</span></label>
              {vehiclesLoading ? (
                <div style={{ padding: '12px', color: 'var(--text-muted)' }}>Đang tải danh sách xe...</div>
              ) : vehicles.length > 0 ? (
                <select
                  className="form-select"
                  style={{ height: 48, fontSize: '1rem', fontWeight: 600 }}
                  value={form.vehicleId}
                  onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">-- Chọn xe --</option>
                  {vehicles
                    .filter(v => v.vehicleType === form.vehicleType && !passes.some(p => p.vehicleId === v.id && (p.isActive || p.paymentStatus === 'UNPAID')))
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.licensePlate} ({v.vehicleType === 'MOTORBIKE' ? 'Xe máy' : v.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'})
                      </option>
                    ))}
                </select>
              ) : (
                <div style={{ padding: '14px', color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  ℹ️ Bạn chưa có xe loại <strong>{form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : form.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'}</strong>. <button type="button" onClick={() => navigate('/driver/register-vehicle')} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, padding: 0 }}>Đăng ký xe ngay</button>
                </div>
              )}
            </div>

            {/* Duration Selector inside form */}
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Thời hạn đăng ký</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {MONTH_DURATIONS.map(d => {
                  const isSelected = form.duration === d.months;
                  return (
                    <button
                      key={d.months}
                      type="button"
                      onClick={() => setForm({ ...form, duration: d.months })}
                      style={{
                        padding: '12px 8px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: isSelected ? '#3b82f6' : 'var(--text-primary)',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.95rem' }}>{d.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Summary */}
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Tổng tiền</label>
              <div style={{
                padding: '16px 20px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '14px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Thanh toán trọn gói:</span>
                <span>₫{getPassPrice(form.vehicleType, form.duration).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Phương thức thanh toán online</label>
              <select
                className="form-select"
                style={{ height: 48, fontSize: '1rem', fontWeight: 600 }}
                value={form.paymentMethod}
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="VNPAY">🔥 Cổng thanh toán trực tuyến VNPay (VNPAY-QR / Thẻ ATM / Visa)</option>
                <option value="CARD">💳 Thẻ ngân hàng (ATM / Visa / MasterCard)</option>
                <option value="TRANSFER">🏦 Chuyển khoản QR Code (MoMo / ZaloPay / VietQR)</option>
              </select>
            </div>

            {error && (
              <div className="error-banner" style={{ marginBottom: 16, marginTop: 16 }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => { setTab('available'); setError(''); }}
                disabled={loading}
                style={{
                  padding: '14px 22px',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  color: 'var(--text-secondary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                ← Quay lại
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRegister}
                disabled={loading || !form.vehicleId}
                style={{ 
                  flex: 1, 
                  height: 52, 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 6px 18px rgba(99, 102, 241, 0.3)'
                }}>
                <span>{loading ? 'Đang xử lý...' : '🎫 Xác nhận đăng ký Pass'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY & PERKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Live Order Summary Card */}
            <div className="card" style={{ 
              padding: '28px 32px', 
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.25)',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: '1.5rem' }}>🧾</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Tóm tắt đơn đăng ký</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loại phương tiện:</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    {form.vehicleType === 'MOTORBIKE' ? '🏍️ Xe máy' : form.vehicleType === 'CAR' ? '🚗 Ô tô' : '🚛 Xe tải'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Biển số xe chọn:</span>
                  {form.vehicleId ? (
                    <strong style={{ 
                      color: '#3b82f6', 
                      background: 'var(--bg-card)', 
                      padding: '4px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #3b82f6',
                      fontWeight: 800
                    }}>
                      {vehicles.find(v => v.id.toString() === form.vehicleId.toString())?.licensePlate || 'Chưa xác định'}
                    </strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa chọn xe</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Gói thời hạn:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{form.duration} tháng</strong>
                </div>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Tổng thanh toán:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                    ₫{getPassPrice(form.vehicleType, form.duration).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: '#10b981', fontWeight: 600 }}>
                <span>✓</span> Bảo vệ giá ưu đãi & Kích hoạt tự động ngay sau khi xác nhận
              </div>
            </div>

            {/* 2. Perks & Benefits Card */}
            <div className="card" style={{ padding: '24px 28px', background: 'var(--bg-secondary)' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✨</span> Lợi ích của Pass Hàng Tháng
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '1rem' }}>⚡</div>
                  <div>
                    <strong style={{ fontSize: '0.93rem', color: 'var(--text-primary)', display: 'block' }}>Ra vào không giới hạn 24/7</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block', marginTop: 2 }}>Thoải mái ra vào bãi đỗ xe bất kể thời gian trong ngày hay trong tháng, không phải lo phát sinh chi phí lẻ.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '1rem' }}>💰</div>
                  <div>
                    <strong style={{ fontSize: '0.93rem', color: 'var(--text-primary)', display: 'block' }}>Tiết kiệm tối đa chi phí gửi xe</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block', marginTop: 2 }}>Chi phí trọn gói theo tháng giúp tiết kiệm đáng kể so với tổng chi phí thanh toán theo từng lượt hay theo giờ hàng ngày.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '1rem' }}>📱</div>
                  <div>
                    <strong style={{ fontSize: '0.93rem', color: 'var(--text-primary)', display: 'block' }}>Quản lý & Gia hạn trực tuyến tiện lợi</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block', marginTop: 2 }}>Dễ dàng theo dõi lịch sử vé tháng, kiểm tra thời hạn và thực hiện gia hạn nhanh chóng ngay trên hệ thống web.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Active Passes */}
      {tab === 'active' && (
        <>
          {activePasses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>🎫</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Bạn chưa có pass nào đang hoạt động</p>
              <button className="btn-primary" onClick={() => setTab('available')}>
                <span>🎫 Đăng ký Pass</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {activePasses.map(pass => {
                const endDate = pass.endDate ? new Date(pass.endDate) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const remainingDays = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
                const isUnpaid = pass.paymentStatus === 'UNPAID' || pass.isActive === false;
                const isExpiringSoon = remainingDays >= 0 && remainingDays <= 7 && !isUnpaid;
                const isExpired = remainingDays < 0 && !isUnpaid;
                
                const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
                const vehicleOfPass = vehicles.find(v => v.id === pass.vehicleId || v.licensePlate === pass.licensePlate);
                const vehicleTypeStr = pass.vehicleType || vehicleOfPass?.vehicleType || 'CAR';

                return (
                  <div key={pass.id} className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', borderTop: isUnpaid ? '4px solid #ef4444' : isExpired ? '4px solid #ef4444' : isExpiringSoon ? '4px solid #f59e0b' : '4px solid #10b981' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
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
                        background: isUnpaid ? 'rgba(239,68,68,0.12)' : isExpired ? 'rgba(239,68,68,0.12)' : isExpiringSoon ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isUnpaid ? '#ef4444' : isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#10b981',
                        border: `1px solid ${isUnpaid ? 'rgba(239,68,68,0.3)' : isExpired ? 'rgba(239,68,68,0.3)' : isExpiringSoon ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      }}>
                        {isUnpaid ? '⏳ Chưa thanh toán' : isExpired ? 'Hết hạn' : isExpiringSoon ? `Còn ${remainingDays} ngày` : 'Đang hoạt động'}
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
                      {isUnpaid ? (
                        <button
                          onClick={async () => {
                            try {
                              const paymentUrl = await createVnPayUrl({
                                amount: pass.fee || 0,
                                orderInfo: `Thanh toan ve thang xe ${pass.licensePlate || ''}`,
                                orderType: 'billpayment',
                                targetId: pass.id,
                                targetType: 'MONTHLY_PASS'
                              });
                              if (paymentUrl) window.location.href = paymentUrl;
                            } catch (e) {
                              alert('Lỗi tạo cổng thanh toán: ' + (e.response?.data?.message || e.message));
                            }
                          }}
                          style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 16, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                          💳 Thanh toán VNPay ngay
                        </button>
                      ) : (isExpired || isExpiringSoon) ? (
                        <button
                          onClick={() => { setRenewModal(pass); setRenewDuration(1); setRenewError(''); }}
                          style={{
                            flex: 1,
                            padding: '14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            borderRadius: 14,
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            transition: 'all 0.25s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                          }}>
                          ✨ Gia hạn vé tháng
                        </button>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                           <div style={{ flex: 2, padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 16, fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                              <span style={{ fontSize: '1.2rem' }}>✓</span> Đảm bảo luôn có chỗ đỗ
                           </div>
                           <button
                              onClick={() => { setRenewModal(pass); setRenewDuration(1); setRenewError(''); }}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                border: 'none',
                                borderRadius: 14,
                                color: '#ffffff',
                                padding: '12px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                transition: 'all 0.25s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                              }}>
                              ✨ Gia hạn
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
                      ₫{getPassPrice(renewModal.vehicleType || vehicles.find(v => v.id === renewModal.vehicleId)?.vehicleType || 'CAR', d.months).toLocaleString()}
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
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1rem' }}>₫{getPassPrice(renewModal.vehicleType || vehicles.find(v => v.id === renewModal.vehicleId)?.vehicleType || 'CAR', renewDuration).toLocaleString()}</span>
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

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Phương thức thanh toán online</label>
              <select
                className="form-select"
                style={{ height: 44, fontSize: '0.92rem', fontWeight: 600 }}
                value={renewPaymentMethod}
                onChange={e => setRenewPaymentMethod(e.target.value)}>
                <option value="VNPAY">🔥 Cổng thanh toán trực tuyến VNPay (VNPAY-QR / Thẻ ATM / Visa)</option>
                <option value="CARD">💳 Thẻ ngân hàng (ATM / Visa / MasterCard)</option>
                <option value="TRANSFER">🏦 Chuyển khoản QR Code (MoMo / ZaloPay / VietQR)</option>
              </select>
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
                  flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: '#fff', cursor: renewLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700,
                  opacity: renewLoading ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}>
                {renewLoading ? '⏳ Đang gia hạn...' : '✨ Xác nhận gia hạn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
