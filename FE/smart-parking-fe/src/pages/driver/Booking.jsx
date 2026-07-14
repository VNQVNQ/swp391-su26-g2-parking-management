import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  CONFIRMED: { label: 'Đã xác nhận',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  CANCELLED: { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  EXPIRED:   { label: 'Hết hạn',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toLocalDT(date, time) {
  return `${date}T${time}:00`;
}

function calcDuration(timeFrom, timeTo) {
  if (!timeFrom || !timeTo) return 0;
  const [h1, m1] = timeFrom.split(':').map(Number);
  const [h2, m2] = timeTo.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

export default function Booking() {
  const [form, setForm] = useState({
    vehicleId: '',
    vehicleType: 'MOTORBIKE',
    licensePlate: '',
    date: getTodayStr(),
    timeFrom: '',
    timeTo: '',
    useManualEntry: false,
    slotId: '',
    slotCode: '',
  });

  const [vehicles,       setVehicles]       = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loading,        setLoading]        = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [bookingResult,  setBookingResult]  = useState(null);
  const [error,          setError]          = useState('');

  // ── State cho Modal Chọn Chỗ ──
  const [showMapModal,    setShowMapModal]    = useState(false);
  const [zones,           setZones]           = useState([]);
  const [slots,           setSlots]           = useState([]);
  const [bookedSlotIds,   setBookedSlotIds]   = useState([]);
  const [activeZone,      setActiveZone]      = useState(null);
  const [modalLoading,    setModalLoading]    = useState(false);
  const [selectedSlot,    setSelectedSlot]    = useState(null); // { id, slotCode }

  /* ── Load xe đã đăng ký ── */
  useEffect(() => {
    const load = async () => {
      setVehiclesLoading(true);
      try {
        const res = await api.get('/api/v1/vehicles/my-vehicles');
        const data = res.data.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setVehicles(list);
        if (list.length > 0) {
          setForm(f => ({
            ...f,
            vehicleId:   list[0].id,
            licensePlate: list[0].licensePlate,
            vehicleType: list[0].vehicleType || 'MOTORBIKE',
          }));
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    load();
  }, []);

  /* ── Load Zones phù hợp loại xe khi mở Modal ── */
  const openSlotSelection = async () => {
    if (!form.date || !form.timeFrom || !form.timeTo) {
      setError('Vui lòng điền đầy đủ Ngày, Giờ vào và Giờ ra trước khi chọn chỗ đỗ');
      return;
    }
    if (calcDuration(form.timeFrom, form.timeTo) < 15) {
      setError('Thời gian đặt tối thiểu là 15 phút để hiển thị sơ đồ chỗ trống');
      return;
    }

    setShowMapModal(true);
    setModalLoading(true);
    try {
      const res = await api.get('/api/v1/zones');
      const allZones = res.data.data ?? res.data ?? [];
      // Lọc các zone trùng khớp với loại xe đã chọn
      const filteredZones = allZones.filter(z => z.vehicleType === form.vehicleType);
      setZones(filteredZones);
      if (filteredZones.length > 0) {
        setActiveZone(filteredZones[0]);
      } else {
        setActiveZone(null);
        setSlots([]);
        setBookedSlotIds([]);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Load slots & booked slots của activeZone ứng với khoảng thời gian đã điền ── */
  const loadZoneSlots = useCallback(async (zone) => {
    if (!zone) return;
    setModalLoading(true);
    try {
      const startTimeISO = toLocalDT(form.date, form.timeFrom);
      const duration = calcDuration(form.timeFrom, form.timeTo);
      const endTimeISO = new Date(new Date(startTimeISO).getTime() + duration * 60 * 1000).toISOString().slice(0, 19);

      const [slotsRes, bookedRes] = await Promise.all([
        api.get(`/api/v1/parking-slots/zone/${zone.id}`),
        api.get(`/api/v1/bookings/zone/${zone.id}/booked-slots`, {
          params: { startTime: startTimeISO, endTime: endTimeISO }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      setSlots(slotsRes.data?.data ?? slotsRes.data ?? []);
      const bookedIds = bookedRes.data?.data ?? bookedRes.data ?? [];
      setBookedSlotIds(Array.isArray(bookedIds) ? bookedIds : []);
    } catch (err) {
      console.error('Error loading slots for zone:', err);
      setSlots([]);
      setBookedSlotIds([]);
    } finally {
      setModalLoading(false);
    }
  }, [form.date, form.timeFrom, form.timeTo]);

  useEffect(() => {
    if (showMapModal && activeZone) {
      loadZoneSlots(activeZone);
    }
  }, [showMapModal, activeZone, loadZoneSlots]);

  /* ── Validation form chính ── */
  const validate = () => {
    if (!form.vehicleId && !form.useManualEntry) { setError('Vui lòng chọn xe'); return false; }
    if (form.useManualEntry && !form.licensePlate.trim()) { setError('Vui lòng nhập biển số'); return false; }
    if (!form.date)     { setError('Vui lòng chọn ngày'); return false; }
    if (!form.timeFrom) { setError('Vui lòng chọn giờ vào'); return false; }
    if (!form.timeTo)   { setError('Vui lòng chọn giờ ra'); return false; }

    const duration = calcDuration(form.timeFrom, form.timeTo);
    if (duration < 15)  { setError('Thời gian đặt tối thiểu 15 phút'); return false; }
    if (duration > 720) { setError('Thời gian đặt tối đa 12 giờ'); return false; }

    const startDT = new Date(`${form.date}T${form.timeFrom}:00`);
    if (startDT < new Date(Date.now() + 5 * 60 * 1000)) {
      setError('Giờ vào phải ít nhất 5 phút sau thời điểm hiện tại');
      return false;
    }
    return true;
  };

  /* ── Submit đặt chỗ ── */
  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const startTime = toLocalDT(form.date, form.timeFrom);
      const duration  = calcDuration(form.timeFrom, form.timeTo);

      const payload = {
        vehicleId:       form.vehicleId,
        startTime,
        durationMinutes: duration,
        slotId:          form.slotId || null // Nếu rỗng thì BE tự phân bổ
      };

      const res = await api.post('/api/v1/bookings', payload);
      const booking = res.data.data ?? res.data;
      setBookingResult(booking);
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Đặt chỗ thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset form ── */
  const resetForm = () => {
    setSuccess(false);
    setBookingResult(null);
    setError('');
    setForm(f => ({ ...f, timeFrom: '', timeTo: '', slotId: '', slotCode: '' }));
    setSelectedSlot(null);
  };

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const duration = form.timeFrom && form.timeTo ? calcDuration(form.timeFrom, form.timeTo) : 0;

  /* ── Màn hình thành công ── */
  if (success && bookingResult) {
    const statusCfg = STATUS_CONFIG[bookingResult.status] || STATUS_CONFIG.PENDING;
    const endTime = bookingResult.endTime
      ? new Date(bookingResult.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '—';
    const startTimeDisplay = bookingResult.startTime
      ? new Date(bookingResult.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : form.timeFrom;
    const dateDisplay = bookingResult.startTime
      ? new Date(bookingResult.startTime).toLocaleDateString('vi-VN')
      : form.date;
    const expiryDisplay = bookingResult.bookingExpiryAt
      ? new Date(bookingResult.bookingExpiryAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '—';

    return (
      <div className="page-full">
        <div className="page-header"><h2>📌 Đặt chỗ trước</h2></div>

        <div className="card" style={{ maxWidth: 540, margin: '0 auto', padding: 40, textAlign: 'center', borderRadius: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '2rem',
          }}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>

          <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Đặt chỗ thành công!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
            Chỗ đỗ xe đã được giữ cho bạn
          </p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'left' }}>
            {[
              { label: 'Mã đặt chỗ',  value: bookingResult.bookingCode || '—', bold: true, mono: true },
              { label: 'Biển số',      value: bookingResult.licensePlate || form.licensePlate },
              { label: 'Chỗ đỗ',      value: bookingResult.slotCode || 'Tự động phân bổ' },
              { label: 'Ngày',         value: dateDisplay },
              { label: 'Giờ vào',      value: startTimeDisplay },
              { label: 'Giờ ra',       value: endTime },
              { label: 'Thời lượng',   value: `${bookingResult.durationMinutes || duration} phút` },
              { label: 'Trạng thái',   value: statusCfg.label, chip: true, chipColor: statusCfg.color, chipBg: statusCfg.bg },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                {r.chip ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: r.chipColor, background: r.chipBg, padding: '2px 10px', borderRadius: 99 }}>
                    {r.value}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-primary)', fontWeight: r.bold ? 700 : 600, fontSize: '0.85rem', fontFamily: r.mono ? 'monospace' : 'inherit' }}>
                    {r.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: '0.83rem', color: '#f59e0b', textAlign: 'left' }}>
            ⚠️ Chỗ được giữ đến <strong>{expiryDisplay}</strong> (30 phút sau giờ hẹn). Quá thời gian sẽ tự động hủy.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => window.location.href = '/driver/booking-history'}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12 }}>
              📋 Xem lịch sử
            </button>
            <button className="btn-primary" onClick={resetForm}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12 }}>
              <Calendar size={16} />
              <span>Đặt chỗ mới</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📌 Đặt chỗ trước</h2>
        <p>Giữ chỗ đỗ xe theo thời gian và tự do chọn vị trí</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
        {/* Form chính */}
        <div className="card" style={{ padding: 32, borderRadius: 24 }}>
          {/* Warning banner */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 28, fontSize: '0.84rem', color: '#f59e0b', display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn. Vui lòng đến đúng giờ.</span>
          </div>

          {/* Chọn xe */}
          <div className="form-group">
            <label className="form-label">
              {vehicles.length > 0 && !form.useManualEntry ? 'Chọn xe của tôi' : 'Biển số xe'}
              <span className="required">*</span>
            </label>

            {vehiclesLoading ? (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải danh sách xe...</div>
            ) : vehicles.length > 0 && !form.useManualEntry ? (
              <>
                <div className="form-select-wrapper">
                  <select
                    className="form-select"
                    value={form.vehicleId}
                    onChange={e => {
                      const v = vehicles.find(x => x.id === e.target.value);
                      setForm(f => ({
                        ...f,
                        vehicleId: e.target.value,
                        licensePlate: v?.licensePlate || '',
                        vehicleType: v?.vehicleType || 'MOTORBIKE',
                        slotId: '',
                        slotCode: '',
                      }));
                      setSelectedSlot(null);
                    }}>
                    <option value="">-- Chọn xe --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {VEHICLE_ICON[v.vehicleType]} {v.licensePlate} ({v.vehicleType === 'MOTORBIKE' ? 'Xe máy' : v.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => {
                  setForm(f => ({ ...f, useManualEntry: true, vehicleId: '', licensePlate: '', slotId: '', slotCode: '' }));
                  setSelectedSlot(null);
                }}
                  style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Nhập biển số khác
                </button>
              </>
            ) : (
              <>
                <div className="form-input-wrapper">
                  <input type="text" className="form-input" placeholder="VD: 51G-12345"
                    value={form.licensePlate}
                    onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))} />
                </div>
                {vehicles.length > 0 && (
                  <button type="button" onClick={() => {
                    setForm(f => ({ ...f, useManualEntry: false, slotId: '', slotCode: '' }));
                    setSelectedSlot(null);
                  }}
                    style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    ← Quay lại danh sách xe
                  </button>
                )}
              </>
            )}
          </div>

          {/* Loại xe nếu manual */}
          {(form.useManualEntry || vehicles.length === 0) && (
            <div className="form-group">
              <label className="form-label">Loại xe</label>
              <div className="vehicle-type-grid">
                {[['MOTORBIKE','🏍️','Xe máy'],['CAR','🚗','Ô tô'],['TRUCK','🚛','Xe tải']].map(([type, icon, label]) => (
                  <div key={type}
                    className={`vehicle-type-card ${form.vehicleType === type ? 'selected' : ''}`}
                    onClick={() => {
                      setForm(f => ({ ...f, vehicleType: type, slotId: '', slotCode: '' }));
                      setSelectedSlot(null);
                    }}>
                    <span style={{ fontSize: 26 }}>{icon}</span>
                    <span className="vehicle-name">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thời gian */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} style={{ marginRight: 4 }} />
              Thời gian đặt chỗ
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Ngày</label>
                <input type="date" className="form-input" value={form.date}
                  min={getTodayStr()}
                  onChange={e => {
                    setForm(f => ({ ...f, date: e.target.value, slotId: '', slotCode: '' }));
                    setSelectedSlot(null);
                  }}
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Giờ vào</label>
                <input type="time" className="form-input" value={form.timeFrom}
                  onChange={e => {
                    setForm(f => ({ ...f, timeFrom: e.target.value, slotId: '', slotCode: '' }));
                    setSelectedSlot(null);
                  }}
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Giờ ra</label>
                <input type="time" className="form-input" value={form.timeTo}
                  onChange={e => {
                    setForm(f => ({ ...f, timeTo: e.target.value, slotId: '', slotCode: '' }));
                    setSelectedSlot(null);
                  }}
                  style={{ colorScheme: 'dark' }} />
              </div>
            </div>
            {duration > 0 && (
              <p style={{ marginTop: 8, fontSize: '0.82rem', color: duration < 15 || duration > 720 ? '#ef4444' : 'var(--text-muted)' }}>
                {duration < 15 ? '⚠️ Tối thiểu 15 phút' : duration > 720 ? '⚠️ Tối đa 12 giờ (720 phút)' : `⏱️ Thời lượng: ${duration} phút`}
              </p>
            )}
          </div>

          {/* Chọn vị trí đỗ (Manual Slot Selection) */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎯 Chọn vị trí đỗ xe</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Mặc định: Tự động phân bổ)</span>
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                flex: 1, padding: '12px 16px', background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                color: form.slotCode ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: form.slotCode ? 700 : 400, fontSize: '0.9rem',
              }}>
                {form.slotCode ? `Vị trí đã chọn: Slot ${form.slotCode}` : 'Hệ thống tự động xếp chỗ'}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={openSlotSelection}
                disabled={!form.date || !form.timeFrom || !form.timeTo || duration < 15 || duration > 720}
                style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <MapPin size={16} />
                Xem sơ đồ
              </button>
            </div>
            {(!form.date || !form.timeFrom || !form.timeTo || duration < 15) && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                * Vui lòng nhập đầy đủ thông tin thời gian hợp lệ trước để xem sơ đồ chỗ trống.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ padding: '14px 24px', borderRadius: 14, fontSize: '1rem', marginTop: 8, width: '100%' }}>
            <Calendar size={18} />
            <span>{loading ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}</span>
          </button>
        </div>

        {/* Sidebar xem trước */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>
              <MapPin size={18} color="var(--accent-primary)" /> Thông tin đặt chỗ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Biển số',     value: form.licensePlate || '—' },
                { label: 'Loại xe',     value: form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : form.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải' },
                { label: 'Ngày',        value: form.date ? new Date(form.date).toLocaleDateString('vi-VN') : '—' },
                { label: 'Giờ vào',     value: form.timeFrom || '—' },
                { label: 'Giờ ra',      value: form.timeTo   || '—' },
                { label: 'Chỗ đỗ',      value: form.slotCode || 'Tự động' },
                { label: 'Thời lượng',  value: duration > 0 ? `${duration} phút` : '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{r.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.83rem' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Chọn Chỗ Bản Đồ ── */}
      {showMapModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 840, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', padding: 0,
            overflow: 'hidden', borderRadius: 24, border: '1px solid var(--border-color)'
          }}>
            {/* Header modal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 28px', borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)'
            }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📍 Chọn vị trí đỗ xe</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '4px 0 0' }}>
                  Loại xe: {form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : form.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'} · Khung giờ: {form.timeFrom} → {form.timeTo} ({form.date})
                </p>
              </div>
              <button onClick={() => setShowMapModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Content modal */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar Zones */}
              <div style={{ borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-card)' }}>
                <div style={{ padding: '10px 16px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Khu vực phù hợp
                </div>
                {zones.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: 16, fontSize: '0.8rem' }}>Không có khu vực phù hợp loại xe</p>
                ) : (
                  zones.map(zone => {
                    const isActive = activeZone?.id === zone.id;
                    return (
                      <button key={zone.id} onClick={() => { setActiveZone(zone); setSelectedSlot(null); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '12px 16px',
                          background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                          border: 'none', borderLeft: isActive ? '3.5px solid var(--accent-primary)' : '3.5px solid transparent',
                          borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                        <p style={{ fontWeight: 600, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '0.82rem', margin: 0 }}>
                          {VEHICLE_ICON[zone.vehicleType]} {zone.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          {zone.floorName} · {zone.totalSlots} slots
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Grid Slots */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {activeZone ? (
                  <>
                    {/* Chú giải */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>Sơ đồ chỗ đỗ:</span>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Trống',      color: 'var(--accent-primary)' },
                          { label: 'Chọn (Click)', color: 'var(--accent-blue)' },
                          { label: 'Đang đỗ',    color: '#ef4444' },
                          { label: 'Bận (Đặt trước)', color: '#8b5cf6' },
                          { label: 'Bảo trì',    color: '#f59e0b' },
                        ].map(l => (
                          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {modalLoading ? (
                      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', flex: 1 }}>Đang tải sơ đồ...</div>
                    ) : slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', flex: 1 }}>Không có chỗ nào trong khu vực này</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                        {slots.map(slot => {
                          const isOccupied    = !!slot.currentSessionId;
                          const isMaintenance = slot.maintenanceStatus === 'MAINTENANCE';
                          const isBooked      = !isOccupied && !isMaintenance && bookedSlotIds.includes(slot.id);
                          const isSelected    = selectedSlot?.id === slot.id;

                          const isDisabled = isOccupied || isMaintenance || isBooked;

                          const slotColor = isSelected ? 'var(--accent-blue)' : isOccupied ? '#ef4444' : isMaintenance ? '#f59e0b' : isBooked ? '#8b5cf6' : 'var(--accent-primary)';
                          const slotBg    = isSelected ? 'rgba(59,130,246,0.15)' : isOccupied ? 'rgba(239,68,68,0.06)' : isMaintenance ? 'rgba(245,158,11,0.06)' : isBooked ? 'rgba(139,92,246,0.06)' : 'rgba(16,185,129,0.06)';
                          const borderColor = isSelected ? 'var(--accent-blue)' : isDisabled ? 'rgba(255,255,255,0.12)' : 'rgba(16,185,129,0.25)';

                          return (
                            <button
                              key={slot.id}
                              disabled={isDisabled}
                              onClick={() => setSelectedSlot({ id: slot.id, slotCode: slot.slotCode })}
                              style={{
                                background: slotBg,
                                border: `1.5px solid ${borderColor}`,
                                borderRadius: 12, padding: '12px 6px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                minHeight: 64, cursor: isDisabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                              }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: slotColor }}>
                                {slot.slotCode.split('-').slice(-1)[0] || slot.slotCode}
                              </span>
                              {isOccupied && <span style={{ fontSize: '0.55rem', color: '#ef4444', marginTop: 3 }}>Đang đỗ</span>}
                              {isBooked && <span style={{ fontSize: '0.55rem', color: '#8b5cf6', marginTop: 3 }}>Đã đặt</span>}
                              {isMaintenance && <span style={{ fontSize: '0.55rem', color: '#f59e0b', marginTop: 3 }}>Bảo trì</span>}
                              {!isDisabled && !isSelected && <span style={{ fontSize: '0.55rem', color: 'var(--accent-primary)', marginTop: 3 }}>Trống</span>}
                              {isSelected && <span style={{ fontSize: '0.55rem', color: 'var(--accent-blue)', marginTop: 3, fontWeight: 700 }}>Chọn ✔</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Vui lòng chọn Khu vực</div>
                )}
              </div>
            </div>

            {/* Footer modal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 28px', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)'
            }}>
              <div>
                {selectedSlot ? (
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    Chỗ đang chọn: <strong>{selectedSlot.slotCode}</strong>
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa chọn chỗ đỗ</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={() => {
                  setForm(f => ({ ...f, slotId: '', slotCode: '' }));
                  setSelectedSlot(null);
                  setShowMapModal(false);
                }} style={{ padding: '8px 16px', borderRadius: 10 }}>
                  Không chọn chỗ (Hệ thống tự xếp)
                </button>
                <button
                  className="btn-primary"
                  disabled={!selectedSlot}
                  onClick={() => {
                    setForm(f => ({ ...f, slotId: selectedSlot.id, slotCode: selectedSlot.slotCode }));
                    setShowMapModal(false);
                  }}
                  style={{ padding: '8px 24px', borderRadius: 10 }}>
                  Xác nhận chọn chỗ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
