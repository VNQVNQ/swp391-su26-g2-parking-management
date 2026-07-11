import StatCards from "../../components/dashboard/StatCards";
import SlotGrid from "../../components/dashboard/SlotGrid";
import { RevenueChart, PeakHourChart, UtilizationChart } from "../../components/dashboard/Charts";
import {
  dashboardStats,
  mockSlotsByFloor,
  revenueData,
  peakHourData,
  utilizationData,
} from "../../data/mockDashboard";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(dashboardStats);
  const [slotsData, setSlotsData] = useState(mockSlotsByFloor);

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const [activeRes, floorsRes] = await Promise.all([
          api.get('/api/v1/sessions/active'),
          api.get('/api/v1/floors/with-slots')
        ]);
        
        const activeSessions = activeRes.data?.data || [];
        const floors = floorsRes.data?.data || [];

        let totalSlots = 0;
        let maintenance = 0;
        
        const realSlotsByFloor = floors.map((f: any) => {
          totalSlots += f.totalSlots || 0;
          
          let floorSlots = [];
          if (f.zones) {
            f.zones.forEach((z: any) => {
              if (z.slots) floorSlots.push(...z.slots);
            });
          }
          
          // Map to correct format for Grid
          const mappedSlots = floorSlots.map((s: any) => {
            const isOccupied = activeSessions.some((session: any) => 
              session.slotId === s.id || session.slot?.id === s.id || session.slotCode === s.slotCode
            );
            const isMaintenance = s.maintenanceStatus !== 'AVAILABLE';
            if (isMaintenance) maintenance++;
            
            return {
              id: s.id,
              slotCode: s.slotCode,
              floorId: f.id,
              zone: s.zone?.name || 'N/A',
              vehicleType: s.vehicleType,
              status: isMaintenance ? 'MAINTENANCE' : (isOccupied ? 'OCCUPIED' : 'FREE')
            };
          });

          return {
            floor: { id: f.id, floorName: f.name, totalSlots: f.totalSlots },
            slots: mappedSlots.sort((a,b) => a.slotCode.localeCompare(b.slotCode))
          };
        });

        const activeCount = activeSessions.length;
        const available = totalSlots - activeCount - maintenance;

        setStats(prev => ({
          ...prev,
          totalSlots,
          availableSlots: available > 0 ? available : 0,
          activeParkings: activeCount,
          maintenanceSlots: maintenance,
          utilization: totalSlots > 0 ? Math.round((activeCount / totalSlots) * 100) : 0
        }));

        if (realSlotsByFloor.length > 0) {
          setSlotsData(realSlotsByFloor);
        }

      } catch (err) {
        console.error("Failed to load real dashboard data", err);
      }
    };
    loadRealData();
  }, []);

  return (
    <div className="p-6 max-w-screen-xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bảng điều khiển PARKING_MANAGER</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xin chào, <span className="text-indigo-400">{user?.fullName}</span> · Cập nhật realtime
        </p>
      </div>

      {/* BR-32: availableSlots update sau check-in/out */}
      <StatCards {...stats} />

      {/* BR-22: Reserved hiển thị riêng; BR-14: Maintenance riêng */}
      <div className="mb-6">
        <SlotGrid data={slotsData} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* BR-47 */}
        <RevenueChart data={revenueData} />
        {/* BR-49 */}
        <PeakHourChart data={peakHourData} />
      </div>

      {/* BR-48 */}
      <UtilizationChart data={utilizationData} />
    </div>
  );
}
