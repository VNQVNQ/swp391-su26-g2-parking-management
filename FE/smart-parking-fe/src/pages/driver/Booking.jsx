import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, List } from 'lucide-react';
import api from '../../services/api';

const FLOORS = ['Basement 1', 'Basement 2', 'Floor 1', 'Floor 2'];
const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function Booking() {
  const [tab, setTab] = useState('book'); // 'book' | 'history'
  const [form, setForm] = useState({ licensePlate: '', vehicleType: 'MOTORBIKE', floor: 'Basement 1', dateIn: '', dateOut: '', timeFrom: '', timeTo: '', useManualEntry: false });
  const [vehicles,      setVehicles]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [success,       setSuccess]       = useState(false);
  const [bookingId,     setBookingId]     = useState('');
  const [error,         setError]         = useState('');
  const [bookingHistory, setBookingHistory] = useState([]);

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

    // Load booking history from localStorage
    const saved = localStorage.getItem('bookingHistory');
    if (saved) {
      try { setBookingHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { setError('Vui lòng nhập biển số');  return; }
    if (!form.dateIn)              { setError('Vui lòng chọn ngày vào'); return; }
    if (!form.dateOut)             { setError('Vui lòng chọn ngày ra');  return; }
    if (!form.timeFrom)            { setError('Vui lòng chọn giờ vào'); return; }
    if (!form.timeTo)              { setError('Vui lòng chọn giờ ra');  return; }

    // Validate date out >= date in
    if (form.dateOut < form.dateIn) { setError('Ngày ra phải sau hoặc bằng ngày vào'); return; }

    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const id = `BK${Date.now().toString().slice(-6)}`;
    setBookingId(id);

    // Save to booking history
    const newBooking = {
      id,
      licensePlate: form.licensePlate,
      vehicleType: form.vehicleType,
      floor: form.floor,
      dateIn: form.dateIn,
      dateOut: form.dateOut,
      timeFrom: form.timeFrom,
      timeTo: form.timeTo,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const updatedHistory = [newBooking, ...bookingHistory];
    setBookingHistory(updatedHistory);
    localStorage.setItem('bookingHistory', JSON.stringify(updatedHistory));

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
            { label: 'Loại xe',    value: form.vehicleType },
            { label: 'Tầng',       value: form.floor },
            { label: 'Ngày vào',   value: form.dateIn },
            { label: 'Ngày ra',    value: form.dateOut },
            { label: 'Giờ vào',    value: form.timeFrom },
            { label: 'Giờ ra',     value: form.timeTo },
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
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setTab('history')}
            style={{
              flex: 1, padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <List size={16} /> Xem lịch sử
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setSuccess(false); setForm({ licensePlate: '', vehicleType: 'MOTORBIKE', floor: 'Basement 1', dateIn: '', dateOut: '', timeFrom: '', timeTo: '' }); }}>
            <span>📌 Đặt chỗ mới</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📌 Đặt chỗ trước</h2>
        <p>Giữ chỗ đỗ xe theo thời gian</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${tab === 'book' ? 'active' : ''}`} onClick={() => setTab('book')}>
          <Calendar size={16} style={{ marginRight: 6 }} /> Đặt chỗ
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <List size={16} style={{ marginRight: 6 }} /> Lịch sử ({bookingHistory.length})
        </button>
      </div>

      {/* Tab: Book */}
      {tab === 'book' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Form */}
          <div className="card">
            {/* Warning */}
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24, fontSize: '0.85rem', color: '#f59e0b' }}>
              ⚠️ Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn (BR-05). Hết thời gian slot tự về FREE.
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

            {/* Date In & Date Out */}
            <div className="form-group">
              <label className="form-label">Ngày</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Ngày vào</label>
                  <input type="date" className="form-input" value={form.dateIn}
                    onChange={e => setForm({ ...form, dateIn: e.target.value })}
                    style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Ngày ra</label>
                  <input type="date" className="form-input" value={form.dateOut}
                    min={form.dateIn}
                    onChange={e => setForm({ ...form, dateOut: e.target.value })}
                    style={{ colorScheme: 'dark' }} />
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="form-group">
              <label className="form-label">Thời gian</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              <Calendar size={18} />
              <span>{loading ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}</span>
            </button>
          </div>

          {/* Sidebar */}
          <div className="right-sidebar">
            <div className="card">
              <div className="card-title"><MapPin size={18} /> Thông tin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Biển số',  value: form.licensePlate || '—' },
                  { label: 'Loại xe', value: form.vehicleType },
                  { label: 'Tầng',    value: form.floor },
                  { label: 'Ngày vào', value: form.dateIn || '—' },
                  { label: 'Ngày ra',  value: form.dateOut || '—' },
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
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <>
          {bookingHistory.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có đặt chỗ nào</p>
              <button className="btn-primary" style={{ maxWidth: 260, margin: '0 auto' }} onClick={() => setTab('book')}>
                <span>📌 Đặt chỗ ngay</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookingHistory.map(booking => (
                <div key={booking.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{VEHICLE_ICON[booking.vehicleType] || '🚗'}</span>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', marginBottom: 2 }}>{booking.licensePlate}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mã: {booking.id}</p>
                      </div>
                    </div>
                    <span className={`badge ${booking.status === 'PENDING' ? 'badge-warning' : booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: '0.75rem' }}>
                      {booking.status === 'PENDING' ? 'Đang chờ' : booking.status === 'CONFIRMED' ? 'Đã xác nhận' : booking.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Tầng', value: booking.floor },
                      { label: 'Ngày vào', value: booking.dateIn },
                      { label: 'Ngày ra', value: booking.dateOut },
                      { label: 'Giờ', value: `${booking.timeFrom} → ${booking.timeTo}` },
                    ].map(r => (
                      <div key={r.label} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{r.label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Đặt lúc: {new Date(booking.createdAt).toLocaleString('vi-VN')}
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
