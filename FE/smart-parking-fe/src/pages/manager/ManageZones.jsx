import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, MapPin, Car, Bike, Truck } from 'lucide-react';
import api from '../../services/api';

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];
const vehicleTypeLabel = (t) => ({ MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' }[t] || t);

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
    if (window.confirm('Bạn có chắc chắn muốn xóa khu vực này? Lưu ý: Chỉ có thể xóa khi khu vực này không chứa bất kỳ Chỗ đỗ (Slot) nào.')) {
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
    return floor ? `Tầng ${floor.levelNumber}: ${floor.name}` : '—';
  };

  // Filter zones based on search and filters
  const filteredZones = zones.filter(zone => {
    const matchSearch = !searchTerm || zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || zone.floorId === filterFloor;
    const matchVehicleType = !filterVehicleType || zone.vehicleType === filterVehicleType;
    return matchSearch && matchFloor && matchVehicleType;
  });

  const stats = [
    { label: 'Tổng số Khu vực', value: zones.length, icon: MapPin, color: '#3b82f6' },
    { label: 'Khu vực Ô tô', value: zones.filter(z => z.vehicleType === 'CAR').length, icon: Car, color: '#10b981' },
    { label: 'Khu vực Xe máy', value: zones.filter(z => z.vehicleType === 'MOTORBIKE').length, icon: Bike, color: '#8b5cf6' },
    { label: 'Khu vực Xe tải', value: zones.filter(z => z.vehicleType === 'TRUCK').length, icon: Truck, color: '#f59e0b' },
  ];

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>📍 Quản lý Khu vực</h2>
          <p>Tạo, sửa, xóa các phân khu đỗ xe theo từng tầng</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm khu vực mới
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
            placeholder="Tìm tên khu vực..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 42, width: '100%' }}
          />
        </div>
        <select
          className="form-select"
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          style={{ minWidth: '160px', padding: '10px 14px' }}>
          <option value="">Tất cả tầng</option>
          {floors.map(floor => (
            <option key={floor.id} value={floor.id}>Tầng {floor.levelNumber}: {floor.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterVehicleType}
          onChange={e => setFilterVehicleType(e.target.value)}
          style={{ minWidth: '160px', padding: '10px 14px' }}>
          <option value="">Tất cả loại xe</option>
          {VEHICLE_TYPES.map(type => (
            <option key={type} value={type}>{vehicleTypeLabel(type)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>📍</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Chưa có khu vực nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
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
                <th>Tổng số chỗ đỗ</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.map(zone => (
                 <tr key={zone.id}>
                   <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{zone.name}</td>
                   <td>{getFloorName(zone.floorId)}</td>
                  <td>
                    <span style={{
                      fontSize: '0.8rem',
                      background: zone.vehicleType === 'CAR' ? 'rgba(16, 185, 129, 0.1)' : zone.vehicleType === 'MOTORBIKE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: zone.vehicleType === 'CAR' ? '#10b981' : zone.vehicleType === 'MOTORBIKE' ? '#8b5cf6' : '#f59e0b',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}>
                      {vehicleTypeLabel(zone.vehicleType)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{zone.totalSlots}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(zone)}
                        style={{ padding: '6px' }}
                        title="Chỉnh sửa">
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(zone.id)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px' }}
                        title="Xóa">
                        <Trash2 size={16} />
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
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Thuộc Tầng <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.floorId}
                onChange={e => setForm({ ...form, floorId: e.target.value })}
                style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn tầng --</option>
                {floors.map(floor => (
                  <option key={floor.id} value={floor.id}>
                    Tầng {floor.levelNumber}: {floor.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên Khu vực <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Zone A, Khu VIP..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
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
              <label className="form-label">Sức chứa (Tổng số chỗ đỗ) <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="VD: 20, 50, 100..."
                value={form.totalSlots}
                onChange={e => setForm({ ...form, totalSlots: e.target.value })}
                style={{ padding: '12px 14px' }}
              />
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
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Khu vực' : 'Thêm Khu vực'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
