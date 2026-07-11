import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Building2, Layers } from 'lucide-react';
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
    if (window.confirm('Bạn có chắc chắn muốn xóa tầng này? Lưu ý: Chỉ có thể xóa khi tầng này không chứa bất kỳ Khu vực (Zone) nào.')) {
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

  const stats = [
    { label: 'Tổng số tầng', value: floors.length, icon: Layers, color: '#3b82f6' },
  ];

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>🏢 Quản lý Tầng</h2>
          <p>Tạo, sửa, xóa tầng đỗ xe</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm tầng mới
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

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
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
                <th>Cấp Tầng</th>
                <th>Tên Tầng</th>
                <th>Mô tả</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {floors.map(floor => (
                <tr key={floor.id}>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}>
                      Tầng {floor.levelNumber}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{floor.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{floor.description || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn-sm btn-sm-primary"
                        onClick={() => handleEdit(floor)}
                        style={{ padding: '6px' }}
                        title="Chỉnh sửa">
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => handleDelete(floor.id)}
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa tầng' : 'Thêm tầng mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Cấp tầng (Level) <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="VD: -1 (hầm), 0, 1, 2..."
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                style={{ padding: '12px 14px' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Tên Tầng <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Tầng hầm B1, Tầng 1..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ padding: '12px 14px' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Mô tả chi tiết</label>
              <textarea
                className="form-input"
                placeholder="Vị trí, đặc điểm, thông tin thêm..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ padding: '12px 14px', minHeight: '80px', resize: 'vertical' }}
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
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Tầng' : 'Thêm Tầng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
