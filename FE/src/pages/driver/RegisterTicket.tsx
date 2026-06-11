import { useState } from "react";

type TicketType = "HOURLY" | "DAILY" | "MONTHLY";
type VehicleType = "MOTORBIKE" | "CAR" | "TRUCK";

const TICKET_PRICES: Record<TicketType, Record<VehicleType, number>> = {
  HOURLY:  { MOTORBIKE: 5_000,   CAR: 20_000,   TRUCK: 40_000   },
  DAILY:   { MOTORBIKE: 30_000,  CAR: 120_000,  TRUCK: 250_000  },
  MONTHLY: { MOTORBIKE: 500_000, CAR: 2_000_000, TRUCK: 4_000_000 },
};

export default function RegisterTicket() {
  const [form, setForm] = useState({
    licensePlate: "",
    vehicleType:  "MOTORBIKE" as VehicleType,
    ticketType:   "HOURLY" as TicketType,
    ownerName:    "",
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const price = TICKET_PRICES[form.ticketType][form.vehicleType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.licensePlate.trim()) { setError("Vui lòng nhập biển số xe"); return; }
    setError(""); setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSuccess(true);
    } catch {
      setError("Đăng ký thất bại. Thử lại.");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-[#080d08] flex items-center justify-center p-6">
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-[#00c853] text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Đăng ký vé thành công!</h2>
        <p className="text-gray-500 text-sm mb-6">Vé đã được tạo và lưu vào hệ thống</p>
        <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-4 text-left space-y-2 mb-6">
          {[
            { label: "Biển số",   value: form.licensePlate },
            { label: "Loại xe",   value: form.vehicleType  },
            { label: "Loại vé",   value: form.ticketType   },
            { label: "Phí",       value: `${price.toLocaleString("vi-VN")} ₫` },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{r.label}</span>
              <span className="text-white font-medium">{r.value}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setSuccess(false)}
          className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl text-sm transition">
          ➕ Đăng ký vé mới
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎫 Đăng ký vé</h1>
        <p className="text-sm text-gray-500 mt-1">Đăng ký vé đỗ xe mới</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Loại vé */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Loại vé</label>
          <div className="grid grid-cols-3 gap-3">
            {([["HOURLY","⏱️","Theo giờ"],["DAILY","📅","Theo ngày"],["MONTHLY","📆","Theo tháng"]] as const).map(([type, icon, label]) => (
              <button key={type} type="button"
                onClick={() => setForm({ ...form, ticketType: type })}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition ${
                  form.ticketType === type
                    ? "border-[#00c853] bg-[#00c853]/5 text-white"
                    : "border-[#1e2a1e] text-gray-500 hover:border-[#2a3d2a]"
                }`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-[#00c853] font-semibold">
                  {TICKET_PRICES[type][form.vehicleType].toLocaleString("vi-VN")}₫
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Owner name */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
          <label className="block text-xs text-gray-400 font-semibold uppercase mb-3">Tên chủ xe (tuỳ chọn)</label>
          <input
            value={form.ownerName}
            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            placeholder="Nguyễn Văn A"
            className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"
          />
        </div>

        {/* Price summary */}
        <div className="bg-[#001a0a] border border-[#00c853]/20 rounded-2xl p-5 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Tổng phí</p>
            <p className="text-xs text-gray-600 mt-0.5">{form.ticketType} · {form.vehicleType}</p>
          </div>
          <p className="text-2xl font-bold text-[#00c853]">{price.toLocaleString("vi-VN")} ₫</p>
        </div>

        {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl text-sm transition shadow-lg shadow-[#00c853]/20">
          {loading ? "Đang xử lý..." : "🎫 Đăng ký vé"}
        </button>
      </form>
    </div>
  );
}
