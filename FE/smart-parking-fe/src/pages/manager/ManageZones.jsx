import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];

export default function ManageZones() {
  const [zones, setZones] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    floorId: '',
    name: '',
    vehicleType: 'CAR',
    totalSlots: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [floorsRes, zonesRes] = await Promise.all([
        api.get('/api/v1/floors'),
        api.get('/api/v1/zones')
      ]);

      const floorsData = floorsRes.data.data ?? floorsRes.data ?? [];
      const zonesData = zonesRes.data.data ?? zonesRes.data ?? [];

      setFloors(Array.isArray(floorsData) ? floorsData.sort((a, b) => (a.level || 0) - (b.level || 0)) : []);
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
    if (!form.floorId || !form.name || !form.vehicleType || !form.totalSlots) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        floorId: form.floorId,
        name: form.name,
        vehicleType: form.vehicleType,
        totalSlots: parseInt(form.totalSlots)
      };

      if (editingId) {
        await api.put(`/api/v1/zones/${editingId}`, payload);
      } else {
        await api.post('/api/v1/zones', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ floorId: '', name: '', vehicleType: 'CAR', totalSlots: '' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu khu vực');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (zone) => {
    setForm({
      floorId: zone.floorId || '',
      name: zone.name || '',
      vehicleType: zone.vehicleType || 'CAR',
      totalSlots: zone.totalSlots || ''
    });
    setEditingId(zone.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khu vực này?')) {
      try {
        await api.delete(`/api/v1/zones/${id}`);
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xóa khu vực');
      }
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ floorId: '', name: '', vehicleType: 'CAR', totalSlots: '' });
    setError('');
  };

  const getFloorName = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    return floor ? `Level ${floor.levelNumber}: ${floor.name}` : '—';
  };

  // Filter zones based on search and filters
  const filteredZones = zones.filter(zone => {
    const matchSearch = !searchTerm || zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || zone.floorId === filterFloor;
    const matchVehicleType = !filterVehicleType || zone.vehicleType === filterVehicleType;
    return matchSearch && matchFloor && matchVehicleType;
  });

  return (
    <div className="page-full">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>📍 Quản lý Khu vực</h2>
          <p>Tạo, sửa, xóa khu vực đỗ xe</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
          <Plus size={16} /> Thêm khu vực
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
            placeholder="Tìm tên khu vực..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select
          className="form-select"
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          style={{ minWidth: '150px', padding: '8px 12px' }}>
          <option value="">Tất cả tầng</option>
          {floors.map(floor => (
            <option key={floor.id} value={floor.id}>Level {floor.level}: {floor.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterVehicleType}
          onChange={e => setFilterVehicleType(e.target.value)}
          style={{ minWidth: '150px', padding: '8px 12px' }}>
          <option value="">Tất cả loại xe</option>
          {VEHICLE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📋</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có khu vực nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Tạo khu vực đầu tiên
          </button>
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
                <th>Tổng số chỗ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.map(zone => (
                 <tr key={zone.id}>
                   <td style={{ fontWeight: 600 }}>{zone.name}</td>
                   <td>{getFloorName(zone.floorId)}</td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      background: 'rgba(59,130,246,0.1)',
                      color: '#3b82f6',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {zone.vehicleType}
                    </span>
                  </td>
                  <td>{zone.totalSlots}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(zone)}
                        title="Chỉnh sửa">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(zone.id)}
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
              <h3>{editingId ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tầng <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.floorId}
                onChange={e => setForm({ ...form, floorId: e.target.value })}>
                <option value="">-- Chọn tầng --</option>
                {floors.map(floor => (
                  <option key={floor.id} value={floor.id}>
                    Level {floor.level}: {floor.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên khu vực <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Zone A, zona 1..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
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
              <label className="form-label">Tổng số chỗ <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="VD: 20, 50, 100..."
                value={form.totalSlots}
                onChange={e => setForm({ ...form, totalSlots: e.target.value })}
              />
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

