import { useState } from 'react';
import { Search, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';

const STATUS_LABEL = {
  PENDING:   { text: 'Chờ xác nhận', color: '#f59e0b' },
  CONFIRMED: { text: 'Đã xác nhận',  color: '#10b981' },
  CANCELLED: { text: 'Đã huỷ',       color: '#94a3b8' },
  EXPIRED:   { text: 'Đã hết hạn',   color: '#ef4444' },
  COMPLETED: { text: 'Hoàn tất',     color: '#3b82f6' },
};

export default function BookingHistory() {
  const [plate,    setPlate]    = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    if (!plate.trim()) { setError('Vui lòng nhập biển số xe'); return; }
    setError(''); setLoading(true); setBookings([]);

    try {
      // 1. Tra vehicleId từ biển số
      const vehicleRes = await api.get(`/api/v1/vehicles/plate/${plate.trim().toUpperCase()}`);
      const vehicleId = (vehicleRes.data.data ?? vehicleRes.data)?.id;

      // 2. Lấy lịch sử booking của xe đó
      const res = await api.get(`/api/v1/bookings/vehicle/${vehicleId}`);
      const data = res.data.data ?? res.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy xe với biển số này. Vui lòng đăng ký xe trước.');
      } else {
        setError(err.response?.data?.message || 'Không thể tải lịch sử đặt chỗ.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await api.post(`/api/v1/bookings/${bookingId}/cancel`);
      // Cập nhật lại trạng thái ngay trên danh sách hiện tại, không cần gọi lại API
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    } catch (err) {
      setError(err.response?.data?.message || 'Huỷ đặt chỗ thất bại.');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED';

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📜 Lịch sử đặt chỗ</h2>
        <p>Tra cứu và huỷ các lượt đặt chỗ theo biển số xe</p>
      </div>

      {/* Ô tra cứu */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-input-wrapper" style={{ flex: 1 }}>
            <input type="text" className="form-input" placeholder="Nhập biển số xe, VD: 51A-12345"
              value={plate}
              onChange={e => setPlate(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && loadBookings()} />
          </div>
          <button className="btn-primary" onClick={loadBookings} disabled={loading} style={{ minWidth: 140 }}>
            <Search size={16} />
            <span>{loading ? 'Đang tra...' : 'Tra cứu'}</span>
          </button>
        </div>
        {error && (
          <div className="error-banner" style={{ marginTop: 16 }}>
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      {/* Danh sách booking */}
      {bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(b => {
            const statusInfo = STATUS_LABEL[b.status] || { text: b.status, color: 'var(--text-muted)' };
            return (
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                        {b.bookingCode}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                        background: `${statusInfo.color}1a`, color: statusInfo.color,
                        border: `1px solid ${statusInfo.color}4d`,
                      }}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Slot: </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{b.slotCode || '—'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Bắt đầu: </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {b.startTime ? new Date(b.startTime).toLocaleString('vi-VN') : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Kết thúc: </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {b.endTime ? new Date(b.endTime).toLocaleString('vi-VN') : '—'}
                        </span>
                      </div>
                    </div>
                    {b.status === 'PENDING' && b.bookingExpiryAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.78rem', color: '#f59e0b' }}>
                        <Clock size={14} />
                        <span>
                          {b.isExpired
                            ? 'Đã quá hạn giữ chỗ'
                            : `Giữ chỗ đến ${new Date(b.bookingExpiryAt).toLocaleTimeString('vi-VN')}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {canCancel(b.status) && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '8px 14px',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                      <XCircle size={14} />
                      {cancellingId === b.id ? 'Đang huỷ...' : 'Huỷ đặt chỗ'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && bookings.length === 0 && plate && !error && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>📭</p>
          <p style={{ color: 'var(--text-secondary)' }}>Xe này chưa có lượt đặt chỗ nào</p>
        </div>
      )}
    </div>
  );
}
