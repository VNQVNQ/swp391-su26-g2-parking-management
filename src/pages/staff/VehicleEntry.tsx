import { useState, useRef, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';

// ── Icons ─────────────────────────────────────────────────────────────────────
function MotorbikeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>
      <path d="M12 17h-7"/><path d="M19 17h-2l-3-6h-4l-1 3"/><path d="M17 11l-1-4h-2"/><path d="M9 7h4"/>
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  );
}

const VEHICLE_TYPES = [
  { id: 'Motorbike', label: 'Motorbike', icon: <MotorbikeIcon /> },
  { id: 'Car',       label: 'Car',       icon: <CarIcon /> },
  { id: 'Truck',     label: 'Truck',     icon: <TruckIcon /> },
];

const STEPS = [
  { num: 1, label: 'Vehicle Info'      },
  { num: 2, label: 'Face Registration' },
  { num: 3, label: 'Confirm'           },
  { num: 4, label: 'Complete'          },
];

function getSlotLocation(slot: string) {
  if (!slot) return 'Unknown';
  const prefix = slot.split('-')[0];
  const map: Record<string,string> = { A:'Basement 1', B:'Basement 1', C:'Basement 2', D:'Basement 2', E:'Floor 1', F:'Floor 1', G:'Floor 2', H:'Floor 2' };
  return map[prefix] || 'Floor 1';
}

export default function VehicleEntry() {
  const store = useParkingStore() as any;
  const [step,         setStep]         = useState(1);
  const [plate,        setPlate]        = useState('');
  const [vehicleType,  setVehicleType]  = useState('');
  const [ticketType,   setTicketType]   = useState('hourly');
  const [ownerName,    setOwnerName]    = useState('');
  const [faceReg,      setFaceReg]      = useState(false);
  const [assignedSlot, setAssignedSlot] = useState('');
  const [assignedFloor,setAssignedFloor]= useState('');
  const [entryTime,    setEntryTime]    = useState('');
  const [error,        setError]        = useState('');
  const [camError,     setCamError]     = useState('');
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);

  const isStep1Valid = plate.trim() !== '' && vehicleType !== '' && ownerName.trim() !== '';

  const startCamera = async () => {
    try {
      setCamError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      setCamError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'No camera found.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (step === 2) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  const handleConfirm = () => {
    const result = store.registerVehicle({ plate: plate.trim(), type: vehicleType, owner: ownerName.trim(), ticketType, faceRegistered: faceReg });
    if (!result.success) { setError(result.error); return; }
    setAssignedSlot(result.slot);
    setAssignedFloor(result.floor || getSlotLocation(result.slot));
    setEntryTime(new Date().toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }));
    setStep(4);
  };

  const reset = () => { setStep(1); setPlate(''); setVehicleType(''); setTicketType('hourly'); setOwnerName(''); setFaceReg(false); setAssignedSlot(''); setEntryTime(''); setError(''); };

  const floorData = store.getFloorStats;

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🚗 Vehicle Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Register a new vehicle entering the parking facility</p>
      </div>

      <div className="flex gap-6">
        {/* ── Main ── */}
        <div className="flex-1 min-w-0">

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num ? 'bg-[#00c853] text-black ring-4 ring-[#00c853]/20' :
                    step > s.num  ? 'bg-[#00c853] text-black' : 'bg-[#1e2a1e] text-gray-500'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap ${step === s.num ? 'text-[#00c853]' : 'text-gray-600'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-12 h-0.5 mx-1 mb-4 ${step > s.num ? 'bg-[#00c853]' : 'bg-[#1e2a1e]'}`} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Step 1: Enter Vehicle Information</h2>

              {/* License Plate */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">License Plate <span className="text-red-400">*</span></label>
                <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="e.g. 79H-113.56"
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"/>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-2">Vehicle Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v.id} type="button" onClick={() => setVehicleType(v.id)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-xl border transition-all ${
                        vehicleType === v.id ? 'border-[#00c853] bg-[#00c853]/5 text-[#00c853]' : 'border-[#1e2a1e] text-gray-500 hover:border-[#2a3d2a]'
                      }`}>
                      {v.icon}
                      <span className="text-sm font-medium">{v.label}</span>
                      <span className="text-xs">{store.getVehicleAvailability(v.id)} available</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket Type */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Ticket Type</label>
                <div className="relative">
                  <select value={ticketType} onChange={e => setTicketType(e.target.value)}
                    className="w-full appearance-none bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00c853]/50 cursor-pointer">
                    <option value="hourly">Hourly Ticket (per hour)</option>
                    <option value="daily">Daily Ticket (per day)</option>
                  </select>
                  <span className="absolute right-3 top-3.5 text-gray-600 pointer-events-none">▾</span>
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Owner Name <span className="text-red-400">*</span></label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Enter owner name"
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"/>
              </div>

              <button type="button" disabled={!isStep1Valid} onClick={() => setStep(2)}
                className="w-full bg-[#00c853] hover:bg-[#00e060] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Step 2: Face Registration</h2>
              <p className="text-xs text-gray-500">Face data is securely stored and only used for identity verification in case of lost ticket.</p>

              {camError && <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3 text-xs text-red-400">⚠️ {camError}</div>}

              <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl overflow-hidden relative" style={{ minHeight: 320 }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!streamRef.current && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <span className="text-5xl mb-2 opacity-30">📷</span>
                    <span className="text-sm">Camera is off</span>
                  </div>
                )}
                {faceReg && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#00c853] text-black text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Face Captured
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setFaceReg(true)}
                className="w-full bg-[#00c853]/10 hover:bg-[#00c853]/20 border border-[#00c853]/30 text-[#00c853] font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                📷 {faceReg ? 'Retake Photo' : 'Capture Face'}
              </button>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-xl transition">
                  ← Back
                </button>
                <button type="button" onClick={() => { setFaceReg(false); setStep(3); }}
                  className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl transition">
                  {faceReg ? 'Continue →' : 'Skip →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">Step 3: Confirm Information</h2>
              <p className="text-xs text-gray-500 mb-5">Review the details below before confirming vehicle entry.</p>

              {error && <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3 text-xs text-red-400 mb-4">⚠️ {error}</div>}

              <div className="border border-[#1e2a1e] rounded-xl overflow-hidden mb-5">
                {[
                  { label: 'License Plate',     value: plate,                                            mono: true },
                  { label: 'Vehicle Type',       value: vehicleType },
                  { label: 'Ticket Type',        value: ticketType === 'hourly' ? 'Hourly Ticket' : 'Daily Ticket' },
                  { label: 'Assigned Slot',      value: 'Auto-assigned on confirm' },
                  { label: 'Face Registration',  value: faceReg ? '✅ Registered' : 'Not registered' },
                  { label: 'Owner Name',         value: ownerName },
                ].map((r, i) => (
                  <div key={r.label} className={`flex justify-between items-center px-5 py-3.5 ${i < 5 ? 'border-b border-[#1e2a1e]' : ''}`}>
                    <span className="text-gray-500 text-sm">{r.label}</span>
                    <span className={`text-white font-semibold text-sm ${r.mono ? 'font-mono' : ''}`}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-xl transition">
                  ← Back
                </button>
                <button type="button" onClick={handleConfirm}
                  className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  ✓ Confirm Entry
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center">
                  <span className="text-[#00c853] text-2xl">✓</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Registration Successful!</h2>
              <p className="text-sm text-gray-500 mb-6">The vehicle has been registered and a parking slot has been assigned.</p>

              <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 text-left space-y-3 mb-6">
                {[
                  { label: 'License Plate', value: plate },
                  { label: 'Location',      value: `${assignedFloor} — Slot ${assignedSlot}` },
                  { label: 'Entry Time',    value: entryTime },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="text-white font-medium">{r.value}</span>
                  </div>
                ))}
              </div>

              <button type="button" onClick={reset}
                className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-xl transition">
                ➕ Register New Vehicle
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Slot Status */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Slot Status</h3>
            <div className="space-y-4">
              {floorData.map((floor: any, i: number) => {
                const pct = Math.round(((floor.total - floor.available) / floor.total) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{floor.name}</span>
                      <span className="text-gray-500">{floor.available}/{floor.total}</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2a1e] rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-[#00c853] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Instructions</h3>
            <ol className="space-y-2 text-xs text-gray-500">
              {['Enter license plate & vehicle info', 'Capture face for verification (optional)', 'Review and confirm information', 'Registration complete'].map((t, i) => (
                <li key={i} className={`${step === i + 1 ? 'text-[#00c853] font-semibold' : step > i + 1 ? 'text-gray-700 line-through' : ''}`}>
                  {i + 1}. {t}
                </li>
              ))}
            </ol>
          </div>

          {/* Face Recognition info */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="text-[#00c853]">👁</span> Face Recognition
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Face registration helps verify vehicle owner identity in case of lost ticket. Data is securely stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
