import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, MapPin, Car, Bike, Truck, ChevronRight, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

/* ─── Toast Notification ─────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: t.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
          color: '#fff', padding: '12px 18px', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontSize: '0.88rem', fontWeight: 600,
          animation: 'slideInRight 0.3s ease',
          pointerEvents: 'auto', minWidth: 260, maxWidth: 380,
        }}>
          {t.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];
const vehicleTypeLabel = (t) => ({ MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' }[t] || t);
const vehicleTypeStyle = (t) => ({
  CAR: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: '🚗' },
  MOTORBIKE: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', icon: '🏍️' },
  TRUCK: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: '🚛' },
}[t] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', icon: '🚗' });

/* ─── Confirm Delete Modal ──────────────────────────────────── */
function ConfirmModal({ isOpen, title, description, onConfirm, onCancel, confirmLabel = 'Xóa' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={26} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>{title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={onCancel}>Hủy</button>
          <button className="btn-sm" style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', padding: '10px 20px' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function ManageZones() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const floorIdFromUrl = searchParams.get('floorId') || '';

  const [zones, setZones] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState(floorIdFromUrl);
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ floorId: floorIdFromUrl, name: '', vehicleType: 'CAR', totalSlots: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => { loadData(); }, []);

  // Sync floorId from URL to filter
  useEffect(() => {
    setFilterFloor(floorIdFromUrl);
    if (floorIdFromUrl) setForm(f => ({ ...f, floorId: floorIdFromUrl }));
  }, [floorIdFromUrl]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFloor, filterVehicleType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [floorsRes, zonesRes] = await Promise.all([
        api.get('/api/v1/floors'),
        api.get('/api/v1/zones')
      ]);
      const floorsData = floorsRes.data.data ?? floorsRes.data ?? [];
      const zonesData = zonesRes.data.data ?? zonesRes.data ?? [];
      setFloors(Array.isArray(floorsData) ? floorsData.sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0)) : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
      setError('');
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.floorId || !form.name || !form.vehicleType || !form.totalSlots) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    setSubmitting(true);
    try {
      const payload = { floorId: form.floorId, name: form.name, vehicleType: form.vehicleType, totalSlots: parseInt(form.totalSlots) };
      if (editingId) {
        await api.put(`/api/v1/zones/${editingId}`, payload);
        showToast(`✅ Đã cập nhật khu vực "${form.name}" thành công`);
      } else {
        await api.post('/api/v1/zones', payload);
        showToast(`✅ Đã thêm khu vực "${form.name}" thành công`);
      }
      setShowForm(false); setEditingId(null); setForm({ floorId: floorIdFromUrl, name: '', vehicleType: 'CAR', totalSlots: '' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu khu vực');
      showToast(err.response?.data?.message || 'Lỗi khi lưu khu vực', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (zone) => {
    setForm({ floorId: zone.floorId || '', name: zone.name || '', vehicleType: zone.vehicleType || 'CAR', totalSlots: zone.totalSlots || '' });
    setEditingId(zone.id); setShowForm(true); setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const zoneName = deleteTarget.name;
    try {
      await api.delete(`/api/v1/zones/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
      showToast(`🗑️ Đã xóa khu vực "${zoneName}" thành công`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa khu vực';
      setError(msg);
      showToast(msg, 'error');
      setDeleteTarget(null);
    }
  };

  const handleReset = () => { setShowForm(false); setEditingId(null); setForm({ floorId: floorIdFromUrl, name: '', vehicleType: 'CAR', totalSlots: '' }); setError(''); };

  const getFloorName = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    return floor ? `Tầng ${floor.levelNumber}: ${floor.name}` : '—';
  };

  const currentFloor = floors.find(f => f.id === floorIdFromUrl);

  const filteredZones = zones.filter(zone => {
    const matchSearch = !searchTerm || zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || zone.floorId === filterFloor;
    const matchVehicleType = !filterVehicleType || zone.vehicleType === filterVehicleType;
    return matchSearch && matchFloor && matchVehicleType;
  });

  const totalPages = Math.ceil(filteredZones.length / PAGE_SIZE) || 1;
  const pagedZones = filteredZones.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Occupancy per zone
  const getOccupancy = (zone) => {
    const total = zone.createdSlots || 0;
    const avail = zone.availableSlots || 0;
    const used = total - avail;
    return { total, used, pct: total > 0 ? Math.round((used / total) * 100) : 0 };
  };

  const totalSlots = zones.reduce((s, z) => s + (z.createdSlots || 0), 0);
  const usedSlots = zones.reduce((s, z) => s + ((z.createdSlots || 0) - (z.availableSlots || 0)), 0);
  const overallOccupancy = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

  const stats = [
    { label: 'Tổng số Khu vực', value: zones.length, icon: MapPin, color: '#3b82f6', sub: filterFloor ? `Đang lọc: ${currentFloor?.name || ''}` : 'Toàn hệ thống' },
    { label: 'Tỷ lệ lấp đầy', value: `${overallOccupancy}%`, icon: Activity, color: '#10b981', sub: `${usedSlots}/${totalSlots} chỗ đang dùng`, pct: overallOccupancy },
    { label: 'Khu Ô tô', value: zones.filter(z => z.vehicleType === 'CAR').length, icon: Car, color: '#10b981', sub: '' },
    { label: 'Khu Xe máy', value: zones.filter(z => z.vehicleType === 'MOTORBIKE').length, icon: Bike, color: '#8b5cf6', sub: '' },
  ];

  return (
    <div className="page-full-width">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <span style={{ cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => navigate('/PARKING_MANAGER/floors')}>Quản lý Tầng</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {currentFloor ? `${currentFloor.name}` : 'Tất cả Khu vực'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>📍 Quản lý Khu vực</h2>
          <p>Tạo, sửa, xóa các phân khu — click vào khu vực để xem chỗ đỗ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-card-value" style={{ fontSize: typeof s.value === 'string' && s.value.length > 5 ? '1.5rem' : '2rem' }}>{s.value}</div>
              {s.pct !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: s.pct > 80 ? '#ef4444' : s.pct > 60 ? '#f59e0b' : '#10b981', borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )}
              {s.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>}
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Filter bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 2, minWidth: '400px' }}>
          <div className="form-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm tên khu vực..."
              style={{ padding: '10px 14px 10px 40px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="form-select" value={filterFloor}
            onChange={e => { setFilterFloor(e.target.value); setSearchParams(e.target.value ? { floorId: e.target.value } : {}); }}
            style={{ minWidth: 160, padding: '10px 14px' }}>
            <option value="">Tất cả tầng</option>
            {floors.map(floor => <option key={floor.id} value={floor.id}>Tầng {floor.levelNumber}: {floor.name}</option>)}
          </select>
          <select className="form-select" value={filterVehicleType} onChange={e => setFilterVehicleType(e.target.value)} style={{ minWidth: 140, padding: '10px 14px' }}>
            <option value="">Tất cả loại xe</option>
            {VEHICLE_TYPES.map(type => <option key={type} value={type}>{vehicleTypeLabel(type)}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Thêm khu vực
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>📍</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Chưa có khu vực nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}><Plus size={16} /> Tạo khu vực đầu tiên</button>
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy khu vực với bộ lọc này</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tên khu vực</th>
                <th>Tầng</th>
                <th>Loại xe</th>
                <th>Chỗ đỗ</th>
                <th>Tỷ lệ lấp đầy</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedZones.map(zone => {
                const vts = vehicleTypeStyle(zone.vehicleType);
                const occ = getOccupancy(zone);
                const barColor = occ.pct > 80 ? '#ef4444' : occ.pct > 60 ? '#f59e0b' : '#10b981';
                return (
                  <tr key={zone.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => navigate(`/PARKING_MANAGER/parking-slots?zoneId=${zone.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {zone.name}
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{getFloorName(zone.floorId)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', background: vts.bg, color: vts.color, padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
                        {vts.icon} {vehicleTypeLabel(zone.vehicleType)}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ fontWeight: 600 }}>{zone.createdSlots || 0}</td>
                    <td onClick={e => e.stopPropagation()} style={{ minWidth: 140 }}>
                      {occ.total > 0 ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            <span>{occ.used}/{occ.total}</span>
                            <span style={{ color: barColor, fontWeight: 600 }}>{occ.pct}%</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${occ.pct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                          </div>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn-sm btn-sm-primary" onClick={() => handleEdit(zone)} style={{ padding: '6px' }} title="Chỉnh sửa"><Edit2 size={15} /></button>
                        <button className="btn-sm" onClick={() => setDeleteTarget({ id: zone.id, name: zone.name })}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px' }} title="Xóa"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <button className="btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}>Trước</button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button className="btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}>Sau</button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Thuộc Tầng <span className="required">*</span></label>
              <select className="form-select" value={form.floorId} onChange={e => setForm({ ...form, floorId: e.target.value })} style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn tầng --</option>
                {floors.map(floor => <option key={floor.id} value={floor.id}>Tầng {floor.levelNumber}: {floor.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên Khu vực <span className="required">*</span></label>
              <input type="text" className="form-input" placeholder="VD: Zone A, Khu VIP..."
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '12px 14px' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select className="form-select" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} style={{ padding: '12px 14px' }}>
                {VEHICLE_TYPES.map(type => <option key={type} value={type}>{vehicleTypeLabel(type)}</option>)}
              </select>
            </div>
            {!editingId && (
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Sức chứa (Tổng số chỗ đỗ) <span className="required">*</span></label>
                <input type="number" className="form-input" placeholder="VD: 20, 50, 100..."
                  value={form.totalSlots} onChange={e => setForm({ ...form, totalSlots: e.target.value })} style={{ padding: '12px 14px' }} />
              </div>
            )}
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 16 }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={handleReset}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Khu vực' : 'Thêm Khu vực'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Xóa khu vực "${deleteTarget?.name}"?`}
        description="Hành động này không thể hoàn tác. Chỉ có thể xóa khi khu vực không còn chỗ đỗ nào bên trong. Xóa khu vực sẽ ảnh hưởng đến toàn bộ chỗ đỗ bên trong."
        confirmLabel="Xóa khu vực"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} />
    </div>
  );
}
