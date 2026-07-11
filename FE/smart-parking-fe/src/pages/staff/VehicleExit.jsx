import { useState, useEffect, useCallback } from 'react';
import { getActiveSessions, calculateFee, exitSession, processPayment } from '../../services/sessionApi';
import { Search, RefreshCw, Clock, MapPin, Car, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
const VEHICLE_LABEL = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };

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
  return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function VehicleExit() {
  const [sessions,        setSessions]       = useState([]);
  const [searchQuery,     setSearchQuery]    = useState('');
  const [selectedSession, setSelectedSession]= useState(null);
  const [feeInfo,         setFeeInfo]        = useState(null);
  const [loading,         setLoading]        = useState(false);
  const [feeLoading,      setFeeLoading]     = useState(false);
  const [error,           setError]          = useState('');
  const [exitDone,        setExitDone]       = useState(false);
  const [receiptId,       setReceiptId]      = useState('');
  const [exitResult,      setExitResult]     = useState(null);
  const [processing,      setProcessing]     = useState(false);

  // ── Load active sessions ──────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setSessions([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Tự động tính phí khi chọn session ────────────────────────────────────
  const handleSelect = async (session) => {
    if (exitDone) { setExitDone(false); setExitResult(null); }
    setSelectedSession(session);
    setError('');
    setFeeLoading(true);
    try {
      const fee = await calculateFee(session.id);
      setFeeInfo(fee);
    } catch {
      setFeeInfo({ totalFee: 0, durationMinutes: 0 });
    } finally { setFeeLoading(false); }
  };

  // ── Xác nhận xe ra ────────────────────────────────────────────────────────
  const handlePayment = async () => {
    setError(''); setProcessing(true);
    try {
      const slotId = selectedSession.slotId || selectedSession.slot?.id;
      await exitSession(selectedSession.id, slotId);
      if (feeInfo?.totalFee > 0) {
        await processPayment(selectedSession.id, feeInfo.totalFee, 'CASH');
      }
      setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
      setExitResult({ session: selectedSession, fee: feeInfo });
      setExitDone(true);
      // Xoá session khỏi danh sách và bỏ chọn
      setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
      setSelectedSession(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý xe ra. Vui lòng thử lại.');
    } finally { setProcessing(false); }
  };

  const handleReset = () => {
    setSelectedSession(null); setFeeInfo(null);
    setSearchQuery(''); setError('');
    setExitDone(false); setExitResult(null);
    loadSessions();
  };

  // ── Lọc sessions ──────────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const plate = (s.licensePlate || s.vehicle?.licensePlate || '').toLowerCase();
    const slot  = (s.slotCode   || s.slot?.slotCode || '').toLowerCase();
    return plate.includes(q) || slot.includes(q);
  });

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🚪 Xe Ra Bãi</h2>
        <p>Chọn xe từ danh sách để xử lý ra bãi và thanh toán</p>
      </div>

      {/* Thông báo thành công (sau khi xử lý xong) */}
      {exitDone && exitResult && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: 2 }}>
                🧾 Biên lai #{receiptId} — Xe ra thành công!
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Biển số: <strong>{exitResult.session?.licensePlate || exitResult.session?.vehicle?.licensePlate}</strong>
                {' · '}Phí: <strong style={{ color: '#10b981' }}>₫{(exitResult.fee?.totalFee || 0).toLocaleString('vi-VN')}</strong>
                {' · '}Thanh toán: Tiền mặt
              </p>
            </div>
          </div>
          <button onClick={handleReset} style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Tải lại danh sách
          </button>
        </div>
      )}

      {/* ── LAYOUT 2 CỘT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>

        {/* ── CỘT TRÁI: Danh sách xe đang đỗ ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          {/* Header danh sách */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Danh sách xe đang đỗ</span>
              <span style={{ background: 'var(--accent-primary)', color: '#000', fontSize: '0.75rem', fontWeight: 800, borderRadius: 20, padding: '2px 10px', minWidth: 28, textAlign: 'center' }}>
                {sessions.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 32, fontSize: '0.88rem', padding: '8px 8px 8px 32px' }}
                  placeholder="Tìm biển số hoặc vị trí..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                />
              </div>
              <button onClick={loadSessions} disabled={loading} title="Tải lại" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
              </button>
            </div>
          </div>

          {/* Body danh sách */}
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin-animation" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: '0.9rem' }}>Đang tải danh sách...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>🅿️</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{searchQuery ? 'Không tìm thấy xe' : 'Bãi xe trống'}</p>
                {searchQuery && <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Thử tìm với từ khóa khác</p>}
              </div>
            ) : (
              filtered.map(session => {
                const plate   = session.licensePlate   || session.vehicle?.licensePlate || '—';
                const slot    = session.slotCode       || session.slot?.slotCode        || '—';
                const zone    = session.zoneName       || session.slot?.zone?.name      || '—';
                const type    = session.vehicleType    || session.vehicle?.vehicleType  || 'CAR';
                const entry   = session.entryTime;
                const isSelected = selectedSession?.id === session.id;

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSelect(session)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px', textAlign: 'left', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(16,185,129,0.06)' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
                      transition: 'all 0.15s', border: 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{VEHICLE_ICON[type] || '🚗'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '0.5px' }}>{plate}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{slot} · {zone}</span>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {entry ? calcDuration(entry) : '—'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        <Clock size={11} />{entry ? formatTime(entry) : '—'}
                      </p>
                    </div>
                    {isSelected && <ChevronRight size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI: Chi tiết & Thanh toán ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!selectedSession ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', marginBottom: 12 }}>👈</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Chọn xe từ danh sách</p>
              <p style={{ fontSize: '0.82rem', marginTop: 6 }}>Nhấp vào một xe để xem thông tin và xử lý ra bãi</p>
            </div>
          ) : (
            <>
              {/* Thông tin xe */}
              <div className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                    {VEHICLE_ICON[selectedSession.vehicleType || selectedSession.vehicle?.vehicleType] || '🚗'}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>
                      {selectedSession.licensePlate || selectedSession.vehicle?.licensePlate}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {VEHICLE_LABEL[selectedSession.vehicleType || selectedSession.vehicle?.vehicleType] || 'Xe'}
                    </p>
                  </div>
                </div>

                {/* Ảnh khuôn mặt lúc vào */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, fontWeight: 700 }}>
                    🤳 Khuôn mặt đăng ký khi vào
                  </p>
                  <div style={{
                    width: '100%', height: 220, borderRadius: 20,
                    background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, color: 'var(--text-muted)', overflow: 'hidden', position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    {/* Mock ảnh khuôn mặt cho mục đích demo UI/UX */}
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedSession.licensePlate || selectedSession.vehicle?.licensePlate}&backgroundColor=transparent`} alt="Khuôn mặt" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      Mô phỏng ảnh Camera
                    </div>
                  </div>
                </div>

                {/* Chi tiết vị trí & thời gian */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { icon: '📍', label: 'Vị trí',     value: selectedSession.slotCode || selectedSession.slot?.slotCode || '—' },
                    { icon: '🗺️', label: 'Khu vực',   value: selectedSession.zoneName  || selectedSession.slot?.zone?.name  || '—' },
                    { icon: '🏢', label: 'Tầng',       value: selectedSession.floorName || selectedSession.slot?.floor?.name || '—' },
                    { icon: '🕐', label: 'Giờ vào',   value: selectedSession.entryTime ? `${formatDateShort(selectedSession.entryTime)} ${formatTime(selectedSession.entryTime)}` : '—' },
                    { icon: '⏱️', label: 'Đã đỗ',    value: selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—', span: 2 },
                  ].map(r => (
                    <div key={r.label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 12px', gridColumn: r.span ? `span ${r.span}` : undefined }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>{r.icon} {r.label}</p>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng phí */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.15))', 
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 20, padding: '24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 20px rgba(16,185,129,0.1)'
              }}>
                <div>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💳 Tổng Phí</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                    {feeLoading ? 'Đang tính...' : feeInfo?.durationMinutes ? `${feeInfo.durationMinutes} phút` : 'Tính theo thời gian thực'}
                  </p>
                </div>
                <p style={{ fontWeight: 800, fontSize: '2.4rem', color: 'var(--accent-primary)', letterSpacing: '-1px' }}>
                  {feeLoading ? '...' : `₫${(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}`}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                  <AlertCircle size={16} />{error}
                </div>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setSelectedSession(null); setFeeInfo(null); setError(''); }}
                  style={{ flex: 0.4, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  onClick={handlePayment}
                  disabled={processing || feeLoading}
                  style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {processing ? (
                    <><RefreshCw size={16} className="spin-animation" /> Đang xử lý...</>
                  ) : (
                    <><CheckCircle size={16} /> Xác nhận Xe Ra</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Sidebar: Thống kê & hướng dẫn */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Thống kê hôm nay</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>🚗 Xe đang đỗ</span>
              <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{sessions.length}</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Hướng dẫn</p>
            <ol style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 2.2 }}>
              <li>Tìm và chọn xe từ danh sách bên trái</li>
              <li>Kiểm tra ảnh khuôn mặt & phí đỗ xe</li>
              <li>Thu tiền (nếu có phí)</li>
              <li>Bấm <strong>"Xác nhận Xe Ra"</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
