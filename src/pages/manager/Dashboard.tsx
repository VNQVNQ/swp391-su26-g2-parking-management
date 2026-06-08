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
export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 max-w-screen-xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xin chào, <span className="text-indigo-400">{user?.fullName}</span> · Cập nhật realtime
        </p>
      </div>

      {/* BR-32: availableSlots update sau check-in/out */}
      <StatCards {...dashboardStats} />

      {/* BR-22: Reserved hiển thị riêng; BR-14: Maintenance riêng */}
      <div className="mb-6">
        <SlotGrid data={mockSlotsByFloor} />
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
