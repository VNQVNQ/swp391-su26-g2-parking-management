import { useState, useMemo } from 'react';
import api from '../../services/api';
import { Car, Bike, Truck, CheckCircle2, AlertCircle, Clock, ChevronRight, Check, ArrowRight } from 'lucide-react';

const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', label: 'Xe máy', icon: <Bike size={32} strokeWidth={1.5} />, price: '5.000đ/lượt' },
  { id: 'CAR',       label: 'Ô tô',   icon: <Car size={32} strokeWidth={1.5} />, price: '15.000đ/lượt' },
  { id: 'TRUCK',     label: 'Xe tải', icon: <Truck size={32} strokeWidth={1.5} />, price: '30.000đ/lượt' },
];

export default function RegisterVehicle() {
  const [plate,       setPlate]       = useState('');
  const [type,        setType]        = useState('MOTORBIKE');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(null);
  const [error,       setError]       = useState('');
  
  // Strict Real-time validation
  const plateRegex = /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3}\.?[0-9]{2}$/;
  const isPlateValid = useMemo(() => {
    if (!plate) return null; // haven't typed yet
    return plateRegex.test(plate.trim().toUpperCase());
  }, [plate]);

  const handleSubmit = async () => {
    if (!isPlateValid) { setError('Vui lòng nhập biển số đúng định dạng hệ thống (VD: 29A-123.45)'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/v1/vehicles', {
        licensePlate: plate.trim().toUpperCase(),
        vehicleType: type,
        hasMonthlyPass: false,
      });
      setSuccess(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally { setLoading(false); }
  };

  const selectedVehicleData = VEHICLE_TYPES.find(v => v.id === type);

  if (success) return (
    <div className="saas-container fade-in">
      <div className="saas-success-card">
        <div className="success-icon-wrapper">
          <span className="celebration-emoji">🎉</span>
        </div>
        <h2 className="success-title">Đăng ký thành công!</h2>
        <p className="success-subtitle">Xe đã được thêm vào hệ thống và sẵn sàng sử dụng.</p>
        
        <div className="success-details">
          <div className="detail-row">
            <span>Biển số xe</span>
            <strong>{success.licensePlate}</strong>
          </div>
          <div className="detail-row">
            <span>Loại phương tiện</span>
            <strong>{selectedVehicleData?.label}</strong>
          </div>
          <div className="detail-row">
            <span>Trạng thái</span>
            <strong style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> Đã kích hoạt
            </strong>
          </div>
        </div>

        <button className="saas-btn-primary" style={{ width: '100%', height: 56, marginTop: 16 }} onClick={() => { setSuccess(null); setPlate(''); setError(''); setType('MOTORBIKE'); }}>
          <span className="btn-content">Đăng ký xe khác <ArrowRight size={18} /></span>
        </button>
      </div>
      <style>{saasStyles}</style>
    </div>
  );

  return (
    <div className="saas-page fade-in">
      <div className="saas-container">
        
        {/* ── HEADER ── */}
        <div className="saas-header">
          <div className="header-left">
            <h1 className="header-title">🚗 Đăng ký xe</h1>
            <p className="header-subtitle">Đăng ký phương tiện để sử dụng hệ thống bãi xe thông minh.</p>
          </div>
          <div className="header-right">
            <div className="time-badge">
              <Clock size={16} />
              <span>Estimated 30 seconds</span>
            </div>
          </div>
        </div>

        {/* ── LAYOUT ── */}
        <div className="saas-layout">
          
          {/* LEFT: FORM */}
          <div className="saas-card form-section">
            <div className="form-group">
              <label className="saas-label">Biển số xe</label>
              <div className={`saas-input-wrapper ${isPlateValid === true ? 'valid' : isPlateValid === false ? 'invalid' : ''}`}>
                <div className="input-prefix">🚗</div>
                <input 
                  type="text" 
                  className="saas-input"
                  placeholder="VD: 51G-123.45"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())} 
                  autoFocus
                />
                {isPlateValid === true && <CheckCircle2 className="validation-icon success" size={20} />}
                {isPlateValid === false && <AlertCircle className="validation-icon error" size={20} />}
              </div>
              
              {/* Validation Messages */}
              <div className="validation-msg-container">
                {isPlateValid === null && (
                  <p className="validation-hint">✓ Format chuẩn: 29A-123.45 hoặc 59F2-67890</p>
                )}
                {isPlateValid === true && (
                  <p className="validation-msg success">✓ Biển số hợp lệ</p>
                )}
                {isPlateValid === false && (
                  <p className="validation-msg error">❌ Biển số không đúng định dạng</p>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 32 }}>
              <label className="saas-label">Loại xe</label>
              <div className="vehicle-type-grid">
                {VEHICLE_TYPES.map(v => {
                  const isSelected = type === v.id;
                  return (
                    <div 
                      key={v.id}
                      className={`saas-vehicle-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setType(v.id)}
                    >
                      {isSelected && (
                        <div className="tick-corner">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                      <div className="vehicle-icon">{v.icon}</div>
                      <div className="vehicle-label">{v.label}</div>
                      <div className="vehicle-price">Chi phí: <br/>{v.price}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="saas-error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button 
              className="saas-btn-primary submit-btn" 
              onClick={handleSubmit} 
              disabled={loading || isPlateValid === false}
            >
              {loading ? (
                <span className="btn-content"><span className="spinner"></span> Đang đăng ký...</span>
              ) : (
                <span className="btn-content">🚗 Đăng ký xe</span>
              )}
            </button>
          </div>

          {/* RIGHT: INFO & PREVIEW */}
          <div className="saas-right-panel">
            {/* Live Preview Card */}
            <div className="saas-card preview-card">
              <h3 className="preview-title">🚗 Xe của bạn</h3>
              <div className="preview-content">
                <div className="preview-row">
                  <span className="preview-label">Biển số:</span>
                  <span className={`preview-value plate ${!plate ? 'empty' : ''}`}>
                    {plate || 'Chưa nhập'}
                  </span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Loại:</span>
                  <span className="preview-value type">
                    {selectedVehicleData?.icon} {selectedVehicleData?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="saas-card info-card">
              <div className="info-section">
                <h4 className="info-heading">✓ Hướng dẫn</h4>
                <ol className="info-list">
                  <li>Nhập chính xác biển số xe theo định dạng của biển số thực.</li>
                  <li>Chọn đúng loại phương tiện để áp dụng bảng giá chính xác.</li>
                  <li>Bấm Đăng ký để hoàn tất việc thêm xe.</li>
                </ol>
              </div>
              
              <div className="info-divider"></div>
              
              <div className="info-section">
                <h4 className="info-heading">✓ Sau khi đăng ký</h4>
                <ul className="info-list no-bullets">
                  <li><CheckCircle2 size={16} /> Xe được lưu an toàn vào hệ thống</li>
                  <li><CheckCircle2 size={16} /> Có thể tự động check-in qua camera</li>
                  <li><CheckCircle2 size={16} /> Có thể xem lịch sử đỗ xe bất cứ lúc nào</li>
                </ul>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* ── STYLES ── */}
      <style>{saasStyles}</style>
    </div>
  );
}

const saasStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .saas-page {
    font-family: 'Inter', sans-serif;
    background-color: #0F172A;
    min-height: calc(100vh - 80px);
    color: #F8FAFC;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
  }

  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .saas-container {
    width: 100%;
    max-width: 1200px;
  }

  /* ── Header ── */
  .saas-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .header-title {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
    background: linear-gradient(to right, #ffffff, #94A3B8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-subtitle {
    font-size: 16px;
    color: #94A3B8;
    margin: 0;
  }

  .time-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 8px 16px;
    border-radius: 100px;
    color: #94A3B8;
    font-size: 14px;
    font-weight: 500;
  }

  /* ── Layout ── */
  .saas-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 32px;
  }

  @media (max-width: 1024px) {
    .saas-layout {
      grid-template-columns: 1fr;
    }
  }

  /* ── Cards ── */
  .saas-card {
    background: #1E293B;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }

  .form-section {
    display: flex;
    flex-direction: column;
  }

  .saas-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #F8FAFC;
  }

  /* ── Input ── */
  .saas-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .saas-input-wrapper:focus-within {
    border-color: #10B981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  }

  .saas-input-wrapper.valid {
    border-color: #10B981;
    background: rgba(16, 185, 129, 0.03);
  }

  .saas-input-wrapper.invalid {
    border-color: #EF4444;
    background: rgba(239, 68, 68, 0.03);
  }

  .input-prefix {
    padding: 0 16px;
    font-size: 20px;
    border-right: 1px solid rgba(255,255,255,0.1);
    color: #94A3B8;
  }

  .saas-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #F8FAFC;
    outline: none;
    letter-spacing: 1px;
  }

  .saas-input::placeholder {
    color: #475569;
    font-weight: 400;
    letter-spacing: normal;
  }

  .validation-icon {
    margin-right: 16px;
  }
  .validation-icon.success { color: #10B981; }
  .validation-icon.error { color: #EF4444; }

  .validation-msg-container {
    margin-top: 8px;
    min-height: 24px;
  }

  .validation-hint {
    font-size: 13px;
    color: #64748B;
    margin: 0;
  }

  .validation-msg {
    font-size: 13px;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .validation-msg.success { color: #10B981; }
  .validation-msg.error { color: #EF4444; }

  /* ── Vehicle Cards ── */
  .vehicle-type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 600px) {
    .vehicle-type-grid {
      grid-template-columns: 1fr;
    }
  }

  .saas-vehicle-card {
    position: relative;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .saas-vehicle-card:hover {
    transform: translateY(-4px);
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255,255,255,0.2);
    box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5);
  }

  .saas-vehicle-card.selected {
    background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.02) 100%);
    border-color: #10B981;
    box-shadow: 0 8px 24px -4px rgba(16, 185, 129, 0.2);
  }

  .tick-corner {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: #10B981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
  }

  .vehicle-icon {
    color: #F8FAFC;
    margin-bottom: 12px;
    display: inline-flex;
  }

  .saas-vehicle-card.selected .vehicle-icon {
    color: #10B981;
  }

  .vehicle-label {
    font-size: 16px;
    font-weight: 600;
    color: #F8FAFC;
    margin-bottom: 8px;
  }

  .vehicle-price {
    font-size: 13px;
    color: #94A3B8;
    line-height: 1.4;
  }

  /* ── Button ── */
  .submit-btn {
    margin-top: 40px;
    width: 100%;
    height: 56px;
  }

  .saas-btn-primary {
    background: linear-gradient(180deg, #00C853 0%, #00A152 100%);
    border: 1px solid #00964b;
    border-radius: 12px;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 161, 82, 0.2), inset 0 1px 0 rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
  }

  .saas-btn-primary:hover:not(:disabled) {
    background: linear-gradient(180deg, #34D399 0%, #10B981 100%);
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
  }

  .saas-btn-primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .saas-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  .btn-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Right Panel ── */
  .saas-right-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .preview-card {
    background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  
  .preview-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 4px;
    background: linear-gradient(90deg, #10B981, #3B82F6);
  }

  .preview-title {
    font-size: 15px;
    font-weight: 600;
    color: #94A3B8;
    margin: 0 0 20px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-label {
    color: #64748B;
    font-size: 14px;
  }

  .preview-value {
    font-weight: 600;
    color: #F8FAFC;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-value.plate {
    font-size: 18px;
    letter-spacing: 1px;
    background: rgba(255,255,255,0.05);
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .preview-value.plate.empty {
    color: #475569;
    font-style: italic;
    letter-spacing: normal;
  }

  .info-card {
    padding: 24px;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-heading {
    font-size: 15px;
    font-weight: 600;
    color: #F8FAFC;
    margin: 0;
  }

  .info-list {
    margin: 0;
    padding-left: 20px;
    color: #94A3B8;
    font-size: 14px;
    line-height: 1.7;
  }

  .info-list.no-bullets {
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-list.no-bullets li {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #cbd5e1;
  }
  
  .info-list.no-bullets li svg {
    color: #10B981;
    flex-shrink: 0;
  }

  .info-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 24px 0;
  }

  /* ── Success Screen ── */
  .saas-success-card {
    background: #1E293B;
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 24px;
    padding: 48px;
    max-width: 520px;
    margin: 80px auto;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(16, 185, 129, 0.1);
    position: relative;
    overflow: hidden;
  }

  .saas-success-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at top center, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  .success-icon-wrapper {
    width: 80px;
    height: 80px;
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid rgba(16, 185, 129, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    position: relative;
    z-index: 1;
  }

  .celebration-emoji {
    font-size: 36px;
    animation: bounce 2s infinite ease-in-out;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .success-title {
    font-size: 28px;
    font-weight: 800;
    color: #F8FAFC;
    margin: 0 0 12px 0;
    position: relative;
    z-index: 1;
  }

  .success-subtitle {
    font-size: 15px;
    color: #94A3B8;
    margin: 0 0 32px 0;
    position: relative;
    z-index: 1;
  }

  .success-details {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    text-align: left;
    position: relative;
    z-index: 1;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .detail-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .detail-row span {
    color: #94A3B8;
    font-size: 14px;
  }

  .detail-row strong {
    color: #F8FAFC;
    font-size: 15px;
  }

  .saas-error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
    padding: 16px;
    color: #FCA5A5;
    font-size: 14px;
    font-weight: 500;
    margin-top: 24px;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
