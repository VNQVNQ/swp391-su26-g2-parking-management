import { useState, useRef, useEffect } from 'react';
import { validateVehicle, getZones, getAvailableSlots, createSession } from '../../services/sessionApi';

// ── Vehicle type options ──────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', label: 'Motorbike', icon: '🏍️' },
  { id: 'CAR',       label: 'Car',       icon: '🚗' },
  { id: 'TRUCK',     label: 'Truck',     icon: '🚛' },
];

const STEPS = [
  { num: 1, label: 'Vehicle Info'      },
  { num: 2, label: 'Select Zone'       },
  { num: 3, label: 'Face Registration' },
  { num: 4, label: 'Confirm'           },
  { num: 5, label: 'Complete'          },
];

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
      setCamError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'No camera found.');
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
      // Bỏ dấu chấm — BE regex không chấp nhận dấu chấm
      const cleanPlate = plate.trim().replace('.', '').toUpperCase();
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
      const cleanPlate = plate.trim().replace('.', '').toUpperCase();
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
      const cleanPlate = plate.trim().replace('.', '').toUpperCase();
      const result = await createSession(cleanPlate, selectedZone.id);
      setSessionResult(result);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo session. Thử lại.');
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
      <div className="page-header">
        <h2>🚗 Vehicle Entry</h2>
        <p>Register a new vehicle entering the parking facility</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step === s.num ? 'var(--accent-primary)' : step > s.num ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: `2px solid ${step >= s.num ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step >= s.num ? '#000' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700,
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.7rem', color: step === s.num ? 'var(--accent-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 40, height: 2, background: step > s.num ? 'var(--accent-primary)' : 'var(--border-color)', margin: '0 4px', marginBottom: 16 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* ── Main content ── */}
        <div>

          {/* STEP 1 — Nhập biển số */}
          {step === 1 && (
            <div className="card">
              <div className="card-title">Step 1: Enter Vehicle Information</div>
              {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
              <div className="form-group">
                <label className="form-label">License Plate <span className="required">*</span></label>
                <div className="form-input-wrapper">
                  <input type="text" className="form-input"
                    placeholder="e.g. 51G-12345"
                    value={plate}
                    onChange={e => setPlate(e.target.value.toUpperCase())} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Format: 51G-12345 hoặc 30A-B9999 (BE không nhận dấu chấm)
                </p>
              </div>
              <button className="btn-primary" onClick={handleValidate} disabled={loading}>
                <span>{loading ? 'Đang kiểm tra...' : 'Continue →'}</span>
              </button>
            </div>
          )}

          {/* STEP 2 — Chọn zone */}
          {step === 2 && (
            <div className="card">
              <div className="card-title">Step 2: Select Parking Zone</div>
              {vehicleInfo?.foundVehicle && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#10b981' }}>
                  ✓ Xe đã có trong hệ thống — {vehicleInfo.licensePlate}
                </div>
              )}
              {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Đang tải zones...</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {filteredZones.map(zone => (
                  <button key={zone.id} onClick={() => handleSelectZone(zone)}
                    className="vehicle-type-card"
                    style={{ textAlign: 'left', padding: '16px' }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{zone.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{zone.floorName} · {zone.vehicleType}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', marginTop: 4, fontWeight: 600 }}>
                      {zone.availableSlots ?? '?'} slot trống / {zone.totalSlots}
                    </p>
                  </button>
                ))}
                {filteredZones.length === 0 && !loading && (
                  <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '20px 0' }}>
                    Không có zone phù hợp
                  </p>
                )}
              </div>
              <button onClick={() => setStep(1)} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          )}

          {/* STEP 3 — Camera */}
          {step === 3 && (
            <div className="card">
              <div className="card-title">Step 3: Face Registration (Optional)</div>
              {camError && <div className="error-banner" style={{ marginBottom: 12 }}>⚠️ {camError}</div>}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!streamRef.current && <span style={{ color: 'var(--text-muted)', fontSize: '3rem' }}>📷</span>}
              </div>
              {faceReg && <p style={{ color: 'var(--accent-primary)', textAlign: 'center', marginBottom: 12 }}>✓ Face Captured</p>}
              <button className="btn-secondary" onClick={() => setFaceReg(true)} style={{ marginBottom: 12, width: '100%' }}>
                📷 {faceReg ? 'Retake' : 'Capture Face'}
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={() => setStep(4)} style={{ flex: 1 }}>
                  {faceReg ? 'Continue →' : 'Skip →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 4 && (
            <div className="card">
              <div className="card-title">Step 4: Confirm Information</div>
              {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20 }}>
                {[
                  { label: 'License Plate', value: plate },
                  { label: 'Zone',          value: selectedZone?.name },
                  { label: 'Floor',         value: selectedZone?.floorName },
                  { label: 'Vehicle Type',  value: selectedZone?.vehicleType },
                  { label: 'Available Slots', value: availableSlots.length > 0 ? `${availableSlots.length} slots` : 'Auto-assign' },
                  { label: 'Face Registration', value: faceReg ? '✅ Registered' : 'Not registered' },
                ].map((r, i) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={handleConfirm} disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Đang xử lý...' : '✓ Confirm Entry'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Success */}
          {step === 5 && sessionResult && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Registration Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Vehicle has been checked in successfully</p>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'left', marginBottom: 24 }}>
                {[
                  { label: 'Session ID',    value: sessionResult.sessionId?.slice(0, 8) + '...' },
                  { label: 'License Plate', value: sessionResult.licensePlate },
                  { label: 'Slot',          value: sessionResult.slotCode },
                  { label: 'Zone',          value: sessionResult.zoneName },
                  { label: 'Floor',         value: sessionResult.floorName },
                  { label: 'Entry Time',    value: new Date(sessionResult.entryTime).toLocaleTimeString('vi-VN') },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={reset}>➕ Register New Vehicle</button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="right-sidebar">
          <div className="card">
            <div className="card-title">Instructions</div>
            <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 2 }}>
              {STEPS.map((s, i) => (
                <li key={s.num} style={{ color: step === s.num ? 'var(--accent-primary)' : step > s.num ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: step > s.num ? 'line-through' : 'none' }}>
                  {s.label}
                </li>
              ))}
            </ol>
          </div>
          {selectedZone && (
            <div className="card">
              <div className="card-title">Selected Zone</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedZone.name}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{selectedZone.floorName}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', marginTop: 8, fontWeight: 600 }}>
                {availableSlots.length} slots available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
