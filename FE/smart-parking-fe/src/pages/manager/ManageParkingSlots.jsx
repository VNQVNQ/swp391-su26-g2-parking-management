import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];
const MAINTENANCE_STATUS = ['AVAILABLE', 'MAINTENANCE'];

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
    if (window.confirm('Bạn có chắc muốn xóa chỗ đỗ này?')) {
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

  return (
    <div className="page-full">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🅿️ Quản lý Chỗ đỗ</h2>
          <p>Tạo, sửa, xóa chỗ đỗ xe</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
          <Plus size={16} /> Thêm chỗ đỗ
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm mã chỗ đỗ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select
          className="form-select"
          value={filterZone}
          onChange={e => setFilterZone(e.target.value)}
          style={{ minWidth: '150px', padding: '8px 12px' }}>
          <option value="">Tất cả khu vực</option>
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ minWidth: '150px', padding: '8px 12px' }}>
          <option value="">Tất cả trạng thái</option>
          {MAINTENANCE_STATUS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>🅿️</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có chỗ đỗ nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Tạo chỗ đỗ đầu tiên
          </button>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy chỗ đỗ với bộ lọc này</p>
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
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
               {filteredSlots.map(slot => (
                 <tr key={slot.id}>
                   <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{slot.slotCode}</td>
                   <td>{slot.zoneName || getZoneName(slot.zoneId)}</td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      background: 'rgba(59,130,246,0.1)',
                      color: '#3b82f6',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {slot.vehicleType}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      background: slot.maintenanceStatus === 'AVAILABLE' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                      color: slot.maintenanceStatus === 'AVAILABLE' ? '#10b981' : '#94a3b8',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {slot.maintenanceStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(slot)}
                        title="Chỉnh sửa">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(slot.id)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                        title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleReset}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingId ? 'Chỉnh sửa chỗ đỗ' : 'Thêm chỗ đỗ mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Khu vực <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.zoneId}
                onChange={e => setForm({ ...form, zoneId: e.target.value })}>
                <option value="">-- Chọn khu vực --</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.vehicleType})
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
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.vehicleType}
                onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Trạng thái <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.maintenanceStatus}
                onChange={e => setForm({ ...form, maintenanceStatus: e.target.value })}>
                {MAINTENANCE_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn-outline"
                onClick={handleReset}>
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

