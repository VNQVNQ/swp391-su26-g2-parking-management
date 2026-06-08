import { useState } from "react";
import type { ParkingSession, VehicleType } from "../../types/staff.types";
import {
  mockActiveSessions,
  RATE_PER_HOUR,
  MINIMUM_FEE,
  LOST_TICKET_SURCHARGE,
} from "../../data/mockStaff";

// ── Helpers ──────────────────────────────────────────────────────────────────
// BR-01: ceil((exit-entry)/60) × ratePerHour, minimumFee nếu < 1h
function calcFee(entryTime: string, vehicleType: VehicleType): number {
  const diffMs    = Date.now() - new Date(entryTime).getTime();
  const diffHours = Math.ceil(diffMs / 3_600_000);
  const rate      = RATE_PER_HOUR[vehicleType];
  const minFee    = MINIMUM_FEE[vehicleType];
  return Math.max(diffHours * rate, minFee);
}

function formatDuration(entryTime: string): string {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} day ${h % 24} hr ${m} min`;
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
    + ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const VEHICLE_ICON: Record<VehicleType, string> = {
  MOTORBIKE: "🏍️",
  CAR:       "🚗",
  TRUCK:     "🚛",
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
function StatsSidebar({
  exited, parked, faceData, overstay,
}: { exited: number; parked: number; faceData: number; overstay: number }) {
  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* Today's Statistics */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Today's Statistics</h3>
        <div className="space-y-3">
          {[
            { label: "Vehicles Exited",  value: exited,   badge: null,                  color: "text-white" },
            { label: "Currently Parked", value: parked,   badge: null,                  color: "text-white" },
            { label: "With Face Data",   value: faceData, badge: "👁",                  color: "text-white" },
            { label: "Overstay",         value: overstay, badge: null, danger: true,    color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-gray-500 text-sm flex items-center gap-1.5">
                {s.badge && <span className="text-gray-600">{s.badge}</span>}
                {s.label}
              </span>
              <span className={`font-bold text-sm ${
                s.danger && s.value > 0 ? "bg-red-600 text-white px-2 py-0.5 rounded text-xs" : "text-white"
              }`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Instructions</h3>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li>1. Enter license plate or select from list</li>
          <li>2. Verify identity (if face registered)</li>
          <li>3. Review information and parking fee</li>
          <li>4. Collect payment and confirm</li>
        </ol>
      </div>

      {/* Lost Ticket info */}
      <div className="bg-[#1a1000] border border-[#3d2800] rounded-xl p-5">
        <h3 className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2">
          🎫 Lost Ticket
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          For lost tickets, a surcharge of ₫50,000 applies. If the vehicle owner registered their face during entry,
          they can verify their identity to waive the surcharge.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type Mode   = "normal" | "lost-ticket";
type Step   = "find" | "payment" | "done" | "lost-find" | "lost-payment" | "lost-done";

export default function VehicleExit() {
  const [sessions, setSessions]   = useState<ParkingSession[]>(mockActiveSessions);
  const [exitedCount, setExited]  = useState(0);
  const [step, setStep]           = useState<Step>("find");
  const [_mode, setMode]          = useState<Mode>("normal");

  // Selected session
  const [session, setSession]     = useState<ParkingSession | null>(null);
  const [fee, setFee]             = useState(0);
  const [searchQuery, setSearch]  = useState("");
  const [lostQuery, setLostQuery] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const [exitTime, setExitTime]   = useState("");
  const [isLostTicket, setIsLost] = useState(false);

  // Stats
  const currentlyParked = sessions.length;
  const overstayCount   = sessions.filter((s) => s.status === "OVERSTAY").length;
  const faceDataCount   = sessions.filter((s) => s.hasFaceData).length;

  // Select vehicle from list
  const selectSession = (s: ParkingSession) => {
    const calculatedFee = calcFee(s.entryTime, s.vehicleType);
    setSession(s);
    setFee(calculatedFee);
    setIsLost(false);
    setStep("payment");
  };

  // Search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const found = sessions.find((s) =>
      s.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!found) { setError("Không tìm thấy xe đang đỗ"); return; }
    setError("");
    selectSession(found);
  };

  // Lost ticket search
  const handleLostSearch = () => {
    if (!lostQuery.trim()) { setError("Vui lòng nhập biển số"); return; }
    const found = sessions.find((s) =>
      s.licensePlate.toLowerCase().includes(lostQuery.toLowerCase())
    );
    if (!found) { setError("Không tìm thấy xe"); return; }
    setError("");
    const parkingFee = calcFee(found.entryTime, found.vehicleType);
    setSession(found);
    setFee(parkingFee + LOST_TICKET_SURCHARGE);
    setIsLost(true);
    setStep("lost-payment");
  };

  // Process payment
  const handlePayment = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      // Update mock
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      setExited((n) => n + 1);
      setReceiptId(String(Math.floor(Math.random() * 90000000 + 10000000)));
      setExitTime(new Date().toLocaleString("en-US", {
        month: "2-digit", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      }));
      setStep(isLostTicket ? "lost-done" : "done");
    } catch {
      setError("Thanh toán thất bại. Thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("find"); setMode("normal"); setSession(null);
    setFee(0); setSearch(""); setLostQuery(""); setError("");
    setIsLost(false);
  };

  const totalFee    = isLostTicket ? fee : fee;
  const parkingFee  = isLostTicket ? fee - LOST_TICKET_SURCHARGE : fee;

  return (
    <div className="min-h-screen bg-[#080d08] text-white">
      <div className="p-6 max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#00c853]">→</span> Vehicle Exit
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Process vehicle exit and parking payment</p>
        </div>

        <div className="flex gap-6">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* ════ STEP: FIND ════ */}
            {step === "find" && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Step 1: Find Vehicle</h2>
                <p className="text-xs text-gray-500 mb-5">Enter license plate or select from list</p>

                {/* Search */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">Search</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-gray-600 text-sm">🔍</span>
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearch(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Enter license plate (e.g., 30A-123.45)"
                        className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-[#00c853]/50 font-mono transition"
                      />
                    </div>
                    <button onClick={handleSearch}
                      className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2">
                      🔍 Search
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs mt-2">⚠️ {error}</p>}
                </div>

                {/* Lost Ticket Banner */}
                <button
                  onClick={() => { setStep("lost-find"); setMode("lost-ticket"); setError(""); }}
                  className="w-full bg-[#1a1000] border border-[#3d2800] hover:border-amber-600/50 rounded-xl px-5 py-3.5 flex items-center justify-between mb-5 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 text-lg">🎫</span>
                    <div className="text-left">
                      <p className="text-amber-400 font-semibold text-sm">Lost Ticket?</p>
                      <p className="text-gray-500 text-xs">Use face verification or pay surcharge</p>
                    </div>
                  </div>
                  <span className="text-amber-400 text-xs font-semibold group-hover:underline">
                    Report Lost Ticket
                  </span>
                </button>

                {/* Vehicle list */}
                <p className="text-xs text-gray-500 mb-3">
                  Or select from parked vehicles ({sessions.length})
                </p>
                <div className="space-y-2">
                  {sessions.map((s) => {
                    const isOverstay   = s.status === "OVERSTAY";
                    const isMonthly    = s.hasMonthlyPass;
                    return (
                      <button key={s.id} onClick={() => selectSession(s)}
                        className="w-full flex items-center gap-4 bg-[#080d08] hover:bg-[#0f1a0f] border border-[#1e2a1e] hover:border-[#2a3d2a] rounded-xl px-5 py-3.5 transition text-left">
                        <span className="text-xl flex-shrink-0">{VEHICLE_ICON[s.vehicleType]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono font-semibold text-sm">{s.licensePlate}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {s.slotCode} · Entered at {new Date(s.entryTime).toLocaleTimeString("en-US", {
                              hour: "2-digit", minute: "2-digit", hour12: true,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium ${isOverstay ? "text-red-400" : "text-gray-400"}`}>
                            {formatDuration(s.entryTime)}
                          </span>
                          {isMonthly && (
                            <span className="bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30 text-xs font-bold px-2 py-0.5 rounded">
                              Monthly Pass
                            </span>
                          )}
                          {isOverstay && (
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                              Overstay
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {sessions.length === 0 && (
                    <p className="text-center text-gray-600 py-8 text-sm">Không có xe nào đang đỗ</p>
                  )}
                </div>
              </div>
            )}

            {/* ════ STEP: PAYMENT (Normal) ════ */}
            {step === "payment" && session && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Step 3: Payment</h2>
                <p className="text-xs text-gray-500 mb-5">Confirm information and collect fee</p>

                {/* Vehicle card */}
                <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#1e2a1e]">
                    <span className="text-2xl">{VEHICLE_ICON[session.vehicleType]}</span>
                    <div>
                      <p className="text-white font-mono font-bold text-lg">{session.licensePlate}</p>
                      <p className="text-gray-500 text-xs">{session.ownerName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Parking Location</p>
                      <p className="text-white font-semibold">{session.slotCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
                      <span className="bg-[#1e2a1e] text-gray-300 text-xs px-2 py-0.5 rounded">
                        {session.ticketType === "HOURLY" ? "Hourly" : session.ticketType === "DAILY" ? "Daily" : "Monthly"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                      <p className="text-white text-sm">{formatDateTime(session.entryTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Exit Time</p>
                      <p className="text-white text-sm">{formatDateTime(new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>🕐</span>
                    <span className="text-xs">Parking Duration</span>
                  </div>
                  <p className="text-white font-bold text-lg mt-1">{formatDuration(session.entryTime)}</p>
                </div>

                {/* Total Fee */}
                <div className="bg-[#001a0a] border border-[#00c853]/20 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[#00c853] text-sm font-semibold flex items-center gap-2">
                      💳 Total Fee
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">VAT included</p>
                  </div>
                  <p className="text-[#00c853] font-bold text-2xl">
                    ₫{fee.toLocaleString("vi-VN")}
                  </p>
                </div>

                {error && <p className="text-red-400 text-xs mb-3">⚠️ {error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep("find")}
                    className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-lg text-sm transition">
                    Back
                  </button>
                  <button onClick={handlePayment} disabled={loading}
                    className="flex-1 bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 text-black font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2">
                    {loading
                      ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>
                      : "💳 Process Payment"}
                  </button>
                </div>
              </div>
            )}

            {/* ════ STEP: DONE (Normal) ════ */}
            {step === "done" && session && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-8">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/40 flex items-center justify-center">
                    <span className="text-[#00c853] text-xl">✓</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white text-center mb-1">Payment Successful!</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Thank you for using our service</p>

                {/* Receipt */}
                <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2a1e]">
                    <span className="text-[#00c853] text-sm font-semibold flex items-center gap-2">
                      🧾 Payment Receipt
                    </span>
                    <span className="text-gray-600 text-xs font-mono">#{receiptId}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "License Plate",    value: session.licensePlate, mono: true },
                      { label: "Parking Duration", value: formatDuration(session.entryTime) },
                      { label: "Payment Time",     value: exitTime },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r.label}</span>
                        <span className={`text-white font-medium ${r.mono ? "font-mono" : ""}`}>{r.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-[#1e2a1e]">
                      <span className="text-white font-bold">Total Amount</span>
                      <span className="text-[#00c853] font-bold text-base">₫{fee.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleReset}
                  className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
                  🔄 Process Next Vehicle
                </button>
              </div>
            )}

            {/* ════ LOST TICKET: FIND ════ */}
            {step === "lost-find" && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  🎫 Lost Ticket - Find Vehicle
                </h2>
                <p className="text-xs text-gray-500 mb-5">Enter the vehicle license plate to verify ownership</p>

                {/* Warning */}
                <div className="bg-[#1a1000] border border-[#3d2800] rounded-xl px-4 py-3 mb-5">
                  <p className="text-amber-400 text-xs leading-relaxed">
                    <span className="font-bold">Note:</span> A surcharge of ₫50,000 will be applied for lost tickets.
                    If face verification is successful, the surcharge will be waived.
                  </p>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    License Plate Number <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-gray-600 text-sm">🔍</span>
                      <input
                        value={lostQuery}
                        onChange={(e) => setLostQuery(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleLostSearch()}
                        placeholder="Enter license plate (e.g., 30A-123.45)"
                        className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-[#00c853]/50 font-mono transition"
                      />
                    </div>
                    <button onClick={handleLostSearch}
                      className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2">
                      🔍 Find
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs mt-2">⚠️ {error}</p>}
                </div>

                <button onClick={() => { setStep("find"); setError(""); }}
                  className="w-full bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-lg text-sm transition">
                  Back to Normal Exit
                </button>
              </div>
            )}

            {/* ════ LOST TICKET: PAYMENT ════ */}
            {step === "lost-payment" && session && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Lost Ticket - Payment</h2>
                <p className="text-xs text-gray-500 mb-5">Confirm information and collect fee</p>

                {/* Lost ticket warning */}
                <div className="bg-[#1a1000] border border-[#3d2800] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                  <span className="text-amber-400">⚠️</span>
                  <div>
                    <p className="text-amber-400 text-sm font-semibold">Lost Ticket</p>
                    <p className="text-amber-600 text-xs">Surcharge of ₫50,000 applied</p>
                  </div>
                </div>

                {/* Vehicle card */}
                <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#1e2a1e]">
                    <span className="text-2xl">{VEHICLE_ICON[session.vehicleType]}</span>
                    <div>
                      <p className="text-white font-mono font-bold text-lg">{session.licensePlate}</p>
                      <p className="text-gray-500 text-xs">{session.ownerName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Parking Location</p>
                      <p className="text-white font-semibold">{session.slotCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
                      <span className="bg-[#1e2a1e] text-gray-300 text-xs px-2 py-0.5 rounded">
                        {session.ticketType === "HOURLY" ? "Hourly" : "Monthly"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                      <p className="text-white text-sm">{formatDateTime(session.entryTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Exit Time</p>
                      <p className="text-white text-sm">{formatDateTime(new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-xs">🕐 Parking Duration</span>
                  </div>
                  <p className="text-white font-bold text-lg mt-1">{formatDuration(session.entryTime)}</p>
                </div>

                {/* Fee breakdown */}
                <div className="bg-[#001a0a] border border-[#00c853]/20 rounded-xl px-5 py-4 mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Parking Fee</span>
                    <span className="text-white">₫{parkingFee.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3 pb-3 border-b border-[#1e2a1e]">
                    <span className="text-gray-400">Lost Ticket Surcharge</span>
                    <span className="text-amber-400">₫{LOST_TICKET_SURCHARGE.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#00c853] text-sm font-semibold flex items-center gap-2">
                      💳 Total Fee
                    </p>
                    <p className="text-[#00c853] font-bold text-2xl">
                      ₫{totalFee.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">VAT included</p>
                </div>

                {error && <p className="text-red-400 text-xs mb-3">⚠️ {error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep("lost-find")}
                    className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-lg text-sm transition">
                    Back
                  </button>
                  <button onClick={handlePayment} disabled={loading}
                    className="flex-1 bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 text-black font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2">
                    {loading
                      ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>
                      : "💳 Process Payment"}
                  </button>
                </div>
              </div>
            )}

            {/* ════ LOST TICKET: DONE ════ */}
            {(step === "lost-done") && session && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-8">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/40 flex items-center justify-center">
                    <span className="text-[#00c853] text-xl">✓</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white text-center mb-1">Payment Successful!</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Thank you for using our service</p>

                <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2a1e]">
                    <span className="text-[#00c853] text-sm font-semibold">🧾 Payment Receipt</span>
                    <span className="text-gray-600 text-xs font-mono">#{receiptId}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "License Plate",    value: session.licensePlate, mono: true },
                      { label: "Parking Duration", value: formatDuration(session.entryTime) },
                      { label: "Payment Time",     value: exitTime },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r.label}</span>
                        <span className={`text-white font-medium ${r.mono ? "font-mono" : ""}`}>{r.value}</span>
                      </div>
                    ))}
                    {/* Lost ticket row */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lost Ticket</span>
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded font-semibold">
                        Surcharge Applied
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-[#1e2a1e]">
                      <span className="text-white font-bold">Total Amount</span>
                      <span className="text-[#00c853] font-bold text-base">₫{totalFee.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleReset}
                  className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
                  🔄 Process Next Vehicle
                </button>
              </div>
            )}

          </div>

          {/* ── Sidebar ── */}
          <StatsSidebar
            exited={exitedCount}
            parked={currentlyParked}
            faceData={faceDataCount}
            overstay={overstayCount}
          />

        </div>
      </div>
    </div>
  );
}
