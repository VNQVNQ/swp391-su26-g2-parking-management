import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Building2, Layers, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/* ─── Confirm Delete Modal ──────────────────────────────────── */
function ConfirmModal({ isOpen, title, description, onConfirm, onCancel, confirmLabel = 'Xóa', danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            border: `2px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <AlertTriangle size={26} color={danger ? '#ef4444' : '#f59e0b'} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>{title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={onCancel}>Hủy</button>
          <button
            className="btn-sm"
            style={{ background: danger ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)', color: '#fff', border: 'none', padding: '10px 20px' }}
            onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageFloors() {
  const navigate = useNavigate();
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ level: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [floorsRes, zonesRes] = await Promise.all([
        api.get('/api/v1/floors'),
        api.get('/api/v1/zones').catch(() => ({ data: { data: [] } })),
      ]);
      const floorsData = floorsRes.data.data ?? floorsRes.data ?? [];
      const zonesData = zonesRes.data?.data ?? zonesRes.data ?? [];
      setFloors(Array.isArray(floorsData) ? floorsData.sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0)) : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách tầng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.level || !form.name) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    setSubmitting(true);
    try {
      const payload = { levelNumber: parseInt(form.level), name: form.name, description: form.description || '' };
      if (editingId) {
        await api.put(`/api/v1/floors/${editingId}`, payload);
      } else {
        await api.post('/api/v1/floors', payload);
      }
      setShowForm(false); setEditingId(null); setForm({ level: '', name: '', description: '' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu tầng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (floor) => {
    setForm({ level: floor.levelNumber || '', name: floor.name || '', description: floor.description || '' });
    setEditingId(floor.id);
    setShowForm(true);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/floors/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa tầng');
      setDeleteTarget(null);
    }
  };

  const handleReset = () => { setShowForm(false); setEditingId(null); setForm({ level: '', name: '', description: '' }); setError(''); };

  const getZoneCount = (floorId) => zones.filter(z => z.floorId === floorId).length;
  const getOccupancyForFloor = (floorId) => {
    const floorZones = zones.filter(z => z.floorId === floorId);
    const total = floorZones.reduce((sum, z) => sum + (z.totalSlots || 0), 0);
    const created = floorZones.reduce((sum, z) => sum + (z.createdSlots || 0), 0);
    const avail = floorZones.reduce((sum, z) => sum + (z.availableSlots || 0), 0);
    const used = created - avail;
    return { total, used, pct: total > 0 ? Math.round((used / total) * 100) : 0 };
  };

  const totalZones = zones.length;
  const avgZonesPerFloor = floors.length > 0 ? (totalZones / floors.length).toFixed(1) : 0;

  const stats = [
    { label: 'Tổng số tầng', value: floors.length, icon: Layers, color: '#3b82f6', sub: `${avgZonesPerFloor} khu/tầng TB` },
    { label: 'Tổng khu vực', value: totalZones, icon: MapPin, color: '#10b981', sub: 'Trên tất cả tầng' },
    { label: 'Tổng chỗ đỗ', value: zones.reduce((s, z) => s + (z.totalSlots || 0), 0), icon: Building2, color: '#8b5cf6', sub: 'Toàn bãi xe' },
  ];

  return (
    <div className="page-full-width">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <span>Tổng quan</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Quản lý Tầng</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>🏢 Quản lý Tầng</h2>
          <p>Tạo, sửa, xóa tầng đỗ xe — click vào tầng để xem khu vực</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Thêm tầng mới
        </button>
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
              <div className="stat-card-value">{s.value}</div>
              {s.sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>}
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : floors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>🏢</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Chưa có tầng nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Tạo tầng đầu tiên
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tầng</th>
                <th>Tên Tầng</th>
                <th>Mô tả</th>
                <th>Khu vực</th>
                <th>Tỷ lệ lấp đầy</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {floors.map(floor => {
                const zoneCount = getZoneCount(floor.id);
                const occ = getOccupancyForFloor(floor.id);
                const barColor = occ.pct > 80 ? '#ef4444' : occ.pct > 60 ? '#f59e0b' : '#10b981';
                return (
                  <tr key={floor.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => navigate(`/PARKING_MANAGER/zones?floorId=${floor.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td onClick={e => e.stopPropagation()} style={{ width: 90 }}>
                      <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                        Tầng {floor.levelNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {floor.name}
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{floor.description || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <span style={{
                        background: zoneCount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                        color: zoneCount > 0 ? '#10b981' : '#94a3b8',
                        padding: '3px 10px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600,
                      }}>
                        {zoneCount} khu vực
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ minWidth: 140 }}>
                      {occ.total > 0 ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            <span>{occ.used}/{occ.total}</span>
                            <span style={{ color: barColor, fontWeight: 600 }}>{occ.pct}%</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${occ.pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Chưa có dữ liệu</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn-sm btn-sm-primary" onClick={() => handleEdit(floor)} style={{ padding: '6px' }} title="Chỉnh sửa">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn-sm"
                          onClick={() => setDeleteTarget({ id: floor.id, name: floor.name })}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px' }}
                          title="Xóa">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleReset}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa tầng' : 'Thêm tầng mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Cấp tầng (Level) <span className="required">*</span></label>
              <input type="number" className="form-input" placeholder="VD: -1 (hầm), 0, 1, 2..."
                value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} style={{ padding: '12px 14px' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên Tầng <span className="required">*</span></label>
              <input type="text" className="form-input" placeholder="VD: Tầng hầm B1, Tầng 1..."
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '12px 14px' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Mô tả chi tiết</label>
              <textarea className="form-input" placeholder="Vị trí, đặc điểm, thông tin thêm..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: '12px 14px', minHeight: '80px', resize: 'vertical' }} />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 16 }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={handleReset}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Tầng' : 'Thêm Tầng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Xóa tầng "${deleteTarget?.name}"?`}
        description="Hành động này không thể hoàn tác. Chỉ có thể xóa tầng khi không chứa khu vực nào. Nếu có khu vực bên trong, hãy xóa khu vực trước."
        confirmLabel="Xóa tầng"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
