import { useState } from "react";

interface Ticket {
  id: string;
  licensePlate: string;
  vehicleType: string;
  ticketType: string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING";
  fee: number;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: "T001", licensePlate: "51G-123.45",
    vehicleType: "MOTORBIKE", ticketType: "MONTHLY",
    startDate: "2026-06-01", endDate: "2026-06-30",
    status: "ACTIVE", fee: 500_000,
  },
  {
    id: "T002", licensePlate: "51F-987.65",
    vehicleType: "CAR", ticketType: "DAILY",
    startDate: "2026-06-08", endDate: "2026-06-08",
    status: "EXPIRED", fee: 120_000,
  },
];

const STATUS_CONFIG = {
  ACTIVE:  { label: "Đang dùng", bg: "bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30"   },
  EXPIRED: { label: "Hết hạn",   bg: "bg-gray-800 text-gray-500 border-gray-700"             },
  PENDING: { label: "Chờ duyệt", bg: "bg-amber-950/60 text-amber-400 border-amber-800/50"    },
};

export default function MyTickets() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");

  const filtered = MOCK_TICKETS.filter((t) => filter === "ALL" || t.status === filter);

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📋 Vé của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách vé đỗ xe đã đăng ký</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["ALL","ACTIVE","EXPIRED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter === f
                ? "bg-[#00c853] border-[#00c853] text-black"
                : "bg-[#0d1117] border-[#1e2a1e] text-gray-500 hover:text-gray-300"
            }`}>
            {f === "ALL" ? "Tất cả" : f === "ACTIVE" ? "Đang dùng" : "Hết hạn"}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {filtered.map((ticket) => {
          const cfg = STATUS_CONFIG[ticket.status];
          return (
            <div key={ticket.id} className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono font-bold text-white text-lg">{ticket.licensePlate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ticket.vehicleType} · {ticket.ticketType}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg}`}>
                  {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Mã vé",     value: ticket.id },
                  { label: "Phí",       value: `${ticket.fee.toLocaleString("vi-VN")} ₫` },
                  { label: "Từ ngày",   value: ticket.startDate },
                  { label: "Đến ngày",  value: ticket.endDate ?? "—" },
                ].map((r) => (
                  <div key={r.label} className="bg-[#080d08] rounded-xl p-3">
                    <p className="text-xs text-gray-500">{r.label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📭</p>
            <p>Không có vé nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
