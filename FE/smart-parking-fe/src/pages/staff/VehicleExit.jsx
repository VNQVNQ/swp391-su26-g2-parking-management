import { useState, useCallback, useEffect, useRef } from 'react';
import { getActiveSessions, calculateFee, exitSession, processPayment } from '../../services/sessionApi';
import api from '../../services/api';
import useFaceApi, { loadFaceDescriptor, clearFaceDescriptor, MATCH_THRESHOLD } from '../../hooks/useFaceApi';
import {
  Search, RefreshCw, Clock, MapPin, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft, CreditCard, Banknote, AlertTriangle, X, Camera,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const VEHICLE_ICON  = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };
const VEHICLE_LABEL = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', TRUCK: 'Xe tải' };
const WRONG_ZONE_SUBTYPES = [
  { value: 'WRONG_VEHICLE_TYPE', label: 'Xe máy đỗ vào khu xe khác', icon: '🏍️' },
  { value: 'WRONG_FLOOR', label: 'Xe đỗ nhầm tầng', icon: '🏢' },
  { value: 'OCCUPIED_RESERVED', label: 'Chiếm vị trí đặt trước', icon: '📋' },
  { value: 'MULTIPLE_SLOTS', label: 'Chiếm nhiều hơn một ô', icon: '⬛' },
];
const STEPS = ['search', 'info', 'face', 'payment', 'done'];
const MAX_RETRY = 3;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function calcDuration(entryTime) {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}
function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDateShort(dt) {
  return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/* ─── Step Indicator ─────────────────────────────────────────────────────── */
function StepIndicator({ step }) {
  const steps = [
    { key: 'search',  label: 'Tìm xe',    icon: '🔍' },
    { key: 'info',    label: 'Thông tin',  icon: '📋' },
    { key: 'face',    label: 'Khuôn mặt', icon: '👤' },
    { key: 'payment', label: 'Thanh toán', icon: '💳' },
    { key: 'done',    label: 'Hoàn tất',   icon: '✅' },
  ];
  const currentIdx = STEPS.indexOf(step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: done   ? 'var(--accent-primary)'
                          : active ? 'linear-gradient(135deg, var(--accent-primary), #059669)'
                                   : 'var(--bg-secondary)',
                border: `2px solid ${done || active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                boxShadow: active ? '0 0 0 4px rgba(16,185,129,0.15)' : 'none', transition: 'all 0.3s',
              }}>
                {done ? <CheckCircle size={20} color="#fff" /> : <span>{s.icon}</span>}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                color: active ? 'var(--accent-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 52, height: 2, marginBottom: 20,
                background: done ? 'var(--accent-primary)' : 'var(--border-color)', transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Exception Modal ────────────────────────────────────────────────────── */
function ExceptionPanel({ session, onClose, onPenaltyApplied, initialType, initialNotes }) {
  const [type, setType]               = useState(initialType || 'LOST_TICKET');
  const [notes, setNotes]             = useState(initialNotes || '');
  const [penaltyFee, setPenaltyFee]   = useState('');
  const [penaltySource, setPenaltySrc]= useState('none'); // 'admin' | 'manual' | 'none'
  const [loadingFee, setLoadingFee]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');
  const [resultFee, setResultFee]     = useState(null);
  const [appliedTypes, setAppliedTypes] = useState([]);

  const isMonthlyPass = session?.hasMonthlyPass === true 
                     || session?.ticketType === 'MONTHLY' 
                     || session?.ticketType === 'Vé tháng'
                     || session?.ticketType === 'Monthly';

  const TYPES = [
    { value: 'LOST_TICKET', label: '🎫 Mất vé',    color: '#f59e0b' },
    { value: 'WRONG_ZONE',  label: '📍 Sai vị trí', color: '#8b5cf6' },
  ];

  // Normalize vehicleType sang UPPERCASE enum value
  const rawVehicleType = session?.vehicleType
    || session?.vehicle?.vehicleType
    || session?.vehicle?.type
    || '';
  const vehicleType = rawVehicleType.toUpperCase() || 'CAR';

  const fetchAppliedExceptions = async () => {
    if (!session?.id) return [];
    try {
      const res = await api.get('/api/v1/exceptions', { params: { sessionId: session.id } });
      const list = res.data?.data || [];
      const types = list
        .filter(ex => ex.status === 'RESOLVED' || ex.status === 'APPROVED')
        .map(ex => ex.exceptionType === 'WRONG_SPOT' ? 'WRONG_ZONE' : ex.exceptionType);
      setAppliedTypes(types);
      return types;
    } catch {
      return [];
    }
  };

  // Auto-fetch penalty fee từ bảng admin khi chọn loại ngoại lệ
  const fetchPenaltyFee = async (exceptionType) => {
    if (!vehicleType) return;
    setLoadingFee(true);
    setPenaltyFee('');
    setPenaltySrc('none');
    try {
      let res = await api.get('/api/v1/penalty-configs/lookup', {
        params: { vehicleType, exceptionType }
      });
      if (!res.data?.found && exceptionType === 'WRONG_ZONE') {
        const resSpot = await api.get('/api/v1/penalty-configs/lookup', {
          params: { vehicleType, exceptionType: 'WRONG_SPOT' }
        });
        if (resSpot.data?.found) res = resSpot;
      }
      if (res.data?.found && res.data?.data?.penaltyAmount != null) {
        const amount = Number(res.data.data.penaltyAmount);
        setPenaltyFee(String(amount));
        setPenaltySrc(amount > 0 ? 'admin' : 'none');
      } else {
        setPenaltyFee('');
        setPenaltySrc('none');
      }
    } catch {
      setPenaltyFee('');
      setPenaltySrc('none');
    } finally {
      setLoadingFee(false);
    }
  };

  // Fetch khi component mount
  useEffect(() => {
    const init = async () => {
      const types = await fetchAppliedExceptions();
      let targetType = initialType || 'LOST_TICKET';
      if (types.includes(targetType)) {
        const availableTypes = TYPES.filter(t => !types.includes(t.value));
        targetType = availableTypes[0]?.value || 'LOST_TICKET';
      }
      setType(targetType);
      fetchPenaltyFee(targetType);
      if (initialNotes) setNotes(initialNotes);
    };
    init();
  }, [session?.id, initialType, initialNotes]); // eslint-disable-line

  const handleTypeChange = (newType) => {
    if (appliedTypes.includes(newType)) return;
    setType(newType);
    fetchPenaltyFee(newType);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) { setError('Vui lòng nhập ghi chú mô tả tình huống.'); return; }
    if (appliedTypes.includes(type)) { setError('Ngoại lệ này đã được xử lý cho xe trước đó.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        exceptionType: type,
        reason: notes,
        resolution: `Nhân viên xử lý: ${notes}`,
        evidenceNote: notes,
      };
      if (session?.id) payload.sessionId = session.id;
      if (penaltyFee && Number(penaltyFee) > 0) payload.penaltyFee = String(penaltyFee);

      const res = await api.post('/api/v1/exceptions/staff-handle', payload);
      const fee = res.data?.data?.penaltyFee;
      setResultFee(fee ? Number(fee) : 0);
      const newAppliedTypes = [...appliedTypes, type];
      setAppliedTypes(newAppliedTypes);
      setSubmitted(true);
      if (fee && Number(fee) > 0 && onPenaltyApplied) {
        onPenaltyApplied(Number(fee));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý ngoại lệ. Thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Label loại xe hiển thị
  const vehicleLabel = vehicleType === 'CAR' ? '🚗 Ô tô'
    : vehicleType === 'MOTORBIKE' ? '🏍️ Xe máy'
    : vehicleType === 'TRUCK' ? '🚛 Xe tải'
    : vehicleType || '—';

  const hasMoreTypes = TYPES.some(t => !appliedTypes.includes(t.value));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Xử lý Ngoại lệ</p>
              {session && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {session.licensePlate || session.vehicle?.licensePlate}
                  {vehicleLabel && <span style={{ marginLeft: 6, padding: '1px 6px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.7rem' }}>
                    {vehicleLabel}
                  </span>}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}><X size={20} /></button>
        </div>

        {submitted ? (
          /* ── Kết quả ── */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Đã xử lý ngoại lệ thành công!</p>
            {resultFee > 0 ? (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', margin: '12px 0 20px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Phí phạt đã áp dụng</p>
                <p style={{ fontWeight: 800, fontSize: '1.4rem', color: '#f59e0b' }}>₫{resultFee.toLocaleString('vi-VN')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>✅ Đã cộng vào tổng phí thanh toán</p>
              </div>
            ) : (
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 20 }}>Không có phí phạt thêm.</p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>Đóng &amp; Hoàn tất</button>
              {hasMoreTypes && (
                <button
                  onClick={() => {
                    const nextAvailable = TYPES.find(t => !appliedTypes.includes(t.value))?.value || 'LOST_TICKET';
                    setType(nextAvailable);
                    fetchPenaltyFee(nextAvailable);
                    setNotes('');
                    setResultFee(0);
                    setSubmitted(false);
                  }}
                  style={{ flex: 1.2, padding: '10px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                  + Xử lý thêm ngoại lệ
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Loại ngoại lệ */}
            <div style={{
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem',
              color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>💡 Hệ thống đã tự động tính phí đỗ quá giờ. Xử lý ngoại lệ tại quầy chỉ gồm: <b>Mất vé/thẻ</b> và <b>Đỗ sai vị trí</b>.</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loại ngoại lệ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {TYPES.map(t => {
                const isApplied = appliedTypes.includes(t.value);
                const isSelected = type === t.value && !isApplied;
                return (
                  <button
                    key={t.value}
                    disabled={isApplied}
                    onClick={() => !isApplied && handleTypeChange(t.value)}
                    style={{
                      padding: '10px 8px', borderRadius: 10, cursor: isApplied ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.78rem',
                      textAlign: 'center', border: `2px solid ${isSelected ? t.color : 'var(--border-color)'}`,
                      background: isSelected ? `${t.color}18` : 'var(--bg-secondary)',
                      color: isSelected ? t.color : isApplied ? 'var(--text-muted)' : 'var(--text-secondary)',
                      opacity: isApplied ? 0.55 : 1, transition: 'all 0.15s',
                    }}>
                    {t.label}
                    {isApplied && <div style={{ fontSize: '0.66rem', color: '#10b981', marginTop: 2, fontWeight: 700 }}>✓ Đã áp dụng</div>}
                  </button>
                );
              })}
            </div>

            {/* Phí phạt */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Phí phạt áp dụng (VNĐ)
                </p>
                {loadingFee ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏳ Đang tra cứu...</span>
                ) : penaltyFee && Number(penaltyFee) > 0 ? (
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>
                    ✓ Tự động theo Admin
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Chưa có cấu hình (0 VNĐ)</span>
                )}
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={loadingFee ? 'Đang tải...' : penaltyFee && Number(penaltyFee) > 0 ? `${Number(penaltyFee).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ (Chưa cấu hình)'}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: penaltyFee && Number(penaltyFee) > 0 ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid var(--border-color)',
                  background: penaltyFee && Number(penaltyFee) > 0 ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem',
                  fontFamily: 'monospace', fontWeight: 700, boxSizing: 'border-box', outline: 'none', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                💡 Mức phí phạt được tra cứu và áp dụng tự động theo bảng cấu hình của Admin (không nhập thủ công)
              </p>
            </div>

            {/* Ghi chú */}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ghi chú / Mô tả</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mô tả tình huống ngoại lệ và cách xử lý..." rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />

            {error && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem', marginTop: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={onClose} style={{ flex: 0.4, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>Hủy</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <><RefreshCw size={14} className="spin-animation" /> Đang xử lý...</> : <><AlertTriangle size={15} /> Xác nhận xử lý ngoại lệ</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── FaceVerify Step ────────────────────────────────────────────────────── */
function FaceVerifyStep({ session, onVerified, onBypass, onBack }) {
  const [scanStatus,  setScanStatus]  = useState('idle'); // idle | scanning | matched | failed | nodata
  const [retryCount,  setRetryCount]  = useState(0);
  const [distance,    setDistance]    = useState(null);
  const [detectFace,  setDetectFace]  = useState(false);
  const [camError,    setCamError]    = useState('');

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const detectLoop   = useRef(null);
  const isProcessing = useRef(false);

  const { modelsLoaded, loadingModels, modelError, loadModels, captureDescriptor, compareDescriptors, detectAndDraw } = useFaceApi();

  const sessionId = session?.id;

  // Load models
  useEffect(() => { loadModels(); }, [loadModels]);

  // Camera
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

  useEffect(() => {
    // Kiểm tra có descriptor không
    const saved = loadFaceDescriptor(sessionId);
    if (!saved) { setScanStatus('nodata'); return; }

    let timeoutId;
    startCamera().then(() => {
      if (!modelsLoaded) return;
      if (detectLoop.current) clearInterval(detectLoop.current);
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
    return () => {
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [sessionId, modelsLoaded]); // eslint-disable-line

  const handleScan = async () => {
    if (!modelsLoaded || !detectFace) return;
    setScanStatus('scanning');
    try {
      const current = await captureDescriptor(videoRef);
      if (!current) {
        setScanStatus('failed');
        setRetryCount(r => r + 1);
        return;
      }
      const saved = loadFaceDescriptor(sessionId);
      const { match, distance: dist } = await compareDescriptors(saved, current);
      setDistance(dist);
      if (match) {
        setScanStatus('matched');
        stopCamera();
        setTimeout(() => {
          clearFaceDescriptor(sessionId);
          onVerified();
        }, 1200);
      } else {
        setScanStatus('failed');
        setRetryCount(r => r + 1);
      }
    } catch {
      setScanStatus('failed');
      setRetryCount(r => r + 1);
    }
  };

  const handleRetry = () => { setScanStatus('idle'); setDistance(null); };

  // ── No face data → bypass mode ──────────────────────────────────────────
  if (scanStatus === 'nodata') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card" style={{ padding: 32, borderRadius: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Không có dữ liệu khuôn mặt</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
            Xe này chưa đăng ký khuôn mặt khi vào hoặc dữ liệu đã hết hạn (đăng ký từ thiết bị khác).
          </p>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: '0.85rem', color: '#f59e0b', textAlign: 'left' }}>
            ⚠️ Vui lòng kiểm tra giấy tờ xe thủ công trước khi cho phép ra.
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button onClick={onBypass}
              style={{ padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem' }}>
              ✅ Đã kiểm tra — Cho phép ra (Bypass)
            </button>
            <button onClick={onBack}
              style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.1rem' }}>
          👤 Xác thực khuôn mặt
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          Quét khuôn mặt tài xế để xác nhận đúng chủ xe trước khi ra
        </p>

        {(camError || modelError) && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', marginBottom: 14, display: 'flex', gap: 8 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {camError || modelError}
          </div>
        )}

        {/* Camera */}
        <div style={{
          background: '#000', borderRadius: 16, overflow: 'hidden', height: 300,
          position: 'relative', marginBottom: 16,
          border: `2px solid ${
            scanStatus === 'matched' ? '#10b981'
            : scanStatus === 'failed' ? '#ef4444'
            : detectFace ? 'rgba(16,185,129,0.5)'
            : 'var(--border-color)'}`,
          transition: 'border-color 0.3s',
          boxShadow: scanStatus === 'matched' ? '0 0 20px rgba(16,185,129,0.4)' : scanStatus === 'failed' ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
        }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

          {/* Oval guide */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              width: 180, height: 220,
              border: `3px dashed ${
                scanStatus === 'matched' ? '#10b981'
                : scanStatus === 'failed' ? '#ef4444'
                : detectFace ? '#10b981' : 'rgba(255,255,255,0.4)'}`,
              borderRadius: '50%', transition: 'all 0.3s',
            }} />
          </div>

          {/* Result overlay */}
          {(scanStatus === 'matched' || scanStatus === 'failed') && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: scanStatus === 'matched' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
              backdropFilter: 'blur(2px)',
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{scanStatus === 'matched' ? '✅' : '❌'}</div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>
                {scanStatus === 'matched' ? 'Khớp!' : 'Không khớp'}
              </p>
              {distance !== null && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: 4 }}>
                  Khoảng cách: {distance} {scanStatus === 'matched' ? `(≤ ${MATCH_THRESHOLD} ✅)` : `(> ${MATCH_THRESHOLD} ❌)`}
                </p>
              )}
            </div>
          )}

          {/* Status badge */}
          {scanStatus !== 'matched' && scanStatus !== 'failed' && (
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
              padding: '4px 14px', borderRadius: 20,
              color: detectFace ? '#10b981' : '#f59e0b',
              fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {loadingModels ? '⏳ Đang tải model AI...' : detectFace ? '👤 Phát hiện khuôn mặt' : '🔍 Đang tìm khuôn mặt...'}
            </div>
          )}
        </div>

        {/* Retry info */}
        {retryCount > 0 && scanStatus !== 'matched' && (
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 12, fontSize: '0.82rem', color: '#ef4444' }}>
            Đã thử {retryCount}/{MAX_RETRY} lần. {retryCount >= MAX_RETRY ? 'Đã hết lượt — dùng chức năng Ngoại lệ.' : ''}
          </div>
        )}

        {/* Buttons */}
        {scanStatus === 'matched' ? (
          <div style={{ textAlign: 'center', padding: '10px', color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>
            ✅ Xác thực thành công! Đang chuyển...
          </div>
        ) : scanStatus === 'failed' && retryCount >= MAX_RETRY ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack} style={{ flex: 0.4, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
            <button onClick={onBypass} style={{ flex: 1, padding: '12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertTriangle size={15} /> Bypass — Xử lý ngoại lệ
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={onBack} style={{ padding: '13px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
            {scanStatus === 'failed' ? (
              <button onClick={handleRetry} style={{ padding: '13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RefreshCw size={15} /> Thử lại ({MAX_RETRY - retryCount} lần)
              </button>
            ) : (
              <button onClick={handleScan}
                disabled={!modelsLoaded || !detectFace || scanStatus === 'scanning'}
                style={{
                  padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: (modelsLoaded && detectFace) ? 'pointer' : 'not-allowed',
                  background: detectFace && modelsLoaded ? 'linear-gradient(135deg, var(--accent-primary), #059669)' : 'var(--bg-secondary)',
                  border: `1px solid ${detectFace && modelsLoaded ? 'transparent' : 'var(--border-color)'}`,
                  color: detectFace && modelsLoaded ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                {scanStatus === 'scanning'
                  ? <><RefreshCw size={15} className="spin-animation" /> Đang xử lý...</>
                  : <><Camera size={15} /> {detectFace ? 'Quét khuôn mặt' : 'Chờ nhận diện...'}</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function VehicleExit() {
  const [step,            setStep]           = useState('search');
  const [searchQuery,     setSearchQuery]    = useState('');
  const [sessions,        setSessions]       = useState([]);
  const [searchResults,   setSearchResults]  = useState(null);
  const [selectedSession, setSelectedSession]= useState(null);
  const [feeInfo,         setFeeInfo]        = useState(null);
  const [payMethod,       setPayMethod]      = useState('CASH');
  const [loading,         setLoading]        = useState(false);
  const [feeLoading,      setFeeLoading]     = useState(false);
  const [processing,      setProcessing]     = useState(false);
  const [error,           setError]          = useState('');
  const [exitResult,      setExitResult]     = useState(null);
  const [showException,   setShowException]  = useState(false);
  const [receiptId,       setReceiptId]      = useState('');
  const [sessionExceptions, setSessionExceptions] = useState([]);
  const [exceptionInitialType, setExceptionInitialType] = useState(null);
  const [exceptionInitialNotes, setExceptionInitialNotes] = useState('');
  const [sortBy, setSortBy] = useState('duration_desc');
  const [filterVehicleType, setFilterVehicleType] = useState('ALL');
  const [filterSpecial, setFilterSpecial] = useState('ALL');
  const [monthlyPassInfo, setMonthlyPassInfo] = useState(null);

  const pendingWrongZoneList = sessionExceptions.filter(ex => 
    (ex.exceptionType === 'WRONG_ZONE' || ex.exceptionType === 'WRONG_SPOT') && ex.status === 'PENDING'
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      const arr = Array.isArray(data) ? data : [];
      setSessions(arr);
      setSearchResults(arr);
    } catch {
      setSessions([]); setSearchResults([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleSearchChange = (e) => {
    const val = e.target.value.toUpperCase();
    setSearchQuery(val);
    if (!val.trim()) setSearchResults(sessions);
    else {
      const q = val.trim();
      setSearchResults(sessions.filter(s => {
        const plate = (s.licensePlate || s.vehicle?.licensePlate || '').toUpperCase();
        return plate.includes(q);
      }));
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setError('');
    setFeeLoading(true);
    setExceptionInitialType(null);
    setExceptionInitialNotes('');
    setMonthlyPassInfo(null);
    try {
      const exRes = await api.get('/api/v1/exceptions', { params: { sessionId: session.id } });
      setSessionExceptions(exRes.data?.data || []);
    } catch { setSessionExceptions([]); }
    try {
      const fee = await calculateFee(session.id);
      setFeeInfo(fee);
    } catch { setFeeInfo({ totalFee: 0, durationMinutes: 0 }); }
    finally { setFeeLoading(false); }
    if (session.hasMonthlyPass && session.vehicleId) {
      try {
        const passRes = await api.get(`/api/v1/monthly-passes/vehicle/${session.vehicleId}/active`);
        setMonthlyPassInfo(passRes.data?.data || null);
      } catch { setMonthlyPassInfo(null); }
    }
    setStep('info');
  };

  const handleConfirmPayment = async () => {
    setError(''); setProcessing(true);
    try {
      const slotId = selectedSession.slotId || selectedSession.slot?.id;
      await exitSession(selectedSession.id, slotId);
      if (feeInfo?.totalFee > 0) {
        await processPayment(selectedSession.id, feeInfo.totalFee, payMethod);
      }
      setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
      setExitResult({ session: selectedSession, fee: feeInfo, payMethod });
      setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý xe ra. Vui lòng thử lại.');
    } finally { setProcessing(false); }
  };

  const handleReset = () => {
    setStep('search'); setSearchQuery(''); setSearchResults(null);
    setSelectedSession(null); setFeeInfo(null); setError('');
    setExitResult(null); setPayMethod('CASH');
    setSessionExceptions([]); setExceptionInitialType(null); setExceptionInitialNotes('');
    setMonthlyPassInfo(null);
  };

  const displayResults = (searchResults || [])
      .filter(s => {
        const type = s.vehicleType || s.vehicle?.vehicleType || 'CAR';
        if (filterVehicleType !== 'ALL' && type !== filterVehicleType) return false;
        const hasPass = s.hasMonthlyPass === true || s.ticketType === 'MONTHLY' || s.ticketType === 'Vé tháng' || s.ticketType === 'Monthly';
        const hasBooking = s.hasBooking === true || s.bookingCode != null;
        if (filterSpecial === 'MONTHLY' && !hasPass) return false;
        if (filterSpecial === 'BOOKING' && !hasBooking) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'plate_asc') {
          return (a.licensePlate || a.vehicle?.licensePlate || '').localeCompare(b.licensePlate || b.vehicle?.licensePlate || '');
        }
        const ta = a.entryTime ? new Date(a.entryTime).getTime() : 0;
        const tb = b.entryTime ? new Date(b.entryTime).getTime() : 0;
        return sortBy === 'duration_desc' ? ta - tb : tb - ta;
      });

  const plate = selectedSession?.licensePlate || selectedSession?.vehicle?.licensePlate || '';
  const vtype = selectedSession?.vehicleType  || selectedSession?.vehicle?.vehicleType  || 'CAR';

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🚪 Xe Ra Bãi</h2>
        <p>Xử lý xe ra theo từng bước: Tìm xe → Thông tin → Xác thực mặt → Thanh toán</p>
      </div>

      <StepIndicator step={step} />

      {/* ── BƯỚC 1: TÌM XE ── */}
      {step === 'search' && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.1rem' }}>🔍 Nhập biển số xe cần tìm</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>Nhập biển số (một phần hoặc toàn bộ) để tìm xe đang đỗ trong bãi</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <div className="form-input-wrapper" style={{ flex: 1 }}>
                <Search className="input-icon" size={18} style={{ pointerEvents: 'none', color: 'var(--text-muted)' }} />
                <input type="text" className="form-input"
                  style={{ width: '100%', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', padding: '14px 14px 14px 44px' }}
                  placeholder="Nhập biển số xe (VD: 51A-12345)..."
                  value={searchQuery} onChange={handleSearchChange} autoFocus />
              </div>
              <button className="btn-primary" onClick={loadSessions} disabled={loading}
                style={{ padding: '0 24px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', width: 'auto' }}>
                <RefreshCw size={16} className={loading ? 'spin-animation' : ''} /> Làm mới
              </button>
            </div>

            {searchResults && (
                searchResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔎</p>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {searchQuery ? `Không tìm thấy xe "${searchQuery}"` : 'Không có xe nào đang đỗ trong bãi'}
                      </p>
                      <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Kiểm tra lại biển số hoặc làm mới danh sách</p>
                      <button onClick={() => setShowException(true)}
                              style={{ marginTop: 16, padding: '8px 20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#f59e0b', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} /> Xử lý ngoại lệ
                      </button>
                    </div>
                ) : (
                    <>
                      {/* Filter + Sort bar */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                        <select value={filterVehicleType} onChange={e => setFilterVehicleType(e.target.value)}
                                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                          <option value="ALL">Tất cả loại xe</option>
                          <option value="MOTORBIKE">🏍️ Xe máy</option>
                          <option value="CAR">🚗 Ô tô</option>
                          <option value="TRUCK">🚛 Xe tải</option>
                        </select>
                        <select value={filterSpecial} onChange={e => setFilterSpecial(e.target.value)}
                                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="MONTHLY">🎫 Vé tháng</option>
                          <option value="BOOKING">📅 Đặt chỗ trước</option>
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem', marginLeft: 'auto' }}>
                          <option value="duration_desc">⏱️ Xe đỗ lâu nhất → mới vào</option>
                          <option value="duration_asc">⏱️ Xe mới vào → đỗ lâu nhất</option>
                          <option value="plate_asc">🔤 Biển số: A → Z</option>
                        </select>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                        {searchQuery ? `Tìm thấy ${displayResults.length} xe khớp` : `Danh sách ${displayResults.length} xe đang đỗ`}
                      </p>

                      {displayResults.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Không có xe nào khớp bộ lọc hiện tại
                          </div>
                      ) : (
                          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                              <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Biển số /<br/>Loại xe</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Vị trí</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Giờ vào</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Thời gian đỗ</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Trạng thái</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Xác thực<br/>khuôn mặt</th>
                                <th style={{ verticalAlign: 'middle' }}></th>
                              </tr>
                              </thead>
                              <tbody>
                              {displayResults.map((session) => {
                                const p    = session.licensePlate || session.vehicle?.licensePlate || '—';
                                const slot = session.slotCode     || session.slot?.slotCode        || '—';
                                const type = session.vehicleType  || session.vehicle?.vehicleType  || 'CAR';
                                const hasFace = !!loadFaceDescriptor(session.id);
                                const hasPass = session.hasMonthlyPass === true
                                    || session.ticketType === 'MONTHLY'
                                    || session.ticketType === 'Vé tháng'
                                    || session.ticketType === 'Monthly';
                                const hasBooking = session.hasBooking === true || session.bookingCode != null;

                                return (
                                    <tr key={session.id} onClick={() => handleSelectSession(session)}
                                        style={{ cursor: 'pointer', borderTop: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                          <span style={{ fontSize: 20 }}>{VEHICLE_ICON[type] || '🚗'}</span>
                                          <div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{p}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{VEHICLE_LABEL[type]}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{slot}</span>
                                      </td>
                                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        {session.entryTime ? formatTime(session.entryTime) : '—'}
                                      </td>
                                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{session.entryTime ? calcDuration(session.entryTime) : '—'}</span>
                                      </td>
                                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                          {hasBooking && (
                                              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>ĐẶT CHỖ</span>
                                          )}
                                          {hasPass && (
                                              <span style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>VÉ THÁNG</span>
                                          )}
                                          {!hasBooking && !hasPass && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: hasFace ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: hasFace ? '#10b981' : '#f59e0b' }}>
                        {hasFace ? '🔐' : '⚠️'}
                      </span>
                                      </td>
                                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                      </td>
                                    </tr>
                                );
                              })}
                              </tbody>
                            </table>
                          </div>
                      )}
                    </>
                )
            )}
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={() => setShowException(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} /> Xử lý trường hợp ngoại lệ
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 2: THÔNG TIN XE ── */}
      {step === 'info' && selectedSession && (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingWrongZoneList.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '2px solid #ef4444',
              borderRadius: 20, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '0 8px 30px rgba(239,68,68,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>
                    ⚠️ PHÁT HIỆN VI PHẠM: XE ĐỖ SAI VỊ TRÍ
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    Hệ thống ghi nhận xe này đang vi phạm lỗi đỗ xe sai quy định trong bãi.
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(239,68,68,0.3)' }}>
                {pendingWrongZoneList.map(ex => (
                  <div key={ex.id} style={{ marginBottom: pendingWrongZoneList.length > 1 ? 10 : 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📍</span> {ex.subType ? WRONG_ZONE_SUBTYPES.find(s => s.value === ex.subType)?.label || ex.subType : 'Đỗ sai vị trí'}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Lý do/Mô tả:</strong> {ex.reason}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Ghi nhận bởi: <strong style={{ color: 'var(--text-secondary)' }}>{ex.createdBy || 'Nhân viên bãi xe'}</strong> · {ex.createdAt ? new Date(ex.createdAt).toLocaleString('vi-VN') : ''}
                      {ex.penaltyFee ? ` · Phí phạt dự kiến: ₫${parseInt(ex.penaltyFee).toLocaleString('vi-VN')}` : ''}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: 12 }}>
                <span style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 600 }}>
                  👉 Vui lòng xử lý phụ phí vi phạm sai vị trí trước khi cho xe ra bãi!
                </span>
                <button
                  onClick={() => {
                    setExceptionInitialType('WRONG_ZONE');
                    setExceptionInitialNotes(pendingWrongZoneList[0]?.reason || 'Xử lý vi phạm sai vị trí');
                    setShowException(true);
                  }}
                  style={{
                    padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: 10,
                    color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                  }}
                >
                  <AlertTriangle size={16} /> Xử lý vi phạm ngay
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                {VEHICLE_ICON[vtype] || '🚗'}
              </div>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '1.5px' }}>{plate}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{VEHICLE_LABEL[vtype] || 'Xe'}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '4px 10px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-primary)', borderRadius: 20, fontWeight: 700 }}>ĐANG ĐỖ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '📍', label: 'Vị trí ô đỗ',  value: selectedSession.slotCode || selectedSession.slot?.slotCode || '—' },
                { icon: '🗺️', label: 'Khu vực',       value: selectedSession.zoneName  || selectedSession.slot?.zone?.name  || '—' },
                { icon: '🏢', label: 'Tầng',           value: selectedSession.floorName || selectedSession.slot?.floor?.name || '—' },
                { icon: '🕐', label: 'Giờ vào',       value: selectedSession.entryTime ? `${formatDateShort(selectedSession.entryTime)} ${formatTime(selectedSession.entryTime)}` : '—' },
                { icon: '⏱️', label: 'Thời gian đỗ',  value: selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—', span: 2 },
              ].map(r => (
                <div key={r.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', gridColumn: r.span ? `span ${r.span}` : undefined }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{r.icon} {r.label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {monthlyPassInfo && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.12))',
              border: '1px solid rgba(139,92,246,0.25)', borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '1.1rem' }}>🎫</span>
                <p style={{ margin: 0, fontWeight: 700, color: '#8b5cf6', fontSize: '0.88rem' }}>Vé tháng đang áp dụng</p>
                {monthlyPassInfo.isExpiring && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 10, fontWeight: 700 }}>
                    ⚠️ Sắp hết hạn
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Ngày bắt đầu</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{new Date(monthlyPassInfo.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Ngày hết hạn</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: monthlyPassInfo.isExpiring ? '#f59e0b' : 'var(--text-primary)' }}>{new Date(monthlyPassInfo.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Còn lại</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{monthlyPassInfo.remainingDays} ngày</p>
                </div>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(139,92,246,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phí vé tháng: ₫{(monthlyPassInfo.fee || 0).toLocaleString('vi-VN')}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: monthlyPassInfo.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: monthlyPassInfo.paymentStatus === 'PAID' ? '#10b981' : '#ef4444' }}>
                  {monthlyPassInfo.paymentStatus === 'PAID' ? 'Đã thanh toán' : monthlyPassInfo.paymentStatus}
                </span>
              </div>
            </div>
          )}

          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.12))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Phí tạm tính</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {feeLoading ? 'Đang tính...' : feeInfo?.durationMinutes ? `${feeInfo.durationMinutes} phút` : 'Tính theo thực tế'}
              </p>
            </div>
            <p style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--accent-primary)', letterSpacing: '-0.5px' }}>
              {feeLoading ? '...' : `₫${(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('search'); setSelectedSession(null); setSessionExceptions([]); setExceptionInitialType(null); setExceptionInitialNotes(''); }}
              style={{ flex: 0.35, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
            <button onClick={() => setShowException(true)}
              style={{ flex: 0.4, padding: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, color: '#f59e0b', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertTriangle size={15} /> Ngoại lệ
            </button>
            <button className="btn-primary" onClick={() => setStep('face')} disabled={feeLoading}
              style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Xác thực khuôn mặt <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3: KHUÔN MẶT ── */}
      {step === 'face' && selectedSession && (
        <FaceVerifyStep
          session={selectedSession}
          onVerified={() => setStep('payment')}
          onBypass={() => { setShowException(false); setStep('payment'); }}
          onBack={() => setStep('info')}
        />
      )}

      {/* ── BƯỚC 4: THANH TOÁN ── */}
      {step === 'payment' && selectedSession && (
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 28 }}>{VEHICLE_ICON[vtype] || '🚗'}</span>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>{plate}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{VEHICLE_LABEL[vtype]} · {selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—'}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 12, fontWeight: 600 }}>🔐 Đã xác thực</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 16 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Tổng phí cần thanh toán</p>
              <p style={{ fontWeight: 900, fontSize: '3rem', color: 'var(--accent-primary)', letterSpacing: '-2px', lineHeight: 1 }}>
                ₫{(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}
              </p>
              {feeInfo?.durationMinutes && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>{feeInfo.durationMinutes} phút đỗ xe</p>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Phương thức thanh toán</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { key: 'CASH', label: 'Tiền mặt', icon: <Banknote size={20} />,   color: '#10b981' },
                { key: 'CARD', label: 'Thẻ',      icon: <CreditCard size={20} />, color: '#6366f1' },
                { key: 'QR',   label: 'QR Code',  icon: <span style={{fontSize:20}}>📱</span>, color: '#f59e0b' },
              ].map(m => (
                  <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                    padding: '16px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    border: `2px solid ${payMethod === m.key ? m.color : 'var(--border-color)'}`,
                    background: payMethod === m.key ? `${m.color}18` : 'var(--bg-secondary)',
                    color: payMethod === m.key ? m.color : 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                  }}>
                    {m.icon}{m.label}
                    {payMethod === m.key && <CheckCircle size={14} color={m.color} />}
                  </button>
              ))}
            </div>

            {payMethod === 'QR' && (
                <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 16 }}>
                  <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `THANH TOAN VE XE\nBien so: ${plate}\nSo tien: ${(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}d`
                      )}`}
                      alt="QR thanh toán"
                      style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
                    Quét mã để xác nhận thanh toán
                  </p>
                </div>
            )}

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', marginBottom: 16 }}>
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('face')}
                style={{ flex: 0.35, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ArrowLeft size={15} /> Quay lại
              </button>
              <button className="btn-primary" onClick={handleConfirmPayment} disabled={processing}
                style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {processing
                  ? <><RefreshCw size={16} className="spin-animation" /> Đang xử lý...</>
                  : <><CheckCircle size={16} /> Xác nhận Thu tiền &amp; Xe Ra</>}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setShowException(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} /> Xử lý ngoại lệ cho xe này
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 5: HOÀN TẤT ── */}
      {step === 'done' && exitResult && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card" style={{ padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 6 }}>Xe ra bãi thành công!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>Biên lai #{receiptId}</p>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '20px', textAlign: 'left', marginBottom: 28 }}>
              {[
                { label: 'Biển số',      value: exitResult.session?.licensePlate || exitResult.session?.vehicle?.licensePlate },
                { label: 'Loại xe',      value: VEHICLE_LABEL[exitResult.session?.vehicleType || exitResult.session?.vehicle?.vehicleType] || '—' },
                { label: 'Thời gian đỗ',value: exitResult.fee?.durationMinutes ? `${exitResult.fee.durationMinutes} phút` : '—' },
                { label: 'Tổng phí',     value: `₫${(exitResult.fee?.totalFee || 0).toLocaleString('vi-VN')}`, highlight: true },
                { label: 'Thanh toán',   value: exitResult.payMethod === 'CASH' ? 'Tiền mặt' : exitResult.payMethod === 'QR' ? 'QR Code' : 'Thẻ' },
                ...(monthlyPassInfo ? [{ label: 'Vé tháng', value: `Còn hạn đến ${new Date(monthlyPassInfo.endDate).toLocaleDateString('vi-VN')} (${monthlyPassInfo.remainingDays} ngày)` }] : []),
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: r.highlight ? 800 : 600, fontSize: r.highlight ? '1.1rem' : '0.88rem', color: r.highlight ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={handleReset}
              style={{ padding: '14px 32px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Xử lý xe tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: NGOẠI LỆ ── */}
      {showException && (
        <ExceptionPanel 
          session={selectedSession} 
          onClose={async () => {
            setShowException(false);
            if (selectedSession) {
              try {
                const fee = await calculateFee(selectedSession.id);
                setFeeInfo(fee);
              } catch (err) {}
            }
          }}
          onPenaltyApplied={async (penaltyFee) => {
            if (selectedSession) {
              try {
                const fee = await calculateFee(selectedSession.id);
                setFeeInfo(fee);
              } catch (err) {}
            }
          }}
        />
      )}
    </div>
  );
}
