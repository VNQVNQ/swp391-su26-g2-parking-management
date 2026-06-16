import { useState, useEffect, useCallback } from 'react';
import { getActiveSessions, calculateFee, exitSession, processPayment } from '../../services/sessionApi';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

function calcDuration(entryTime) {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function VehicleExit() {
  const [step,           setStep]           = useState(1);
  const [sessions,       setSessions]       = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedSession,setSelectedSession]= useState(null);
  const [feeInfo,        setFeeInfo]        = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [receiptId,      setReceiptId]      = useState('');
  const [exitResult,     setExitResult]     = useState(null);

  // ── Load active sessions ───────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      console.log('Sessions data:', data); 
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading sessions:', err); 
      setSessions([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Filter sessions by search ─────────────────────────────────────────────
  const filtered = sessions.filter(s =>
    !searchQuery || s.vehicle?.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slot?.slotCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Select session → tính phí ─────────────────────────────────────────────
  const handleSelect = async (session) => {
    setSelectedSession(session);
    setLoading(true);
    try {
      const fee = await calculateFee(session.id);
      setFeeInfo(fee);
    } catch {
      setFeeInfo({ totalFee: 0, durationMinutes: 0 });
    } finally { setLoading(false); }
    setStep(2);
  };

  // ── Process exit + payment ────────────────────────────────────────────────
  const handlePayment = async () => {
    setError(''); setLoading(true);
    try {
      // 1. Exit session
      await exitSession(selectedSession.id, selectedSession.slot?.id);
      // 2. Process payment
      if (feeInfo?.totalFee > 0) {
        await processPayment(selectedSession.id, feeInfo.totalFee, 'CASH');
      }
      setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
      setExitResult({ session: selectedSession, fee: feeInfo });
      setStep(3);
      // Reload sessions
      loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý xe ra. Thử lại.');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setStep(1); setSelectedSession(null); setFeeInfo(null);
    setSearchQuery(''); setError(''); setExitResult(null);
    loadSessions();
  };

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🚪 Vehicle Exit</h2>
        <p>Process vehicle exit and parking payment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* ── Main ── */}
        <div>

          {/* STEP 1 — Danh sách xe đang đỗ */}
          {step === 1 && (
            <div className="card">
              <div className="card-title">Active Parking Sessions ({sessions.length})</div>

              {/* Search */}
              <div className="form-group">
                <div className="form-input-wrapper">
                  <input type="text" className="form-input"
                    placeholder="🔍 Search by license plate or slot..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value.toUpperCase())} />
                </div>
              </div>

              {error && <div className="error-banner" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

              {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Loading sessions...</p>}

              {/* Session list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(session => {
                  const plate = session.vehicle?.licensePlate || session.licensePlate || '—';
                  const slot  = session.slot?.slotCode || session.slotCode || '—';
                  const entry = session.entryTime;
                  const type  = session.vehicle?.vehicleType || session.vehicleType || 'CAR';

                  return (
                    <button key={session.id} onClick={() => handleSelect(session)}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                      <span style={{ fontSize: 24 }}>{VEHICLE_ICON[type] || '🚗'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{plate}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Slot: {slot} · In: {entry ? formatTime(entry) : '—'}</p>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {entry ? calcDuration(entry) : '—'}
                      </span>
                    </button>
                  );
                })}

                {filtered.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>🅿️</p>
                    <p>No active sessions</p>
                    <button onClick={loadSessions} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#000', fontWeight: 600, cursor: 'pointer' }}>
                      🔄 Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && selectedSession && (
            <div className="card">
              <div className="card-title">Payment</div>
              {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

              {/* Vehicle info */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 28 }}>{VEHICLE_ICON[selectedSession.vehicle?.vehicleType] || '🚗'}</span>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      {selectedSession.vehicle?.licensePlate || selectedSession.licensePlate}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Slot: {selectedSession.slot?.slotCode || selectedSession.slotCode}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Entry Time',  value: selectedSession.entryTime ? formatTime(selectedSession.entryTime) : '—' },
                    { label: 'Duration',    value: selectedSession.entryTime ? calcDuration(selectedSession.entryTime) : '—' },
                    { label: 'Zone',        value: selectedSession.slot?.zone?.name || '—' },
                    { label: 'Floor',       value: selectedSession.slot?.floor?.name || '—' },
                  ].map(r => (
                    <div key={r.label} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.label}</p>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee */}
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.88rem' }}>💳 Total Fee</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {feeInfo?.durationMinutes ? `${feeInfo.durationMinutes} minutes` : ''}
                  </p>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--accent-primary)' }}>
                  ₫{(feeInfo?.totalFee || 0).toLocaleString('vi-VN')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={handlePayment} disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Processing...' : '💳 Process Payment'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Receipt */}
          {step === 3 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div className="modal-icon success" style={{ margin: '0 auto 20px' }}>✓</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Payment Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Thank you for using our service</p>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'left', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>🧾 Receipt #{receiptId}</span>
                </div>
                {[
                  { label: 'License Plate', value: exitResult?.session?.vehicle?.licensePlate || '—' },
                  { label: 'Total Fee',     value: `₫${(exitResult?.fee?.totalFee || 0).toLocaleString('vi-VN')}` },
                  { label: 'Payment',       value: 'CASH' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={reset}>🔄 Process Next Vehicle</button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="right-sidebar">
          <div className="card">
            <div className="card-title">Today's Statistics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Currently Parked</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{sessions.length}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Instructions</div>
            <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 2 }}>
              <li>Select vehicle from list</li>
              <li>Review parking fee</li>
              <li>Collect payment</li>
              <li>Confirm exit</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
