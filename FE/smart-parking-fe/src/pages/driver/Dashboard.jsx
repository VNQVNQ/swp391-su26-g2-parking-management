import { useState, useEffect, Component } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, X, Car, BookOpen, MapPin, Calendar, Zap, History, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import NotificationBell from '../../components/NotificationBell';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 50, color: 'red' }}>
          <h2>Something went wrong in Dashboard:</h2>
          <pre>{this.state.error.toString()}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DriverDashboardWrapper() {
  return <ErrorBoundary><DriverDashboard /></ErrorBoundary>;
}

function DriverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vehicles: 0, activeSessions: 0 });
  const [myVehicles, setMyVehicles] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ type: 'WRONG_ZONE', description: '', licensePlate: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const resV = await api.get('/api/v1/vehicles/my-vehicles').catch(() => null);
        let vehicles = resV?.data?.data ?? resV?.data ?? [];
        vehicles = Array.isArray(vehicles) ? vehicles : (vehicles.content || []);
        
        setMyVehicles(vehicles);
        setStats(s => ({ ...s, vehicles: vehicles.length }));

        // Fetch active session or bookings if API supports it
        // We will try fetching bookings
        const resB = await api.get('/api/v1/bookings/my-bookings').catch(() => null);
        let bookings = resB?.data?.data ?? resB?.data ?? [];
        bookings = Array.isArray(bookings) ? bookings : (bookings.content || []);
        setRecentBookings(bookings.slice(0, 3));

        // Just check sessions for the first vehicle to see if parking
        if (vehicles.length > 0) {
          const sessRes = await api.get('/api/v1/parking-sessions', { params: { licensePlate: vehicles[0].licensePlate, status: 'ACTIVE' } }).catch(() => null);
          let sessions = sessRes?.data?.data ?? sessRes?.data ?? [];
          sessions = Array.isArray(sessions) ? sessions : (sessions.content || []);
          
          if (sessions.length > 0) {
            setActiveSession(sessions[0]);
          }
        }
      } catch (err) {
        console.error("Dashboard load data error:", err);
      }
    };
    loadData();
  }, []);

  const quickActions = [
    { icon: <Car size={28} />, label: 'Đăng ký xe',  route: '/driver/register-vehicle' },
    { icon: <BookOpen size={28} />, label: 'Xe của tôi',   route: '/driver/my-vehicles' },
    { icon: <MapPin size={28} />, label: 'Xem slot',    route: '/driver/slots' },
    { icon: <Calendar size={28} />, label: 'Đặt chỗ',     route: '/driver/booking' },
  ];

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.licensePlate) {
      alert("Vui lòng chọn xe bị sự cố!");
      return;
    }
    try {
      await api.post('/api/v1/exceptions', {
        exceptionType: reportForm.type,
        licensePlate: reportForm.licensePlate,
        reason: reportForm.description,
        evidenceNote: "Reported via Driver App"
      });
      alert(`Đã gửi báo cáo sự cố thành công!\nBan quản lý sẽ sớm xử lý.`);
      setShowReportModal(false);
      setReportForm({ type: 'WRONG_ZONE', description: '', licensePlate: myVehicles.length > 0 ? myVehicles[0].licensePlate : '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo.');
    }
  };

  return (
    <div className="page-full">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🏠 Dashboard</h2>
          <p>Xin chào! Quản lý xe và chỗ đỗ của bạn</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => {
              setReportForm({ type: 'WRONG_ZONE', description: '', licensePlate: myVehicles.length > 0 ? myVehicles[0].licensePlate : '' });
              setShowReportModal(true);
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <AlertTriangle size={18} /> Báo cáo sự cố
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: '24px 28px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Car size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xe đã đăng ký</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>{stats.vehicles}</div>
          </div>
        </div>
        
        <div className="card" style={{ padding: '24px 28px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <MapPin size={26} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đang đỗ</div>
            {activeSession ? (
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>{activeSession.parkingSlot?.name || 'Khu vực bãi đỗ'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>Biển số: {activeSession.licensePlate}</div>
              </div>
            ) : (
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 8 }}>Chưa có xe đang đỗ</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: 28, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="#f59e0b" /> Thao tác nhanh
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.route)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                padding: '24px 16px', background: 'var(--bg-input)',
                border: '1px solid var(--border-color)', borderRadius: 16,
                cursor: 'pointer', transition: 'all 0.2s ease', color: '#6366f1',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; 
                e.currentTarget.style.transform = 'translateY(-4px)'; 
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.borderColor = 'var(--border-color)'; 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.background = 'var(--bg-input)';
              }}>
              <div style={{ color: '#818cf8', marginBottom: 4 }}>
                {a.icon}
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: 28, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={20} color="#10b981" /> Hoạt động gần đây
          </h3>
          <Link to="/driver/booking-history" style={{ fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        
        {recentBookings.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <History size={32} opacity={0.3} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>Chưa có hoạt động nào gần đây</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentBookings.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Đặt chỗ {b.parkingSlot?.name || 'Bãi đỗ'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Biển số: {b.licensePlate} • Bắt đầu: {new Date(b.startTime).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: b.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: b.status === 'ACTIVE' ? '#10b981' : 'var(--text-muted)' }}>
                  {b.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Báo cáo sự cố */}
      {showReportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)',
            width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem' }}>
                <AlertTriangle color="#ef4444" /> Báo cáo sự cố
              </h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Xe gặp sự cố</label>
                <select 
                  value={reportForm.licensePlate}
                  onChange={e => setReportForm({...reportForm, licensePlate: e.target.value})}
                  required
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    borderRadius: 8, color: 'var(--text-primary)', outline: 'none'
                  }}
                >
                  <option value="" disabled>-- Chọn xe --</option>
                  {(Array.isArray(myVehicles) ? myVehicles : []).map(v => (
                    <option key={v.id || v.licensePlate} value={v.licensePlate}>{v.licensePlate}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loại sự cố</label>
                <select 
                  value={reportForm.type}
                  onChange={e => setReportForm({...reportForm, type: e.target.value})}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    borderRadius: 8, color: 'var(--text-primary)', outline: 'none'
                  }}
                >
                  <option value="WRONG_ZONE">Có xe khác chiếm chỗ của tôi</option>
                  <option value="LOST_TICKET">Tôi bị mất vé / thẻ</option>
                  <option value="OTHER">Sự cố khác (Barie hỏng, vv...)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mô tả chi tiết</label>
                <textarea 
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  placeholder="Vui lòng cung cấp thêm thông tin (biển số xe chiếm chỗ, vị trí, ...)"
                  rows={4}
                  required
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    borderRadius: 8, color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', color: 'white', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
