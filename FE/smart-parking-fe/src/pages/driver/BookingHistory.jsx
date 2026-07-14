import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, X, Search, Filter, FileText } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ xác nhận',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    icon: '⏳',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    icon: '✅',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    icon: '❌',
  },
  EXPIRED: {
    label: 'Hết hạn',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.2)',
    icon: '🕐',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
    icon: '🎉',
  },
};

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDT(dt) {
  if (!dt) return '—';
  return `${fmtDate(dt)} ${fmtTime(dt)}`;
}

export default function BookingHistory() {
  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [cancelling,     setCancelling]     = useState(null);   // booking ID being cancelled
  const [error,          setError]          = useState('');
  const [cancelError,    setCancelError]    = useState('');
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [searchText,     setSearchText]     = useState('');
  const [confirmCancel,  setConfirmCancel]  = useState(null);   // booking to cancel

  /* ── Load bookings ── */
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/bookings/my-bookings');
      const data = res.data.data ?? res.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải lịch sử đặt chỗ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  /* ── Cancel booking ── */
  const handleCancel = async (bookingId) => {
    setCancelling(bookingId);
    setCancelError('');
    try {
      await api.post(`/api/v1/bookings/${bookingId}/cancel`);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
      setConfirmCancel(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể hủy đặt chỗ';
      setCancelError(msg);
    } finally {
      setCancelling(null);
    }
  };

  /* ── Filter & search ── */
  const filtered = bookings.filter(b => {
    const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchSearch = !searchText.trim() ||
      b.bookingCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.licensePlate?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.slotCode?.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  /* ── Stats ── */
  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    expired:   bookings.filter(b => b.status === 'EXPIRED').length,
  };

  const filterTabs = [
    { value: 'ALL',      label: 'Tất cả',         count: stats.total     },
    { value: 'PENDING',  label: 'Chờ xác nhận',   count: stats.pending   },
    { value: 'CONFIRMED',label: 'Đã xác nhận',    count: stats.confirmed },
    { value: 'CANCELLED',label: 'Đã hủy',          count: stats.cancelled },
    { value: 'EXPIRED',  label: 'Hết hạn',         count: stats.expired  },
  ];

  return (
    <div className="page-full">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>📋 Lịch sử đặt chỗ</h2>
            <p>Theo dõi và quản lý các lượt đặt chỗ của bạn</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadBookings}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
              <RefreshCw size={14} />
              Làm mới
            </button>
            <button onClick={() => window.location.href = '/driver/booking'}
              className="btn-primary"
              style={{ padding: '8px 18px', borderRadius: 10, fontSize: '0.85rem' }}>
              <Calendar size={14} />
              <span>Đặt chỗ mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Tổng đặt chỗ',    value: stats.total,     color: 'var(--text-primary)' },
          { label: 'Đang chờ',         value: stats.pending,   color: '#f59e0b' },
          { label: 'Đã xác nhận',      value: stats.confirmed, color: '#10b981' },
          { label: 'Hủy / Hết hạn',   value: stats.cancelled + stats.expired, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-header"><span className="stat-card-label">{s.label}</span></div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filterTabs.map(tab => (
              <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  border: filterStatus === tab.value ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-color)',
                  background: filterStatus === tab.value ? 'var(--accent-primary-glow)' : 'transparent',
                  color: filterStatus === tab.value ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: filterStatus === tab.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{ marginLeft: 6, background: filterStatus === tab.value ? 'var(--accent-primary)' : 'var(--border-color)', color: filterStatus === tab.value ? '#fff' : 'var(--text-muted)', borderRadius: 99, padding: '1px 7px', fontSize: '0.72rem' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm mã, biển số, slot..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.83rem',
                outline: 'none', width: 220,
              }} />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Cancel error */}
      {cancelError && (
        <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {cancelError}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(16,185,129,0.15)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p>Đang tải lịch sử...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, borderRadius: 20 }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 8 }}>
            {searchText || filterStatus !== 'ALL' ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử đặt chỗ'}
          </p>
          {filterStatus === 'ALL' && !searchText && (
            <button className="btn-primary" onClick={() => window.location.href = '/driver/booking'}
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12 }}>
              <Calendar size={16} />
              <span>Đặt chỗ ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EXPIRED;
            const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
            return (
              <div key={booking.id} className="card" style={{
                padding: '20px 24px', borderRadius: 18,
                border: `1.5px solid ${cfg.border}`,
                background: cfg.bg,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  {/* Left info */}
                  <div style={{ flex: 1 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: 1 }}>
                        {booking.bookingCode || '—'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, color: cfg.color,
                        background: 'rgba(255,255,255,0.08)', border: `1px solid ${cfg.border}`,
                        padding: '2px 10px', borderRadius: 99,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px 24px' }}>
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Biển số</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{booking.licensePlate || '—'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Chỗ đỗ</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{booking.slotCode || 'Chưa gán'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Ngày đặt</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{fmtDate(booking.startTime)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Thời gian</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {fmtTime(booking.startTime)} → {fmtTime(booking.endTime)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Thời lượng</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{booking.durationMinutes || '—'} phút</span>
                      </div>
                      {booking.status === 'PENDING' && booking.bookingExpiryAt && (
                        <div>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Hết hạn lúc</span>
                          <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '0.85rem' }}>{fmtTime(booking.bookingExpiryAt)}</span>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Tạo lúc</span>
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{fmtDT(booking.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  {canCancel && (
                    <button
                      onClick={() => setConfirmCancel(booking)}
                      disabled={cancelling === booking.id}
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        border: '1.5px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        whiteSpace: 'nowrap', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
                      <X size={14} />
                      {cancelling === booking.id ? 'Đang hủy...' : 'Hủy đặt chỗ'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {confirmCancel && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 420, width: '90%', padding: 32, borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Xác nhận hủy đặt chỗ</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 6 }}>
              Bạn có chắc muốn hủy lượt đặt chỗ này?
            </p>
            <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 700, marginBottom: 24 }}>
              {confirmCancel.bookingCode}
            </p>
            {cancelError && (
              <div className="error-banner" style={{ marginBottom: 16, textAlign: 'left' }}>⚠️ {cancelError}</div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setConfirmCancel(null); setCancelError(''); }}
                className="btn-secondary" style={{ flex: 1, padding: '12px 16px', borderRadius: 12 }}>
                Quay lại
              </button>
              <button onClick={() => handleCancel(confirmCancel.id)}
                disabled={cancelling === confirmCancel.id}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem',
                  opacity: cancelling ? 0.7 : 1,
                }}>
                {cancelling === confirmCancel.id ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
