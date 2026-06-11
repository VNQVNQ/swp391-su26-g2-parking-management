import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  Entry: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  Exit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Slot: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  Pricing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Exceptions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Passes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Ticket: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    </svg>
  ),
  MyTicket: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Booking: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h8M8 18h5"/>
    </svg>
  ),
  Logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── Nav items per role ────────────────────────────────────────────────────────
const MANAGER_NAV: NavItem[] = [
  { to: "/dashboard",  label: "Dashboard",        icon: Icons.Dashboard  },
  { to: "/pricing",    label: "Pricing Config",   icon: Icons.Pricing    },
  { to: "/passes",     label: "Passes & Bookings",icon: Icons.Passes     },
  { to: "/exceptions", label: "Exceptions",       icon: Icons.Exceptions },
  { to: "/reports",    label: "Reports",          icon: Icons.Reports    },
];

const STAFF_NAV: NavItem[] = [
  { to: "/staff/dashboard", label: "Dashboard",     icon: Icons.Dashboard },
  { to: "/staff/entry",     label: "Vehicle Entry", icon: Icons.Entry     },
  { to: "/staff/exit",      label: "Vehicle Exit",  icon: Icons.Exit      },
  { to: "/staff/slots",     label: "Slot View",     icon: Icons.Slot      },
];

const DRIVER_NAV: NavItem[] = [
  { to: "/driver/dashboard",       label: "Dashboard",   icon: Icons.Dashboard },
  { to: "/driver/register-ticket", label: "Đăng ký vé", icon: Icons.Ticket    },
  { to: "/driver/my-tickets",      label: "Xem vé",      icon: Icons.MyTicket  },
  { to: "/driver/slots",           label: "Xem slot",    icon: Icons.Slot      },
  { to: "/driver/booking",         label: "Đặt chỗ",     icon: Icons.Booking   },
];

const ROLE_COLOR: Record<string, string> = {
  MANAGER:      "bg-blue-950/60 text-blue-400 border-blue-800/50",
  STAFF:        "bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30",
  DRIVER:       "bg-amber-950/60 text-amber-400 border-amber-800/50",
  SYSTEM_ADMIN: "bg-purple-950/60 text-purple-400 border-purple-800/50",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();

  const navItems =
    user?.role === "MANAGER"      ? MANAGER_NAV :
    user?.role === "STAFF"        ? STAFF_NAV   :
    user?.role === "DRIVER"       ? DRIVER_NAV  : [];

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials = user?.fullName
    ?.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase() ?? "?";

  const roleColor = ROLE_COLOR[user?.role ?? ""] ?? "bg-gray-800 text-gray-400 border-gray-700";

  return (
    <aside className="w-56 min-h-screen bg-[#080d08] border-r border-[#1e2a1e] flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1e2a1e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00c853] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h6M3 15h6"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ParkGuard</p>
            <p className="text-[10px] text-gray-600 mt-0.5">BMS v1.0</p>
          </div>
        </div>
      </div>

      {/* Role + User */}
      <div className="px-4 py-3 border-b border-[#1e2a1e]">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider border ${roleColor}`}>
          {user?.role}
        </span>
        <p className="text-xs text-gray-400 mt-1.5 truncate">{user?.fullName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20"
                  : "text-gray-500 hover:text-gray-200 hover:bg-[#0f1a0f]"
              }`
            }>
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-[#00c853]" : "text-gray-600"}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#1e2a1e] p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-[#1e2a1e] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#00c853]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all">
          <span className="text-gray-600">{Icons.Logout}</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
