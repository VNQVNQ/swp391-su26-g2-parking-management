import StatCards from "../../components/dashboard/StatCards";
import SlotGrid from "../../components/dashboard/SlotGrid";
import { RevenueChart, UtilizationChart } from "../../components/dashboard/Charts";
import { compareSlotCodes } from "../../utils/slotHelper";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    activeParkings: 0,
    maintenanceSlots: 0,
    utilization: 0
  });
  const [slotsData, setSlotsData] = useState([]);
  const [realRevenueData, setRealRevenueData] = useState([]);
  const [realUtilizationData, setRealUtilizationData] = useState([]);

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const [activeRes, completedRes, floorsRes] = await Promise.all([
          api.get('/api/v1/parking-sessions/active/all').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/parking-sessions/completed/all').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/floors/with-slots').catch(() => ({ data: { data: [] } }))
        ]);
        
        const activeSessions = activeRes.data?.data || activeRes.data || [];
        const completedSessions = completedRes.data?.data || completedRes.data || [];
        const floors = floorsRes.data?.data || floorsRes.data || [];

        let totalSlots = 0;
        let maintenance = 0;
        
        const realSlotsByFloor = floors.map((f: any) => {
          let floorSlots: any[] = [];
          if (f.zones) {
            f.zones.forEach((z: any) => {
              if (z.slots) floorSlots.push(...z.slots);
            });
          }
          
          totalSlots += floorSlots.length;
          
          // Map to correct format for Grid
          const mappedSlots = floorSlots.map((s: any) => {
            const isOccupied = !!s.currentSessionId;
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
            floor: { id: f.id, floorName: f.name, totalSlots: mappedSlots.length },
            slots: mappedSlots.sort(compareSlotCodes)
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

        // Calculate Revenue Data (last 7 days)
        const dayRevenueMap: Record<string, number> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toLocaleDateString('vi-VN', { weekday: 'short' });
          dayRevenueMap[key] = 0;
        }

        completedSessions.forEach((v: any) => {
          if (!v.exitTime) return;
          const exit = new Date(v.exitTime);
          if (exit >= new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)) {
            const key = exit.toLocaleDateString('vi-VN', { weekday: 'short' });
            if (dayRevenueMap[key] !== undefined) {
              dayRevenueMap[key] += (v.totalFee || v.finalFee || 0);
            }
          }
        });

        const revChartData = Object.keys(dayRevenueMap).map(k => ({
          name: k,
          revenue: dayRevenueMap[k]
        }));
        setRealRevenueData(revChartData);

        // Utilization data
        const occupied = activeSessions.length; // Approximate utilization based on active sessions
        const utilChartData = [
          { name: 'Đang dùng', value: occupied, fill: '#00d084' },
          { name: 'Trống', value: Math.max(0, totalSlots - occupied - maintenance), fill: '#e2e8f0' }
        ];
        if (maintenance > 0) {
           utilChartData.push({ name: 'Bảo trì', value: maintenance, fill: '#f59e0b' });
        }
        setRealUtilizationData(utilChartData);

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
        <RevenueChart data={realRevenueData.length ? realRevenueData : [{name: 'Loading', revenue: 0}]} />
        <UtilizationChart data={realUtilizationData.length ? realUtilizationData : [{name: 'Loading', value: 1, fill: '#e2e8f0'}]} />
      </div>
    </div>
  );
}
