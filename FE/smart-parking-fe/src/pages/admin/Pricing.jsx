import { DollarSign, Clock, Settings, Shield, Plus, X, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import api from '../../services/api';

/* ── Nhãn hiển thị ─────────────────────────────────────────────────── */
const VEHICLE_TYPE_LABELS = { CAR: 'Ô tô', MOTORBIKE: 'Xe máy', TRUCK: 'Xe tải' };
const EXCEPTION_TYPE_LABELS = {
  LOST_TICKET: '🎫 Mất vé',
  WRONG_ZONE:  '📍 Sai vị trí',
  OVERSTAY:    '⏰ Quá giờ',
  WRONG_SPOT:  '🅿️ Đỗ sai vị trí (cũ)',
};
const VEHICLE_TYPES   = ['CAR', 'MOTORBIKE', 'TRUCK'];
const EXCEPTION_TYPES = ['LOST_TICKET', 'WRONG_ZONE', 'OVERSTAY'];

/* ── Section: Phí Phạt Ngoại Lệ ────────────────────────────────────── */
function PenaltySection() {
  const [penalties, setPenalties]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm] = useState({
    vehicleType:   'CAR',
    exceptionType: 'LOST_TICKET',
    penaltyAmount: '',
    description:   '',
  });

  useEffect(() => { fetchPenalties(); }, []);

  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/penalty-configs');
      setPenalties(res.data?.data || []);
    } catch { setPenalties([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ vehicleType: 'CAR', exceptionType: 'LOST_TICKET', penaltyAmount: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      vehicleType:   p.vehicleType,
      exceptionType: p.exceptionType,
      penaltyAmount: String(p.penaltyAmount || ''),
      description:   p.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.penaltyAmount || Number(form.penaltyAmount) <= 0) {
      setError('Vui lòng nhập mức phí phạt hợp lệ (> 0).');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/penalty-configs/${editingId}`, {
          penaltyAmount: Number(form.penaltyAmount),
          description: form.description,
          isActive: true,
        });
      } else {
        await api.post('/api/v1/penalty-configs', {
          vehicleType:   form.vehicleType,
          exceptionType: form.exceptionType,
          penaltyAmount: Number(form.penaltyAmount),
          description:   form.description,
        });
      }
      setShowModal(false);
      fetchPenalties();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu cấu hình phí phạt.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Vô hiệu hóa mức phí phạt này?')) return;
    try {
      await api.delete(`/api/v1/penalty-configs/${id}`);
      fetchPenalties();
    } catch { alert('Không thể xóa cấu hình này.'); }
  };

  const inputSt = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-input)',
    border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  };

  const activePenalties = penalties.filter(p => p.isActive);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            🚨 Phí Phạt Ngoại Lệ
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mức phí phạt được áp dụng tự động khi nhân viên xử lý ngoại lệ (mất vé, sai khu vực, ra không trả)
          </p>
        </div>
        <button className="btn-sm btn-sm-primary" onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Thêm mức phạt
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>Đang tải...</p>
      ) : activePenalties.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 12 }}>
          <AlertTriangle size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có cấu hình phí phạt</p>
          <p style={{ fontSize: '0.82rem' }}>Thêm mức phạt để nhân viên tự động nhận đề xuất khi xử lý ngoại lệ</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại xe</th>
                <th>Loại ngoại lệ</th>
                <th>Mức phí phạt</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {activePenalties.map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                      background: p.exceptionType === 'WRONG_SPOT' || p.exceptionType === 'OVERSTAY' ? 'rgba(139,92,246,0.12)' : (p.vehicleType === 'CAR' ? 'rgba(59,130,246,0.12)' : p.vehicleType === 'MOTORBIKE' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'),
                      color: p.exceptionType === 'WRONG_SPOT' || p.exceptionType === 'OVERSTAY' ? '#8b5cf6' : (p.vehicleType === 'CAR' ? '#3b82f6' : p.vehicleType === 'MOTORBIKE' ? '#10b981' : '#f59e0b'),
                    }}>
                      {VEHICLE_TYPE_LABELS[p.vehicleType] || p.vehicleType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{EXCEPTION_TYPE_LABELS[p.exceptionType] || p.exceptionType}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>
                      ₫{Number(p.penaltyAmount).toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.description || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-sm btn-sm-secondary" onClick={() => openEdit(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <Edit2 size={13} /> Sửa
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer',
                          fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo / sửa phí phạt */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh sửa mức phí phạt' : 'Thêm mức phí phạt'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!editingId && (
                <>
                  <div className="form-group">
                    <label className="form-label">Loại xe</label>
                    <select style={inputSt} value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                      {VEHICLE_TYPES.map(v => (
                        <option key={v} value={v}>{VEHICLE_TYPE_LABELS[v]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Loại ngoại lệ</label>
                    <select style={inputSt} value={form.exceptionType} onChange={e => setForm(f => ({ ...f, exceptionType: e.target.value }))}>
                      {EXCEPTION_TYPES.map(et => (
                        <option key={et} value={et}>{EXCEPTION_TYPE_LABELS[et]}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      ⚠️ Nếu đã tồn tại mức phạt cho tổ hợp này, sẽ tự động cập nhật.
                    </p>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Mức phí phạt (VNĐ)</label>
                <input style={inputSt} type="number" min="0" value={form.penaltyAmount}
                  onChange={e => setForm(f => ({ ...f, penaltyAmount: e.target.value }))}
                  placeholder="VD: 50000" />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả (tùy chọn)</label>
                <input style={inputSt} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="VD: Phí mất vé xe ô tô" />
              </div>

              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu mức phạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Pricing Component ─────────────────────────────────────────── */
export default function Pricing() {
  const store = useParkingStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    name: '', vehicleType: 'Car', ticketType: 'Hourly',
    rate: '', minFee: '', maxDaily: '',
    peakStart: '', peakEnd: '', peakMult: ''
  };
  const [form, setForm] = useState(initialForm);

  const stats = [
    { label: 'Chính sách đang áp dụng', value: store.pricingConfigs.filter(p => p.active).length, icon: Shield, color: '#10b981' },
    { label: 'Tổng chính sách', value: store.pricingConfigs.length, icon: Settings, color: '#3b82f6' },
    { label: 'Giá cơ bản Ô tô', value: '₫20.000/giờ', icon: DollarSign, color: '#f59e0b' },
    { label: 'Giờ cao điểm', value: '07:00 - 09:00', icon: Clock, color: '#8b5cf6' },
  ];

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, vehicleType: p.vehicleType, ticketType: p.ticketType,
      rate: p.rate || '', minFee: p.minFee || '', maxDaily: p.maxDaily || '',
      peakStart: p.peakStart || '', peakEnd: p.peakEnd || '', peakMult: p.peakMult || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const config = {
      name: form.name, vehicleType: form.vehicleType, ticketType: form.ticketType,
      rate: Number(form.rate), minFee: Number(form.minFee) || 0, maxDaily: Number(form.maxDaily) || 0,
      peakStart: form.peakStart, peakEnd: form.peakEnd, peakMult: Number(form.peakMult) || 0
    };
    if (editingId) store.updatePricing(editingId, config);
    else store.addPricing(config);
    setShowModal(false);
  };

  const inputSt = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-input)',
    border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none'
  };

  return (
    <div className="page-full-width">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Bảng Giá &amp; Chính Sách</h2>
          <p>Cấu hình mức phí gửi xe, phí phạt ngoại lệ và các chính sách vận hành</p>
        </div>
        <button className="btn-sm btn-sm-primary"
          style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> Tạo chính sách mới
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
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

      {/* Bảng giá cơ bản */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 14 }}>
          💰 Giá Đỗ Xe Cơ Bản
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên chính sách</th>
              <th>Loại xe</th>
              <th>Giá cơ bản</th>
              <th>Phí tối đa/ngày</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {store.pricingConfigs.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{VEHICLE_TYPE_LABELS[(p.vehicleType || '').toUpperCase()] || p.vehicleType}</td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₫{p.rate.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(p.ticketType || '').toUpperCase() === 'HOURLY' ? ' /giờ' : (p.ticketType || '').toUpperCase() === 'DAILY' ? ' /ngày' : ' /tháng'}
                  </span>
                </td>
                <td>{p.maxDaily ? `₫${p.maxDaily.toLocaleString()}` : '—'}</td>
                <td>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={p.active} onChange={() => store.togglePricing(p.id)} />
                    <span className="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <button className="btn-sm btn-sm-secondary" onClick={() => handleEdit(p)}>Chỉnh sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Section Phí Phạt ── */}
      <PenaltySection />

      {/* Quy tắc kinh doanh */}
      <div className="rules-section">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Quy tắc hiện hành</h4>
        <div className="rules-grid">
          {[
            { code: 'QT-10', title: 'Giá cơ bản Ô tô', desc: 'Ô tô tính phí 20.000 VNĐ/giờ, tối thiểu 1 giờ.' },
            { code: 'QT-11', title: 'Giá cơ bản Xe máy', desc: 'Xe máy tính phí 5.000 VNĐ/giờ, tối thiểu 4 giờ đầu.' },
            { code: 'QT-12', title: 'Phụ phí qua đêm', desc: 'Xe đỗ từ 22:00 đến 06:00 phụ thu thêm 50.000 VNĐ.' },
            { code: 'QT-13', title: 'Mất vé', desc: 'Phí phạt mất vé theo cấu hình trong bảng "Phí Phạt Ngoại Lệ" bên trên.' },
            { code: 'QT-14', title: 'Sai khu vực', desc: 'Phí phạt sai khu vực theo cấu hình trong bảng "Phí Phạt Ngoại Lệ" bên trên.' },
            { code: 'QT-15', title: 'Quá giờ', desc: 'Tính thêm phí theo giờ thực tế (không hệ số nhân). Nhân viên xử lý trực tiếp.' },
          ].map((r, i) => (
            <div key={i} className="rule-card">
              <div className="rule-card-title"><span className="rule-code">{r.code}</span>{r.title}</div>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tạo / Chỉnh sửa Giá Cơ Bản */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Tên chính sách</label>
                <input style={inputSt} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="VD: Ô tô theo giờ cao cấp" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Loại xe</label>
                <select style={inputSt} value={form.vehicleType} onChange={e => setForm(p => ({...p, vehicleType: e.target.value}))}>
                  <option value="Car">Ô tô (Car)</option>
                  <option value="Motorbike">Xe máy (Motorbike)</option>
                  <option value="Truck">Xe tải (Truck)</option>
                  <option value="Bicycle">Xe đạp (Bicycle)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Loại vé</label>
                <select style={inputSt} value={form.ticketType} onChange={e => setForm(p => ({...p, ticketType: e.target.value}))}>
                  <option value="Hourly">Theo giờ (Hourly)</option>
                  <option value="Daily">Theo ngày (Daily)</option>
                  <option value="Monthly">Theo tháng (Monthly)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Giá cơ bản (VNĐ/giờ)</label>
                <input style={inputSt} type="number" value={form.rate} onChange={e => setForm(p => ({...p, rate: e.target.value}))} placeholder="VD: 20000" />
              </div>
              <div className="form-group">
                <label className="form-label">Phí tối thiểu (VNĐ)</label>
                <input style={inputSt} type="number" value={form.minFee} onChange={e => setForm(p => ({...p, minFee: e.target.value}))} placeholder="VD: 20000" />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Phí tối đa mỗi ngày (VNĐ)</label>
                <input style={inputSt} type="number" value={form.maxDaily} onChange={e => setForm(p => ({...p, maxDaily: e.target.value}))} placeholder="Bỏ trống nếu không giới hạn" />
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '16px', marginBottom: '12px' }}>Giờ cao điểm (Không bắt buộc)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Giờ bắt đầu</label>
                <input style={inputSt} type="time" value={form.peakStart} onChange={e => setForm(p => ({...p, peakStart: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Giờ kết thúc</label>
                <input style={inputSt} type="time" value={form.peakEnd} onChange={e => setForm(p => ({...p, peakEnd: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hệ số nhân</label>
                <input style={inputSt} type="number" step="0.1" value={form.peakMult} onChange={e => setForm(p => ({...p, peakMult: e.target.value}))} placeholder="VD: 1.5" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleSave}><span>Lưu chính sách</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
