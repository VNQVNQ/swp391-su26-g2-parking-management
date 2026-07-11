import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Grid3x3, Car, Bike, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];
const MAINTENANCE_STATUS = ['AVAILABLE', 'MAINTENANCE'];

const vehicleTypeLabel = (t) => ({ MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' }[t] || t);
const statusLabel = (s) => ({ AVAILABLE: 'Trống', MAINTENANCE: 'Bảo trì' }[s] || s);
const statusColor = (s) => ({
  AVAILABLE:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  MAINTENANCE: { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' },
}[s] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' });

export default function ManageParkingSlots() {
  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    zoneId: '',
    slotCode: '',
    vehicleType: 'CAR',
    maintenanceStatus: 'AVAILABLE'
  });
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsRes, zonesRes] = await Promise.all([
        api.get('/api/v1/parking-slots'),
        api.get('/api/v1/zones')
      ]);

      const slotsData = slotsRes.data.data ?? slotsRes.data ?? [];
      const zonesData = zonesRes.data.data ?? zonesRes.data ?? [];

      setSlots(Array.isArray(slotsData) ? slotsData : []);
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
    if (!form.zoneId || !form.slotCode || !form.vehicleType) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const selectedZone = zones.find(z => z.id === form.zoneId);
      const payload = {
        zoneId: form.zoneId,
        floorId: selectedZone?.floorId,
        slotCode: form.slotCode,
        vehicleType: form.vehicleType,
        maintenanceStatus: form.maintenanceStatus
      };

      if (editingId) {
        await api.put(`/api/v1/parking-slots/${editingId}`, payload);
      } else {
        await api.post('/api/v1/parking-slots', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ zoneId: '', slotCode: '', vehicleType: 'CAR', maintenanceStatus: 'AVAILABLE' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu chỗ đỗ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (slot) => {
    setForm({
      zoneId: slot.zoneId || '',
      slotCode: slot.slotCode || '',
      vehicleType: slot.vehicleType || 'CAR',
      maintenanceStatus: slot.maintenanceStatus || 'AVAILABLE'
    });
    setEditingId(slot.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa chỗ đỗ này? Lưu ý: Không thể xóa nếu đang có xe đỗ hoặc có phiên gửi xe đang hoạt động.')) {
      try {
        await api.delete(`/api/v1/parking-slots/${id}`);
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xóa chỗ đỗ');
      }
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ zoneId: '', slotCode: '', vehicleType: 'CAR', maintenanceStatus: 'AVAILABLE' });
    setError('');
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : '—';
  };

  // Filter slots based on search and filters
  const filteredSlots = slots.filter(slot => {
    const matchSearch = !searchTerm || slot.slotCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchZone = !filterZone || slot.zoneId === filterZone;
    const matchStatus = !filterStatus || slot.maintenanceStatus === filterStatus;
    return matchSearch && matchZone && matchStatus;
  });

  const stats = [
    { label: 'Tổng số Chỗ đỗ', value: slots.length, icon: Grid3x3, color: '#3b82f6' },
    { label: 'Chỗ đỗ Ô tô', value: slots.filter(s => s.vehicleType === 'CAR').length, icon: Car, color: '#10b981' },
    { label: 'Chỗ đỗ Xe máy', value: slots.filter(s => s.vehicleType === 'MOTORBIKE').length, icon: Bike, color: '#8b5cf6' },
    { label: 'Đang bảo trì', value: slots.filter(s => s.maintenanceStatus === 'MAINTENANCE').length, icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>🅿️ Quản lý Chỗ đỗ</h2>
          <p>Tạo, sửa, xóa và quản lý trạng thái từng ô đỗ xe</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm chỗ đỗ
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
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

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm theo mã chỗ đỗ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 42, width: '100%' }}
          />
        </div>
        <select
          className="form-select"
          value={filterZone}
          onChange={e => setFilterZone(e.target.value)}
          style={{ minWidth: '160px', padding: '10px 14px' }}>
          <option value="">Tất cả khu vực</option>
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ minWidth: '160px', padding: '10px 14px' }}>
          <option value="">Tất cả trạng thái</option>
          {MAINTENANCE_STATUS.map(status => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>🅿️</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Chưa có chỗ đỗ nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Tạo chỗ đỗ đầu tiên
          </button>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy chỗ đỗ phù hợp với bộ lọc này</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Mã chỗ đỗ</th>
                <th>Khu vực</th>
                <th>Loại xe</th>
                <th>Trạng thái</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
               {filteredSlots.map(slot => {
                 const hasActiveSession = !!slot.currentSessionId;
                 const stColor = statusColor(slot.maintenanceStatus);
                 return (
                 <tr key={slot.id}>
                   <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{slot.slotCode}</td>
                   <td>{slot.zoneName || getZoneName(slot.zoneId)}</td>
                   <td>
                     <span style={{
                       fontSize: '0.8rem',
                       background: slot.vehicleType === 'CAR' ? 'rgba(16, 185, 129, 0.1)' : slot.vehicleType === 'MOTORBIKE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                       color: slot.vehicleType === 'CAR' ? '#10b981' : slot.vehicleType === 'MOTORBIKE' ? '#8b5cf6' : '#f59e0b',
                       padding: '4px 10px',
                       borderRadius: '8px',
                       fontWeight: 600
                     }}>
                       {vehicleTypeLabel(slot.vehicleType)}
                     </span>
                   </td>
                   <td>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                       <span style={{
                         fontSize: '0.8rem',
                         background: stColor.bg,
                         color: stColor.color,
                         padding: '4px 10px',
                         borderRadius: '8px',
                         fontWeight: 600,
                         width: 'fit-content'
                       }}>
                         {statusLabel(slot.maintenanceStatus)}
                       </span>
                       {hasActiveSession && (
                         <span style={{
                           fontSize: '0.75rem',
                           background: 'rgba(249,115,22,0.1)',
                           color: '#f97316',
                           padding: '2px 8px',
                           borderRadius: '4px',
                           fontWeight: 600,
                           width: 'fit-content',
                           marginTop: '4px'
                         }}>🚗 Đang có xe</span>
                       )}
                     </div>
                   </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(slot)}
                        style={{ padding: '6px' }}
                        title="Chỉnh sửa">
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(slot.id)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px' }}
                        title="Xóa">
                        <Trash2 size={16} />
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa chỗ đỗ' : 'Thêm chỗ đỗ mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Khu vực <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.zoneId}
                onChange={e => setForm({ ...form, zoneId: e.target.value })}
                style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn khu vực --</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({vehicleTypeLabel(zone.vehicleType)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Mã chỗ đỗ <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: A-001, B1-05..."
                value={form.slotCode}
                onChange={e => setForm({ ...form, slotCode: e.target.value.toUpperCase() })}
                style={{ padding: '12px 14px' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.vehicleType}
                onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                style={{ padding: '12px 14px' }}>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{vehicleTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Trạng thái <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.maintenanceStatus}
                onChange={e => setForm({ ...form, maintenanceStatus: e.target.value })}
                style={{ padding: '12px 14px' }}>
                {MAINTENANCE_STATUS.map(status => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }}
                onClick={handleReset}>
                Hủy
              </button>
              <button
                className="btn-sm btn-sm-primary"
                style={{ padding: '10px 20px' }}
                onClick={handleSubmit}
                disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Chỗ đỗ' : 'Thêm Chỗ đỗ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
