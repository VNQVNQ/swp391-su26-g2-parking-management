import { CalendarCheck, CreditCard, Car, Bike, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PassesBookings() {
  const [tab, setTab] = useState('passes');
  const [passes, setPasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [passesRes, bookingsRes] = await Promise.all([
        api.get('/api/v1/monthly-passes').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/bookings').catch(() => ({ data: { data: [] } }))
      ]);

      const passesData = passesRes.data?.data ?? passesRes.data ?? [];
      const bookingsData = bookingsRes.data?.data ?? bookingsRes.data ?? [];

      setPasses(Array.isArray(passesData) ? passesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) return;
    try {
      await api.post(`/api/v1/bookings/${id}/cancel`);
      loadData();
    } catch (err) {
      alert('Không thể hủy đặt chỗ: ' + (err.response?.data?.message || err.message));
    }
  };

  const stats = [
    { label: 'Vé tháng đang hoạt động', value: passes.filter(p => p.status === 'ACTIVE' || p.isActive).length, icon: CreditCard, color: '#10b981' },
    { label: 'Chờ xử lý', value: bookings.filter(b => b.status === 'PENDING').length, icon: CalendarCheck, color: '#f59e0b' },
    { label: 'Vé ô tô', value: passes.filter(p => p.vehicleType === 'CAR' || p.vehicle?.vehicleType === 'CAR').length, icon: Car, color: '#3b82f6' },
    { label: 'Vé xe máy', value: passes.filter(p => p.vehicleType === 'MOTORBIKE' || p.vehicle?.vehicleType === 'MOTORBIKE').length, icon: Bike, color: '#8b5cf6' },
  ];

  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>🎫 Vé tháng & Đặt trước</h2>
        <p>Quản lý vé tháng và các đơn đặt chỗ trước</p>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <Icon size={20} className="stat-card-icon" style={{ color: s.color }} />
              </div>
              <div className="stat-card-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Tab Nav */}
      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'passes' ? 'active' : ''}`} onClick={() => setTab('passes')}>Danh sách Vé tháng</button>
        <button className={`tab-btn ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Danh sách Đặt chỗ</button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Monthly Passes Tab */}
          {tab === 'passes' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Danh sách Vé tháng</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Chỉ xem - Tài xế đăng ký vé tháng từ tài khoản của họ</p>
                </div>
              </div>
              
              {passes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-muted)' }}>Chưa có vé tháng nào trong hệ thống</p>
                </div>
              ) : (
                <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Biển số xe</th>
                        <th>Loại xe</th>
                        <th>Ngày bắt đầu</th>
                        <th>Ngày hết hạn</th>
                        <th>Phí</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passes.map(p => {
                        const plate = p.licensePlate || p.vehicle?.licensePlate || 'N/A';
                        const type = p.vehicleType || p.vehicle?.vehicleType || 'N/A';
                        const status = p.status || (p.isActive ? 'ACTIVE' : 'EXPIRED');
                        
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{plate}</td>
                            <td>{type === 'CAR' ? 'Ô tô' : type === 'MOTORBIKE' ? 'Xe máy' : type === 'TRUCK' ? 'Xe tải' : type}</td>
                            <td>{p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                            <td>{p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                            <td style={{ fontWeight: 600 }}>₫{(p.fee || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${status === 'ACTIVE' || status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                {status === 'ACTIVE' || status === 'Active' ? 'Hoạt động' : 'Hết hạn'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Monthly Pass Pricing Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ borderLeft: '4px solid #3b82f6', textAlign: 'center', padding: '28px' }}>
                  <Car size={28} style={{ color: '#3b82f6', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Ô tô</h4>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫2,500,000</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/tháng</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #8b5cf6', textAlign: 'center', padding: '28px' }}>
                  <Bike size={28} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe máy</h4>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫500,000</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/tháng</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b', textAlign: 'center', padding: '28px' }}>
                  <Truck size={28} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe tải</h4>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫4,000,000</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/tháng</span>
                </div>
              </div>
            </>
          )}

          {/* Bookings Tab */}
          {tab === 'bookings' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Danh sách Đặt chỗ</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Quản lý đơn đặt chỗ - Hủy các đơn đặt chỗ của tài xế khi cần</p>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-muted)' }}>Chưa có đơn đặt chỗ nào</p>
                </div>
              ) : (
                <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã đặt chỗ</th>
                        <th>Biển số xe</th>
                        <th>Chỗ đỗ</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => {
                        const plate = b.licensePlate || b.vehicle?.licensePlate || 'N/A';
                        const slot = b.slotCode || b.slot?.slotCode || 'N/A';
                        const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';
                        
                        return (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.bookingCode || b.id.substring(0,8)}</td>
                            <td style={{ fontWeight: 600 }}>{plate}</td>
                            <td>{slot}</td>
                            <td>{b.startTime ? new Date(b.startTime).toLocaleString('vi-VN') : '—'}</td>
                            <td>{b.endTime ? new Date(b.endTime).toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : b.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                                {b.status === 'CONFIRMED' ? 'Đã xác nhận' : b.status === 'PENDING' ? 'Đang chờ' : b.status === 'CANCELLED' ? 'Đã hủy' : b.status === 'EXPIRED' ? 'Hết hạn' : b.status}
                              </span>
                            </td>
                            <td>
                              {canCancel ? (
                                <button className="btn-sm btn-sm-danger" onClick={() => handleCancelBooking(b.id)}>Hủy</button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Booking Rules */}
              <div className="rules-section">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Quy định Đặt chỗ</h4>
                <div className="rules-grid">
                  {[
                    { code: 'BR-30', title: 'Giữ chỗ', desc: 'Chỗ đỗ được giữ tối đa 30 phút sau thời gian bắt đầu' },
                    { code: 'BR-31', title: 'Hủy chỗ', desc: 'Có thể hủy đặt chỗ trước 1 giờ so với thời gian bắt đầu' },
                    { code: 'BR-32', title: 'Tự động hủy', desc: 'Đặt chỗ không được sử dụng sẽ tự động hủy sau thời gian giữ chỗ' },
                  ].map((r, i) => (
                    <div key={i} className="rule-card">
                      <div className="rule-card-title"><span className="rule-code">{r.code}</span>{r.title}</div>
                      <p>{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
