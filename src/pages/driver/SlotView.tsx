import { useState } from "react";

type SlotStatus = "FREE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

const STATUS_CONFIG: Record<SlotStatus, { bg: string; border: string; text: string; label: string }> = {
  FREE:        { bg: "bg-[#0a1f0a]",  border: "border-[#1a3d1a]",  text: "text-[#00c853]", label: "Trống"    },
  OCCUPIED:    { bg: "bg-[#1f0a0a]",  border: "border-[#3d1a1a]",  text: "text-red-500",   label: "Đang đỗ" },
  RESERVED:    { bg: "bg-[#1a1200]",  border: "border-[#3d2e00]",  text: "text-amber-400", label: "Đã đặt"  },
  MAINTENANCE: { bg: "bg-[#111111]",  border: "border-[#2a2a2a]",  text: "text-gray-500",  label: "Bảo trì" },
};

const FLOORS = [
  { id: "b1", name: "Basement 1", slots: 20, free: 8,  type: "CAR"      },
  { id: "b2", name: "Basement 2", slots: 20, free: 12, type: "CAR"      },
  { id: "f1", name: "Floor 1",    slots: 16, free: 5,  type: "MOTORBIKE"},
  { id: "f2", name: "Floor 2",    slots: 16, free: 9,  type: "MOTORBIKE"},
];

const makeSlots = (total: number, free: number) =>
  Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    status: (i < total - free ? "OCCUPIED" : "FREE") as SlotStatus,
  }));

export default function DriverSlotView() {
  const [activeFloor, setActiveFloor] = useState("b1");

  const floor = FLOORS.find((f) => f.id === activeFloor)!;
  const slots = makeSlots(floor.slots, floor.free);

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6 max-w-screen-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🅿️ Xem slot</h1>
        <p className="text-sm text-gray-500 mt-1">Tình trạng chỗ đỗ xe hiện tại</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["FREE","OCCUPIED","RESERVED","MAINTENANCE"] as SlotStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = slots.filter((sl) => sl.status === s).length;
          return (
            <div key={s} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Floor tabs */}
      <div className="flex gap-2 mb-5">
        {FLOORS.map((f) => (
          <button key={f.id} onClick={() => setActiveFloor(f.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFloor === f.id
                ? "bg-[#00c853] text-black"
                : "bg-[#0d1117] border border-[#1e2a1e] text-gray-500 hover:text-gray-300"
            }`}>
            {f.name}
          </button>
        ))}
      </div>

      {/* Slot grid */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">{floor.name}</h2>
            <p className="text-xs text-gray-500">{floor.type} · {floor.free}/{floor.slots} trống</p>
          </div>
          {/* Legend */}
          <div className="flex gap-3">
            {(["FREE","OCCUPIED","RESERVED"] as SlotStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].bg} border ${STATUS_CONFIG[s].border}`} />
                <span className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
          {slots.map((slot) => {
            const cfg = STATUS_CONFIG[slot.status];
            return (
              <div key={slot.id}
                className={`${cfg.bg} border ${cfg.border} rounded-lg p-2 text-center aspect-square flex flex-col items-center justify-center transition hover:brightness-125`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-1 ${cfg.bg}`}>
                  <span className={`text-xs ${cfg.text}`}>●</span>
                </div>
                <p className={`text-[10px] font-bold ${cfg.text}`}>{String(slot.id).padStart(2,"0")}</p>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-[#1e2a1e]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Tỉ lệ lấp đầy</span>
            <span className="text-[#00c853] font-semibold">
              {Math.round(((floor.slots - floor.free) / floor.slots) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[#1e2a1e] rounded-full overflow-hidden">
            <div className="h-full bg-[#00c853] rounded-full"
              style={{ width: `${((floor.slots - floor.free) / floor.slots) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
