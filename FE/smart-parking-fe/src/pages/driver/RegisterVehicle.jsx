import { useState } from 'react';
import api from '../../services/api';

const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', label: 'Xe máy', icon: '🏍️' },
  { id: 'CAR',       label: 'Ô tô',   icon: '🚗' },
  { id: 'TRUCK',     label: 'Xe tải', icon: '🚛' },
];

export default function RegisterVehicle() {
  const [plate,       setPlate]       = useState('');
  const [type,        setType]        = useState('MOTORBIKE');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(null);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    if (!plate.trim()) { setError('Vui lòng nhập biển số'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/v1/vehicles', {
        licensePlate: plate.trim().toUpperCase(),
        vehicleType: type,
        hasMonthlyPass: false,
      });
      setSuccess(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Thử lại.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="page-full">
      <div className="page-header"><h2>🚗 Đăng ký xe</h2></div>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 40 }}>
        <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Đăng ký xe thành công!</h3>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20, textAlign: 'left' }}>
          {[
            { label: 'Biển số',  value: success.licensePlate },
            { label: 'Loại xe', value: success.vehicleType  },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => { setSuccess(null); setPlate(''); }}>
          ➕ Đăng ký xe khác
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🚗 Đăng ký xe</h2>
        <p>Thêm xe của bạn vào hệ thống</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Biển số xe <span className="required">*</span></label>
            <div className="form-input-wrapper">
              <input type="text" className="form-input"
                placeholder="VD: 51G-12345"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Format: 51G-12345 hoặc 30AB-9999
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Loại xe <span className="required">*</span></label>
            <div className="vehicle-type-grid">
              {VEHICLE_TYPES.map(v => (
                <div key={v.id}
                  className={`vehicle-type-card ${type === v.id ? 'selected' : ''}`}
                  onClick={() => setType(v.id)}>
                  <span style={{ fontSize: 28 }}>{v.icon}</span>
                  <span className="vehicle-name">{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            <span>{loading ? 'Đang đăng ký...' : '🚗 Đăng ký xe'}</span>
          </button>
        </div>

        <div className="right-sidebar">
          <div className="card">
            <div className="card-title">ℹ️ Hướng dẫn</div>
            <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 2 }}>
              <li>Nhập biển số đúng format</li>
              <li>Chọn loại xe</li>
              <li>Bấm đăng ký</li>
            </ol>
          </div>
          <div className="card" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 8 }}>✅ Sau khi đăng ký</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Xe sẽ được lưu vào hệ thống và Staff có thể check-in xe khi vào bãi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
