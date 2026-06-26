import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function ManageFloors() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ level: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Load floors
  useEffect(() => {
    loadFloors();
  }, []);

  const loadFloors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/floors');
      const data = res.data.data ?? res.data ?? [];
      setFloors(Array.isArray(data) ? data.sort((a, b) => (a.level || 0) - (b.level || 0)) : []);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách tầng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.level || !form.name) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        levelNumber: parseInt(form.level),
        name: form.name,
        description: form.description || ''
      };

      if (editingId) {
        await api.put(`/api/v1/floors/${editingId}`, payload);
      } else {
        await api.post('/api/v1/floors', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ level: '', name: '', description: '' });
      await loadFloors();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu tầng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (floor) => {
    setForm({
      level: floor.levelNumber || '',
      name: floor.name || '',
      description: floor.description || ''
    });
    setEditingId(floor.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tầng này?')) {
      try {
        await api.delete(`/api/v1/floors/${id}`);
        await loadFloors();
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xóa tầng');
      }
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ level: '', name: '', description: '' });
    setError('');
  };

  return (
    <div className="page-full">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🏢 Quản lý Tầng</h2>
          <p>Tạo, sửa, xóa tầng đỗ xe</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
          <Plus size={16} /> Thêm tầng mới
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : floors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📋</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có tầng nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Tạo tầng đầu tiên
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tầng</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {floors.map(floor => (
                <tr key={floor.id}>
                  <td style={{ fontWeight: 600 }}>Level {floor.levelNumber}</td>
                  <td>{floor.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{floor.description || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(floor)}
                        title="Chỉnh sửa">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(floor.id)}
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
              <h3>{editingId ? 'Chỉnh sửa tầng' : 'Thêm tầng mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tầng <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="VD: -1 (hầm), 0, 1, 2..."
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Basement 1, Floor 1..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Mô tả</label>
              <input
                type="text"
                className="form-input"
                placeholder="Vị trí, đặc điểm..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
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

