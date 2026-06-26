import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogIn, LogOut, CircleDot,
  DollarSign, CalendarCheck, AlertTriangle,
  BarChart3, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Car, Power,
  BookOpen, MapPin, Calendar, Building2, Grid3x3, Ticket,
} from 'lucide-react';

// ── Role-based navigation items ──────────────────────────────────────────────
const navItems = [
  // ADMIN (System Administrator)
  { to: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/admin/pricing',   label: 'Pricing',    icon: DollarSign,      roles: ['ADMIN'] },
  { to: '/admin/reports',   label: 'Reports',    icon: BarChart3,       roles: ['ADMIN'] },
  { to: '/admin/settings',  label: 'Settings',   icon: SettingsIcon,    roles: ['ADMIN'] },
  // PARKING_MANAGER (Parking Lot PARKING_MANAGER)
  { to: '/PARKING_MANAGER/dashboard',   label: 'Dashboard',         icon: LayoutDashboard, roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/floors',      label: 'Manage Floors',     icon: Building2,       roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/zones',       label: 'Manage Zones',      icon: MapPin,          roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/parking-slots', label: 'Manage Slots',    icon: Grid3x3,         roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/slots',       label: 'Slot Management',   icon: CircleDot,       roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/passes',      label: 'Passes & Bookings', icon: CalendarCheck,   roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/exceptions',  label: 'Exceptions',        icon: AlertTriangle,   roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/reports',     label: 'Reports',           icon: BarChart3,       roles: ['PARKING_MANAGER'] },
  // PARKING_STAFF
  { to: '/entry',       label: 'Vehicle Entry',     icon: LogIn,           roles: ['PARKING_STAFF'] },
  { to: '/exit',        label: 'Vehicle Exit',      icon: LogOut,          roles: ['PARKING_STAFF'] },
  { to: '/PARKING_STAFF/slots', label: 'Slot View',         icon: MapPin,          roles: ['PARKING_STAFF'] },
  // DRIVER
  { to: '/driver/dashboard',        label: 'Dashboard',    icon: LayoutDashboard, roles: ['DRIVER'] },
  { to: '/driver/register-vehicle', label: 'Đăng ký xe',   icon: Car,             roles: ['DRIVER'] },
  { to: '/driver/my-vehicles',      label: 'Xe của tôi',   icon: BookOpen,        roles: ['DRIVER'] },
  { to: '/driver/monthly-pass',     label: 'Pass hàng tháng', icon: Ticket,       roles: ['DRIVER'] },
  { to: '/driver/slots',            label: 'Xem slot',     icon: MapPin,          roles: ['DRIVER'] },
  { to: '/driver/booking',          label: 'Đặt chỗ',      icon: Calendar,        roles: ['DRIVER'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:   'System Admin',
  PARKING_MANAGER: 'Parking Manager',
  PARKING_STAFF:   'Parking Staff',
  DRIVER:  'Driver',
};

export default function Sidebar({ collapsed, onToggleCollapse, user, onLogout }: any) {
  const location = useLocation();

  const displayName = user?.fullName || user?.name || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const userRole  = user?.role || 'PARKING_STAFF';
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
