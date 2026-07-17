import { CalendarCheck, CreditCard, Car, Bike, Truck, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

// Helper: extract vehicle type from pass object (handles nested vehicle object)
const getVehicleType = (p) =>
  p.vehicleType || p.vehicle?.vehicleType || p.vehicleTypeName || '';

// Helper: extract license plate
const getLicensePlate = (p) =>
  p.licensePlate || p.vehicle?.licensePlate || p.vehiclePlate || 'N/A';

const VEHICLE_TYPE_MAP = {
  CAR: { label: 'Ô tô', icon: '🚗', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  MOTORBIKE: { label: 'Xe máy', icon: '🏍️', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  TRUCK: { label: 'Xe tải', icon: '🚛', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
};

function VehicleTypeBadge({ type }) {
  const normalized = String(type || '').toUpperCase().trim();
  const info = VEHICLE_TYPE_MAP[normalized];
  if (!info) return <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{type || '—'}</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: info.bg, border: `1px solid ${info.border}`,
      color: info.color, padding: '4px 10px', borderRadius: 8,
      fontSize: '0.8rem', fontWeight: 600,
    }}>
      {info.icon} {info.label}
    </span>
  );
}

export default function PassesBookings() {
  const [tab, setTab] = useState('passes');
  const [passes, setPasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [monthlyPrices, setMonthlyPrices] = useState({ CAR: 2500000, MOTORBIKE: 500000, TRUCK: 4000000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passSearch, setPassSearch] = useState('');
  const [passVehicleFilter, setPassVehicleFilter] = useState('');
  const [passStatusFilter, setPassStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [passesRes, bookingsRes, pricingRes] = await Promise.all([
        api.get('/api/v1/monthly-passes').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/bookings').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/pricing-rules/ticket-type/MONTHLY').catch(() => ({ data: { data: [] } }))
      ]);

      const passesData = passesRes.data?.data ?? passesRes.data ?? [];
      const bookingsData = bookingsRes.data?.data ?? bookingsRes.data ?? [];
      let rulesData = pricingRes.data?.data ?? pricingRes.data ?? [];

      if (!Array.isArray(rulesData) || rulesData.length === 0) {
        try {
          const allRulesRes = await api.get('/api/v1/pricing-rules');
          const allRules = allRulesRes.data?.data ?? allRulesRes.data ?? [];
          if (Array.isArray(allRules)) {
            rulesData = allRules.filter(r => (r.ticketType || '').toUpperCase() === 'MONTHLY');
          }
        } catch (e) {
          console.error(e);
        }
      }

      const prices = { CAR: 2500000, MOTORBIKE: 500000, TRUCK: 4000000 };
      if (Array.isArray(rulesData)) {
        rulesData.forEach(rule => {
          if (rule && rule.vehicleType && rule.isActive !== false) {
            const vt = String(rule.vehicleType).toUpperCase();
            const fee = Number(rule.monthlyFee || rule.minimumFee || rule.ratePerHour || 0);
            if (fee > 0) prices[vt] = fee;
          }
        });
      }
      setMonthlyPrices(prices);

      const parsedPasses = Array.isArray(passesData) ? passesData : [];
      const parsedBookings = Array.isArray(bookingsData) ? bookingsData : [];

      // Debug: log first pass to understand structure
      if (parsedPasses.length > 0) {
        console.log('[PassesBookings] Sample pass object:', parsedPasses[0]);
      }

      setPasses(parsedPasses);
      setBookings(parsedBookings);
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

  // Stats
  const activePasses = passes.filter(p => {
    const s = p.status || (p.isActive ? 'ACTIVE' : 'EXPIRED');
    return s === 'ACTIVE' || s === 'Active';
  });
  const carPasses = passes.filter(p => {
    const t = getVehicleType(p).toUpperCase();
    return t === 'CAR';
  });
  const motorbikePasses = passes.filter(p => {
    const t = getVehicleType(p).toUpperCase();
    return t === 'MOTORBIKE';
  });

  const stats = [
    { label: 'Vé tháng đang hoạt động', value: activePasses.length, icon: CreditCard, color: '#10b981' },
    { label: 'Chưa vào (đặt chỗ)', value: bookings.filter(b => b.status === 'PENDING').length, icon: CalendarCheck, color: '#f59e0b' },
    { label: 'Vé ô tô', value: carPasses.length, icon: Car, color: '#3b82f6' },
    { label: 'Vé xe máy', value: motorbikePasses.length, icon: Bike, color: '#8b5cf6' },
  ];

  // Filter passes
  const filteredPasses = passes.filter(p => {
    const plate = getLicensePlate(p).toLowerCase();
    const matchSearch = !passSearch || plate.includes(passSearch.toLowerCase());
    const vt = getVehicleType(p).toUpperCase();
    const matchVehicle = !passVehicleFilter || vt === passVehicleFilter;
    const s = p.status || (p.isActive ? 'ACTIVE' : 'EXPIRED');
    const matchStatus = !passStatusFilter || s === passStatusFilter;
    return matchSearch && matchVehicle && matchStatus;
  });

  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>🎫 Vé tháng &amp; Đặt trước</h2>
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
              {/* Filter bar */}
              <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm theo biển số..."
                    value={passSearch}
                    onChange={e => setPassSearch(e.target.value)}
                    style={{ paddingLeft: 36, width: '100%', padding: '8px 12px 8px 36px' }}
                  />
                </div>
                <select
                  className="form-select"
                  value={passVehicleFilter}
                  onChange={e => setPassVehicleFilter(e.target.value)}
                  style={{ minWidth: 140, padding: '8px 12px' }}>
                  <option value="">Tất cả loại xe</option>
                  <option value="CAR">🚗 Ô tô</option>
                  <option value="MOTORBIKE">🏍️ Xe máy</option>
                  <option value="TRUCK">🚛 Xe tải</option>
                </select>
                <select
                  className="form-select"
                  value={passStatusFilter}
                  onChange={e => setPassStatusFilter(e.target.value)}
                  style={{ minWidth: 140, padding: '8px 12px' }}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="EXPIRED">Hết hạn</option>
                </select>
                {(passSearch || passVehicleFilter || passStatusFilter) && (
                  <button
                    onClick={() => { setPassSearch(''); setPassVehicleFilter(''); setPassStatusFilter(''); }}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    ✕ Xóa lọc
                  </button>
                )}
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {filteredPasses.length}/{passes.length} vé
                </span>
              </div>

              {filteredPasses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {passes.length === 0 ? 'Chưa có vé tháng nào trong hệ thống' : 'Không tìm thấy vé phù hợp với bộ lọc'}
                  </p>
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
                      {filteredPasses.map(p => {
                        const plate = getLicensePlate(p);
                        const vehicleType = getVehicleType(p);
                        const status = p.status || (p.isActive ? 'ACTIVE' : 'EXPIRED');
                        const isPassActive = status === 'ACTIVE' || status === 'Active' || p.isActive === true;
                        const vt = String(vehicleType).toUpperCase();
                        const feeVal = p.fee || p.price || p.amount || monthlyPrices[vt] || 0;

                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{plate}</td>
                            <td>
                              <VehicleTypeBadge type={vehicleType} />
                            </td>
                            <td>{p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                            <td>{p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                            <td style={{ fontWeight: 600 }}>₫{feeVal.toLocaleString('vi-VN')}</td>
                            <td>
                              <span className={`badge ${isPassActive ? 'badge-success' : 'badge-danger'}`}>
                                {isPassActive ? '✓ Hoạt động' : '✗ Hết hạn'}
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
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫{(monthlyPrices.CAR || 0).toLocaleString('vi-VN')}</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/tháng</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #8b5cf6', textAlign: 'center', padding: '28px' }}>
                  <Bike size={28} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe máy</h4>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫{(monthlyPrices.MOTORBIKE || 0).toLocaleString('vi-VN')}</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/tháng</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b', textAlign: 'center', padding: '28px' }}>
                  <Truck size={28} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Xe tải</h4>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫{(monthlyPrices.TRUCK || 0).toLocaleString('vi-VN')}</p>
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
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.bookingCode || b.id?.substring(0, 8)}</td>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{plate}</td>
                            <td>{slot}</td>
                            <td>{b.startTime ? new Date(b.startTime).toLocaleString('vi-VN') : '—'}</td>
                            <td>{b.endTime ? new Date(b.endTime).toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : b.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                                {b.status === 'CONFIRMED' ? 'Đã vào' : b.status === 'PENDING' ? 'Chưa vào' : b.status === 'CANCELLED' ? 'Đã hủy' : b.status === 'EXPIRED' ? 'Hết hạn' : b.status}
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
