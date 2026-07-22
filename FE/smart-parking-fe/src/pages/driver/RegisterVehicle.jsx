import { useState, useMemo } from 'react';
import api from '../../services/api';
import { createVnPayUrl } from '../../services/vnpayApi';
import { Car, Bike, Truck, CheckCircle2, AlertCircle, Check } from 'lucide-react';

const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', label: 'Xe máy', icon: <Bike size={42} strokeWidth={1.5} />, price: '5.000đ/lượt', feeValue: 5000 },
  { id: 'CAR',       label: 'Ô tô',   icon: <Car size={42} strokeWidth={1.5} />, price: '15.000đ/lượt', feeValue: 15000 },
  { id: 'TRUCK',     label: 'Xe tải', icon: <Truck size={42} strokeWidth={1.5} />, price: '30.000đ/lượt', feeValue: 30000 },
];

export default function RegisterVehicle() {
  const [plate,       setPlate]       = useState('');
  const [type,        setType]        = useState('MOTORBIKE');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(null);
  const [error,       setError]       = useState('');
  
  // Strict Real-time validation
  const plateRegex = /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3}\.?[0-9]{2}$/;
  const isPlateValid = useMemo(() => {
    if (!plate) return null;
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
        paymentMethod
      });
      const newVehicle = res.data.data ?? res.data;
      if (paymentMethod === 'VNPAY') {
        const selectedVehicleData = VEHICLE_TYPES.find(v => v.id === type);
        const paymentUrl = await createVnPayUrl({
          amount: selectedVehicleData?.feeValue || 15000,
          orderInfo: `Thanh toan phi dang ky xe ${plate.trim().toUpperCase()}`,
          orderType: 'billpayment',
          targetId: newVehicle.id,
          targetType: 'VEHICLE'
        });
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
      }
      setSuccess(newVehicle);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally { setLoading(false); }
  };

  const selectedVehicleData = VEHICLE_TYPES.find(v => v.id === type);

  if (success) return (
    <div className="saas-page fade-in">
      <div className="saas-container success-container">
        <div className="saas-success-card">
          <div className="success-icon-wrapper">
            <span className="celebration-emoji">🎉</span>
          </div>
          <h2 className="success-title">Đăng ký thành công!</h2>
          <p className="success-subtitle">Xe đã được đăng kí thành công vào hệ thống</p>
          
          <div className="success-details">
            <div className="detail-row">
              <span>Biển số xe</span>
              <strong className="license-plate-badge">{success.licensePlate}</strong>
            </div>
            <div className="detail-row">
              <span>Loại phương tiện</span>
              <strong style={{ fontWeight: 700 }}>{selectedVehicleData?.label}</strong>
            </div>
            <div className="detail-row">
              <span>Trạng thái</span>
              <strong className="status-badge-success">
                <CheckCircle2 size={16} /> Đã kích hoạt
              </strong>
            </div>
          </div>

          <button 
            type="button"
            className="saas-btn-success-action"
            onClick={() => { setSuccess(null); setPlate(''); setError(''); setType('MOTORBIKE'); }}
          >
            ➕ Đăng ký thêm xe khác
          </button>
        </div>
      </div>
      <style>{saasStyles}</style>
    </div>
  );

  return (
    <div className="saas-page fade-in">
      <div className="saas-container centered-container">
        
        {/* ── HEADER ── */}
        <div className="saas-header centered-header">
          <h1 className="header-title">🚗 Đăng ký phương tiện</h1>
          <p className="header-subtitle">Thêm thông tin xe của bạn để sử dụng hệ thống bãi đỗ & đăng ký vé tháng</p>
        </div>

        {/* ── CENTERED FORM CARD ── */}
        <div className="saas-card form-section centered-card">
          <div className="form-group">
            <label className="saas-label">Biển số xe <span className="req">*</span></label>
            <div className={`saas-input-wrapper ${isPlateValid === true ? 'valid' : isPlateValid === false ? 'invalid' : ''}`}>
              <div className="input-prefix">🚗</div>
              <input 
                type="text" 
                className="saas-input"
                placeholder="VD: 51G-123.45 hoặc 29A-678.90"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())} 
                autoFocus
              />
              {isPlateValid === true && <CheckCircle2 className="validation-icon success" size={24} />}
              {isPlateValid === false && <AlertCircle className="validation-icon error" size={24} />}
            </div>
            
            {/* Validation Messages */}
            <div className="validation-msg-container">
              {isPlateValid === null && (
                <p className="validation-hint">✓ Định dạng chuẩn: 29A-123.45 hoặc 59F2-67890</p>
              )}
              {isPlateValid === true && (
                <p className="validation-msg success"><CheckCircle2 size={16} /> Biển số hợp lệ, sẵn sàng đăng ký</p>
              )}
              {isPlateValid === false && (
                <p className="validation-msg error"><AlertCircle size={16} /> Biển số không đúng định dạng hệ thống</p>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 36 }}>
            <label className="saas-label">Loại phương tiện <span className="req">*</span></label>
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
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                    <div className="vehicle-icon">{v.icon}</div>
                    <div className="vehicle-label">{v.label}</div>
                    <div className="vehicle-price">Chi phí cơ bản: <br/><strong>{v.price}</strong></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 28 }}>
            <label className="saas-label">Phương thức thanh toán phí đăng ký <span className="req">*</span></label>
            <select
              className="saas-input"
              style={{ height: 56, width: '100%', borderRadius: 16, border: '1.5px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0 16px', fontSize: '15.5px', fontWeight: 600 }}
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}>
              <option value="VNPAY">🔥 Cổng thanh toán trực tuyến VNPay (VNPAY-QR / Thẻ ATM / Visa)</option>
              <option value="FREE">✓ Miễn phí đăng ký (Hoặc thanh toán tiền mặt tại bãi)</option>
            </select>
          </div>

          {/* Live Preview Box */}
          <div className="live-preview-box">
            <div className="preview-info-row" style={{ marginBottom: 12 }}>
              <span className="preview-lbl">Xe chuẩn bị đăng ký:</span>
              <span className="preview-val">
                <strong className={plate ? 'val-plate' : 'val-empty'}>{plate || 'CHƯA NHẬP BIỂN SỐ'}</strong>
                <span className="val-type">({selectedVehicleData?.label})</span>
              </span>
            </div>
            <div className="preview-info-row" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 12 }}>
              <span className="preview-lbl">Phí đăng ký ({selectedVehicleData?.label}):</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>
                {selectedVehicleData?.price}
              </span>
            </div>
          </div>

          {error && (
            <div className="saas-error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="button"
            className="saas-btn-primary submit-btn" 
            onClick={handleSubmit} 
            disabled={loading || isPlateValid === false}
          >
            {loading ? (
              <span className="btn-content"><span className="spinner"></span> Đang xử lý đăng ký...</span>
            ) : (
              <span className="btn-content">✓ Hoàn tất đăng ký xe ngay</span>
            )}
          </button>
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
    background: transparent;
    color: var(--text-primary);
    padding: 0;
  }

  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .saas-container.centered-container {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
  }

  .saas-container.success-container {
    width: 100%;
    max-width: 520px;
    margin: 40px auto;
  }

  /* ── Header ── */
  .saas-header.centered-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .header-title {
    font-size: 34px;
    font-weight: 800;
    margin: 0 0 10px 0;
    letter-spacing: -0.6px;
    color: var(--text-primary);
  }

  .header-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }

  /* ── Cards ── */
  .saas-card.centered-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 44px 40px;
    box-shadow: var(--shadow-lg);
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 640px) {
    .saas-card.centered-card {
      padding: 28px 20px;
    }
  }

  .form-section {
    display: flex;
    flex-direction: column;
  }

  .saas-label {
    display: block;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    color: var(--text-primary);
  }

  .req {
    color: #EF4444;
    margin-left: 4px;
  }

  /* ── Input ── */
  .saas-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--bg-input);
    border: 1.5px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    height: 64px;
    transition: all 0.25s ease;
  }

  .saas-input-wrapper:focus-within {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px var(--accent-primary-glow);
  }

  .saas-input-wrapper.valid {
    border-color: var(--accent-green);
    background: rgba(16, 185, 129, 0.05);
  }

  .saas-input-wrapper.invalid {
    border-color: var(--accent-red);
    background: rgba(239, 68, 68, 0.05);
  }

  .input-prefix {
    padding: 0 20px;
    font-size: 26px;
    border-right: 1px solid var(--border-color);
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  .saas-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0 20px;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    outline: none;
    letter-spacing: 1.5px;
  }

  .saas-input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
    font-size: 18px;
    letter-spacing: normal;
  }

  .validation-icon {
    margin-right: 20px;
  }
  .validation-icon.success { color: #10B981; }
  .validation-icon.error { color: #EF4444; }

  .validation-msg-container {
    margin-top: 10px;
    min-height: 24px;
  }

  .validation-hint {
    font-size: 14px;
    color: #64748B;
    margin: 0;
  }

  .validation-msg {
    font-size: 14px;
    font-weight: 600;
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
    gap: 20px;
  }

  @media (max-width: 600px) {
    .vehicle-type-grid {
      grid-template-columns: 1fr;
    }
  }

  .saas-vehicle-card {
    position: relative;
    background: var(--bg-secondary);
    border: 1.5px solid var(--border-color);
    border-radius: 20px;
    padding: 28px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .saas-vehicle-card:hover {
    transform: translateY(-4px);
    background: var(--bg-card-hover);
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
  }

  .saas-vehicle-card.selected {
    background: var(--accent-primary-glow);
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-glow);
  }

  .tick-corner {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    background: var(--accent-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .vehicle-icon {
    color: var(--text-secondary);
    margin-bottom: 14px;
    display: inline-flex;
  }

  .saas-vehicle-card.selected .vehicle-icon {
    color: var(--accent-primary);
  }

  .vehicle-label {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .vehicle-price {
    font-size: 13.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* ── Live Preview Box ── */
  .live-preview-box {
    margin-top: 36px;
    background: var(--bg-secondary);
    border: 1px dashed var(--border-color);
    border-radius: 16px;
    padding: 18px 24px;
  }

  .preview-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .preview-lbl {
    font-size: 15px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .preview-val {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .val-plate {
    font-size: 20px;
    font-weight: 800;
    color: var(--accent-primary);
    background: var(--bg-card);
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    letter-spacing: 1px;
  }

  .val-empty {
    font-size: 16px;
    color: var(--text-muted);
    font-style: italic;
  }

  .val-type {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* ── Buttons ── */
  .submit-btn {
    margin-top: 28px;
    width: 100%;
    height: 60px;
    font-size: 18px;
  }

  .saas-btn-primary {
    background: var(--accent-gradient);
    border: none;
    border-radius: 16px;
    color: #ffffff;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
  }

  .saas-btn-primary:hover:not(:disabled) {
    background: var(--accent-gradient-hover);
    transform: scale(1.015);
    box-shadow: var(--shadow-lg);
  }

  .saas-btn-primary:active:not(:disabled) {
    transform: scale(0.985);
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

  /* ── Success Screen ── */
  .saas-success-card {
    background: var(--bg-card);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 28px;
    padding: 44px 36px;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    box-shadow: 0 20px 45px rgba(16, 185, 129, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
  }

  .saas-success-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at top center, rgba(16, 185, 129, 0.1) 0%, transparent 65%);
    pointer-events: none;
  }

  .success-icon-wrapper {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
    border: 2px solid rgba(16, 185, 129, 0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    position: relative;
    z-index: 1;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
  }

  .celebration-emoji {
    font-size: 38px;
    animation: bounce 2s infinite ease-in-out;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .success-title {
    font-size: 26px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
    position: relative;
    z-index: 1;
  }

  .success-subtitle {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0 0 28px 0;
    position: relative;
    z-index: 1;
    line-height: 1.5;
  }

  .success-details {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 20px 24px;
    margin: 0 auto 28px auto;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    position: relative;
    z-index: 1;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px dashed var(--border-color);
  }
  .detail-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .detail-row span {
    color: var(--text-secondary);
    font-size: 14.5px;
    font-weight: 500;
  }

  .detail-row strong {
    color: var(--text-primary);
    font-size: 15.5px;
    font-weight: 700;
  }

  .license-plate-badge {
    background: var(--bg-card);
    border: 1.5px solid #3B82F6;
    color: #2563EB !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    padding: 4px 12px;
    border-radius: 8px;
    letter-spacing: 0.8px;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
  }

  .status-badge-success {
    color: #10B981 !important;
    font-weight: 700 !important;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.1);
    padding: 4px 12px;
    border-radius: 20px;
  }

  .saas-btn-success-action {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 54px;
    font-size: 16px;
    font-weight: 700;
    border-radius: 16px;
    cursor: pointer;
    background: linear-gradient(135deg, #10B981, #059669);
    color: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  }

  .saas-btn-success-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(16, 185, 129, 0.35);
  }

  .saas-error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 14px;
    padding: 16px;
    color: #FCA5A5;
    font-size: 15px;
    font-weight: 500;
    margin-top: 24px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
