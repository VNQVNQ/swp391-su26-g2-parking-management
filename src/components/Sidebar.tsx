import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

// ── SVG Icons — match v0 style ────────────────────────────────────────────────
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
      <circle cx="12" cy="12" r="10"/>
      <path d="M9 12h6M12 8v8"/>
    </svg>
  ),
  Pricing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Exceptions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
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
  { to: "/dashboard",  label: "Dashboard",     icon: Icons.Dashboard  },
  { to: "/pricing",    label: "Pricing Config", icon: Icons.Pricing    },
  { to: "/reports",    label: "Reports",        icon: Icons.Reports    },
  { to: "/exceptions", label: "Exceptions",     icon: Icons.Exceptions },
];

const STAFF_NAV: NavItem[] = [
  { to: "/staff/dashboard", label: "Dashboard",     icon: Icons.Dashboard },
  { to: "/staff/entry",     label: "Vehicle Entry", icon: Icons.Entry     },
  { to: "/staff/exit",      label: "Vehicle Exit",  icon: Icons.Exit      },
  { to: "/staff/slots",     label: "Slot View",     icon: Icons.Slot      },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();

  const navItems =
    user?.role === "MANAGER" ? MANAGER_NAV :
    user?.role === "STAFF"   ? STAFF_NAV   : [];

  const isManager = user?.role === "MANAGER";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // Initials avatar
  const initials = user?.fullName
    ?.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase() ?? "?";

  return (
    <aside className="w-56 min-h-screen bg-[#080d08] border-r border-[#1e2a1e] flex flex-col flex-shrink-0">

      {/* ── Logo ── */}
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

      {/* ── Role + User ── */}
      <div className="px-4 py-3 border-b border-[#1e2a1e]">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider ${
          isManager
            ? "bg-blue-950/60 text-blue-400 border border-blue-800/50"
            : "bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30"
        }`}>
          {user?.role}
        </span>
        <p className="text-xs text-gray-400 mt-1.5 truncate">{user?.fullName}</p>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20"
                  : "text-gray-500 hover:text-gray-200 hover:bg-[#0f1a0f]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-[#00c853]" : "text-gray-600"}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User info + Logout ── */}
      <div className="border-t border-[#1e2a1e] p-3 space-y-1">
        {/* User card */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-[#1e2a1e] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#00c853]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-gray-600 truncate">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all duration-150"
        >
          <span className="text-gray-600">{Icons.Logout}</span>
          Đăng xuất
        </button>
      </div>

    </aside>
  );
}
