import { useState, useRef, useEffect, useCallback } from 'react';
import { validateVehicle, getZones, getAvailableSlots, createSession } from '../../services/sessionApi';
import { Car, Camera, Check, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import useFaceApi, { saveFaceDescriptor } from '../../hooks/useFaceApi';
import api from '../../services/api';

const STEPS = [
  { num: 1, label: 'Thông tin xe'  },
  { num: 2, label: 'Chọn khu vực'  },
  { num: 3, label: 'Khuôn mặt'     },
  { num: 4, label: 'Xác nhận'      },
];

const vehicleTypeLabel = (type) => {
  const map = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };
  return map[type] || type;
};

export default function VehicleEntry() {
  const [step,           setStep]           = useState(1);
  const [plate,          setPlate]          = useState('');
  const [vehicleInfo,    setVehicleInfo]    = useState(null);
  const [zones,          setZones]          = useState([]);
  const [selectedZone,   setSelectedZone]   = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [faceDescriptor, setFaceDescriptor] = useState(null); // Float32Array
  const [sessionResult,  setSessionResult]  = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [debtInfo, setDebtInfo] = useState(null);
  const [camError,       setCamError]       = useState('');

  // Face-step states
  const [faceStatus,    setFaceStatus]    = useState('idle'); // idle | detecting | captured | error
  const [faceMsg,       setFaceMsg]       = useState('');
  const [detectFace,    setDetectFace]    = useState(false); // khuôn mặt đang thấy?

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const detectLoop   = useRef(null);
  const isProcessing = useRef(false);

  const { modelsLoaded, loadingModels, modelError, loadModels, captureDescriptor, detectAndDraw } = useFaceApi();

  // ── Load zones khi mount ──────────────────────────────────────────────────
  useEffect(() => {
    getZones().then(setZones).catch(() => setZones([]));
  }, []);

  // ── Load face-api models ngay khi component mount ────────────────────────
  useEffect(() => { loadModels(); }, [loadModels]);

  // ── Camera control ────────────────────────────────────────────────────────
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      setCamError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCamError(err.name === 'NotAllowedError' ? 'Quyền truy cập camera bị từ chối.' : 'Không tìm thấy camera.');
    }
  };

  const stopCamera = () => {
    if (detectLoop.current) { clearInterval(detectLoop.current); detectLoop.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // ── Realtime detection loop khi step=3 ───────────────────────────────────
  useEffect(() => {
    let timeoutId;
    if (step === 3) {
      startCamera().then(() => {
        if (!modelsLoaded) return;
        if (detectLoop.current) clearInterval(detectLoop.current);
        // Delay nhỏ để video ready
        timeoutId = setTimeout(() => {
          detectLoop.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
            if (isProcessing.current) return;
            isProcessing.current = true;
            try {
              const result = await detectAndDraw(videoRef, canvasRef);
              setDetectFace(!!result);
            } finally {
              isProcessing.current = false;
            }
          }, 200);
        }, 800);
      });
    } else {
      stopCamera();
      setDetectFace(false);
      setFaceStatus('idle');
      setFaceMsg('');
    }
    return () => {
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [step, modelsLoaded]);  // eslint-disable-line

  // ── Step 1: Validate biển số ──────────────────────────────────────────────
  const handleValidate = async () => {
    if (!plate.trim()) { setError('Vui lòng nhập biển số xe'); return; }
    setError(''); setDebtInfo(null); setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();
      const plateRegex = /^[0-9]{2}[A-Z]{1,2}[0-9]?-[0-9]{4,5}$/;
      if (!plateRegex.test(cleanPlate)) {
        setError('Định dạng không đúng. Xe máy: 21AC-21342 | Ô tô: 36D-24821');
        return;
      }
      const result = await validateVehicle(cleanPlate);
      if (!result.valid) {
        if (result.errorCode === 'VEHICLE_ALREADY_IN_PARKING') {
          setError('Xe đã có trong hệ thống (đang đỗ trong bãi) — không thể tiếp tục cho xe vào');
          return;
        }
        if (result.errorCode === 'VEHICLE_BLACKLISTED') {
          setError(`🚫 XE TRONG DANH SÁCH ĐEN — ${result.unpaidDebtCount} khoản nợ chưa thanh toán, tổng ₫${Number(result.totalUnpaidAmount || 0).toLocaleString('vi-VN')}. Không được phép vào bãi.`);
          return;
        }
        if (result.errorCode === 'VEHICLE_HAS_UNPAID_DEBT') {
          setError(`⚠️ Xe còn nợ phí lần trước: ₫${Number(result.totalUnpaidAmount || 0).toLocaleString('vi-VN')}`);
          setDebtInfo({ vehicleId: result.vehicleId, totalUnpaidAmount: result.totalUnpaidAmount, unpaidDebtCount: result.unpaidDebtCount });
          return;
        }
        setError(result.message || 'Xe không đủ điều kiện vào bãi');
        return;
      }
      setVehicleInfo(result);
      setStep(2);
    } catch (err) {
      const errCode = err?.response?.data?.data?.errorCode || err?.response?.data?.errorCode;
      const errData = err?.response?.data?.data || err?.response?.data || {};
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (errCode === 'VEHICLE_ALREADY_IN_PARKING' || errMsg.includes('ở trong bãi') || errMsg.includes('Parking Session hoạt động')) {
        setError('Xe đã có trong hệ thống (đang đỗ trong bãi) — không thể tiếp tục cho xe vào');
        return;
      }
      if (errCode === 'VEHICLE_BLACKLISTED') {
        setError(`🚫 XE TRONG DANH SÁCH ĐEN — ${errData.unpaidDebtCount || 0} khoản nợ chưa thanh toán, tổng ₫${Number(errData.totalUnpaidAmount || 0).toLocaleString('vi-VN')}. Không được phép vào bãi.`);
        return;
      }
      if (errCode === 'VEHICLE_HAS_UNPAID_DEBT') {
        setError(`⚠️ Xe còn nợ phí lần trước: ₫${Number(errData.totalUnpaidAmount || 0).toLocaleString('vi-VN')}`);
        setDebtInfo({ vehicleId: errData.vehicleId, totalUnpaidAmount: errData.totalUnpaidAmount, unpaidDebtCount: errData.unpaidDebtCount });
        return;
      }
      if (err?.response?.status === 400 && errMsg) {
        setError(errMsg);
        return;
      }
      setVehicleInfo({ valid: true, licensePlate: plate.trim(), foundVehicle: false });
      setStep(2);
    } finally { setLoading(false); }
  };

  const handleSettleDebt = async () => {
    if (!debtInfo?.vehicleId) return;
    setLoading(true);
    try {
      await api.post('/api/v1/exceptions/settle-debt', { vehicleId: debtInfo.vehicleId });
      setDebtInfo(null);
      setError('');
      await handleValidate();
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể xác nhận thu nợ. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Chọn zone ─────────────────────────────────────────────────────
  const handleSelectZone = async (zone) => {
    setError('');
    setSelectedZone(zone);
    setLoading(true);
    try {
      const slots = await getAvailableSlots(zone.id, plate.trim().toUpperCase());
      setAvailableSlots(slots);
    } catch { setAvailableSlots([]); }
    finally { setLoading(false); }
    setStep(3);
  };

  // ── Step 3: Chụp khuôn mặt ───────────────────────────────────────────────
  const handleCaptureFace = useCallback(async () => {
    if (!modelsLoaded) { setFaceMsg('Model chưa sẵn sàng, vui lòng chờ...'); return; }
    if (!detectFace)   { setFaceMsg('⚠️ Không phát hiện khuôn mặt. Nhìn thẳng vào camera.'); return; }
    setFaceStatus('detecting');
    setFaceMsg('Đang xử lý...');
    try {
      const descriptor = await captureDescriptor(videoRef);
      if (!descriptor) {
        setFaceStatus('error');
        setFaceMsg('❌ Không nhận diện được khuôn mặt. Vui lòng thử lại.');
        return;
      }
      setFaceDescriptor(descriptor);
      setFaceStatus('captured');
      setFaceMsg('✅ Đã chụp khuôn mặt thành công!');
    } catch (err) {
      setFaceStatus('error');
      setFaceMsg('❌ Lỗi xử lý: ' + (err.message || 'Thử lại'));
    }
  }, [modelsLoaded, detectFace, captureDescriptor]);

  // ── Step 4: Xác nhận → tạo session ───────────────────────────────────────
  const handleConfirm = async () => {
    setError(''); setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();
      const result = await createSession(cleanPlate, selectedZone.id, selectedZone.vehicleType);
      // Lưu face descriptor vào localStorage theo sessionId
      if (faceDescriptor && result?.sessionId) {
        saveFaceDescriptor(result.sessionId, faceDescriptor);
      }
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
    setFaceDescriptor(null); setFaceStatus('idle'); setFaceMsg('');
    setSessionResult(null); setError('');
  };

  const filteredZones = zones.filter(z =>
    !vehicleInfo?.vehicleType || z.vehicleType === vehicleInfo.vehicleType
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-full">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2>🚗 Xe Vào Bãi</h2>
        <p>Đăng ký và xếp chỗ cho xe mới vào bãi đỗ</p>
      </div>

      {/* Stepper */}
      {step < 5 && (
        <div className="stepper">
          {STEPS.map((s, i) => {
            const isActive    = step === s.num;
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
        <div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>1. Nhập thông tin xe</h3>
              {error && (
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: debtInfo ? 10 : 20 }}>
                    <AlertCircle size={18} /><span>{error}</span>
                  </div>
              )}

              {debtInfo && (
                  <button onClick={handleSettleDebt} disabled={loading}
                          style={{ width: '100%', padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, color: '#10b981', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.92rem' }}>
                    {loading ? <span className="spinner" /> : <>💰 Thu nợ & Cho vào (₫{Number(debtInfo.totalUnpaidAmount || 0).toLocaleString('vi-VN')})</>}
                  </button>
              )}
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Biển số xe <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="form-input-wrapper" style={{ marginTop: 8 }}>
                  <input type="text" className="form-input"
                    style={{ fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '14px 16px' }}
                    placeholder="VD: 36D-24821 hoặc 21AC-21342"
                    value={plate}
                    onChange={e => setPlate(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleValidate()}
                    autoFocus />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} /> Xe máy: 21AC-21342 hoặc 78D1-13290 | Ô tô: 36D-24821
                </p>
              </div>
              <button className="btn-primary" onClick={handleValidate} disabled={loading} style={{ width: '100%' }}>
                {loading ? <span className="spinner" /> : <span>Tiếp tục <ChevronRight size={18} /></span>}
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="card animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Chọn khu vực đỗ xe</h3>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-accent)', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 20 }}>
                  {plate.trim().toUpperCase()}
                </span>
              </div>

              {vehicleInfo?.hasActiveMonthlyPass && (
                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, fontSize: '0.9rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} /> Xe có vé tháng hợp lệ
                </div>
              )}

              {vehicleInfo?.hasActiveBooking && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} /> Xe đã đặt chỗ trước (Vị trí: {vehicleInfo.bookedSlotCode || 'Chưa xác định'})
                </div>
              )}

              {vehicleInfo?.foundVehicle ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} /> Xe đã có trong hệ thống (Loại: {vehicleTypeLabel(vehicleInfo.vehicleType)})
                </div>
              ) : (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: '0.9rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Info size={20} /> Xe mới — hệ thống sẽ tự động tạo hồ sơ xe.
                </div>
              )}

              {loading && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>}

              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {filteredZones.map(zone => (
                    <button key={zone.id} onClick={() => handleSelectZone(zone)}
                      style={{ textAlign: 'left', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border-color)';  e.currentTarget.style.background = 'var(--bg-input)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{zone.name}</p>
                        <span style={{ fontSize: '1.2rem' }}>{zone.vehicleType === 'CAR' ? '🚗' : '🏍️'}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>{zone.floorName} · {vehicleTypeLabel(zone.vehicleType)}</p>
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

              <div style={{ marginTop: 32 }}>
                <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Quay lại
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: KHUÔN MẶT ── */}
          {step === 3 && (
            <div className="card animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>3. Đăng ký khuôn mặt</h3>
                {/* Model loading status */}
                {loadingModels && (
                  <span style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={13} className="spin-animation" /> Đang tải AI model...
                  </span>
                )}
                {modelsLoaded && !loadingModels && (
                  <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} /> Model sẵn sàng
                  </span>
                )}
              </div>

              {(camError || modelError) && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AlertCircle size={18} /> <span>{camError || modelError}</span>
                </div>
              )}

              {/* Camera + Canvas overlay */}
              <div style={{
                background: '#000', borderRadius: 16, overflow: 'hidden',
                height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, border: `2px solid ${
                  faceStatus === 'captured' ? '#10b981'
                  : detectFace ? 'rgba(16,185,129,0.5)'
                  : 'var(--border-color)'}`,
                position: 'relative', transition: 'border-color 0.3s',
                boxShadow: faceStatus === 'captured' ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
              }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                {/* Canvas overlay cho face detection */}
                <canvas ref={canvasRef} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  transform: 'scaleX(-1)', pointerEvents: 'none',
                }} />

                {/* Face oval guide */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                }}>
                  <div style={{
                    width: 220, height: 280,
                    border: `3px dashed ${faceStatus === 'captured' ? '#10b981' : detectFace ? '#10b981' : 'rgba(255,255,255,0.35)'}`,
                    borderRadius: '50%', transition: 'all 0.3s',
                  }} />
                </div>

                {/* Badge trạng thái */}
                <div style={{
                  position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  padding: '5px 14px', borderRadius: 20,
                  color: faceStatus === 'captured' ? '#10b981' : detectFace ? '#10b981' : '#f59e0b',
                  fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {faceStatus === 'captured' ? '✅ Đã chụp'
                    : detectFace ? '👤 Phát hiện khuôn mặt'
                    : '🔍 Đang tìm khuôn mặt...'}
                </div>
              </div>

              {/* Message */}
              {faceMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem', fontWeight: 500,
                  background: faceStatus === 'captured' ? 'rgba(16,185,129,0.1)' : faceStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  color: faceStatus === 'captured' ? '#10b981' : faceStatus === 'error' ? '#ef4444' : '#f59e0b',
                  border: `1px solid ${faceStatus === 'captured' ? 'rgba(16,185,129,0.3)' : faceStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                  {faceMsg}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => setStep(2)}
                  style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ChevronLeft size={18} /> Quay lại
                </button>

                {faceStatus === 'captured' ? (
                  <button className="btn-primary" onClick={() => setStep(4)}>
                    <span>Tiếp tục <ChevronRight size={18} /></span>
                  </button>
                ) : (
                  <button onClick={handleCaptureFace}
                    disabled={!modelsLoaded || faceStatus === 'detecting'}
                    style={{
                      padding: 14, borderRadius: 8, fontWeight: 600, cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                      background: detectFace ? 'rgba(16,185,129,0.15)' : 'var(--bg-secondary)',
                      border: `1px solid ${detectFace ? 'rgba(16,185,129,0.5)' : 'var(--border-color)'}`,
                      color: detectFace ? '#10b981' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                    }}>
                    {faceStatus === 'detecting'
                      ? <><RefreshCw size={16} className="spin-animation" /> Đang xử lý...</>
                      : <><Camera size={16} /> {detectFace ? 'Chụp khuôn mặt' : 'Chờ nhận diện...'}</>}
                  </button>
                )}
              </div>

              {/* Bỏ qua */}
              {faceStatus !== 'captured' && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button onClick={() => setStep(4)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                    Bỏ qua (không lưu khuôn mặt)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: XÁC NHẬN ── */}
          {step === 4 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>4. Xác nhận thông tin</h3>

              {error && (
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <AlertCircle size={18} /><span>{error}</span>
                  </div>
              )}

              {availableSlots.some(s => s.hasUpcomingBooking) && (
                  <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <AlertCircle size={18} />
                    <span>⚠️ Khu vực này có một số chỗ đang được khách khác đặt trước trong 1-3 tiếng tới. Có thể xếp xe vào tạm, nhưng chỉ nên cho đỗ đến trước giờ đặt 30 phút — cần dặn khách di chuyển hoặc chuẩn bị đổi chỗ trước thời điểm đó.</span>
                  </div>
              )}

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 32, background: 'var(--bg-input)' }}>
                {[
                  { label: 'Biển số xe', value: plate.trim().toUpperCase(), highlight: true },
                  { label: 'Khu vực đỗ', value: selectedZone?.name },
                  { label: 'Tầng',       value: selectedZone?.floorName },
                  { label: 'Loại xe',    value: vehicleTypeLabel(selectedZone?.vehicleType) },
                  { label: 'Khuôn mặt',  value: faceDescriptor ? '✅ Đã đăng ký' : '⚠️ Chưa đăng ký (bỏ qua)' },
                ].map((r, i) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{r.label}</span>
                    <span style={{ color: r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: r.highlight ? '1.1rem' : '0.95rem' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <button onClick={() => setStep(3)}
                  style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ChevronLeft size={18} /> Quay lại
                </button>
                <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? <span className="spinner" /> : <span>Xác nhận xe vào <Check size={18} /></span>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: THÀNH CÔNG ── */}
          {step === 5 && sessionResult && (
            <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 600, margin: '0 auto', border: '1px solid rgba(16,185,129,0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(16,185,129,0.1) 0%, transparent 70%)', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                  <Check size={40} strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Vào Bãi Thành Công!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '1rem' }}>
                  Xe <strong style={{ color: 'var(--text-primary)' }}>{sessionResult.licensePlate}</strong> đã được ghi nhận.
                </p>
                {faceDescriptor && (
                  <p style={{ fontSize: '0.82rem', color: '#10b981', marginBottom: 24 }}>🔐 Khuôn mặt đã được lưu để xác thực khi ra</p>
                )}

                {sessionResult.bookingCode && (
                  <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={20} />
                    <span><strong>Áp dụng Đặt chỗ:</strong> Khách đã dùng mã <strong>{sessionResult.bookingCode}</strong> để vào bãi. Trạng thái đã chuyển sang "Đã vào".</span>
                  </div>
                )}

                <div style={{ background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 0' }}>
                    {[
                      { label: 'Chỗ đỗ',   value: sessionResult.slotCode,    col: 1 },
                      { label: 'Khu vực',  value: sessionResult.zoneName,    col: 1 },
                      { label: 'Tầng',     value: sessionResult.floorName,   col: 2 },
                      { label: 'Giờ vào',  value: new Date(sessionResult.entryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), col: 1 },
                      { label: 'Mã phiên', value: sessionResult.sessionId?.slice(0, 8), col: 2 },
                    ]
                    .concat(sessionResult.bookingCode ? [{ label: 'Mã đặt chỗ', value: sessionResult.bookingCode, col: 2 }] : [])
                    .map(r => (
                      <div key={r.label} style={{ gridColumn: `span ${r.col}` }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ color: r.label === 'Chỗ đỗ' ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: r.label === 'Chỗ đỗ' ? '1.2rem' : '0.95rem' }}>{r.value}</div>
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
                <li style={{ opacity: step === 3 ? 1 : 0.5 }}><span className="step-num">3.</span> Đưa khuôn mặt tài xế vào khung oval rồi nhấn "Chụp". Khuôn mặt sẽ dùng để xác thực khi xe ra.</li>
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
