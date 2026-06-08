import { useState } from "react";
import type { SlotStatus, VehicleType } from "../../types/staff.types";
import { mockFloors, mockSlotsByFloor, mockActiveSessions } from "../../data/mockStaff";

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<SlotStatus, {
  bg: string; border: string; iconBg: string;
  icon: string; iconColor: string; label: string; statIcon: string; statColor: string;
}> = {
  FREE:        { bg: "bg-[#0a1f0a]",  border: "border-[#1a3d1a]",  iconBg: "bg-[#1a3d1a]",  icon: "✓",  iconColor: "text-[#00c853]", label: "Available",   statIcon: "✅", statColor: "text-[#00c853]" },
  OCCUPIED:    { bg: "bg-[#1f0a0a]",  border: "border-[#3d1a1a]",  iconBg: "bg-[#3d1a1a]",  icon: "●",  iconColor: "text-red-500",   label: "Occupied",    statIcon: "🔴", statColor: "text-red-400"   },
  RESERVED:    { bg: "bg-[#1a1200]",  border: "border-[#3d2e00]",  iconBg: "bg-[#3d2e00]",  icon: "🕐", iconColor: "text-amber-400", label: "Reserved",    statIcon: "🕐", statColor: "text-amber-400" },
  MAINTENANCE: { bg: "bg-[#111111]",  border: "border-[#2a2a2a]",  iconBg: "bg-[#2a2a2a]",  icon: "🔧", iconColor: "text-gray-400",  label: "Maintenance", statIcon: "🔧", statColor: "text-gray-400"  },
};

const VEHICLE_LABEL: Record<VehicleType, string> = {
  MOTORBIKE: "Motorbikes",
  CAR:       "Cars",
  TRUCK:     "Trucks",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(entryTime: string): string {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SlotView() {
  const [floorFilter,   setFloorFilter]   = useState<string>("ALL");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | "ALL">("ALL");
  const [viewMode,      setViewMode]      = useState<"grid" | "list">("grid");
  const [hoveredSlot,   setHovered]       = useState<string | null>(null);

  // All slots merged
  const allSlots = Object.values(mockSlotsByFloor).flat();

  // Apply filters
  const filteredSlots = allSlots.filter((s) => {
    const matchFloor   = floorFilter   === "ALL" || s.floorId   === floorFilter;
    const matchVehicle = vehicleFilter === "ALL" || s.vehicleType === vehicleFilter;
    return matchFloor && matchVehicle;
  });

  // Global stats
  const stats = {
    FREE:        filteredSlots.filter((s) => s.status === "FREE").length,
    OCCUPIED:    filteredSlots.filter((s) => s.status === "OCCUPIED").length,
    RESERVED:    filteredSlots.filter((s) => s.status === "RESERVED").length,
    MAINTENANCE: filteredSlots.filter((s) => s.status === "MAINTENANCE").length,
  };

  // Group by zone
  const zoneMap = new Map<string, { zoneName: string; floorName: string; vehicleType: VehicleType; slots: typeof filteredSlots }>();
  for (const slot of filteredSlots) {
    const key = slot.zoneId;
    if (!zoneMap.has(key)) {
      zoneMap.set(key, {
        zoneName:    slot.zoneName,
        floorName:   slot.floorName,
        vehicleType: slot.vehicleType,
        slots: [],
      });
    }
    zoneMap.get(key)!.slots.push(slot);
  }

  const getSession = (slotId: string) =>
    mockActiveSessions.find((s) => s.slotId === slotId);

  return (
    <div className="min-h-screen bg-[#080d08] text-white">
      <div className="p-6 max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#00c853]">🅿️</span> Slot View
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">View and manage parking slot status</p>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(["FREE","OCCUPIED","RESERVED","MAINTENANCE"] as SlotStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${cfg.iconBg} flex items-center justify-center text-base`}>
                    <span className={cfg.iconColor}>{cfg.statIcon}</span>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${cfg.statColor} mb-1`}>{stats[status]}</p>
                <p className="text-sm text-gray-500">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 flex items-center gap-1.5">
              <span>▼</span> Filter:
            </span>

            {/* Floor dropdown */}
            <div className="relative">
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="appearance-none bg-[#0d1117] border border-[#1e2a1e] rounded-lg px-4 py-2 pr-8 text-sm text-white outline-none focus:border-[#00c853]/50 cursor-pointer"
              >
                <option value="ALL">All Floors</option>
                {mockFloors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none text-xs">▾</span>
            </div>

            {/* Vehicle dropdown */}
            <div className="relative">
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value as VehicleType | "ALL")}
                className="appearance-none bg-[#0d1117] border border-[#1e2a1e] rounded-lg px-4 py-2 pr-8 text-sm text-white outline-none focus:border-[#00c853]/50 cursor-pointer"
              >
                <option value="ALL">All Vehicles</option>
                <option value="CAR">Cars</option>
                <option value="MOTORBIKE">Motorbikes</option>
                <option value="TRUCK">Trucks</option>
              </select>
              <span className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none text-xs">▾</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4">
            {(["FREE","OCCUPIED","RESERVED","MAINTENANCE"] as SlotStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  s === "FREE"        ? "bg-[#00c853]" :
                  s === "OCCUPIED"    ? "bg-red-500"   :
                  s === "RESERVED"    ? "bg-amber-400" : "bg-gray-500"
                }`} />
                <span className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── View toggle ── */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setViewMode("grid")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
              viewMode === "grid"
                ? "border-[#00c853] text-[#00c853] bg-[#00c853]/5"
                : "border-[#1e2a1e] text-gray-500 hover:text-gray-300"
            }`}>
            Grid View
          </button>
          <button onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
              viewMode === "list"
                ? "border-[#00c853] text-[#00c853] bg-[#00c853]/5"
                : "border-[#1e2a1e] text-gray-500 hover:text-gray-300"
            }`}>
            List View
          </button>
        </div>

        {/* ── GRID VIEW ── */}
        {viewMode === "grid" && (
          <div className="space-y-6">
            {Array.from(zoneMap.entries()).map(([zoneId, zone]) => {
              const available = zone.slots.filter((s) => s.status === "FREE").length;
              const total     = zone.slots.length;
              const pct       = Math.round((available / total) * 100);

              return (
                <div key={zoneId} className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
                  {/* Zone header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <span className="text-gray-400">🚗</span>
                        {zone.zoneName} - {VEHICLE_LABEL[zone.vehicleType]}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{zone.floorName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">{available}/{total} available</p>
                      <div className="w-24 h-1 bg-[#1e2a1e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00c853] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slot grid — card lớn như prototype */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {zone.slots.map((slot) => {
                      const cfg       = STATUS_CONFIG[slot.status];
                      const session   = slot.status === "OCCUPIED" ? getSession(slot.id) : undefined;
                      const isHovered = hoveredSlot === slot.id;

                      return (
                        <div key={slot.id} className="relative aspect-square"
                          onMouseEnter={() => setHovered(slot.id)}
                          onMouseLeave={() => setHovered(null)}>

                          {/* Slot card — large square like prototype */}
                          <div className={`
                            w-full h-full ${cfg.bg} border ${cfg.border}
                            rounded-lg flex flex-col items-center justify-center
                            cursor-default transition-all hover:brightness-125
                          `}>
                            {/* Icon circle */}
                            <div className={`w-6 h-6 rounded-full ${cfg.iconBg} flex items-center justify-center mb-1`}>
                              <span className={`text-xs ${cfg.iconColor}`}>{cfg.icon}</span>
                            </div>
                            {/* Slot number */}
                            <p className={`text-[10px] font-bold ${cfg.iconColor} leading-none`}>
                              {slot.slotCode.split("-")[1]}
                            </p>
                          </div>

                          {/* Tooltip */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-48 bg-[#0d1117] border border-[#2a3d2a] rounded-xl p-3 shadow-2xl text-xs pointer-events-none">
                              <p className="font-bold text-white mb-1 font-mono">{slot.slotCode}</p>
                              <p className="text-gray-400">{slot.floorName} · {slot.zoneName}</p>
                              <p className="text-gray-400">{slot.vehicleType}</p>
                              <p className={`font-semibold mt-1 ${cfg.iconColor}`}>{cfg.label}</p>
                              {session && (
                                <div className="border-t border-[#1e2a1e] mt-2 pt-2 space-y-0.5">
                                  <p className="text-white font-mono">{session.licensePlate}</p>
                                  <p className="text-gray-500">{session.ownerName}</p>
                                  <p className="text-gray-500">
                                    In: {new Date(session.entryTime).toLocaleTimeString("en-US", {
                                      hour: "2-digit", minute: "2-digit", hour12: true,
                                    })}
                                  </p>
                                  <p className="text-[#00c853]">{formatDuration(session.entryTime)}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === "list" && (
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a1e]">
                  {["Slot Code","Floor","Zone","Vehicle Type","Status","Session"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((slot) => {
                  const cfg     = STATUS_CONFIG[slot.status];
                  const session = slot.status === "OCCUPIED" ? getSession(slot.id) : undefined;
                  return (
                    <tr key={slot.id} className="border-b border-[#1e2a1e]/50 hover:bg-[#0f1a0f] transition">
                      <td className="px-4 py-3 font-mono font-semibold text-white">{slot.slotCode}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{slot.floorName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{slot.zoneName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{slot.vehicleType}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          slot.status === "FREE"
                            ? "bg-[#0a1f0a] border-[#1a3d1a] text-[#00c853]"
                            : slot.status === "OCCUPIED"
                            ? "bg-[#1f0a0a] border-[#3d1a1a] text-red-400"
                            : slot.status === "RESERVED"
                            ? "bg-[#1a1200] border-[#3d2e00] text-amber-400"
                            : "bg-[#111] border-[#2a2a2a] text-gray-400"
                        }`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {session
                          ? <span className="font-mono text-white">{session.licensePlate} · {formatDuration(session.entryTime)}</span>
                          : <span className="text-gray-700">—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSlots.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <p className="text-3xl mb-2">🅿️</p>
                <p>Không có slot nào phù hợp với bộ lọc</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
