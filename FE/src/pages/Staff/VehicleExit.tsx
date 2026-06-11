import { useState, useMemo } from 'react';
import { useParkingStore } from '../../store/parkingStore';

const LOST_TICKET_SURCHARGE = 50_000;

function calcDuration(entryDate: Date | string) {
  const entry = entryDate instanceof Date ? entryDate : new Date(entryDate);
  const ms = Date.now() - entry.getTime();
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return { display: `${m} min`, total: mins };
  if (m === 0) return { display: `${h} hr`, total: h * 60 };
  return { display: `${h} hr ${m} min`, total: mins };
}

function formatTime(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const VEHICLE_ICON: Record<string, string> = { Car: '🚗', Motorbike: '🏍️', Truck: '🚛' };

export default function VehicleExit() {
  const store = useParkingStore() as any;
  const [step,          setStep]          = useState(1);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [lostQuery,     setLostQuery]     = useState('');
  const [selectedV,     setSelectedV]     = useState<any>(null);
  const [isLost,        setIsLost]        = useState(false);
  const [isLostPayment, setIsLostPayment] = useState(false);
  const [receiptId,     setReceiptId]     = useState('');
  const [exitedAt,      setExitedAt]      = useState('');

  const parkedVehicles = useMemo(() =>
    store.vehicles.map((v: any) => ({ ...v, duration: calcDuration(v.entryTime) })),
  [store.vehicles]);

  const fee        = selectedV ? store.calculateFee(selectedV) : 0;
  const overstayFee = selectedV ? store.getOverstayPenalty(selectedV) : 0;
  const totalFee   = fee + (isLostPayment ? LOST_TICKET_SURCHARGE : 0) + overstayFee;

  const handleSearch = () => {
    const found = parkedVehicles.find((v: any) => v.plate.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!found) { alert('Vehicle not found'); return; }
    setSelectedV(found);
    setIsLostPayment(false);
    setStep(3);
  };

  const handleLostSearch = () => {
    const found = parkedVehicles.find((v: any) => v.plate.toLowerCase().includes(lostQuery.toLowerCase()));
    if (!found) { alert('Vehicle not found'); return; }
    setSelectedV(found);
    setIsLostPayment(true);
    setStep(3);
  };

  const handleSelectFromList = (v: any) => {
    if (v.hasPass) { alert(`${v.plate} has a Monthly Pass — no fee required.`); }
    setSelectedV(v); setIsLostPayment(false); setStep(3);
  };

  const handlePayment = () => {
    const result = store.exitVehicle(selectedV.plate, totalFee, isLostPayment);
    if (!result.success) { alert(result.error); return; }
    setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
    setExitedAt(new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }));
    setStep(4);
  };

  const reset = () => { setStep(1); setSearchQuery(''); setLostQuery(''); setSelectedV(null); setIsLost(false); setIsLostPayment(false); };

  const overstayCount = parkedVehicles.filter((v: any) => v.overstay).length;
  const withFaceData  = parkedVehicles.filter((v: any) => v.faceRegistered).length;

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🚪 Vehicle Exit</h1>
        <p className="text-sm text-gray-500 mt-1">Process vehicle exit and parking payment</p>
      </div>

      <div className="flex gap-6">
        {/* ── Main ── */}
        <div className="flex-1 min-w-0">

          {/* ── STEP 1: Find Vehicle ── */}
          {step === 1 && !isLost && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Step 1: Find Vehicle</h2>

              {/* Search */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Search</label>
                <div className="flex gap-2">
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter license plate (e.g., 30A-123.45)"
                    className="flex-1 bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"/>
                  <button onClick={handleSearch}
                    className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Lost Ticket Banner */}
              <button onClick={() => setIsLost(true)}
                className="w-full bg-[#1a1000] border border-[#3d2800] hover:border-amber-600/50 rounded-xl px-5 py-4 flex items-center justify-between transition">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 text-xl">🎫</span>
                  <div className="text-left">
                    <p className="text-amber-400 font-semibold text-sm">Lost Ticket?</p>
                    <p className="text-gray-500 text-xs">Use face verification or pay surcharge</p>
                  </div>
                </div>
                <span className="text-amber-400 text-xs font-semibold">Report Lost Ticket</span>
              </button>

              {/* Vehicle list */}
              <div>
                <p className="text-xs text-gray-500 mb-3">Or select from parked vehicles ({parkedVehicles.length})</p>
                <div className="space-y-2">
                  {parkedVehicles.map((v: any, i: number) => (
                    <button key={i} onClick={() => handleSelectFromList(v)}
                      className="w-full flex items-center gap-4 bg-[#080d08] hover:bg-[#0f1a0f] border border-[#1e2a1e] hover:border-[#2a3d2a] rounded-xl px-5 py-3.5 transition text-left">
                      <span className="text-xl">{VEHICLE_ICON[v.type] ?? '🚗'}</span>
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-white text-sm">{v.plate}</p>
                        <p className="text-xs text-gray-500">{v.slot} · Entered at {formatTime(v.entryTime)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${v.overstay ? 'text-red-400' : 'text-gray-400'}`}>{v.duration.display}</span>
                        {v.hasPass && <span className="text-xs bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30 px-2 py-0.5 rounded font-semibold">Monthly Pass</span>}
                        {v.overstay && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-semibold">Overstay</span>}
                      </div>
                    </button>
                  ))}
                  {parkedVehicles.length === 0 && (
                    <p className="text-center text-gray-600 py-8 text-sm">No vehicles currently parked</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── LOST TICKET FIND ── */}
          {step === 1 && isLost && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">🎫 Lost Ticket - Find Vehicle</h2>
              <div className="bg-[#1a1000] border border-amber-800/30 rounded-xl px-4 py-3">
                <p className="text-amber-400 text-xs leading-relaxed">
                  <span className="font-bold">Note:</span> A surcharge of ₫50,000 will be applied. If face verification is successful, the surcharge will be waived.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">License Plate Number <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input value={lostQuery} onChange={e => setLostQuery(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleLostSearch()}
                    placeholder="Enter license plate (e.g., 30A-123.45)"
                    className="flex-1 bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"/>
                  <button onClick={handleLostSearch}
                    className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-5 py-2.5 rounded-xl transition">
                    🔍 Find
                  </button>
                </div>
              </div>
              <button onClick={() => setIsLost(false)}
                className="w-full border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-xl transition text-sm">
                ← Back to Normal Exit
              </button>
            </div>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && selectedV && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">
                {isLostPayment ? '🎫 Lost Ticket - Payment' : 'Step 2: Payment'}
              </h2>

              {isLostPayment && (
                <div className="bg-[#1a1000] border border-amber-800/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-amber-400">⚠️</span>
                  <div>
                    <p className="text-amber-400 text-sm font-semibold">Lost Ticket</p>
                    <p className="text-amber-600 text-xs">Surcharge of ₫50,000 applied</p>
                  </div>
                </div>
              )}

              {/* Vehicle card */}
              <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#1e2a1e]">
                  <span className="text-2xl">{VEHICLE_ICON[selectedV.type] ?? '🚗'}</span>
                  <div>
                    <p className="font-mono font-bold text-white text-lg">{selectedV.plate}</p>
                    <p className="text-xs text-gray-500">{selectedV.owner}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Parking Location', value: selectedV.slot },
                    { label: 'Ticket Type',       value: selectedV.ticketType },
                    { label: 'Entry Time',         value: formatTime(selectedV.entryTime) },
                    { label: 'Exit Time',          value: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) },
                  ].map(r => (
                    <div key={r.label} className="bg-[#0d1117] rounded-xl p-3">
                      <p className="text-xs text-gray-500">{r.label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{r.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">🕐 Parking Duration</p>
                <p className="text-white font-bold text-lg">{selectedV.duration?.display ?? calcDuration(selectedV.entryTime).display}</p>
              </div>

              {/* Fee */}
              <div className="bg-[#001a0a] border border-[#00c853]/20 rounded-xl px-5 py-4">
                {isLostPayment || overstayFee > 0 ? (
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Parking Fee</span>
                      <span className="text-white">₫{fee.toLocaleString('vi-VN')}</span>
                    </div>
                    {isLostPayment && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Lost Ticket Surcharge</span>
                        <span className="text-amber-400">₫{LOST_TICKET_SURCHARGE.toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                    {overstayFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Overstay Penalty</span>
                        <span className="text-red-400">₫{overstayFee.toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                    <div className="border-t border-[#1e2a1e] pt-2" />
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <p className="text-[#00c853] text-sm font-semibold">💳 Total Fee<span className="text-gray-600 text-xs ml-2">VAT included</span></p>
                  <p className="text-[#00c853] font-bold text-2xl">₫{totalFee.toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setSelectedV(null); }}
                  className="flex-1 border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-xl transition text-sm">
                  ← Back
                </button>
                <button onClick={handlePayment}
                  className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                  💳 Process Payment
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 4 && selectedV && (
            <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center">
                  <span className="text-[#00c853] text-xl">✓</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Payment Successful!</h2>
              <p className="text-sm text-gray-500 mb-6">Thank you for using our service</p>

              <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 text-left space-y-3 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2a1e]">
                  <span className="text-[#00c853] text-sm font-semibold">🧾 Payment Receipt</span>
                  <span className="text-gray-600 text-xs font-mono">#{receiptId}</span>
                </div>
                {[
                  { label: 'License Plate',    value: selectedV.plate },
                  { label: 'Parking Duration', value: selectedV.duration?.display ?? '' },
                  { label: 'Payment Time',     value: exitedAt },
                  ...(isLostPayment ? [{ label: 'Lost Ticket', value: 'Surcharge Applied' }] : []),
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="text-white font-medium">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-[#1e2a1e]">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-[#00c853] font-bold text-base">₫{totalFee.toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <button onClick={reset}
                className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-xl transition">
                🔄 Process Next Vehicle
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Today's Statistics</h3>
            <div className="space-y-3">
              {[
                { label: "Vehicles Exited",  value: store.exitedVehicles.length, danger: false },
                { label: "Currently Parked", value: store.vehicles.length,       danger: false },
                { label: "With Face Data",   value: withFaceData,                danger: false },
                { label: "Overstay",         value: overstayCount,               danger: true  },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{s.label}</span>
                  <span className={s.danger && s.value > 0 ? 'bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded' : 'text-white font-bold'}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Instructions</h3>
            <ol className="space-y-1.5 text-xs text-gray-500">
              <li>1. Enter license plate or select from list</li>
              <li>2. Verify identity (if face registered)</li>
              <li>3. Review information and parking fee</li>
              <li>4. Collect payment and confirm</li>
            </ol>
          </div>

          <div className="bg-[#1a1000] border border-[#3d2800] rounded-xl p-5">
            <h3 className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2">🎫 Lost Ticket</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              For lost tickets, a surcharge of ₫50,000 applies. If the vehicle owner registered their face during entry, they can verify their identity to waive the surcharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
