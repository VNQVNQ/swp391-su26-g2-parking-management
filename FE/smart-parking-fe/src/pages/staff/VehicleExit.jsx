import { useState, useCallback, useEffect } from 'react';
import { getActiveSessions, calculateFee, exitSession, processPayment } from '../../services/sessionApi';
import {
  Search, RefreshCw, Clock, MapPin, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft, CreditCard, Banknote, AlertTriangle, X,
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const VEHICLE_ICON  = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
const VEHICLE_LABEL = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };
const STEPS = ['search', 'info', 'payment', 'done'];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function calcDuration(entryTime) {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}
function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDateShort(dt) {
  return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/* ─── Step Indicator ─────────────────────────────────────────────────────────── */
function StepIndicator({ step }) {
  const steps = [
    { key: 'search',  label: 'Tìm xe',    icon: '🔍' },
    { key: 'info',    label: 'Thông tin',  icon: '📋' },
    { key: 'payment', label: 'Thanh toán', icon: '💳' },
    { key: 'done',    label: 'Hoàn tất',   icon: '✅' },
  ];
  const currentIdx = STEPS.indexOf(step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: done   ? 'var(--accent-primary)'
                          : active ? 'linear-gradient(135deg, var(--accent-primary), #059669)'
                                   : 'var(--bg-secondary)',
                border: `2px solid ${done || active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                boxShadow: active ? '0 0 0 4px rgba(16,185,129,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <CheckCircle size={20} color="#fff" /> : <span>{s.icon}</span>}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                color: active ? 'var(--accent-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 60, height: 2, marginBottom: 20,
                background: done ? 'var(--accent-primary)' : 'var(--border-color)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Exception Modal ────────────────────────────────────────────────────────── */
function ExceptionPanel({ session, onClose }) {
  const [type, setType]        = useState('LOST_TICKET');
  const [notes, setNotes]      = useState('');
  const [submitted, setSubmit] = useState(false);

  const TYPES = [
    { value: 'LOST_TICKET', label: '🎫 Mất vé',        color: '#f59e0b' },
    { value: 'OVERSTAY',    label: '⏰ Quá giờ',        color: '#ef4444' },
    { value: 'WRONG_ZONE',  label: '🗺️ Sai khu vực',   color: '#8b5cf6' },
    { value: 'UNPAID_EXIT', label: '💸 Ra không trả',   color: '#ec4899' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Xử lý Ngoại lệ</p>
              {session && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1 }}>{session.licensePlate || session.vehicle?.licensePlate}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}><X size={20} /></button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Đã ghi nhận ngoại lệ</p>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 20 }}>Quản lý sẽ xem xét và phê duyệt</p>
            <button onClick={onClose} style={{ padding: '10px 24px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>Đóng</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loại ngoại lệ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  textAlign: 'left', border: `2px solid ${type === t.value ? t.color : 'var(--border-color)'}`,
                  background: type === t.value ? `${t.color}18` : 'var(--bg-secondary)',
                  color: type === t.value ? t.color : 'var(--text-secondary)', transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ghi chú</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mô tả tình huống ngoại lệ..." rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={onClose} style={{ flex: 0.4, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>Hủy</button>
              <button onClick={() => setSubmit(true)} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> Gửi báo cáo ngoại lệ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function VehicleExit() {
  const [step,            setStep]           = useState('search');
  const [searchQuery,     setSearchQuery]    = useState('');
  const [sessions,        setSessions]       = useState([]);
  const [searchResults,   setSearchResults]  = useState(null);
  const [selectedSession, setSelectedSession]= useState(null);
  const [feeInfo,         setFeeInfo]        = useState(null);
  const [payMethod,       setPayMethod]      = useState('CASH');
  const [loading,         setLoading]        = useState(false);
  const [feeLoading,      setFeeLoading]     = useState(false);
  const [processing,      setProcessing]     = useState(false);
  const [error,           setError]          = useState('');
  const [exitResult,      setExitResult]     = useState(null);
  const [showException,   setShowException]  = useState(false);
  const [receiptId,       setReceiptId]      = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      const arr = Array.isArray(data) ? data : [];
      setSessions(arr);
      setSearchResults(arr);
    } catch { 
      setSessions([]); 
      setSearchResults([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /* ── Bước 1: Tìm xe (Realtime filter) ── */
  const handleSearchChange = (e) => {
    const val = e.target.value.toUpperCase();
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(sessions);
    } else {
      const q = val.trim();
      setSearchResults(sessions.filter(s => {
        const plate = (s.licensePlate || s.vehicle?.licensePlate || '').toUpperCase();
        return plate.includes(q);
      }));
    }
  };

  /* ── Chọn xe → info ── */
  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setError('');
    setFeeLoading(true);
    try {
      const fee = await calculateFee(session.id);
      setFeeInfo(fee);
    } catch { setFeeInfo({ totalFee: 0, durationMinutes: 0 }); }
    finally { setFeeLoading(false); }
    setStep('info');
  };

  /* ── Bước 3: Xác nhận thanh toán ── */
  const handleConfirmPayment = async () => {
    setError(''); setProcessing(true);
    try {
      const slotId = selectedSession.slotId || selectedSession.slot?.id;
      await exitSession(selectedSession.id, slotId);
      if (feeInfo?.totalFee > 0) {
        await processPayment(selectedSession.id, feeInfo.totalFee, payMethod);
      }
      setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
      setExitResult({ session: selectedSession, fee: feeInfo, payMethod });
      setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý xe ra. Vui lòng thử lại.');
    } finally { setProcessing(false); }
  };

  const handleReset = () => {
    setStep('search'); setSearchQuery(''); setSearchResults(null);
    setSelectedSession(null); setFeeInfo(null); setError('');
    setExitResult(null); setPayMethod('CASH');
  };

  const plate = selectedSession?.licensePlate || selectedSession?.vehicle?.licensePlate || '';
  const vtype = selectedSession?.vehicleType  || selectedSession?.vehicle?.vehicleType  || 'CAR';

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🚪 Xe Ra Bãi</h2>
        <p>Xử lý xe ra theo từng bước: Tìm xe → Thông tin → Thanh toán</p>
      </div>

      <StepIndicator step={step} />

      {/* ── BƯỚC 1: TÌM XE ── */}
      {step === 'search' && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.1rem' }}>🔍 Nhập biển số xe cần tìm</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>Nhập biển số (một phần hoặc toàn bộ) để tìm xe đang đỗ trong bãi</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 24, zIndex: 10, position: 'relative' }}>
              <div className="form-input-wrapper" style={{ flex: 1 }}>
                <Search className="input-icon" size={18} style={{ pointerEvents: 'none', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', padding: '14px 14px 14px 44px' }}
                  placeholder="Nhập biển số xe (VD: 51A-12345)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </div>
              <button className="btn-primary" onClick={loadSessions} disabled={loading}
                style={{ padding: '0 24px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', width: 'auto' }}>
                <RefreshCw size={16} className={loading ? 'spin-animation' : ''} /> Làm mới
              </button>
            </div>

            {searchResults && (
              searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔎</p>
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {searchQuery ? `Không tìm thấy xe "${searchQuery}"` : 'Không có xe nào đang đỗ trong bãi'}
                  </p>
                  <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Kiểm tra lại biển số hoặc làm mới danh sách</p>
                  <button onClick={() => setShowException(true)}
                    style={{ marginTop: 16, padding: '8px 20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#f59e0b', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> Xử lý ngoại lệ
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                    {searchQuery ? `Tìm thấy ${searchResults.length} xe khớp` : `Danh sách ${searchResults.length} xe đang đỗ`}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {searchResults.map(session => {
                      const p    = session.licensePlate || session.vehicle?.licensePlate || '—';
                      const slot = session.slotCode     || session.slot?.slotCode        || '—';
                      const zone = session.zoneName     || session.slot?.zone?.name      || '—';
                      const type = session.vehicleType  || session.vehicle?.vehicleType  || 'CAR';
                      return (
                        <button key={session.id} onClick={() => handleSelectSession(session)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 14, cursor: 'pointer', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                        >
                          <span style={{ fontSize: 28, flexShrink: 0 }}>{VEHICLE_ICON[type] || '🚗'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '1px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              <MapPin size={10} />{slot}
                              <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Clock size={10} />{session.entryTime ? calcDuration(session.entryTime) : '—'}
                              </span>
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )
            )}
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={() => setShowException(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} /> Xử lý trường hợp ngoại lệ
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 2: THÔNG TIN XE ── */}
      {step === 'info' && selectedSession && (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                {VEHICLE_ICON[vtype] || '🚗'}
              </div>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '1.5px' }}>{plate}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{VEHICLE_LABEL[vtype] || 'Xe'}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '4px 10px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-primary)', borderRadius: 20, fontWeight: 700 }}>ĐANG ĐỖ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>🤳 Khuôn mặt đăng ký khi vào</p>
                <div style={{ width: '100%', height: 200, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${plate}&backgroundColor=transparent`} alt="Khuôn mặt"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: '#1e293b' }}>
                    Mô phỏng Camera
                  </div>
                </div>
              </div>

              {[
                { icon: '📍', label: 'Vị trí ô đỗ', value: selectedSession.slotCode || selectedSession.slot?.slotCode || '—' },
                { icon: '🗺️', label: 'Khu vực',    value: selectedSession.zoneName  || selectedSession.slot?.zone?.name  || '—' },
                { icon: '🏢', label: 'Tầng',        value: selectedSession.floorName || selectedSession.slot?.floor?.name || '—' },
                { icon: '🕐', label: 'Giờ vào',    value: selectedSession.entryTime ? `${formatDateShort(selectedSession.entryTime)} ${formatTime(selectedSession.entryTime)}` : '—' },
                { icon: '⏱️', label: 'Thời gian đỗ', value: selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—', span: 2 },
              ].map(r => (
                <div key={r.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', gridColumn: r.span ? `span ${r.span}` : undefined }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{r.icon} {r.label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.12))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Phí tạm tính</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {feeLoading ? 'Đang tính...' : feeInfo?.durationMinutes ? `${feeInfo.durationMinutes} phút` : 'Tính theo thực tế'}
              </p>
            </div>
            <p style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--accent-primary)', letterSpacing: '-0.5px' }}>
              {feeLoading ? '...' : `₫${(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('search'); setSelectedSession(null); }}
              style={{ flex: 0.35, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
            <button onClick={() => setShowException(true)}
              style={{ flex: 0.4, padding: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, color: '#f59e0b', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertTriangle size={15} /> Ngoại lệ
            </button>
            <button className="btn-primary" onClick={() => setStep('payment')} disabled={feeLoading}
              style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Tiếp tục Thanh toán <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3: THANH TOÁN ── */}
      {step === 'payment' && selectedSession && (
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 28 }}>{VEHICLE_ICON[vtype] || '🚗'}</span>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>{plate}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {VEHICLE_LABEL[vtype]} · {selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—'}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 16 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Tổng phí cần thanh toán</p>
              <p style={{ fontWeight: 900, fontSize: '3rem', color: 'var(--accent-primary)', letterSpacing: '-2px', lineHeight: 1 }}>
                ₫{(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}
              </p>
              {feeInfo?.durationMinutes && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>{feeInfo.durationMinutes} phút đỗ xe</p>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Phương thức thanh toán</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { key: 'CASH', label: 'Tiền mặt', icon: <Banknote size={20} />,   color: '#10b981' },
                { key: 'CARD', label: 'Thẻ / QR', icon: <CreditCard size={20} />, color: '#6366f1' },
              ].map(m => (
                <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                  padding: '16px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  border: `2px solid ${payMethod === m.key ? m.color : 'var(--border-color)'}`,
                  background: payMethod === m.key ? `${m.color}18` : 'var(--bg-secondary)',
                  color: payMethod === m.key ? m.color : 'var(--text-secondary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                }}>
                  {m.icon}
                  {m.label}
                  {payMethod === m.key && <CheckCircle size={14} color={m.color} />}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', marginBottom: 16 }}>
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('info')}
                style={{ flex: 0.35, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ArrowLeft size={15} /> Quay lại
              </button>
              <button className="btn-primary" onClick={handleConfirmPayment} disabled={processing}
                style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {processing
                  ? <><RefreshCw size={16} className="spin-animation" /> Đang xử lý...</>
                  : <><CheckCircle size={16} /> Xác nhận Thu tiền &amp; Xe Ra</>}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setShowException(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} /> Xử lý ngoại lệ cho xe này
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 4: HOÀN TẤT ── */}
      {step === 'done' && exitResult && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card" style={{ padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 6 }}>Xe ra bãi thành công!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>Biên lai #{receiptId}</p>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '20px', textAlign: 'left', marginBottom: 28 }}>
              {[
                { label: 'Biển số',       value: exitResult.session?.licensePlate || exitResult.session?.vehicle?.licensePlate },
                { label: 'Loại xe',       value: VEHICLE_LABEL[exitResult.session?.vehicleType || exitResult.session?.vehicle?.vehicleType] || '—' },
                { label: 'Thời gian đỗ', value: exitResult.fee?.durationMinutes ? `${exitResult.fee.durationMinutes} phút` : '—' },
                { label: 'Tổng phí',      value: `₫${(exitResult.fee?.totalFee || 0).toLocaleString('vi-VN')}`, highlight: true },
                { label: 'Thanh toán',    value: exitResult.payMethod === 'CASH' ? 'Tiền mặt' : 'Thẻ / QR' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: r.highlight ? 800 : 600, fontSize: r.highlight ? '1.1rem' : '0.88rem', color: r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={handleReset}
              style={{ padding: '14px 32px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Xử lý xe tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: NGOẠI LỆ ── */}
      {showException && (
        <ExceptionPanel session={selectedSession} onClose={() => setShowException(false)} />
      )}
    </div>
  );
}
