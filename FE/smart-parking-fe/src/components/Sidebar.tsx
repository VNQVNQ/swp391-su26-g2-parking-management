import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogIn, LogOut, CircleDot,
  DollarSign, CalendarCheck, AlertTriangle,
  BarChart3, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Car, Power,
  Ticket, BookOpen, MapPin, Calendar,
} from 'lucide-react';

// ── Role-based navigation items ──────────────────────────────────────────────
const navItems = [
  // ADMIN
  { to: '/dashboard',  label: 'Dashboard',         icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/slots',      label: 'Slot Management',   icon: CircleDot,       roles: ['ADMIN'] },
  { to: '/pricing',    label: 'Pricing',           icon: DollarSign,      roles: ['ADMIN'] },
  { to: '/passes',     label: 'Passes & Bookings', icon: CalendarCheck,   roles: ['ADMIN'] },
  { to: '/exceptions', label: 'Exceptions',        icon: AlertTriangle,   roles: ['ADMIN'] },
  { to: '/reports',    label: 'Reports',           icon: BarChart3,       roles: ['ADMIN'] },
  { to: '/settings',   label: 'Settings',          icon: SettingsIcon,    roles: ['ADMIN'] },
  // STAFF
  { to: '/entry',       label: 'Vehicle Entry',     icon: LogIn,           roles: ['STAFF'] },
  { to: '/exit',        label: 'Vehicle Exit',      icon: LogOut,          roles: ['STAFF'] },
  { to: '/staff/slots', label: 'Slot View',         icon: MapPin,          roles: ['STAFF'] },
  // DRIVER
{ to: '/driver/dashboard',        label: 'Dashboard',    icon: LayoutDashboard, roles: ['DRIVER'] },
{ to: '/driver/register-vehicle', label: 'Đăng ký xe',   icon: Car,             roles: ['DRIVER'] },
{ to: '/driver/my-vehicles',      label: 'Xe của tôi',   icon: BookOpen,        roles: ['DRIVER'] },
{ to: '/driver/slots',            label: 'Xem slot',     icon: MapPin,          roles: ['DRIVER'] },
{ to: '/driver/booking',          label: 'Đặt chỗ',      icon: Calendar,        roles: ['DRIVER'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:  'Admin / Manager',
  STAFF:  'Staff',
  DRIVER: 'Driver',
};

export default function Sidebar({ collapsed, onToggleCollapse, user, onLogout }: any) {
  const location = useLocation();

  const displayName = user?.fullName || user?.name || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const userRole  = user?.role || 'STAFF';
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo"><Car /></div>
        <div className="sidebar-brand-text">
          <h1>ParkGuard</h1>
          <p>Parking Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink key={item.to} to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}>
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
            <h4>{displayName}</h4>
            <p>{ROLE_LABELS[userRole] || userRole}</p>
          </div>
        </div>
        {onLogout && (
          <button className="collapse-btn" onClick={onLogout}
            style={{ color: '#ef4444', marginBottom: '4px' }} title="Sign out">
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
