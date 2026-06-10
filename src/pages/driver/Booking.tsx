import { useState } from "react";

type VehicleType = "MOTORBIKE" | "CAR" | "TRUCK";

const FLOORS = ["Basement 1", "Basement 2", "Floor 1", "Floor 2"];

export default function Booking() {
  const [form, setForm] = useState({
    licensePlate: "",
    vehicleType:  "MOTORBIKE" as VehicleType,
    floor:        "Basement 1",
    date:         "",
    timeFrom:     "",
    timeTo:       "",
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [bookingId, setBookingId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.licensePlate.trim()) { setError("Vui lòng nhập biển số");  return; }
    if (!form.date)                { setError("Vui lòng chọn ngày");     return; }
    if (!form.timeFrom)            { setError("Vui lòng chọn giờ vào");  return; }
    if (!form.timeTo)              { setError("Vui lòng chọn giờ ra");   return; }
    setError(""); setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setBookingId(`BK${Date.now().toString().slice(-6)}`);
      setSuccess(true);
    } catch {
      setError("Đặt chỗ thất bại. Thử lại.");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-[#080d08] flex items-center justify-center p-6">
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-[#00c853] text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Đặt chỗ thành công!</h2>
        <p className="text-gray-500 text-sm mb-6">Chỗ đỗ xe đã được giữ cho bạn</p>
        <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-4 text-left space-y-2 mb-6">
          {[
            { label: "Mã đặt chỗ",  value: bookingId },
            { label: "Biển số",     value: form.licensePlate },
            { label: "Tầng",        value: form.floor },
            { label: "Ngày",        value: form.date },
            { label: "Thời gian",   value: `${form.timeFrom} → ${form.timeTo}` },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{r.label}</span>
              <span className="text-white font-medium">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-400">
            ⚠️ Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn. Quá thời gian slot sẽ tự động giải phóng.
          </p>
        </div>
        <button onClick={() => setSuccess(false)}
          className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl text-sm transition">
          📌 Đặt chỗ mới
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📌 Đặt chỗ trước</h1>
        <p className="text-sm text-gray-500 mt-1">Giữ chỗ đỗ xe theo thời gian</p>
      </div>

      {/* BR-05 notice */}
      <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-5">
        <p className="text-xs text-amber-400">
          📌 Chỗ được giữ trong <strong>30 phút</strong> sau giờ hẹn (BR-05). Hết thời gian slot tự về FREE.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Biển số */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Biển số xe</label>
          <input
            value={form.licensePlate}
            onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
            placeholder="VD: 51G-123.45"
            className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"
          />
        </div>

        {/* Loại xe */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Loại xe</label>
          <div className="grid grid-cols-3 gap-3">
            {([["MOTORBIKE","🏍️","Xe máy"],["CAR","🚗","Ô tô"],["TRUCK","🚛","Xe tải"]] as const).map(([type, icon, label]) => (
              <button key={type} type="button"
                onClick={() => setForm({ ...form, vehicleType: type })}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition ${
                  form.vehicleType === type
                    ? "border-[#00c853] bg-[#00c853]/5 text-white"
                    : "border-[#1e2a1e] text-gray-500 hover:border-[#2a3d2a]"
                }`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tầng */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Tầng mong muốn</label>
          <div className="relative">
            <select
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className="w-full appearance-none bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00c853]/50 cursor-pointer">
              {FLOORS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <span className="absolute right-3 top-3 text-gray-600 pointer-events-none">▾</span>
          </div>
        </div>

        {/* Ngày + giờ */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Thời gian</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Ngày</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00c853]/50 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Giờ vào</label>
              <input type="time" value={form.timeFrom}
                onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00c853]/50 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Giờ ra</label>
              <input type="time" value={form.timeTo}
                onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00c853]/50 [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl text-sm transition shadow-lg shadow-[#00c853]/20">
          {loading ? "Đang xử lý..." : "📌 Xác nhận đặt chỗ"}
        </button>
      </form>
    </div>
  );
}
