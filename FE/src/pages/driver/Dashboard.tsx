import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const quickActions = [
    { icon: "🎫", label: "Đăng ký vé",  route: "/driver/register-ticket", color: "border-[#00c853]/30 hover:border-[#00c853]" },
    { icon: "📋", label: "Xem vé",       route: "/driver/my-tickets",      color: "border-blue-800/30 hover:border-blue-500"   },
    { icon: "🅿️",  label: "Xem slot",    route: "/driver/slots",           color: "border-indigo-800/30 hover:border-indigo-500" },
    { icon: "📌", label: "Đặt chỗ",     route: "/driver/booking",         color: "border-amber-800/30 hover:border-amber-500"  },
  ];

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xin chào, <span className="text-[#00c853] font-semibold">{user?.fullName}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Vé đang dùng",   value: "0", color: "text-[#00c853]",  icon: "🎫" },
          { label: "Đặt chỗ",        value: "0", color: "text-blue-400",   icon: "📌" },
          { label: "Lịch sử đỗ xe",  value: "0", color: "text-indigo-400", icon: "📋" },
          { label: "Slot yêu thích", value: "0", color: "text-amber-400",  icon: "⭐" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1117] border border-[#1e2a1e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-5">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.route)}
              className={`bg-[#080d08] border ${a.color} rounded-xl p-5 text-center transition-all hover:bg-[#0f1a0f]`}>
              <span className="text-3xl block mb-2">{a.icon}</span>
              <p className="text-sm font-semibold text-white">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Hoạt động gần đây</h2>
        <div className="text-center py-8 text-gray-600">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">Chưa có hoạt động nào</p>
        </div>
      </div>
    </div>
  );
}
