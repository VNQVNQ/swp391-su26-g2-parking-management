import { useState, useEffect, useCallback } from 'react';
import { Clock, Search, RefreshCw, ChevronLeft, ChevronRight, Car, X } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
const VEHICLE_LABEL = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };
const PAGE_SIZE = 15;

function formatDT(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
}

function calcDur(entry, exit) {
  if (!entry) return '—';
  const ms = ((exit ? new Date(exit) : new Date()) - new Date(entry));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m} phút`;
}

const fmtVND = (v) => `₫${Number(v || 0).toLocaleString('vi-VN')}`;

export default function EntryExitHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/v1/parking-sessions/completed/all').catch(() =>
        api.get('/api/v1/parking-sessions/history').catch(() => ({ data: { data: [] } }))
      );
      const data = res.data?.data ?? res.data ?? [];
      setSessions(Array.isArray(data) ? data.sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime)) : []);
    } catch (err) {
      setError('Không thể tải lịch sử phiên đỗ xe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filtered = sessions.filter(s => {
    const plate = (s.licensePlate || s.vehicle?.licensePlate || '').toUpperCase();
    const matchSearch = !search || plate.includes(search.toUpperCase());
    const type = (s.vehicleType || s.vehicle?.vehicleType || 'CAR').toUpperCase();
    const matchType = filterType === 'ALL' || type === filterType;
    const hasExit = !!s.exitTime;
    if (filterStatus === 'COMPLETED' && !hasExit) return false;
    if (filterStatus === 'ACTIVE' && hasExit) return false;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = filtered.filter(s => s.exitTime).reduce((sum, s) => sum + Number(s.totalFee || s.fee || 0), 0);
  const completed = filtered.filter(s => s.exitTime).length;
  const active = filtered.filter(s => !s.exitTime).length;

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📋 Lịch sử Ra Vào Bãi</h2>
        <p>Toàn bộ lịch sử phiên đỗ xe — đang đỗ và đã hoàn tất</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng phiên', value: filtered.length, color: '#3b82f6' },
          { label: 'Đang đỗ',   value: active,           color: '#f59e0b' },
          { label: 'Đã ra',     value: completed,        color: '#10b981' },
          { label: 'Doanh thu', value: fmtVND(totalRevenue), color: '#8b5cf6', big: true },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stat-card-header">
              <span className="stat-card-label">{s.label}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color, fontSize: s.big ? '1.4rem' : undefined }}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search className="input-icon" size={16} />
          <input type="text" className="form-input" placeholder="Tìm biển số..." value={search}
            onChange={handleSearch} style={{ padding: '9px 12px 9px 38px' }} />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <option value="ALL">Tất cả loại xe</option>
          <option value="MOTORBIKE">🏍️ Xe máy</option>
          <option value="CAR">🚗 Ô tô</option>
          <option value="TRUCK">🚛 Xe tải</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">🟡 Đang đỗ</option>
          <option value="COMPLETED">✅ Đã ra</option>
        </select>
        <button onClick={loadHistory} disabled={loading}
          style={{ padding: '9px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <RefreshCw size={15} className={loading ? 'spin-animation' : ''} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải lịch sử...</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> phiên · Trang {page}/{totalPages || 1}
            </span>
            {/* Pagination inline top */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.max(totalPages || 1, 1) }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === Math.max(totalPages || 1, 1) || Math.abs(p - page) <= 2)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) => p === '...' ? (
                    <span key={`ell-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${p === page ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: p === page ? 'var(--accent-primary)' : 'transparent', color: p === page ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: p === page ? 700 : 400 }}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {paged.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</p>
              <p style={{ fontWeight: 600 }}>Không có phiên đỗ xe nào</p>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Thử thay đổi bộ lọc hoặc làm mới dữ liệu</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Biển số / Loại xe</th>
                    <th>Vị trí</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian</th>
                    <th>Phí</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(s => {
                    const plate = s.licensePlate || s.vehicle?.licensePlate || '—';
                    const type = (s.vehicleType || s.vehicle?.vehicleType || 'CAR').toUpperCase();
                    const hasPass = s.hasMonthlyPass || s.ticketType === 'MONTHLY' || s.ticketType === 'Vé tháng';
                    const hasBooking = s.hasBooking || !!s.bookingCode;
                    const isActive = !s.exitTime;
                    return (
                      <tr key={s.id} onClick={() => setSelectedSession(s)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{VEHICLE_ICON[type] || '🚗'}</span>
                            <div>
                              <div style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.5px' }}>{plate}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{VEHICLE_LABEL[type] || type}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.slotCode || s.slot?.slotCode || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.zoneName || '—'}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDT(s.entryTime)}</td>
                        <td style={{ fontSize: '0.82rem' }}>{s.exitTime ? formatDT(s.exitTime) : <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.78rem' }}>Đang đỗ</span>}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{calcDur(s.entryTime, s.exitTime)}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: isActive ? 'var(--text-muted)' : 'var(--accent-primary)', fontSize: '0.88rem' }}>
                            {isActive ? '—' : fmtVND(s.totalFee || s.fee || 0)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                              background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                              color: isActive ? '#f59e0b' : '#10b981',
                            }}>
                              {isActive ? 'Đang đỗ' : 'Hoàn tất'}
                            </span>
                            {hasPass && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 8, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontWeight: 700 }}>VÉ THÁNG</span>}
                            {hasBooking && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 700 }}>ĐẶT CHỖ</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Session detail modal */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Chi tiết phiên đỗ xe</h3>
              <button onClick={() => setSelectedSession(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <span style={{ fontSize: '2.5rem' }}>{VEHICLE_ICON[(selectedSession.vehicleType || selectedSession.vehicle?.vehicleType || 'CAR').toUpperCase()] || '🚗'}</span>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                  {selectedSession.licensePlate || selectedSession.vehicle?.licensePlate || '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {VEHICLE_LABEL[(selectedSession.vehicleType || selectedSession.vehicle?.vehicleType || 'CAR').toUpperCase()] || '—'}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', padding: '4px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
                background: !selectedSession.exitTime ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                color: !selectedSession.exitTime ? '#f59e0b' : '#10b981',
              }}>
                {!selectedSession.exitTime ? '🟡 Đang đỗ' : '✅ Đã ra'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '📍 Vị trí', value: selectedSession.slotCode || selectedSession.slot?.slotCode || '—' },
                { label: '🗺️ Khu vực', value: selectedSession.zoneName || selectedSession.slot?.zone?.name || '—' },
                { label: '🏢 Tầng', value: selectedSession.floorName || selectedSession.slot?.floor?.name || '—' },
                { label: '🕐 Giờ vào', value: formatDT(selectedSession.entryTime) },
                { label: '🚪 Giờ ra', value: selectedSession.exitTime ? formatDT(selectedSession.exitTime) : 'Đang đỗ' },
                { label: '⏱ Thời gian', value: calcDur(selectedSession.entryTime, selectedSession.exitTime) },
                { label: '💰 Phí', value: selectedSession.exitTime ? fmtVND(selectedSession.totalFee || selectedSession.fee || 0) : '—', highlight: true },
                ...(selectedSession.paymentMethod ? [{ label: '💳 Thanh toán', value: selectedSession.paymentMethod }] : []),
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: r.highlight ? 800 : 600, color: r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: r.highlight ? '1.05rem' : '0.88rem' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
