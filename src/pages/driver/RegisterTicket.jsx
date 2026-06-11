import { useState } from 'react';
import { Ticket, DollarSign } from 'lucide-react';

const PRICES = {
  HOURLY:  { MOTORBIKE: 5_000,   CAR: 20_000,   TRUCK: 40_000   },
  DAILY:   { MOTORBIKE: 30_000,  CAR: 120_000,  TRUCK: 250_000  },
  MONTHLY: { MOTORBIKE: 500_000, CAR: 2_000_000, TRUCK: 4_000_000 },
};

export default function RegisterTicket() {
  const [form, setForm] = useState({ licensePlate: '', vehicleType: 'MOTORBIKE', ticketType: 'HOURLY', ownerName: '' });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  const price = PRICES[form.ticketType]?.[form.vehicleType] ?? 0;

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { setError('Vui lòng nhập biển số xe'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  };

  if (success) return (
    <div className="page-full">
      <div className="page-header"><h2>Đăng ký vé</h2></div>
      <div className="modal-overlay" style={{ position: 'relative', background: 'none', padding: 0 }}>
        <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 40 }}>
          <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Đăng ký vé thành công!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Vé đã được tạo và lưu vào hệ thống</p>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24, textAlign: 'left' }}>
            {[
              { label: 'Biển số',  value: form.licensePlate },
              { label: 'Loại xe', value: form.vehicleType  },
              { label: 'Loại vé', value: form.ticketType   },
              { label: 'Phí',     value: `₫${price.toLocaleString('vi-VN')}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setSuccess(false); setForm({ licensePlate: '', vehicleType: 'MOTORBIKE', ticketType: 'HOURLY', ownerName: '' }); }}>
            <span>➕ Đăng ký vé mới</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🎫 Đăng ký vé</h2>
        <p>Đăng ký vé đỗ xe mới</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Main form */}
        <div className="card">

          {/* Biển số */}
          <div className="form-group">
            <label className="form-label">Biển số xe <span className="required">*</span></label>
            <div className="form-input-wrapper">
              <input type="text" className="form-input"
                placeholder="VD: 51G-123.45"
                value={form.licensePlate}
                onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} />
            </div>
          </div>

          {/* Loại xe */}
          <div className="form-group">
            <label className="form-label">Loại xe <span className="required">*</span></label>
            <div className="vehicle-type-grid">
              {[['MOTORBIKE','🏍️','Xe máy'],['CAR','🚗','Ô tô'],['TRUCK','🚛','Xe tải']].map(([type, icon, label]) => (
                <div key={type}
                  className={`vehicle-type-card ${form.vehicleType === type ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, vehicleType: type })}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <span className="vehicle-name">{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                    ₫{PRICES.HOURLY[type]?.toLocaleString('vi-VN')}/hr
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loại vé */}
          <div className="form-group">
            <label className="form-label">Loại vé <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[['HOURLY','⏱️','Theo giờ'],['DAILY','📅','Theo ngày'],['MONTHLY','📆','Theo tháng']].map(([type, icon, label]) => (
                <div key={type}
                  className={`vehicle-type-card ${form.ticketType === type ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, ticketType: type })}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <span className="vehicle-name">{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                    ₫{PRICES[type]?.[form.vehicleType]?.toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Owner name */}
          <div className="form-group">
            <label className="form-label">Tên chủ xe <span className="optional">(tuỳ chọn)</span></label>
            <div className="form-input-wrapper">
              <input type="text" className="form-input"
                placeholder="Nguyễn Văn A"
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })} />
            </div>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <span>⚠️ {error}</span>
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            <Ticket size={18} />
            <span>{loading ? 'Đang xử lý...' : 'Đăng ký vé'}</span>
          </button>
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar">
          <div className="card">
            <div className="card-title"><DollarSign size={18} /> Tổng phí</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 8 }}>
              ₫{price.toLocaleString('vi-VN')}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{form.ticketType} · {form.vehicleType}</p>
          </div>
          <div className="card">
            <div className="card-title">Hướng dẫn</div>
            <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 2 }}>
              <li>Nhập biển số xe</li>
              <li>Chọn loại xe</li>
              <li>Chọn loại vé</li>
              <li>Xác nhận đăng ký</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
