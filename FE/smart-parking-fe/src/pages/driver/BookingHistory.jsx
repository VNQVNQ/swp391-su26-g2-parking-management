import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, X, Search, FileText, ChevronRight, Hash } from 'lucide-react';
import api from '../../services/api';

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
    <div className="page-full animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2>📋 Lịch sử đặt chỗ</h2>
          <p>Theo dõi và quản lý các lượt đặt chỗ của bạn</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={loadBookings}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
          <button onClick={() => window.location.href = '/driver/booking'}
            className="btn-primary"
            style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.9rem' }}>
            <Calendar size={16} />
            <span>Đặt chỗ mới</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng đặt chỗ',    value: stats.total,     color: 'var(--text-primary)' },
          { label: 'Đang chờ',         value: stats.pending,   color: '#f59e0b' },
          { label: 'Đã xác nhận',      value: stats.confirmed, color: '#10b981' },
          { label: 'Hủy / Hết hạn',   value: stats.cancelled + stats.expired, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="stat-card-header"><span className="stat-card-label">{s.label}</span></div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 99,
                border: filterStatus === tab.value ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: filterStatus === tab.value ? 'var(--accent-primary-glow)' : 'transparent',
                color: filterStatus === tab.value ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: filterStatus === tab.value ? 600 : 500,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: filterStatus === tab.value ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: filterStatus === tab.value ? '#fff' : 'var(--text-muted)', borderRadius: 99, padding: '2px 8px', fontSize: '0.75rem', border: filterStatus === tab.value ? 'none' : '1px solid var(--border-color)' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm mã vé, biển số, slot..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.9rem',
              outline: 'none', transition: 'border-color 0.2s'
            }} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner" style={{ marginBottom: 20 }}>⚠️ {error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.15)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '1.05rem' }}>Đang tải lịch sử của bạn...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 80, borderRadius: 20 }}>
          <FileText size={56} color="var(--text-muted)" style={{ margin: '0 auto 20px', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 12, fontWeight: 500 }}>
            {searchText || filterStatus !== 'ALL' ? 'Không tìm thấy kết quả nào phù hợp' : 'Bạn chưa có lịch sử đặt chỗ nào'}
          </p>
          {filterStatus === 'ALL' && !searchText && (
            <button className="btn-primary" onClick={() => window.location.href = '/driver/booking'}
              style={{ marginTop: 20, padding: '12px 28px', borderRadius: 14, fontSize: '1rem' }}>
              <Calendar size={18} />
              <span>Đặt chỗ ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
          {filtered.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EXPIRED;
            const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
            
            return (
              <div key={booking.id} className="card hover-lift" style={{
                padding: 0, borderRadius: 20, overflow: 'hidden',
                border: `1.5px solid ${cfg.border}`,
                display: 'flex', flexDirection: 'column'
              }}>
                {/* Header vé */}
                <div style={{ background: cfg.bg, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${cfg.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: 8, border: `1px solid ${cfg.border}` }}>
                      <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: 1, display: 'block' }}>
                        {booking.bookingCode || '—'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  
                  {booking.status === 'PENDING' && booking.bookingExpiryAt && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Hết hạn lúc</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1rem' }}>{fmtTime(booking.bookingExpiryAt)}</span>
                    </div>
                  )}
                </div>

                {/* Nội dung vé */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Hash size={12}/> Biển số</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{booking.licensePlate || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><MapPin size={12}/> Chỗ đỗ</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{booking.slotCode || 'Chưa gán'}</span>
                    </div>
                  </div>
                  
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Calendar size={12}/> Ngày đặt</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{fmtDate(booking.startTime)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Clock size={12}/> Thời gian</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {fmtTime(booking.startTime)} <ChevronRight size={12} style={{ display: 'inline', color: 'var(--text-muted)' }} /> {fmtTime(booking.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tạo: {fmtDT(booking.createdAt)}
                  </span>
                  
                  {canCancel && (
                    <button
                      onClick={() => setConfirmCancel(booking)}
                      disabled={cancelling === booking.id}
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                      {cancelling === booking.id ? (
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : <X size={14} />}
                      {cancelling === booking.id ? 'Đang hủy...' : 'Hủy vé'}
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
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div className="card animate-fade-in-up" style={{ maxWidth: 440, width: '100%', padding: 40, borderRadius: 24, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
            </div>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: '1.25rem' }}>Xác nhận hủy đặt chỗ</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 20, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn hủy lượt đặt chỗ vé <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{confirmCancel.bookingCode}</strong> không? Hành động này không thể hoàn tác.
            </p>
            
            {cancelError && (
              <div className="error-banner" style={{ marginBottom: 24, textAlign: 'left' }}>⚠️ {cancelError}</div>
            )}
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setConfirmCancel(null); setCancelError(''); }}
                className="btn-secondary" style={{ flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: '0.95rem' }}>
                Không, quay lại
              </button>
              <button onClick={() => handleCancel(confirmCancel.id)}
                disabled={cancelling === confirmCancel.id}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: cancelling ? 0.7 : 1, transition: 'all 0.2s'
                }}>
                {cancelling === confirmCancel.id ? (
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : null}
                {cancelling === confirmCancel.id ? 'Đang hủy...' : 'Có, hủy vé'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
