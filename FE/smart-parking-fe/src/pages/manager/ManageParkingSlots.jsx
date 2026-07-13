import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Grid3x3, Car, Bike, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
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

  // ── Bulk Create State ──
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { type: 'success'|'error', text, count? }
  const [bulkForm, setBulkForm] = useState({
    zoneId: '',
    vehicleType: 'CAR',
    prefix: '',
    startNum: 1,
    endNum: 10,
    maintenanceStatus: 'AVAILABLE'
  });

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

  // ── Bulk Create Handler ──
  const generateSlotCodes = () => {
    const codes = [];
    const start = parseInt(bulkForm.startNum) || 1;
    const end = parseInt(bulkForm.endNum) || 1;
    const prefix = bulkForm.prefix.toUpperCase();
    for (let i = start; i <= end; i++) {
      codes.push(`${prefix}${String(i).padStart(3, '0')}`);
    }
    return codes;
  };

  const handleBulkSubmit = async () => {
    if (!bulkForm.zoneId) { setBulkResult({ type: 'error', text: 'Vui lòng chọn khu vực' }); return; }
    if (!bulkForm.prefix.trim()) { setBulkResult({ type: 'error', text: 'Vui lòng nhập tiền tố mã chỗ đỗ' }); return; }
    const start = parseInt(bulkForm.startNum) || 0;
    const end = parseInt(bulkForm.endNum) || 0;
    if (start > end || start < 0) { setBulkResult({ type: 'error', text: 'Số bắt đầu phải nhỏ hơn hoặc bằng số kết thúc' }); return; }
    if (end - start + 1 > 200) { setBulkResult({ type: 'error', text: 'Tối đa 200 chỗ đỗ mỗi lần tạo' }); return; }

    const slotCodes = generateSlotCodes();
    const selectedZone = zones.find(z => z.id === bulkForm.zoneId);

    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      await api.post('/api/v1/parking-slots/bulk', {
        zoneId: bulkForm.zoneId,
        floorId: selectedZone?.floorId,
        vehicleType: bulkForm.vehicleType,
        slotCodes: slotCodes,
        maintenanceStatus: bulkForm.maintenanceStatus
      });
      setBulkResult({ type: 'success', text: `Đã tạo thành công ${slotCodes.length} chỗ đỗ!`, count: slotCodes.length });
      await loadData();
      setTimeout(() => {
        setShowBulkForm(false);
        setBulkResult(null);
        setBulkForm({ zoneId: '', vehicleType: 'CAR', prefix: '', startNum: 1, endNum: 10, maintenanceStatus: 'AVAILABLE' });
      }, 2000);
    } catch (err) {
      setBulkResult({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Lỗi khi tạo hàng loạt chỗ đỗ' });
    } finally {
      setBulkSubmitting(false);
    }
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => { setShowBulkForm(true); setBulkResult(null); }}
            style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <Layers size={16} /> Tạo hàng loạt
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Thêm chỗ đỗ
          </button>
        </div>
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

      {/* ═══ Bulk Create Modal ═══ */}
      {showBulkForm && (
        <div className="modal-overlay" onClick={() => { setShowBulkForm(false); setBulkResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={22} style={{ color: '#8b5cf6' }} /> Tạo hàng loạt Chỗ đỗ
              </h3>
              <button onClick={() => { setShowBulkForm(false); setBulkResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Result banner */}
            {bulkResult && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: bulkResult.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${bulkResult.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: bulkResult.type === 'success' ? '#10b981' : '#ef4444',
              }}>
                {bulkResult.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {bulkResult.text}
              </div>
            )}

            {/* Zone */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Khu vực <span className="required">*</span></label>
              <select
                className="form-select"
                value={bulkForm.zoneId}
                onChange={e => setBulkForm({ ...bulkForm, zoneId: e.target.value })}
                style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn khu vực --</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({vehicleTypeLabel(zone.vehicleType)})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select
                className="form-select"
                value={bulkForm.vehicleType}
                onChange={e => setBulkForm({ ...bulkForm, vehicleType: e.target.value })}
                style={{ padding: '12px 14px' }}>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{vehicleTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            {/* Prefix + Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: 16 }}>
              <div>
                <label className="form-label">Tiền tố mã <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: A-, B1-"
                  value={bulkForm.prefix}
                  onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })}
                  style={{ padding: '12px 14px' }}
                />
              </div>
              <div>
                <label className="form-label">Số bắt đầu</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={bulkForm.startNum}
                  onChange={e => setBulkForm({ ...bulkForm, startNum: e.target.value })}
                  style={{ padding: '12px 14px' }}
                />
              </div>
              <div>
                <label className="form-label">Số kết thúc</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={bulkForm.endNum}
                  onChange={e => setBulkForm({ ...bulkForm, endNum: e.target.value })}
                  style={{ padding: '12px 14px' }}
                />
              </div>
            </div>

            {/* Maintenance Status */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Trạng thái ban đầu</label>
              <select
                className="form-select"
                value={bulkForm.maintenanceStatus}
                onChange={e => setBulkForm({ ...bulkForm, maintenanceStatus: e.target.value })}
                style={{ padding: '12px 14px' }}>
                {MAINTENANCE_STATUS.map(status => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Xem trước mã chỗ đỗ sẽ được tạo:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                {bulkForm.prefix ? generateSlotCodes().slice(0, 30).map(code => (
                  <span key={code} style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}>{code}</span>
                )) : <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nhập tiền tố để xem trước...</span>}
                {bulkForm.prefix && generateSlotCodes().length > 30 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '3px 8px' }}>
                    ... và {generateSlotCodes().length - 30} mã nữa
                  </span>
                )}
              </div>
              {bulkForm.prefix && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
                  Tổng cộng: <strong style={{ color: '#8b5cf6' }}>{generateSlotCodes().length}</strong> chỗ đỗ
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }}
                onClick={() => { setShowBulkForm(false); setBulkResult(null); }}>
                Hủy
              </button>
              <button
                className="btn-sm btn-sm-primary"
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleBulkSubmit}
                disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Đang tạo...' : <><Layers size={16} /> Tạo hàng loạt</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
