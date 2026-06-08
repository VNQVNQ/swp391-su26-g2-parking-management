import { useState, useRef, useEffect, useCallback } from "react";
import type { VehicleType, ParkingSlot } from "../../types/staff.types";
import {
  
  mockSlotsByFloor,
  getFloorSummaries,
  autoAssignSlot,
} from "../../data/mockStaff";

// ── Types ────────────────────────────────────────────────────────────────────
type TicketType = "HOURLY" | "DAILY" | "MONTHLY";
type Step = 1 | 2 | 3 | 4;

interface FormData {
  licensePlate: string;
  vehicleType: VehicleType | null;
  ticketType: TicketType;
  ownerName: string;
}

// ── Available count per vehicleType ─────────────────────────────────────────
function getAvailableCount(vehicleType: VehicleType): number {
  return Object.values(mockSlotsByFloor)
    .flat()
    .filter((s) => s.status === "FREE" && s.vehicleType === vehicleType)
    .length;
}

// ── Sidebar: Slot Status ─────────────────────────────────────────────────────
function SlotStatusSidebar() {
  const summaries = getFloorSummaries();
  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* Slot Status card */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Slot Status</h3>
        <div className="space-y-4">
          {summaries.map(({ floor, occupied, motorbike, car }) => (
            <div key={floor.id} className="border-b border-[#1e2a1e] pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">{floor.name}</span>
                <span className="text-gray-400 text-xs">{occupied}/{floor.totalSlots}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-[#1e2a1e] rounded-full mb-2">
                <div
                  className="h-full bg-[#00c853] rounded-full transition-all"
                  style={{ width: `${(occupied / floor.totalSlots) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span>🏍️</span> {motorbike}
                </span>
                <span className="flex items-center gap-1">
                  <span>🚗</span> {car}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Instructions</h3>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li>1. Enter license plate in correct format</li>
          <li>2. Select appropriate vehicle type</li>
          <li>3. Capture face for verification (optional)</li>
          <li>4. Confirm to complete registration</li>
        </ol>
      </div>

      {/* Face Recognition info */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
          <span className="text-[#00c853]">👁</span> Face Recognition
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Face registration helps verify vehicle owner identity in case of lost ticket.
          The face data is securely stored and only used for verification purposes.
        </p>
      </div>
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps = [1, 2, 3, 4] as Step[];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            s < current
              ? "bg-[#00c853] text-black"
              : s === current
              ? "bg-[#00c853] text-black ring-4 ring-[#00c853]/20"
              : "bg-[#1e2a1e] text-gray-500"
          }`}>
            {s < current ? "✓" : s}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 transition-all ${
              s < current ? "bg-[#00c853]" : "bg-[#1e2a1e]"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function VehicleEntry() {
  const [step, setStep]       = useState<Step>(1);
  const [form, setForm]       = useState<FormData>({
    licensePlate: "", vehicleType: null, ticketType: "HOURLY", ownerName: "",
  });
  const [assignedSlot, setAssignedSlot] = useState<ParkingSlot | null>(null);
  const [faceCapture, setFaceCapture]   = useState<string | null>(null); // base64
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [entryTime, setEntryTime] = useState("");

  // Camera refs
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  // cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setFaceCapture(canvasRef.current.toDataURL("image/jpeg"));
    stopCamera();
  }, []);

  // ── Step 1: Validate & go to step 2 ────────────────────────────────────
  const handleStep1Continue = () => {
    if (!form.licensePlate.trim()) { setError("Vui lòng nhập biển số xe"); return; }
    if (!form.vehicleType)         { setError("Vui lòng chọn loại xe"); return; }
    setError("");
    setStep(2);
  };

  // ── Step 2: Skip or capture face, then go to step 3 ────────────────────
  const handleStep2Continue = () => {
    stopCamera();
    // Auto-assign slot theo vehicleType
    const slot = autoAssignSlot(form.vehicleType!);
    setAssignedSlot(slot);
    setStep(3);
  };

  // ── Step 3: Confirm entry ───────────────────────────────────────────────
  const handleConfirmEntry = async () => {
    setLoading(true);
    try {
      // TODO: gọi POST /api/v1/sessions/entry khi BE có
      await new Promise((r) => setTimeout(r, 700));

      // Cập nhật mock: đổi slot về OCCUPIED
      if (assignedSlot) {
        const slots = mockSlotsByFloor[assignedSlot.floorId];
        const idx = slots.findIndex((s) => s.id === assignedSlot.id);
        if (idx !== -1) slots[idx].status = "OCCUPIED";
      }

      setEntryTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      }));
      setStep(4);
    } catch {
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setForm({ licensePlate: "", vehicleType: null, ticketType: "HOURLY", ownerName: "" });
    setAssignedSlot(null);
    setFaceCapture(null);
    setError("");
    stopCamera();
  };

  const VEHICLE_TYPES: { type: VehicleType; label: string; icon: string }[] = [
    { type: "MOTORBIKE", label: "Motorbike", icon: "🏍️" },
    { type: "CAR",       label: "Car",       icon: "🚗" },
    { type: "TRUCK",     label: "Truck",     icon: "🚛" },
  ];

  const TICKET_TYPES: { value: TicketType; label: string }[] = [
    { value: "HOURLY",  label: "Hourly Ticket (per hour)" },
    { value: "DAILY",   label: "Daily Ticket (per day)"   },
    { value: "MONTHLY", label: "Monthly Pass"             },
  ];

  return (
    <div className="min-h-screen bg-[#080d08] text-white">
      <div className="p-6 max-w-screen-xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#00c853]">→</span> Vehicle Entry
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Register vehicle entry to parking lot</p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        <div className="flex gap-6">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Step 1: Enter Vehicle Information</h2>
                <p className="text-xs text-gray-500 mb-6">Enter license plate and select vehicle type to register</p>

                {/* License Plate */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    License Plate <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.licensePlate}
                    onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                    placeholder="e.g., 30A-123.45"
                    className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-[#00c853]/50 focus:ring-1 focus:ring-[#00c853]/20 transition font-mono"
                  />
                </div>

                {/* Vehicle Type */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {VEHICLE_TYPES.map(({ type, label, icon }) => {
                      const count = getAvailableCount(type);
                      const isSelected = form.vehicleType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setForm({ ...form, vehicleType: type })}
                          className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border transition-all ${
                            isSelected
                              ? "border-[#00c853] bg-[#00c853]/5"
                              : "border-[#1e2a1e] bg-[#080d08] hover:border-[#2a3d2a]"
                          }`}
                        >
                          <span className="text-2xl">{icon}</span>
                          <span className="text-sm font-medium text-white">{label}</span>
                          <span className="text-xs text-gray-500">{count} available</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Type */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Type</label>
                  <div className="relative">
                    <select
                      value={form.ticketType}
                      onChange={(e) => setForm({ ...form, ticketType: e.target.value as TicketType })}
                      className="w-full appearance-none bg-[#080d08] border border-[#1e2a1e] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00c853]/50 cursor-pointer"
                    >
                      {TICKET_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-3.5 text-gray-500 pointer-events-none">▾</span>
                  </div>
                </div>

                {/* Owner Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Owner Name (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-600 text-sm">👤</span>
                    <input
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="Enter owner name"
                      className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-lg pl-9 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-[#00c853]/50 transition"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mb-4">⚠️ {error}</p>}

                <button
                  onClick={handleStep1Continue}
                  className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ════ STEP 2: Face Registration ════ */}
            {step === 2 && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Step 2: Face Registration</h2>
                <p className="text-xs text-gray-500 mb-4">Capture owner's face for identity verification when exiting (in case of lost ticket)</p>

                {/* Info banner */}
                <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-4 py-3 mb-5">
                  <p className="text-xs text-blue-300">
                    Face data will be used to verify identity if the parking ticket is lost. This step is optional but recommended for security.
                  </p>
                </div>

                {/* Camera area */}
                <div className="relative bg-[#080d08] border border-[#1e2a1e] rounded-xl overflow-hidden mb-4"
                  style={{ minHeight: 360 }}>
                  {faceCapture ? (
                    <img src={faceCapture} alt="captured" className="w-full h-full object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${cameraOn ? "block" : "hidden"}`}
                    />
                  )}

                  {!cameraOn && !faceCapture && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
                      <span className="text-5xl opacity-30">📷</span>
                      <span className="text-sm">Camera is off</span>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Camera controls */}
                <div className="flex gap-3 mb-6">
                  {!cameraOn && !faceCapture && (
                    <button onClick={startCamera}
                      className="flex-1 bg-[#00c853]/10 hover:bg-[#00c853]/20 border border-[#00c853]/30 text-[#00c853] font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
                      📷 Start Camera
                    </button>
                  )}
                  {cameraOn && (
                    <button onClick={capturePhoto}
                      className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-2.5 rounded-lg text-sm transition">
                      📸 Capture Photo
                    </button>
                  )}
                  {faceCapture && (
                    <button onClick={() => { setFaceCapture(null); setCameraOn(false); }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition">
                      🔄 Retake
                    </button>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs mb-3">⚠️ {error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); stopCamera(); }}
                    className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-lg text-sm transition">
                    Back
                  </button>
                  <button onClick={handleStep2Continue}
                    className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-lg text-sm transition">
                    {faceCapture ? "Continue →" : "Skip →"}
                  </button>
                </div>
              </div>
            )}

            {/* ════ STEP 3: Confirm Information ════ */}
            {step === 3 && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Step 3: Confirm Information</h2>
                <p className="text-xs text-gray-500 mb-6">Review information before registering vehicle entry</p>

                {/* Info table */}
                <div className="border border-[#1e2a1e] rounded-xl overflow-hidden mb-6">
                  {[
                    { label: "License Plate",     value: form.licensePlate,
                      render: () => <span className="font-mono font-bold text-white text-base">{form.licensePlate}</span> },
                    { label: "Vehicle Type",      value: form.vehicleType,
                      render: () => <span className="text-white font-medium">{form.vehicleType === "MOTORBIKE" ? "🏍️ Motorbike" : form.vehicleType === "CAR" ? "🚗 Car" : "🚛 Truck"}</span> },
                    { label: "Ticket Type",       value: form.ticketType,
                      render: () => <span className="bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30 text-xs font-bold px-2 py-0.5 rounded">{form.ticketType === "HOURLY" ? "Hourly" : form.ticketType === "DAILY" ? "Daily" : "Monthly"}</span> },
                    { label: "Assigned Slot",     value: assignedSlot?.slotCode ?? "N/A",
                      render: () => <span className="font-mono text-[#00c853] font-bold">{assignedSlot?.slotCode ?? "N/A"}</span> },
                    { label: "Face Registration", value: faceCapture ? "Registered" : "Not registered",
                      render: () => <span className={faceCapture ? "text-[#00c853]" : "text-gray-500"}>{faceCapture ? "✅ Registered" : "Not registered"}</span> },
                    { label: "Owner",             value: form.ownerName || "—",
                      render: () => <span className="text-gray-300">{form.ownerName || "—"}</span> },
                  ].map((row, i) => (
                    <div key={row.label}
                      className={`flex items-center justify-between px-5 py-3.5 ${i < 5 ? "border-b border-[#1e2a1e]" : ""}`}>
                      <span className="text-gray-500 text-sm">{row.label}</span>
                      {row.render()}
                    </div>
                  ))}
                </div>

                {error && <p className="text-red-400 text-xs mb-4">⚠️ {error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="flex-1 bg-transparent border border-[#1e2a1e] hover:border-gray-600 text-gray-400 font-semibold py-3 rounded-lg text-sm transition">
                    Back
                  </button>
                  <button onClick={handleConfirmEntry} disabled={loading}
                    className="flex-1 bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 text-black font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2">
                    {loading
                      ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>
                      : "✓ Confirm Entry"}
                  </button>
                </div>
              </div>
            )}

            {/* ════ STEP 4: Success ════ */}
            {step === 4 && (
              <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-8">
                {/* Success icon */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center">
                    <span className="text-[#00c853] text-2xl">✓</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white text-center mb-1">Registration Successful!</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Vehicle has been registered to the parking lot</p>

                {/* Ticket card */}
                <div className="bg-[#080d08] border border-[#00c853]/20 rounded-xl p-6 mb-6">
                  <p className="text-xs text-gray-500 text-center mb-2 uppercase tracking-widest">LICENSE PLATE</p>
                  <p className="text-3xl font-bold text-white text-center font-mono mb-6">
                    {form.licensePlate}
                  </p>
                  <div className="grid grid-cols-2 gap-4 border-t border-[#1e2a1e] pt-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">LOCATION</p>
                      <p className="text-[#00c853] font-bold font-mono">{assignedSlot?.slotCode ?? "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">ENTRY TIME</p>
                      <p className="text-white font-bold">{entryTime}</p>
                    </div>
                  </div>
                </div>

                <button onClick={handleReset}
                  className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
                  🔄 Register New Vehicle
                </button>
              </div>
            )}

          </div>

          {/* ── Sidebar ── */}
          <SlotStatusSidebar />

        </div>
      </div>
    </div>
  );
}
