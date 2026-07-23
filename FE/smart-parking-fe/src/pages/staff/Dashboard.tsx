import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";

// ── Vehicle type icon ─────────────────────────────────────────────────────────
const VEHICLE_ICON: Record<string, string> = {
  CAR:       "🚗",
  Car:       "🚗",
  MOTORBIKE: "🏍️",
  Motorbike: "🏍️",
  TRUCK:     "🚛",
  Truck:     "🚛"
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zonesRes, slotsRes, activeRes, completedRes] = await Promise.all([
          api.get('/api/v1/zones').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/parking-slots').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/parking-sessions/active/all').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/parking-sessions/completed/all').catch(() => ({ data: { data: [] } }))
        ]);
        
        setZones(zonesRes.data?.data || zonesRes.data || []);
        setSlots(slotsRes.data?.data || slotsRes.data || []);
        setActiveSessions(activeRes.data?.data || activeRes.data || []);
        setCompletedSessions(completedRes.data?.data || completedRes.data || []);
      } catch (error) {
        console.error("Failed to load staff dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const { stats, floorStatus, zoneStatus, parkedVehicles, overstayCount } = useMemo(() => {
    const validSlots = slots.filter((s: any) => s.maintenanceStatus !== 'MAINTENANCE');
    const occupiedSlots = validSlots.filter((s: any) => s.currentSessionId);
    const availableSlots = validSlots.filter((s: any) => !s.currentSessionId);
    
    let availableCars = 0;
    let availableMotorbikes = 0;
    availableSlots.forEach((s: any) => {
      if (s.vehicleType === 'CAR' || s.vehicleType === 'Car') availableCars++;
      else if (s.vehicleType === 'MOTORBIKE' || s.vehicleType === 'Motorbike') availableMotorbikes++;
    });

    const utilizationRate = validSlots.length > 0 ? Math.round((occupiedSlots.length / validSlots.length) * 100) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let revenueToday = 0;
    let vehiclesToday = 0;

    completedSessions.forEach((s: any) => {
      if (s.exitTime) {
        const exitDate = new Date(s.exitTime);
        if (exitDate >= today) {
          revenueToday += (s.totalFee || s.finalFee || 0);
          vehiclesToday++;
        }
      }
    });

    activeSessions.forEach((s: any) => {
      if (s.entryTime) {
        const entryDate = new Date(s.entryTime);
        if (entryDate >= today) {
          vehiclesToday++;
        }
      }
    });

    const sStats = {
      utilizationRate,
      usedSlots: occupiedSlots.length,
      totalSlots: validSlots.length,
      availableTotal: availableSlots.length,
      availableCars,
      availableMotorbikes,
      revenueToday,
      vehiclesToday
    };

    const floorsMap: any = {};
    zones.forEach((z: any) => {
      const fName = z.floorName || z.floor || 'Unknown';
      if (!floorsMap[fName]) floorsMap[fName] = { floor: fName, total: 0, used: 0, maintenance: 0 };
    });
    
    slots.forEach((s: any) => {
      const fName = s.floorName || 'Unknown';
      if (!floorsMap[fName]) floorsMap[fName] = { floor: fName, total: 0, used: 0, maintenance: 0 };
      floorsMap[fName].total++;
      if (s.maintenanceStatus === 'MAINTENANCE') floorsMap[fName].maintenance++;
      else if (s.currentSessionId) floorsMap[fName].used++;
    });

    const fStatus = Object.values(floorsMap).map((f: any) => ({
      floor: f.floor,
      total: f.total,
      available: Math.max(0, f.total - f.used - f.maintenance)
    }));

    const zStatus = zones.map((z: any) => {
      const zSlots = slots.filter((s: any) => s.zoneId === z.id);
      const main = zSlots.filter((s: any) => s.maintenanceStatus === 'MAINTENANCE').length;
      const used = zSlots.filter((s: any) => s.currentSessionId).length;
      const total = zSlots.length;
      return {
        name: z.name,
        floor: z.floorName || z.floor,
        icon: z.vehicleType === 'CAR' ? '🚗' : '🏍️',
        total,
        available: Math.max(0, total - used - main)
      };
    });

    let oCount = 0;
    const now = new Date();
    
    // Nguồn sự thật cho xe đang đỗ là slot.currentSessionId
    const occupiedSessionIds = new Set(occupiedSlots.map((s: any) => String(s.currentSessionId)));
    const validActiveSessions = activeSessions.filter((s: any) => occupiedSessionIds.has(String(s.id)));

    const pVehicles = validActiveSessions.map((s: any) => {
      const entry = new Date(s.entryTime);
      const isOverstay = (now.getTime() - entry.getTime()) > 24 * 60 * 60 * 1000;
      if (isOverstay) oCount++;
      
      const status = isOverstay ? "Overstay" : (s.hasMonthlyPass ? "Monthly Pass" : "Parked");
      
      return {
        id: s.id,
        licensePlate: s.licensePlate || 'N/A',
        vehicleType: s.vehicleType || 'Unknown',
        slot: s.slotCode || 'N/A',
        entryTime: new Date(s.entryTime).toLocaleString('vi-VN'),
        status
      };
    });

    return { stats: sStats, floorStatus: fStatus, zoneStatus: zStatus, parkedVehicles: pVehicles, overstayCount: oCount };
  }, [zones, slots, activeSessions, completedSessions]);

  return (
    <div className="min-h-screen bg-[#080d08] text-white">
      <div className="p-6 max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Bảng điều khiển</h1>
          <p className="text-xs text-gray-500 mt-0.5">Tổng quan trạng thái bãi đỗ xe</p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          {/* Utilization Rate */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Tỷ lệ lấp đầy</span>
              <span className="text-[#00c853] text-sm">📈</span>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.utilizationRate}%</p>
            <div className="h-1 bg-[#1e2a1e] rounded-full mb-2">
              <div className="h-full bg-[#00c853] rounded-full" style={{ width: `${stats.utilizationRate}%` }} />
            </div>
            <p className="text-xs text-gray-500">{stats.usedSlots}/{stats.totalSlots} vị trí đang đỗ</p>
          </div>

          {/* Available Slots */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Vị trí trống</span>
              <span className="text-[#00c853] text-sm">🅿️</span>
            </div>
            <p className="text-3xl font-bold text-white mb-3">{stats.availableTotal}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">🚗 {stats.availableCars} ô tô</span>
              <span className="flex items-center gap-1">🏍️ {stats.availableMotorbikes} xe máy</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Doanh thu hôm nay</span>
              <span className="text-[#00c853] text-sm">💰</span>
            </div>
            <p className="text-3xl font-bold text-white mb-3">
              ₫{stats.revenueToday.toLocaleString('vi-VN')}
            </p>
            <p className="text-xs text-gray-500">{stats.vehiclesToday} lượt xe hôm nay</p>
          </div>

        </div>

        {/* ── Middle row: Floor Status + Parked Vehicles ── */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Status by Floor */}
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-5">Trạng thái theo Tầng</h2>
            <div className="space-y-5">
              {floorStatus.map((f) => {
                const pct = Math.round((f.available / f.total) * 100);
                return (
                  <div key={f.floor}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white text-xs font-medium">{f.floor}</span>
                      <span className="text-gray-500 text-xs">Còn trống {f.available}/{f.total}</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2a1e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00c853] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parked Vehicles */}
          <div className="col-span-2 bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Xe đang đỗ ({parkedVehicles.length})
              </h2>
              {overstayCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1">
                  ⚠️ {overstayCount} quá giờ
                </span>
              )}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a1e]">
                  {["Biển số xe","Loại xe","Vị trí","Thời gian vào","Trạng thái"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {parkedVehicles.map((v: any) => (
                  <tr key={v.id} className="border-b border-[#1e2a1e]/50 hover:bg-[#0f1a0f] transition">
                    <td className="py-3 pr-4 font-mono font-semibold text-white text-sm">{v.licensePlate}</td>
                    <td className="py-3 pr-4">
                      <span className="text-gray-400 text-xs flex items-center gap-1.5">
                        {VEHICLE_ICON[v.vehicleType] || '🚙'} {v.vehicleType === 'CAR' || v.vehicleType === 'Car' ? 'Ô tô' : v.vehicleType === 'MOTORBIKE' || v.vehicleType === 'Motorbike' ? 'Xe máy' : v.vehicleType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 text-xs font-mono">{v.slot}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{v.entryTime}</td>
                    <td className="py-3">
                      {v.status === "Parked" && (
                        <span className="text-xs bg-[#1e2a1e] text-gray-300 border border-[#2a3d2a] px-2.5 py-0.5 rounded">
                          Đang đỗ
                        </span>
                      )}
                      {v.status === "Monthly Pass" && (
                        <span className="text-xs bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30 px-2.5 py-0.5 rounded font-semibold">
                          Vé tháng
                        </span>
                      )}
                      {v.status === "Overstay" && (
                        <span className="text-xs bg-red-600 text-white px-2.5 py-0.5 rounded font-semibold">
                          Quá giờ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Status by Zone ── */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-5">Trạng thái theo Khu vực</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {zoneStatus.map((zone, i) => {
              const pct = Math.round((zone.available / zone.total) * 100);
              return (
                <div key={i} className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-white text-xs font-semibold">{zone.name}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{zone.floor}</p>
                    </div>
                    <span className="text-base">{zone.icon}</span>
                  </div>
                  <p className="text-[#00c853] text-sm font-semibold mt-3">
                    còn trống {zone.available}
                  </p>
                  <div className="h-1 bg-[#1e2a1e] rounded-full mt-2 mb-1 overflow-hidden">
                    <div className="h-full bg-[#00c853] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-right text-xs text-gray-500">/ {zone.total}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => navigate("/PARKING_STAFF/entry")}
            className="bg-[#0d1117] border border-[#1e2a1e] hover:border-[#00c853]/40 rounded-xl p-4 text-left transition group">
            <span className="text-2xl mb-2 block">🚗</span>
            <p className="text-white font-semibold text-sm group-hover:text-[#00c853] transition">Xe Vào</p>
            <p className="text-gray-600 text-xs mt-0.5">Đăng ký xe vào bãi</p>
          </button>
          <button onClick={() => navigate("/PARKING_STAFF/exit")}
            className="bg-[#0d1117] border border-[#1e2a1e] hover:border-[#00c853]/40 rounded-xl p-4 text-left transition group">
            <span className="text-2xl mb-2 block">🚪</span>
            <p className="text-white font-semibold text-sm group-hover:text-[#00c853] transition">Xe Ra</p>
            <p className="text-gray-600 text-xs mt-0.5">Xử lý thanh toán</p>
          </button>
          <button onClick={() => navigate("/PARKING_STAFF/slots")}
            className="bg-[#0d1117] border border-[#1e2a1e] hover:border-[#00c853]/40 rounded-xl p-4 text-left transition group">
            <span className="text-2xl mb-2 block">🅿️</span>
            <p className="text-white font-semibold text-sm group-hover:text-[#00c853] transition">Xem vị trí</p>
            <p className="text-gray-600 text-xs mt-0.5">Xem trạng thái bãi đỗ</p>
          </button>
        </div>

      </div>
    </div>
  );
}
