import { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';

const FLOORS = ['Basement 1', 'Basement 2', 'Floor 1', 'Floor 2'];
const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function Booking() {
  const [form, setForm] = useState({ licensePlate: '', vehicleType: 'MOTORBIKE', floor: 'Basement 1', date: '', timeFrom: '', timeTo: '', useManualEntry: false });
  const [vehicles,      setVehicles]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [success,       setSuccess]       = useState(false);
  const [bookingId,     setBookingId]     = useState('');
  const [error,         setError]         = useState('');

  // Load driver's registered vehicles on mount
  useEffect(() => {
    const loadVehicles = async () => {
      setVehiclesLoading(true);
      try {
        const res = await api.get('/api/v1/vehicles/my-vehicles');
        const data = res.data.data ?? res.data ?? [];
        setVehicles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { setError('Vui lòng nhập biển số');  return; }
    if (!form.date)                { setError('Vui lòng chọn ngày');     return; }
    if (!form.timeFrom)            { setError('Vui lòng chọn giờ vào'); return; }
    if (!form.timeTo)              { setError('Vui lòng chọn giờ ra');  return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setBookingId(`BK${Date.now().toString().slice(-6)}`);
    setLoading(false);
    setSuccess(true);
  };

  if (success) return (
    <div className="page-full">
      <div className="page-header"><h2>📌 Đặt chỗ trước</h2></div>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: 40 }}>
        <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Đặt chỗ thành công!</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Chỗ đỗ xe đã được giữ cho bạn</p>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16, textAlign: 'left' }}>
          {[
            { label: 'Mã đặt chỗ', value: bookingId },
            { label: 'Biển số',    value: form.licensePlate },
            { label: 'Tầng',       value: form.floor },
            { label: 'Ngày',       value: form.date },
            { label: 'Thời gian',  value: `${form.timeFrom} → ${form.timeTo}` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#f59e0b' }}>
          ⚠️ Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn (BR-05)
        </div>
        <button className="btn-primary" onClick={() => { setSuccess(false); setForm({ licensePlate: '', vehicleType: 'MOTORBIKE', floor: 'Basement 1', date: '', timeFrom: '', timeTo: '' }); }}>
          <span>📌 Đặt chỗ mới</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📌 Đặt chỗ trước</h2>
        <p>Giữ chỗ đỗ xe theo thời gian</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        {/* Form */}
        <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {/* Warning */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '16px 20px', marginBottom: 28, fontSize: '0.85rem', color: '#f59e0b', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <span>Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn (BR-05). Hết thời gian slot sẽ tự động về trạng thái trống.</span>
          </div>

          {/* Biển số / Xe đã đăng ký */}
          <div className="form-group">
            <label className="form-label">
              {vehicles.length > 0 ? 'Chọn xe của tôi' : 'Biển số xe'}
              <span className="required">*</span>
            </label>

            {vehiclesLoading ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)' }}>Đang tải danh sách xe...</div>
            ) : vehicles.length > 0 && !form.useManualEntry ? (
              <>
                <div className="form-select-wrapper">
                  <select
                    className="form-select"
                    value={form.licensePlate}
                    onChange={e => {
                      const selected = vehicles.find(v => v.licensePlate === e.target.value);
                      setForm({
                        ...form,
                        licensePlate: e.target.value,
                        vehicleType: selected?.vehicleType || 'MOTORBIKE'
                      });
                    }}>
                    <option value="">-- Chọn xe --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.licensePlate}>
                        {v.licensePlate} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, useManualEntry: true, licensePlate: '' })}
                  style={{
                    marginTop: 8,
                    fontSize: '0.82rem',
                    color: 'var(--accent-blue)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}>
                  Nhập biển số khác
                </button>
              </>
            ) : (
              <>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: 51G-12345"
                    value={form.licensePlate}
                    onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                  />
                </div>
                {vehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, useManualEntry: false })}
                    style={{
                      marginTop: 8,
                      fontSize: '0.82rem',
                      color: 'var(--accent-blue)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}>
                    ← Quay lại danh sách xe
                  </button>
                )}
              </>
            )}
          </div>

          {/* Loại xe - chỉ hiện nếu manual entry hoặc không có xe đăng ký */}
          {(form.useManualEntry || vehicles.length === 0) && (
            <div className="form-group">
              <label className="form-label">Loại xe</label>
              <div className="vehicle-type-grid">
                {[['MOTORBIKE','🏍️','Xe máy'],['CAR','🚗','Ô tô'],['TRUCK','🚛','Xe tải']].map(([type,icon,label]) => (
                  <div key={type}
                    className={`vehicle-type-card ${form.vehicleType === type ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, vehicleType: type })}>
                    <span style={{ fontSize: 28 }}>{icon}</span>
                    <span className="vehicle-name">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiển thị loại xe đã chọn từ danh sách */}
          {!form.useManualEntry && vehicles.length > 0 && form.licensePlate && (
            <div className="form-group">
              <label className="form-label">Loại xe</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{VEHICLE_ICON[form.vehicleType] || '🚗'}</span>
                <span style={{ color: 'var(--text-primary)' }}>{form.vehicleType}</span>
              </div>
            </div>
          )}

          {/* Tầng */}
          <div className="form-group">
            <label className="form-label">Tầng mong muốn</label>
            <div className="form-select-wrapper">
              <select className="form-select" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}>
                {FLOORS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-group">
            <label className="form-label">Thời gian</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Ngày</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Giờ vào</label>
                <input type="time" className="form-input" value={form.timeFrom}
                  onChange={e => setForm({ ...form, timeFrom: e.target.value })}
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Giờ ra</label>
                <input type="time" className="form-input" value={form.timeTo}
                  onChange={e => setForm({ ...form, timeTo: e.target.value })}
                  style={{ colorScheme: 'dark' }} />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <span>⚠️ {error}</span>
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '14px 24px', borderRadius: 16, fontSize: '1.05rem', marginTop: 12 }}>
            <Calendar size={20} />
            <span>{loading ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}</span>
          </button>
        </div>

        {/* Sidebar */}
        <div className="right-sidebar">
          <div className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', marginBottom: 20 }}><MapPin size={20} color="var(--accent-primary)" /> Thông tin bãi đỗ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Biển số',  value: form.licensePlate || '—' },
                { label: 'Loại xe', value: form.vehicleType },
                { label: 'Tầng',    value: form.floor },
                { label: 'Ngày',    value: form.date || '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
