import { useState, useRef, useEffect } from 'react';
import { validateVehicle, getZones, getAvailableSlots, createSession } from '../../services/sessionApi';
import { Car, Camera, Check, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Thông tin xe'        },
  { num: 2, label: 'Chọn khu vực'        },
  { num: 3, label: 'Khuôn mặt'           },
  { num: 4, label: 'Xác nhận'            },
];

const vehicleTypeLabel = (type) => {
  const map = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };
  return map[type] || type;
};

export default function VehicleEntry() {
  const [step,          setStep]          = useState(1);
  const [plate,         setPlate]         = useState('');
  const [vehicleInfo,   setVehicleInfo]   = useState(null); // từ validate API
  const [zones,         setZones]         = useState([]);
  const [selectedZone,  setSelectedZone]  = useState(null);
  const [availableSlots,setAvailableSlots]= useState([]);
  const [faceReg,       setFaceReg]       = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [camError,      setCamError]      = useState('');
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  // ── Load zones khi mount ───────────────────────────────────────────────────
  useEffect(() => {
    getZones().then(setZones).catch(() => setZones([]));
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      setCamError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCamError(err.name === 'NotAllowedError' ? 'Quyền truy cập camera bị từ chối.' : 'Không tìm thấy camera.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (step === 3) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  // ── Step 1: Validate biển số ───────────────────────────────────────────────
  const handleValidate = async () => {
    if (!plate.trim()) { setError('Vui lòng nhập biển số xe'); return; }
    setError(''); setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();

      // Validate định dạng biển số ngay tại Frontend (khớp với Backend)
      const plateRegex = /^[0-9]{2}[A-Z]{1,2}[0-9]?-[0-9]{4,5}$/;
      if (!plateRegex.test(cleanPlate)) {
        setError('Định dạng không đúng. Xe máy: 21AC-21342 | Ô tô: 36D-24821');
        setLoading(false);
        return;
      }

      const result = await validateVehicle(cleanPlate);
      if (!result.valid && result.errorCode === 'UNPAID_FEE') {
        setError('Xe còn nợ phí — không thể vào bãi (BR-03)');
        return;
      }
      setVehicleInfo(result);
      setStep(2);
    } catch (err) {
      // Xe chưa có trong DB → vẫn cho vào, tạo mới khi entry
      setVehicleInfo({ valid: true, licensePlate: plate.trim(), foundVehicle: false });
      setStep(2);
    } finally { setLoading(false); }
  };

  // ── Step 2: Chọn zone ────────────────────────────────────────────────────
  const handleSelectZone = async (zone) => {
    setSelectedZone(zone);
    setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();
      const slots = await getAvailableSlots(zone.id, cleanPlate);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally { setLoading(false); }
    setStep(3);
  };

  // ── Step 4: Confirm → gọi API entry ──────────────────────────────────────
  const handleConfirm = async () => {
    setError(''); setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();
      const result = await createSession(cleanPlate, selectedZone.id, selectedZone.vehicleType);
      setSessionResult(result);
      setStep(5);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo phiên đỗ xe. Vui lòng thử lại.';
      setError(msg);
    } finally { setLoading(false); }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(1); setPlate(''); setVehicleInfo(null);
    setSelectedZone(null); setAvailableSlots([]);
    setFaceReg(false); setSessionResult(null); setError('');
  };

  // ── Filter zones theo loại xe (nếu có vehicleType từ validate) ───────────
  const filteredZones = zones.filter(z =>
    !vehicleInfo?.vehicleType || z.vehicleType === vehicleInfo.vehicleType
  );

  return (
    <div className="page-full">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2>🚗 Xe Vào Bãi</h2>
        <p>Đăng ký và xếp chỗ cho xe mới vào bãi đỗ</p>
      </div>

      {/* ── Stepper Navigation ── */}
      {step < 5 && (
        <div className="stepper">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="stepper-item-wrapper">
                <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="stepper-circle">
                    {isCompleted ? <Check size={16} /> : s.num}
                  </div>
                  <span className="stepper-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`stepper-line ${step > s.num ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: step === 5 ? '1fr' : '1.5fr 1fr', gap: 32 }}>
        {/* ── Main content ── */}
        <div>

          {/* STEP 1 — Nhập biển số */}
          {step === 1 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>1. Nhập thông tin xe</h3>
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Biển số xe <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="form-input-wrapper" style={{ marginTop: 8 }}>
                  <input type="text" className="form-input"
                    style={{ fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '14px 16px' }}
                    placeholder="VD: 36D-24821 hoặc 21AC-21342"
                    value={plate}
                    onChange={e => setPlate(e.target.value.toUpperCase())} 
                    autoFocus />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} /> Xe máy: 21AC-21342 hoặc 78D1-13290 | Ô tô: 36D-24821
                </p>
              </div>

              <button className="btn-primary" onClick={handleValidate} disabled={loading} style={{ width: '100%' }}>
                {loading ? <span className="spinner"></span> : <span>Tiếp tục <ChevronRight size={18} /></span>}
              </button>
            </div>
          )}

          {/* STEP 2 — Chọn zone */}
          {step === 2 && (
            <div className="card animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Chọn khu vực đỗ xe</h3>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-accent)', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 20 }}>
                  {plate.trim().toUpperCase()}
                </span>
              </div>
              
              {vehicleInfo?.foundVehicle ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} /> Xe đã có trong hệ thống (Loại: {vehicleTypeLabel(vehicleInfo.vehicleType)})
                </div>
              ) : (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: '0.9rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Info size={20} /> Xe mới — hệ thống sẽ tự động tạo hồ sơ xe với loại xe của khu vực bạn chọn.
                </div>
              )}

              {loading && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></span></div>}
              
              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {filteredZones.map(zone => (
                    <button key={zone.id} onClick={() => handleSelectZone(zone)}
                      style={{ 
                        textAlign: 'left', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', 
                        background: 'var(--bg-input)', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-input)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{zone.name}</p>
                        <span style={{ fontSize: '1.2rem' }}>{zone.vehicleType === 'CAR' ? '🚗' : '🏍️'}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                        {zone.floorName} · {vehicleTypeLabel(zone.vehicleType)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 800 }}>{zone.availableSlots || 0}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>trống / {zone.totalSlots}</span>
                      </div>
                    </button>
                  ))}
                  {filteredZones.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                      <p style={{ color: 'var(--text-muted)' }}>Không có khu vực phù hợp cho loại xe này</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Quay lại
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Camera */}
          {step === 3 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>3. Đăng ký khuôn mặt (Tùy chọn)</h3>
              
              {camError && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <AlertCircle size={18} /> <span>{camError}</span>
                </div>
              )}
              
              <div style={{ 
                background: 'var(--bg-input)', borderRadius: 20, overflow: 'hidden', height: 550, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
                border: '1px solid var(--border-color)', position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
              }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!streamRef.current && (
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--text-muted)' }}>
                    <Camera size={56} opacity={0.5} />
                    <span style={{ fontSize: '1.1rem' }}>Đang khởi động camera...</span>
                  </div>
                )}
                
                {/* Face Target Overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 300, height: 380, border: `3px dashed ${faceReg ? '#10b981' : 'rgba(255,255,255,0.5)'}`, borderRadius: '50%', transition: 'all 0.3s', boxShadow: faceReg ? '0 0 0 9999px rgba(0,0,0,0.5)' : '0 0 0 9999px rgba(0,0,0,0.3)' }}></div>
                </div>
              </div>
              
              {faceReg && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#10b981', marginBottom: 20, fontWeight: 600 }}>
                  <CheckCircle2 size={18} /> Đã chụp khuôn mặt thành công
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button onClick={() => setStep(2)} style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ChevronLeft size={18} /> Quay lại
                </button>
                
                {faceReg ? (
                  <button className="btn-primary" onClick={() => setStep(4)}>
                    <span>Tiếp tục <ChevronRight size={18} /></span>
                  </button>
                ) : (
                  <button onClick={() => setFaceReg(true)} style={{ padding: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, color: '#10b981', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Camera size={18} /> Chụp khuôn mặt
                  </button>
                )}
              </div>
              
              {!faceReg && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                    Bỏ qua bước này
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Xác nhận */}
          {step === 4 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>4. Xác nhận thông tin</h3>
              
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <AlertCircle size={18} /> <span>{error}</span>
                </div>
              )}
              
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 32, background: 'var(--bg-input)' }}>
                {[
                  { label: 'Biển số xe', value: plate.trim().toUpperCase(), highlight: true },
                  { label: 'Khu vực đỗ', value: selectedZone?.name },
                  { label: 'Tầng',       value: selectedZone?.floorName },
                  { label: 'Loại xe',    value: vehicleTypeLabel(selectedZone?.vehicleType) },
                  { label: 'Khuôn mặt',  value: faceReg ? '✅ Đã đăng ký' : '❌ Chưa đăng ký' },
                ].map((r, i) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{r.label}</span>
                    <span style={{ color: r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: r.highlight ? '1.1rem' : '0.95rem' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <button onClick={() => setStep(3)} style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ChevronLeft size={18} /> Quay lại
                </button>
                <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? <span className="spinner"></span> : <span>Xác nhận xe vào <Check size={18} /></span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Thành công */}
          {step === 5 && sessionResult && (
            <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 600, margin: '0 auto', border: '1px solid rgba(16, 185, 129, 0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 80, height: 80, background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
                  <Check size={40} strokeWidth={3} />
                </div>
                
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Vào Bãi Thành Công!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>Xe <strong style={{ color: 'var(--text-primary)' }}>{sessionResult.licensePlate}</strong> đã được ghi nhận vào hệ thống.</p>
                
                <div style={{ background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 0' }}>
                    {[
                      { label: 'Chỗ đỗ',      value: sessionResult.slotCode, col: 1 },
                      { label: 'Khu vực',     value: sessionResult.zoneName, col: 1 },
                      { label: 'Tầng',        value: sessionResult.floorName, col: 2 },
                      { label: 'Giờ vào',     value: new Date(sessionResult.entryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), col: 1 },
                      { label: 'Mã phiên',    value: sessionResult.sessionId?.slice(0, 8), col: 2 },
                    ].map(r => (
                      <div key={r.label} style={{ gridColumn: `span ${r.col}` }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: r.label === 'Chỗ đỗ' ? '1.2rem' : '0.95rem', color: r.label === 'Chỗ đỗ' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className="btn-primary" onClick={reset} style={{ padding: '16px 32px' }}>
                  <span>➕ Xử lý xe tiếp theo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        {step < 5 && (
          <div className="right-sidebar">
            <div className="instructions-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3>Hướng dẫn thao tác</h3>
              <ul className="instruction-list">
                <li style={{ opacity: step === 1 ? 1 : 0.5 }}><span className="step-num">1.</span> Nhập chính xác biển số xe. Hệ thống tự động kiểm tra nợ phí.</li>
                <li style={{ opacity: step === 2 ? 1 : 0.5 }}><span className="step-num">2.</span> Chọn khu vực còn chỗ trống. Hệ thống sẽ lọc theo loại xe.</li>
                <li style={{ opacity: step === 3 ? 1 : 0.5 }}><span className="step-num">3.</span> (Tùy chọn) Chụp ảnh khuôn mặt tài xế để tăng cường an ninh.</li>
                <li style={{ opacity: step === 4 ? 1 : 0.5 }}><span className="step-num">4.</span> Xác nhận thông tin và cấp chỗ.</li>
              </ul>
            </div>
            
            {selectedZone && step >= 3 && (
              <div className="card animate-slide-up" style={{ animationDelay: '0.3s', padding: 20 }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Khu vực đã chọn</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {selectedZone.vehicleType === 'CAR' ? '🚗' : '🏍️'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{selectedZone.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedZone.floorName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
