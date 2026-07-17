import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle2, X, Car, Bike, Truck, ArrowRight, Grid3x3 } from 'lucide-react';
import api from '../../services/api';
import { compareSlotCodes } from '../../utils/slotHelper';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

const STATUS_CONFIG = {
  PENDING: { label: 'Chưa vào', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  CONFIRMED: { label: 'Đã vào', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  EXPIRED: { label: 'Hết hạn', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toLocalDT(date, time) {
  return `${date}T${time}:00`;
}

function calcDuration(dateFrom, timeFrom, dateTo, timeTo) {
  if (!dateFrom || !timeFrom || !dateTo || !timeTo) return 0;
  const dt1 = new Date(`${dateFrom}T${timeFrom}:00`);
  const dt2 = new Date(`${dateTo}T${timeTo}:00`);
  return Math.round((dt2 - dt1) / (1000 * 60));
}

export default function Booking() {
  const [form, setForm] = useState({
    vehicleId: '',
    vehicleType: 'CAR',
    licensePlate: '',
    date: getTodayStr(),
    endDate: getTodayStr(),
    timeFrom: '',
    timeTo: '',
    useManualEntry: false,
    slotId: '',
    slotCode: '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState('');

  // ── State cho Modal Chọn Chỗ ──
  const [showMapModal, setShowMapModal] = useState(false);
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookedSlotIds, setBookedSlotIds] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // { id, slotCode }

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
            vehicleId: list[0].id,
            licensePlate: list[0].licensePlate,
            vehicleType: list[0].vehicleType || 'CAR',
            useManualEntry: false
          }));
        } else {
          setForm(f => ({ ...f, vehicleId: '', licensePlate: '', useManualEntry: true }));
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setForm(f => ({ ...f, vehicleId: '', licensePlate: '', useManualEntry: true }));
      } finally {
        setVehiclesLoading(false);
      }
    };
    load();
  }, []);

  /* ── Load Zones phù hợp loại xe khi mở Modal ── */
  const openSlotSelection = async () => {
    if (!form.date || !form.timeFrom || !form.endDate || !form.timeTo) {
      setError('Vui lòng điền đầy đủ Ngày vào, Giờ vào, Ngày ra và Giờ ra trước khi chọn chỗ đỗ');
      return;
    }
    if (calcDuration(form.date, form.timeFrom, form.endDate, form.timeTo) < 15) {
      setError('Thời gian đặt tối thiểu là 15 phút để hiển thị sơ đồ chỗ trống');
      return;
    }

    setShowMapModal(true);
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.get('/api/v1/zones');
      const allZones = res.data.data ?? res.data ?? [];
      const filteredZones = allZones.filter(z => z.vehicleType === form.vehicleType);

      setZones(filteredZones);
      if (filteredZones.length > 0) {
        setActiveZone(filteredZones[0]);
      } else {
        setActiveZone(null);
        setSlots([]);
        setBookedSlotIds([]);
        setModalError(`Không tìm thấy khu vực nào dành cho loại xe ${form.vehicleType === 'CAR' ? 'Ô tô' : form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : 'Xe tải'}.`);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
      setModalError('Lỗi khi tải danh sách khu vực. Vui lòng thử lại.');
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Load slots & booked slots của activeZone ── */
  const loadZoneSlots = useCallback(async (zone) => {
    if (!zone) return;
    setModalLoading(true);
    setModalError('');
    try {
      const startTimeISO = toLocalDT(form.date, form.timeFrom);
      const duration = calcDuration(form.date, form.timeFrom, form.endDate, form.timeTo);
      const endTimeISO = new Date(new Date(startTimeISO).getTime() + duration * 60 * 1000).toISOString().slice(0, 19);

      const [slotsRes, bookedRes] = await Promise.all([
        api.get(`/api/v1/parking-slots/zone/${zone.id}`),
        api.get(`/api/v1/bookings/zone/${zone.id}/booked-slots`, {
          params: { startTime: startTimeISO, endTime: endTimeISO }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      const data = slotsRes.data?.data ?? slotsRes.data ?? [];
      const sorted = Array.isArray(data) ? [...data].sort(compareSlotCodes) : [];
      setSlots(sorted);
      const bookedIds = bookedRes.data?.data ?? bookedRes.data ?? [];
      setBookedSlotIds(Array.isArray(bookedIds) ? bookedIds : []);
    } catch (err) {
      console.error('Error loading slots for zone:', err);
      setModalError('Lỗi khi tải sơ đồ chỗ đỗ.');
      setSlots([]);
      setBookedSlotIds([]);
    } finally {
      setModalLoading(false);
    }
  }, [form.date, form.timeFrom, form.endDate, form.timeTo]);

  useEffect(() => {
    if (showMapModal && activeZone) {
      loadZoneSlots(activeZone);
    }
  }, [showMapModal, activeZone, loadZoneSlots]);

  /* ── Validation form chính ── */
  const validate = () => {
    if (!form.useManualEntry && !form.vehicleId) { setError('Vui lòng chọn xe đã đăng ký trong danh sách phương tiện của bạn'); return false; }
    if (form.useManualEntry) {
      const plate = form.licensePlate.trim();
      if (!plate) { setError('Vui lòng nhập biển số xe cần đặt chỗ'); return false; }
      const plateRegex = /^([1-9][0-9][A-Za-z][A-Za-z0-9]?|[A-Za-z]{2})[-.\s]?\d{5}(\.\d{1,2})?$/;
      if (!plateRegex.test(plate)) {
        setError('Biển số xe không hợp lệ (VD: 59B-123.45, 29A-12345)');
        return false;
      }
    }
    if (!form.date) { setError('Vui lòng chọn ngày vào'); return false; }
    if (!form.timeFrom) { setError('Vui lòng chọn giờ vào'); return false; }
    if (!form.endDate) { setError('Vui lòng chọn ngày ra'); return false; }
    if (!form.timeTo) { setError('Vui lòng chọn giờ ra'); return false; }

    const duration = calcDuration(form.date, form.timeFrom, form.endDate, form.timeTo);
    if (duration < 15) { setError('Thời gian đặt tối thiểu 15 phút'); return false; }
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
      const duration = calcDuration(form.date, form.timeFrom, form.endDate, form.timeTo);

      const payload = {
        vehicleId: form.useManualEntry ? null : form.vehicleId,
        licensePlate: form.useManualEntry ? form.licensePlate.trim() : undefined,
        vehicleType: form.useManualEntry ? form.vehicleType : undefined,
        startTime,
        durationMinutes: duration,
        slotId: form.slotId || null
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

  const duration = form.timeFrom && form.timeTo && form.date && form.endDate ? calcDuration(form.date, form.timeFrom, form.endDate, form.timeTo) : 0;

  /* ── Màn hình thành công ── */
  if (success && bookingResult) {
    const statusCfg = STATUS_CONFIG[bookingResult.status] || STATUS_CONFIG.PENDING;
    const endTime = bookingResult.endTime
      ? new Date(bookingResult.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : form.timeTo;
    const endDateDisplay = bookingResult.endTime
      ? new Date(bookingResult.endTime).toLocaleDateString('vi-VN')
      : form.endDate;
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
      <div className="page-full animate-fade-in-up">
        <div className="page-header"><h2>📌 Đặt chỗ trước</h2></div>

        <div className="card" style={{ maxWidth: 540, margin: '0 auto', padding: 40, textAlign: 'center', borderRadius: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '2rem',
            boxShadow: '0 0 20px rgba(16,185,129,0.3)'
          }}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>

          <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Đặt chỗ thành công!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
            Chỗ đỗ xe đã được giữ cho bạn
          </p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'left' }}>
            {[
              { label: 'Mã đặt chỗ', value: bookingResult.bookingCode || '—', bold: true, mono: true },
              { label: 'Biển số', value: bookingResult.licensePlate || form.licensePlate },
              { label: 'Chỗ đỗ', value: bookingResult.slotCode || 'Tự động phân bổ' },
              { label: 'Thời điểm vào', value: `${startTimeDisplay} (${dateDisplay})` },
              { label: 'Thời điểm ra', value: `${endTime} (${endDateDisplay})` },
              { label: 'Thời lượng', value: `${bookingResult.durationMinutes || duration} phút (~${((bookingResult.durationMinutes || duration) / 60).toFixed(1)} giờ)` },
              { label: 'Trạng thái', value: statusCfg.label, chip: true, chipColor: statusCfg.color, chipBg: statusCfg.bg },
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
    <div className="page-full animate-fade-in-up">
      <div className="page-header">
        <h2>📌 Đặt chỗ trước</h2>
        <p>Giữ chỗ đỗ xe theo thời gian và tự do chọn vị trí</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        {/* Form chính */}
        <div className="card" style={{ padding: 32, borderRadius: 24 }}>
          {/* Warning banner */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 28, fontSize: '0.84rem', color: '#f59e0b', display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn. Vui lòng đến đúng giờ.</span>
          </div>

          {/* Chọn xe */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Thông tin phương tiện <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: 3, border: '1px solid var(--border-color)' }}>
                {vehicles.length > 0 && (
                  <button type="button" onClick={() => { setForm(f => ({ ...f, useManualEntry: false, vehicleId: vehicles[0]?.id || '', licensePlate: vehicles[0]?.licensePlate || '', vehicleType: vehicles[0]?.vehicleType || 'CAR', slotId: '', slotCode: '' })); setSelectedSlot(null); }}
                    style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: !form.useManualEntry ? 'var(--bg-card)' : 'transparent', color: !form.useManualEntry ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: !form.useManualEntry ? 'var(--shadow-sm)' : 'none' }}>
                    Xe của tôi
                  </button>
                )}
                <button type="button" onClick={() => { setForm(f => ({ ...f, useManualEntry: true, vehicleId: '', licensePlate: '', slotId: '', slotCode: '' })); setSelectedSlot(null); }}
                  style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: form.useManualEntry ? 'var(--bg-card)' : 'transparent', color: form.useManualEntry ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: form.useManualEntry ? 'var(--shadow-sm)' : 'none' }}>
                  Nhập tay
                </button>
              </div>
            </div>

            {vehiclesLoading ? (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải danh sách xe...</div>
            ) : !form.useManualEntry && vehicles.length > 0 ? (
              <div className="form-select-wrapper">
                <select
                  className="form-select"
                  style={{ padding: '12px 16px', fontSize: '0.95rem' }}
                  value={form.vehicleId}
                  onChange={e => {
                    const v = vehicles.find(x => x.id === e.target.value);
                    setForm(f => ({
                      ...f,
                      vehicleId: e.target.value,
                      licensePlate: v?.licensePlate || '',
                      vehicleType: v?.vehicleType || 'CAR',
                      slotId: '',
                      slotCode: '',
                    }));
                    setSelectedSlot(null);
                  }}>
                  <option value="">-- Chọn xe đã đăng ký --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} - {v.vehicleType === 'MOTORBIKE' ? 'Xe máy' : v.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: '0.83rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>ℹ️ Biển số nhập tay sẽ <strong>không</strong> lưu vào danh sách xe chính chủ của bạn.</span>
                </div>
                <input type="text" className="form-input" placeholder="Nhập biển số xe (VD: 51G-12345)"
                  style={{ padding: '12px 16px', fontSize: '0.95rem' }}
                  value={form.licensePlate}
                  onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))} />
                <div className="vehicle-type-grid">
                  {[['MOTORBIKE', '🏍️', 'Xe máy'], ['CAR', '🚗', 'Ô tô'], ['TRUCK', '🚛', 'Xe tải']].map(([type, icon, label]) => (
                    <div key={type}
                      className={`vehicle-type-card ${form.vehicleType === type ? 'selected' : ''}`}
                      style={{ padding: '12px', transition: 'all 0.2s', transform: form.vehicleType === type ? 'scale(1.02)' : 'scale(1)' }}
                      onClick={() => {
                        setForm(f => ({ ...f, vehicleType: type, slotId: '', slotCode: '' }));
                        setSelectedSlot(null);
                      }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <span className="vehicle-name" style={{ fontSize: '0.85rem' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thời gian */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="var(--accent-primary)" />
              Thời gian đỗ xe <span className="required">*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Thời điểm vào */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🟢 Thời điểm vào
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Ngày vào</label>
                    <input type="date" className="form-input" value={form.date}
                      min={getTodayStr()}
                      onChange={e => {
                        const newDate = e.target.value;
                        setForm(f => ({
                          ...f,
                          date: newDate,
                          endDate: f.endDate < newDate ? newDate : f.endDate,
                          slotId: '', slotCode: ''
                        }));
                        setSelectedSlot(null);
                      }}
                      style={{ padding: '9px 10px', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Giờ vào</label>
                    <input type="time" className="form-input" value={form.timeFrom}
                      onChange={e => {
                        setForm(f => ({ ...f, timeFrom: e.target.value, slotId: '', slotCode: '' }));
                        setSelectedSlot(null);
                      }}
                      style={{ padding: '9px 10px', fontSize: '0.88rem' }} />
                  </div>
                </div>
              </div>

              {/* Thời điểm ra */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔴 Thời điểm ra
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Ngày ra</label>
                    <input type="date" className="form-input" value={form.endDate}
                      min={form.date || getTodayStr()}
                      onChange={e => {
                        setForm(f => ({ ...f, endDate: e.target.value, slotId: '', slotCode: '' }));
                        setSelectedSlot(null);
                      }}
                      style={{ padding: '9px 10px', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Giờ ra</label>
                    <input type="time" className="form-input" value={form.timeTo}
                      onChange={e => {
                        setForm(f => ({ ...f, timeTo: e.target.value, slotId: '', slotCode: '' }));
                        setSelectedSlot(null);
                      }}
                      style={{ padding: '9px 10px', fontSize: '0.88rem' }} />
                  </div>
                </div>
              </div>
            </div>
            {duration > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: duration < 15 || duration > 720 ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)', color: duration < 15 || duration > 720 ? '#ef4444' : 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {duration < 15 || duration > 720 ? <AlertCircle size={16} /> : <Clock size={16} color="var(--accent-primary)" />}
                {duration < 15 ? 'Thời lượng tối thiểu là 15 phút' : duration > 720 ? 'Thời lượng tối đa là 12 giờ (720 phút)' : `Tổng thời gian đặt: ${duration} phút (~${(duration / 60).toFixed(1)} giờ)`}
              </div>
            )}
          </div>

          {/* Chọn vị trí đỗ (Manual Slot Selection) */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, marginTop: 24 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} color="var(--accent-primary)" /> Vị trí đỗ xe</span>
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                flex: 1, padding: '12px 16px', background: form.slotCode ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                border: form.slotCode ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                color: form.slotCode ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: form.slotCode ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8
              }}>
                {form.slotCode ? <><Grid3x3 size={16} /> Vị trí đã chọn: {form.slotCode}</> : 'Hệ thống tự động xếp chỗ'}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={openSlotSelection}
                disabled={!form.date || !form.timeFrom || !form.timeTo || duration < 15 || duration > 720}
                style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <Grid3x3 size={16} />
                Xem sơ đồ
              </button>
            </div>
            {(!form.date || !form.timeFrom || !form.timeTo || duration < 15) && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                * Vui lòng nhập thời gian đỗ hợp lệ để xem sơ đồ chỗ trống.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ padding: '14px 24px', borderRadius: 14, fontSize: '1.05rem', marginTop: 12, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {loading ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Calendar size={18} />}
            <span>{loading ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}</span>
          </button>
        </div>

        {/* Sidebar xem trước */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24, borderRadius: 20, position: 'sticky', top: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
              <MapPin size={18} color="var(--accent-primary)" /> Tóm tắt đặt chỗ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Biển số', value: form.licensePlate || '—', mono: true },
                { label: 'Loại xe', value: form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : form.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải', icon: VEHICLE_ICON[form.vehicleType] },
                { label: 'Ngày', value: form.date ? new Date(form.date).toLocaleDateString('vi-VN') : '—' },
                { label: 'Giờ vào', value: form.timeFrom || '—' },
                { label: 'Giờ ra', value: form.timeTo || '—' },
                { label: 'Chỗ đỗ', value: form.slotCode || 'Hệ thống tự xếp', highlight: !!form.slotCode },
                { label: 'Thời lượng', value: duration > 0 ? `${duration} phút` : '—', color: duration < 15 || duration > 720 ? '#ef4444' : undefined },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                  <span style={{
                    color: r.color || (r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)'),
                    fontWeight: r.highlight || r.mono ? 700 : 500,
                    fontSize: '0.9rem',
                    fontFamily: r.mono ? 'monospace' : 'inherit',
                    background: r.highlight ? 'rgba(99,102,241,0.1)' : 'transparent',
                    padding: r.highlight ? '2px 8px' : '0',
                    borderRadius: 6
                  }}>
                    {r.icon && <span style={{ marginRight: 6 }}>{r.icon}</span>}
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Chọn Chỗ Bản Đồ ── */}
      {showMapModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div className="card animate-fade-in-up" style={{
            width: '100%', maxWidth: 900, maxHeight: '90vh', height: '800px',
            display: 'flex', flexDirection: 'column', padding: 0,
            overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Header modal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '24px 32px', borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Grid3x3 size={22} color="var(--accent-primary)" /> Sơ đồ vị trí đỗ xe
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} /> {form.timeFrom} → {form.timeTo} ({form.date})</span>
                  <span>•</span>
                  <span>{VEHICLE_ICON[form.vehicleType]} {form.vehicleType === 'MOTORBIKE' ? 'Xe máy' : form.vehicleType === 'CAR' ? 'Ô tô' : 'Xe tải'}</span>
                </p>
              </div>
              <button onClick={() => setShowMapModal(false)}
                style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content modal */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar Zones */}
              <div style={{ borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-card)' }}>
                <div style={{ padding: '16px 20px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Khu vực khả dụng
                </div>
                {modalLoading && zones.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
                ) : zones.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '0 20px', fontSize: '0.85rem' }}>Không có khu vực nào.</p>
                ) : (
                  zones.map(zone => {
                    const isActive = activeZone?.id === zone.id;
                    return (
                      <button key={zone.id} onClick={() => { setActiveZone(zone); setSelectedSlot(null); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '14px 20px',
                          background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                          border: 'none', borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
                          borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', gap: 4
                        }}>
                        <span style={{ fontWeight: 600, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {zone.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tầng: {zone.floorName || '—'} • {zone.totalSlots} chỗ
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Grid Slots */}
              <div style={{ padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                {activeZone ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Tình trạng: {activeZone.name}</span>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Trống', color: '#10b981' },
                          { label: 'Đang chọn', color: '#3b82f6' },
                          { label: 'Có xe', color: '#ef4444' },
                          { label: 'Đã đặt', color: '#8b5cf6' },
                          { label: 'Bảo trì', color: '#94a3b8' },
                        ].map(l => (
                          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {modalError ? (
                      <div style={{ textAlign: 'center', padding: 60, color: '#ef4444', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <AlertCircle size={40} />
                        <p>{modalError}</p>
                      </div>
                    ) : modalLoading ? (
                      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p>Đang kiểm tra sơ đồ chỗ đỗ...</p>
                      </div>
                    ) : slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', flex: 1 }}>Không có chỗ nào trong khu vực này</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 10, marginBottom: 20 }}>
                        {slots.map(slot => {
                          const isOccupied = !!slot.currentSessionId;
                          const isMaintenance = slot.maintenanceStatus === 'MAINTENANCE';
                          const isBooked = !isOccupied && !isMaintenance && bookedSlotIds.includes(slot.id);
                          const isSelected = selectedSlot?.id === slot.id;

                          const isDisabled = isOccupied || isMaintenance || isBooked;

                          let bg, border, textColor, label;
                          if (isSelected) {
                            bg = 'rgba(59,130,246,0.15)'; border = '#3b82f6'; textColor = '#3b82f6'; label = 'Chọn ✔';
                          } else if (isMaintenance) {
                            bg = 'rgba(100,116,139,0.15)'; border = 'rgba(100,116,139,0.4)'; textColor = '#94a3b8'; label = 'Bảo trì';
                          } else if (isOccupied) {
                            bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.4)'; textColor = '#ef4444'; label = 'Có xe';
                          } else if (isBooked) {
                            bg = 'rgba(139,92,246,0.15)'; border = 'rgba(139,92,246,0.4)'; textColor = '#8b5cf6'; label = 'Đã đặt';
                          } else {
                            bg = 'rgba(16,185,129,0.1)'; border = 'rgba(16,185,129,0.3)'; textColor = '#10b981'; label = 'Trống';
                          }

                          return (
                            <button
                              key={slot.id}
                              disabled={isDisabled}
                              onClick={() => setSelectedSlot({ id: slot.id, slotCode: slot.slotCode })}
                              className={!isDisabled ? 'hover-lift' : ''}
                              style={{
                                background: bg,
                                border: `1.5px solid ${border}`,
                                borderRadius: 10, padding: '8px 4px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                minHeight: 74, cursor: isDisabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                opacity: isDisabled ? 0.7 : 1,
                                boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none'
                              }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: textColor, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                                {slot.slotCode.split('-').slice(-1)[0] || slot.slotCode}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: textColor, marginTop: 6, fontWeight: isSelected ? 700 : 500 }}>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Vui lòng chọn Khu vực ở menu bên trái</div>
                )}
              </div>
            </div>

            {/* Footer modal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 32px', borderTop: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                {selectedSlot ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vị trí đã chọn:</span>
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', border: '1px solid rgba(59,130,246,0.3)' }}>
                      {selectedSlot.slotCode}
                    </span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa chọn chỗ đỗ</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" onClick={() => {
                  setForm(f => ({ ...f, slotId: '', slotCode: '' }));
                  setSelectedSlot(null);
                  setShowMapModal(false);
                }} style={{ padding: '10px 20px', borderRadius: 10 }}>
                  Để hệ thống tự xếp
                </button>
                <button
                  className="btn-primary"
                  disabled={!selectedSlot}
                  onClick={() => {
                    setForm(f => ({ ...f, slotId: selectedSlot.id, slotCode: selectedSlot.slotCode }));
                    setShowMapModal(false);
                  }}
                  style={{ padding: '10px 24px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Xác nhận chọn chỗ <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
