import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  CircleDot,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Car,
  Power
} from 'lucide-react';

// ── Role-based navigation items ─────────────────────────────────────────
// Each item specifies which roles are allowed to see it.
const navItems = [
  { to: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { to: '/entry',      label: 'Vehicle Entry',    icon: LogIn,           roles: ['STAFF'] },
  { to: '/exit',       label: 'Vehicle Exit',     icon: LogOut,          roles: ['STAFF'] },
  { to: '/slots',      label: 'Slot Management',  icon: CircleDot,       roles: ['MANAGER'] },
  { to: '/pricing',    label: 'Pricing',          icon: DollarSign,      roles: ['ADMIN'] },
  { to: '/passes',     label: 'Passes & Bookings',icon: CalendarCheck,   roles: ['MANAGER'] },
  { to: '/exceptions', label: 'Exceptions',       icon: AlertTriangle,   roles: ['MANAGER'] },
  { to: '/reports',    label: 'Reports',          icon: BarChart3,       roles: ['ADMIN'] },
  { to: '/settings',   label: 'Settings',         icon: SettingsIcon,    roles: ['ADMIN'] },
];

// ── Human-readable role labels ──────────────────────────────────────────
const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export default function Sidebar({ collapsed, onToggleCollapse, user, onLogout }) {
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Filter nav items based on user role
  const userRole = user?.role || 'STAFF';
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Car />
        </div>
        <div className="sidebar-brand-text">
          <h1>ParkingPro</h1>
          <p>Parking Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <h4>{user?.name || 'User'}</h4>
            <p>{ROLE_LABELS[userRole] || userRole}</p>
          </div>
        </div>
        {onLogout && (
          <button
            className="collapse-btn"
            onClick={onLogout}
            style={{ color: '#ef4444', marginBottom: '4px' }}
            title="Sign out"
          >
            <Power size={16} />
            <span className="collapse-text">Sign Out</span>
          </button>
        )}
        <button className="collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="collapse-text">{collapsed ? '' : 'Collapse'}</span>
        </button>
      </div>
    </aside>
  );
}

