import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Grid3x3, List, Car, Bike, AlertTriangle, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { compareSlotCodes } from '../../utils/slotHelper';

const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'TRUCK'];
const MAINTENANCE_STATUS = ['AVAILABLE', 'MAINTENANCE'];

const vehicleTypeLabel = (t) => ({ MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' }[t] || t);
const vehicleTypeIcon = (t) => ({ MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' }[t] || '🚗');
const statusLabel = (s) => ({ AVAILABLE: 'Trống', MAINTENANCE: 'Bảo trì' }[s] || s);
const statusColor = (s) => ({
  AVAILABLE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  MAINTENANCE: { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' },
}[s] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' });

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

/* ─── Grid slot cell ────────────────────────────────────────── */
function SlotCell({ slot, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const hasVehicle = !!slot.currentSessionId;
  const isMaintenance = slot.maintenanceStatus === 'MAINTENANCE';

  let bg, border, textColor, label;
  if (isMaintenance) {
    bg = 'rgba(100,116,139,0.15)'; border = 'rgba(100,116,139,0.4)'; textColor = '#94a3b8'; label = '🔧';
  } else if (hasVehicle) {
    bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.4)'; textColor = '#ef4444'; label = vehicleTypeIcon(slot.vehicleType);
  } else {
    bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.35)'; textColor = '#10b981'; label = vehicleTypeIcon(slot.vehicleType);
  }

  return (
    <div
      title={`${slot.slotCode} — ${hasVehicle ? 'Đang có xe' : isMaintenance ? 'Bảo trì' : 'Trống'}${slot.licensePlate ? ' | ' + slot.licensePlate : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? (isMaintenance ? 'rgba(100,116,139,0.25)' : hasVehicle ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.2)') : bg,
        border: `1.5px solid ${border}`,
        borderRadius: 8, padding: '6px 4px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s', minHeight: 68,
        boxShadow: hovered ? `0 4px 12px ${border}` : 'none',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
      }}>
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, fontFamily: 'monospace', color: textColor, marginTop: 4, textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2 }}>
        {slot.slotCode}
      </span>
      {hasVehicle && slot.licensePlate && (
        <span style={{ fontSize: '0.55rem', color: '#f97316', fontWeight: 700, marginTop: 2 }}>{slot.licensePlate}</span>
      )}
      {/* Hover action buttons */}
      {hovered && (
        <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3, zIndex: 10 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(slot); }}
            style={{ background: '#3b82f6', border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Edit2 size={10} color="#fff" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(slot); }}
            style={{ background: '#ef4444', border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={10} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManageParkingSlots() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneIdFromUrl = searchParams.get('zoneId') || '';

  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState(zoneIdFromUrl);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ zoneId: zoneIdFromUrl, slotCode: '', vehicleType: 'CAR', maintenanceStatus: 'AVAILABLE' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, slotCode }

  // Bulk Create State
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkForm, setBulkForm] = useState({ zoneId: '', vehicleType: 'CAR', prefix: '', startNum: 1, endNum: 10, maintenanceStatus: 'AVAILABLE' });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setFilterZone(zoneIdFromUrl);
    if (zoneIdFromUrl) setForm(f => ({ ...f, zoneId: zoneIdFromUrl }));
  }, [zoneIdFromUrl]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsRes, zonesRes] = await Promise.all([
        api.get('/api/v1/parking-slots'),
        api.get('/api/v1/zones')
      ]);
      const slotsData = slotsRes.data.data ?? slotsRes.data ?? [];
      const zonesData = zonesRes.data.data ?? zonesRes.data ?? [];
      const sortedSlots = Array.isArray(slotsData) ? [...slotsData].sort(compareSlotCodes) : [];
      setSlots(sortedSlots);
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
    if (!form.zoneId || !form.slotCode || !form.vehicleType) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    setSubmitting(true);
    try {
      const selectedZone = zones.find(z => z.id === form.zoneId);
      const payload = { zoneId: form.zoneId, floorId: selectedZone?.floorId, slotCode: form.slotCode, vehicleType: form.vehicleType, maintenanceStatus: form.maintenanceStatus };
      if (editingId) { await api.put(`/api/v1/parking-slots/${editingId}`, payload); }
      else { await api.post('/api/v1/parking-slots', payload); }
      setShowForm(false); setEditingId(null); setForm({ zoneId: zoneIdFromUrl, slotCode: '', vehicleType: 'CAR', maintenanceStatus: 'AVAILABLE' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu chỗ đỗ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (slot) => {
    setForm({ zoneId: slot.zoneId || '', slotCode: slot.slotCode || '', vehicleType: slot.vehicleType || 'CAR', maintenanceStatus: slot.maintenanceStatus || 'AVAILABLE' });
    setEditingId(slot.id); setShowForm(true); setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/parking-slots/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa chỗ đỗ');
      setDeleteTarget(null);
    }
  };

  const handleReset = () => { setShowForm(false); setEditingId(null); setForm({ zoneId: zoneIdFromUrl, slotCode: '', vehicleType: 'CAR', maintenanceStatus: 'AVAILABLE' }); setError(''); };

  const getZoneName = (zoneId) => { const zone = zones.find(z => z.id === zoneId); return zone ? zone.name : '—'; };

  const generateSlotCodes = () => {
    const codes = [];
    const start = parseInt(bulkForm.startNum) || 1;
    const end = parseInt(bulkForm.endNum) || 1;
    const prefix = bulkForm.prefix.toUpperCase();
    const padLen = end >= 100 ? 3 : 2;
    for (let i = start; i <= end; i++) codes.push(`${prefix}${String(i).padStart(padLen, '0')}`);
    return codes;
  };

  const handleBulkSubmit = async () => {
    if (!bulkForm.zoneId) { setBulkResult({ type: 'error', text: 'Vui lòng chọn khu vực' }); return; }
    if (!bulkForm.prefix.trim()) { setBulkResult({ type: 'error', text: 'Vui lòng nhập tiền tố mã chỗ đỗ' }); return; }
    const start = parseInt(bulkForm.startNum) || 0, end = parseInt(bulkForm.endNum) || 0;
    if (start > end || start < 0) { setBulkResult({ type: 'error', text: 'Số bắt đầu phải nhỏ hơn hoặc bằng số kết thúc' }); return; }
    if (end - start + 1 > 200) { setBulkResult({ type: 'error', text: 'Tối đa 200 chỗ đỗ mỗi lần tạo' }); return; }
    const slotCodes = generateSlotCodes();
    const selectedZone = zones.find(z => z.id === bulkForm.zoneId);
    setBulkSubmitting(true); setBulkResult(null);
    try {
      await api.post('/api/v1/parking-slots/bulk', { zoneId: bulkForm.zoneId, floorId: selectedZone?.floorId, vehicleType: bulkForm.vehicleType, slotCodes, maintenanceStatus: bulkForm.maintenanceStatus });
      setBulkResult({ type: 'success', text: `Đã tạo thành công ${slotCodes.length} chỗ đỗ!`, count: slotCodes.length });
      await loadData();
      setTimeout(() => { setShowBulkForm(false); setBulkResult(null); setBulkForm({ zoneId: '', vehicleType: 'CAR', prefix: '', startNum: 1, endNum: 10, maintenanceStatus: 'AVAILABLE' }); }, 2000);
    } catch (err) {
      setBulkResult({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Lỗi khi tạo hàng loạt chỗ đỗ' });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const filteredSlots = slots.filter(slot => {
    const matchSearch = !searchTerm || slot.slotCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchZone = !filterZone || slot.zoneId === filterZone;
    const matchStatus = !filterStatus || slot.maintenanceStatus === filterStatus;
    return matchSearch && matchZone && matchStatus;
  }).sort(compareSlotCodes);

  // Stats
  const available = slots.filter(s => s.maintenanceStatus === 'AVAILABLE' && !s.currentSessionId).length;
  const occupied = slots.filter(s => !!s.currentSessionId).length;
  const maintenance = slots.filter(s => s.maintenanceStatus === 'MAINTENANCE').length;
  const occupancyPct = slots.length > 0 ? Math.round((occupied / slots.length) * 100) : 0;

  const stats = [
    { label: 'Tổng số Chỗ đỗ', value: slots.length, color: '#3b82f6', icon: Grid3x3, pct: null },
    { label: 'Đang có xe', value: occupied, color: '#ef4444', icon: Car, pct: occupancyPct },
    { label: 'Trống', value: available, color: '#10b981', icon: CheckCircle2, pct: null },
    { label: 'Bảo trì', value: maintenance, color: '#94a3b8', icon: AlertTriangle, pct: null },
  ];

  // For grid: group by zone
  const slotsByZone = filteredSlots.reduce((acc, slot) => {
    const key = slot.zoneId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const currentZone = zones.find(z => z.id === zoneIdFromUrl);

  return (
    <div className="page-full-width">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => navigate('/PARKING_MANAGER/floors')}>Quản lý Tầng</span>
        <ChevronRight size={14} />
        <span style={{ cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => navigate('/PARKING_MANAGER/zones')}>Khu vực</span>
        {currentZone && <><ChevronRight size={14} /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentZone.name}</span></>}
        {!currentZone && <><ChevronRight size={14} /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Tất cả Chỗ đỗ</span></>}
      </div>

      {/* Header + action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>🅿️ Quản lý Chỗ đỗ</h2>
          <p>Tạo, sửa, xóa và quản lý trạng thái từng ô đỗ xe</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: 3, border: '1px solid var(--border-color)' }}>
            <button onClick={() => setViewMode('table')}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none' }}>
              <List size={14} /> Bảng
            </button>
            <button onClick={() => setViewMode('grid')}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none' }}>
              <Grid3x3 size={14} /> Sơ đồ
            </button>
          </div>
          <button className="btn-primary" onClick={() => { setShowBulkForm(true); setBulkResult(null); }}
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', whiteSpace: 'nowrap' }}>
            <Layers size={15} /> Tạo hàng loạt
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> Thêm chỗ đỗ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-card-value">{s.value}</div>
              {s.pct !== null && s.pct !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: s.pct > 80 ? '#ef4444' : s.pct > 60 ? '#f59e0b' : '#10b981', borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.pct}% lấp đầy</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid legend (when grid view) */}
      {viewMode === 'grid' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Chú giải:</span>
          {[
            { color: '#10b981', label: 'Trống (sẵn sàng)' },
            { color: '#ef4444', label: 'Đang có xe' },
            { color: '#94a3b8', label: 'Bảo trì' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, opacity: 0.8 }} />
              {l.label}
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-input" placeholder="Tìm theo mã chỗ đỗ..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, width: '100%', padding: '8px 12px 8px 36px' }} />
        </div>
        <select className="form-select" value={filterZone}
          onChange={e => { setFilterZone(e.target.value); setSearchParams(e.target.value ? { zoneId: e.target.value } : {}); }}
          style={{ minWidth: 160, padding: '8px 12px' }}>
          <option value="">Tất cả khu vực</option>
          {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
        </select>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 140, padding: '8px 12px' }}>
          <option value="">Tất cả trạng thái</option>
          {MAINTENANCE_STATUS.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filteredSlots.length}/{slots.length} chỗ</span>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>🅿️</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Chưa có chỗ đỗ nào</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}><Plus size={16} /> Tạo chỗ đỗ đầu tiên</button>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy chỗ đỗ phù hợp với bộ lọc này</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ═══ TABLE VIEW ═══ */
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
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{slot.slotCode}</td>
                    <td>{slot.zoneName || getZoneName(slot.zoneId)}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', background: slot.vehicleType === 'CAR' ? 'rgba(16,185,129,0.1)' : slot.vehicleType === 'MOTORBIKE' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)', color: slot.vehicleType === 'CAR' ? '#10b981' : slot.vehicleType === 'MOTORBIKE' ? '#8b5cf6' : '#f59e0b', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
                        {vehicleTypeIcon(slot.vehicleType)} {vehicleTypeLabel(slot.vehicleType)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.8rem', background: stColor.bg, color: stColor.color, padding: '4px 10px', borderRadius: '8px', fontWeight: 600, width: 'fit-content' }}>
                          {statusLabel(slot.maintenanceStatus)}
                        </span>
                        {hasActiveSession && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, width: 'fit-content' }}>
                            🚗 Đang có xe {slot.licensePlate ? `— ${slot.licensePlate}` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn-sm btn-sm-primary" onClick={() => handleEdit(slot)} style={{ padding: '6px' }} title="Chỉnh sửa"><Edit2 size={15} /></button>
                        <button className="btn-sm" onClick={() => setDeleteTarget({ id: slot.id, slotCode: slot.slotCode })}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px' }} title="Xóa"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ═══ GRID VIEW ═══ */
        <div>
          {Object.keys(slotsByZone)
            .sort((a, b) => (zones.find(z => z.id === a)?.name || '').localeCompare(zones.find(z => z.id === b)?.name || '', undefined, { numeric: true, sensitivity: 'base' }))
            .map(zoneId => {
              const zoneSlots = [...slotsByZone[zoneId]].sort(compareSlotCodes);
              const zone = zones.find(z => z.id === zoneId);
            const zoneAvail = zoneSlots.filter(s => s.maintenanceStatus === 'AVAILABLE' && !s.currentSessionId).length;
            const zoneOcc = zoneSlots.filter(s => !!s.currentSessionId).length;
            return (
              <div key={zoneId} className="card" style={{ marginBottom: 20, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      📍 {zone?.name || 'Khu vực không xác định'}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {zoneSlots.length} chỗ — {zoneAvail} trống, {zoneOcc} đang dùng
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 10px', borderRadius: 6, fontWeight: 600 }}>✓ {zoneAvail}</span>
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 10px', borderRadius: 6, fontWeight: 600 }}>🚗 {zoneOcc}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
                  {zoneSlots.map(slot => (
                    <SlotCell key={slot.id} slot={slot} onEdit={handleEdit} onDelete={(s) => setDeleteTarget({ id: s.id, slotCode: s.slotCode })} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleReset}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingId ? 'Chỉnh sửa chỗ đỗ' : 'Thêm chỗ đỗ mới'}</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Khu vực <span className="required">*</span></label>
              <select className="form-select" value={form.zoneId} onChange={e => setForm({ ...form, zoneId: e.target.value })} style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn khu vực --</option>
                {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name} ({vehicleTypeLabel(zone.vehicleType)})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Mã chỗ đỗ <span className="required">*</span></label>
              <input type="text" className="form-input" placeholder="VD: A-001, B1-05..."
                value={form.slotCode} onChange={e => setForm({ ...form, slotCode: e.target.value.toUpperCase() })} style={{ padding: '12px 14px' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select className="form-select" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} style={{ padding: '12px 14px' }}>
                {VEHICLE_TYPES.map(type => <option key={type} value={type}>{vehicleTypeLabel(type)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Trạng thái <span className="required">*</span></label>
              <select className="form-select" value={form.maintenanceStatus} onChange={e => setForm({ ...form, maintenanceStatus: e.target.value })} style={{ padding: '12px 14px' }}>
                {MAINTENANCE_STATUS.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 16 }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={handleReset}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật Chỗ đỗ' : 'Thêm Chỗ đỗ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkForm && (
        <div className="modal-overlay" onClick={() => { setShowBulkForm(false); setBulkResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={22} style={{ color: '#8b5cf6' }} /> Tạo hàng loạt Chỗ đỗ
              </h3>
              <button onClick={() => { setShowBulkForm(false); setBulkResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {bulkResult && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: bulkResult.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${bulkResult.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: bulkResult.type === 'success' ? '#10b981' : '#ef4444' }}>
                {bulkResult.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {bulkResult.text}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Khu vực <span className="required">*</span></label>
              <select className="form-select" value={bulkForm.zoneId} onChange={e => setBulkForm({ ...bulkForm, zoneId: e.target.value })} style={{ padding: '12px 14px' }}>
                <option value="">-- Chọn khu vực --</option>
                {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name} ({vehicleTypeLabel(zone.vehicleType)})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Loại xe <span className="required">*</span></label>
              <select className="form-select" value={bulkForm.vehicleType} onChange={e => setBulkForm({ ...bulkForm, vehicleType: e.target.value })} style={{ padding: '12px 14px' }}>
                {VEHICLE_TYPES.map(type => <option key={type} value={type}>{vehicleTypeLabel(type)}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: 16 }}>
              <div><label className="form-label">Tiền tố mã <span className="required">*</span></label><input type="text" className="form-input" placeholder="VD: A-, B1-" value={bulkForm.prefix} onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })} style={{ padding: '12px 14px' }} /></div>
              <div><label className="form-label">Số bắt đầu</label><input type="number" className="form-input" min="0" value={bulkForm.startNum} onChange={e => setBulkForm({ ...bulkForm, startNum: e.target.value })} style={{ padding: '12px 14px' }} /></div>
              <div><label className="form-label">Số kết thúc</label><input type="number" className="form-input" min="0" value={bulkForm.endNum} onChange={e => setBulkForm({ ...bulkForm, endNum: e.target.value })} style={{ padding: '12px 14px' }} /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Trạng thái ban đầu</label>
              <select className="form-select" value={bulkForm.maintenanceStatus} onChange={e => setBulkForm({ ...bulkForm, maintenanceStatus: e.target.value })} style={{ padding: '12px 14px' }}>
                {MAINTENANCE_STATUS.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Xem trước mã chỗ đỗ sẽ được tạo:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                {bulkForm.prefix ? generateSlotCodes().slice(0, 30).map(code => (
                  <span key={code} style={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)' }}>{code}</span>
                )) : <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nhập tiền tố để xem trước...</span>}
                {bulkForm.prefix && generateSlotCodes().length > 30 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '3px 8px' }}>... và {generateSlotCodes().length - 30} mã nữa</span>}
              </div>
              {bulkForm.prefix && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>Tổng cộng: <strong style={{ color: '#8b5cf6' }}>{generateSlotCodes().length}</strong> chỗ đỗ</p>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '10px 20px' }} onClick={() => { setShowBulkForm(false); setBulkResult(null); }}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleBulkSubmit} disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Đang tạo...' : <><Layers size={16} /> Tạo hàng loạt</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Xóa chỗ đỗ "${deleteTarget?.slotCode}"?`}
        description="Hành động này không thể hoàn tác. Không thể xóa nếu chỗ đỗ đang có xe hoặc có phiên gửi xe đang hoạt động."
        confirmLabel="Xóa chỗ đỗ"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
