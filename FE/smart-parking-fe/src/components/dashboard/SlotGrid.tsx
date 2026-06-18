import { useState } from "react";
import type { SlotGridByFloor, SlotStatus } from "../../types/slot.types";

interface Props {
  data: SlotGridByFloor[];
}

// BR-14, BR-22, BR-26, BR-27, BR-37
const STATUS_CONFIG: Record<SlotStatus, { bg: string; border: string; text: string; label: string }> = {
  FREE:        { bg: "bg-emerald-950/60", border: "border-emerald-700",  text: "text-emerald-400", label: "Trống"       },
  OCCUPIED:    { bg: "bg-red-950/70",     border: "border-red-700",      text: "text-red-400",     label: "Đang đỗ"    },
  RESERVED:    { bg: "bg-amber-950/70",   border: "border-amber-600",    text: "text-amber-400",   label: "Đã đặt"     },
  MAINTENANCE: { bg: "bg-gray-800",       border: "border-gray-600",     text: "text-gray-500",    label: "Bảo trì"    },
};

export default function SlotGrid({ data }: Props) {
  const [activeFloor, setActiveFloor] = useState(data[0]?.floor.id ?? 0);

  const current = data.find((d) => d.floor.id === activeFloor) ?? data[0];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-300">🅿️ Sơ đồ bãi đỗ xe</h2>

        {/* Legend */}
        <div className="flex gap-3">
          {(Object.entries(STATUS_CONFIG) as [SlotStatus, typeof STATUS_CONFIG[SlotStatus]][]).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${cfg.bg} border ${cfg.border}`} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex gap-2 mb-5">
        {data.map(({ floor }) => (
          <button
            key={floor.id}
            onClick={() => setActiveFloor(floor.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFloor === floor.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            {floor.floorName}
          </button>
        ))}
      </div>

      {/* Slot grid */}
      {current && (
        <>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {current.slots.map((slot) => {
              const cfg = STATUS_CONFIG[slot.status];
              return (
                <div
                  key={slot.id}
                  title={`${slot.slotCode} · ${slot.vehicleType} · ${cfg.label}`}
                  className={`${cfg.bg} border ${cfg.border} rounded-lg p-1.5 text-center cursor-default transition-transform hover:scale-105`}
                >
                  <p className={`text-xs font-bold ${cfg.text} leading-none`}>
                    {slot.slotCode.split("-")[1]}
                  </p>
                  <p className="text-gray-600 text-[9px] mt-0.5 leading-none">{slot.zone}</p>
                </div>
              );
            })}
          </div>

          {/* Floor summary */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
            {(["FREE","OCCUPIED","RESERVED","MAINTENANCE"] as SlotStatus[]).map((s) => {
              const count = current.slots.filter((sl) => sl.status === s).length;
              const cfg   = STATUS_CONFIG[s];
              return (
                <span key={s} className="text-xs text-gray-500">
                  <span className={`font-bold ${cfg.text}`}>{count}</span> {cfg.label}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
