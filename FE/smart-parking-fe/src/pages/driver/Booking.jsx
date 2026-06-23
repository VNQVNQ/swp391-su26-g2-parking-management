import { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', icon: '🏍️', label: 'Xe máy' },
  { id: 'CAR',       icon: '🚗', label: 'Ô tô'   },
  { id: 'TRUCK',     icon: '🚛', label: 'Xe tải' },
];

export default function Booking() {
  const [form, setForm] = useState({
    licensePlate: '', vehicleType: 'MOTORBIKE', zoneId: '', date: '', timeFrom: '', timeTo: '',
  });

  const [zones,   setZones]   = useState([]);
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // BookingResponse từ BE
  const [error,   setError]   = useState('');

  // ── Tải danh sách Zone phù hợp mỗi khi đổi loại xe ──────────────────────
  useEffect(() => {
    setZones([]); setSlots([]); setForm(f => ({ ...f, zoneId: '' }));
    api.get(`/api/v1/zones/vehicle-type/${form.vehicleType}`)
      .then(res => {
        const data = res.data.data ?? res.data ?? [];
        setZones(Array.isArray(data) ? data : []);
      })
      .catch(() => setZones([]));
  }, [form.vehicleType]);

  // ── Tải slot trống mỗi khi đổi Zone ─────────────────────────────────────
  useEffect(() => {
    if (!form.zoneId) { setSlots([]); return; }
    api.get(`/api/v1/parking-slots/available/zone/${form.zoneId}`)
      .then(res => {
        const data = res.data.data ?? res.data ?? [];
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => setSlots([]));
  }, [form.zoneId]);

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { setError('Vui lòng nhập biển số');  return; }
    if (!form.date)                { setError('Vui lòng chọn ngày');     return; }
    if (!form.timeFrom)            { setError('Vui lòng chọn giờ vào'); return; }
    if (!form.timeTo)              { setError('Vui lòng chọn giờ ra');  return; }

    const startTime = `${form.date}T${form.timeFrom}:00`;
    const endDate    = new Date(`${form.date}T${form.timeTo}:00`);
    const startDate  = new Date(startTime);
    const durationMinutes = Math.round((endDate - startDate) / 60000);

    if (durationMinutes <= 0) { setError('Giờ ra phải sau giờ vào'); return; }
    if (durationMinutes < 15) { setError('Thời gian đặt chỗ tối thiểu 15 phút'); return; }
    if (durationMinutes > 720) { setError('Thời gian đặt chỗ tối đa 12 giờ'); return; }

    setError(''); setLoading(true);

    try {
      // 1. Tra vehicleId từ biển số — xe phải đã được đăng ký trước đó
      let vehicleId;
      try {
        const vehicleRes = await api.get(`/api/v1/vehicles/plate/${form.licensePlate.trim().toUpperCase()}`);
        vehicleId = (vehicleRes.data.data ?? vehicleRes.data)?.id;
      } catch {
        setError('Không tìm thấy xe với biển số này. Vui lòng đăng ký xe trước khi đặt chỗ.');
        setLoading(false);
        return;
      }

      // 2. Gửi yêu cầu đặt chỗ thật lên BE
      // Nếu đã chọn 1 slot cụ thể → slotId. Nếu không chọn Zone/slot → để BE tự tìm slot trống phù hợp.
      const payload = {
        vehicleId,
        slotId: form.zoneId && slots.length > 0 ? slots[0].id : null,
        startTime,
        durationMinutes,
        notes: '',
      };

      const res = await api.post('/api/v1/bookings', payload);
      const booking = res.data.data ?? res.data;
      setSuccess(booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt chỗ thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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
            { label: 'Mã đặt chỗ', value: success.bookingCode },
            { label: 'Biển số',    value: success.licensePlate },
            { label: 'Slot',       value: success.slotCode },
            { label: 'Bắt đầu',    value: success.startTime ? new Date(success.startTime).toLocaleString('vi-VN') : '—' },
            { label: 'Kết thúc',   value: success.endTime ? new Date(success.endTime).toLocaleString('vi-VN') : '—' },
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
        <button className="btn-primary" onClick={() => {
          setSuccess(null);
          setForm({ licensePlate: '', vehicleType: 'MOTORBIKE', zoneId: '', date: '', timeFrom: '', timeTo: '' });
        }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Form */}
        <div className="card">
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24, fontSize: '0.85rem', color: '#f59e0b' }}>
            ⚠️ Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn (BR-05). Hết thời gian slot tự về FREE.
            Thời gian đặt chỗ phải bắt đầu ít nhất 5 phút sau hiện tại, và kéo dài 15 phút – 12 giờ.
          </div>

          {/* Biển số */}
          <div className="form-group">
            <label className="form-label">Biển số xe <span className="required">*</span></label>
            <div className="form-input-wrapper">
              <input type="text" className="form-input" placeholder="VD: 51A-12345"
                value={form.licensePlate}
                onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Xe phải đã được đăng ký trong hệ thống ở mục "Đăng ký xe"
            </p>
          </div>

          {/* Loại xe */}
          <div className="form-group">
            <label className="form-label">Loại xe</label>
            <div className="vehicle-type-grid">
              {VEHICLE_TYPES.map(v => (
                <div key={v.id}
                  className={`vehicle-type-card ${form.vehicleType === v.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, vehicleType: v.id })}>
                  <span style={{ fontSize: 28 }}>{v.icon}</span>
                  <span className="vehicle-name">{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone (khu vực) — lấy từ BE theo loại xe */}
          <div className="form-group">
            <label className="form-label">Khu vực mong muốn</label>
            <div className="form-select-wrapper">
              <select className="form-select" value={form.zoneId}
                onChange={e => setForm({ ...form, zoneId: e.target.value })}>
                <option value="">Để hệ thống tự chọn slot trống</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.floorName} — {z.name} ({z.totalSlots} slot)
                  </option>
                ))}
              </select>
            </div>
            {form.zoneId && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {slots.length > 0
                  ? `Còn ${slots.length} slot trống trong khu vực này`
                  : 'Khu vực này hiện không còn slot trống'}
              </p>
            )}
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
                { label: 'Khu vực', value: zones.find(z => z.id === form.zoneId)?.name || 'Tự động' },
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
