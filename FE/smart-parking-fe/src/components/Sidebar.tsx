import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogIn, LogOut, CircleDot,
  DollarSign, CalendarCheck, AlertTriangle,
  BarChart3, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Car, Power,
  BookOpen, MapPin, Calendar, Building2, Grid3x3, Ticket, History,
} from 'lucide-react';

// ── Role-based navigation items ──────────────────────────────────────────────
const navItems = [
  // ADMIN (System Administrator)
  { to: '/admin/dashboard', label: 'Tổng quan',  icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/admin/pricing',   label: 'Bảng giá',    icon: DollarSign,      roles: ['ADMIN'] },
  { to: '/admin/reports',   label: 'Báo cáo',    icon: BarChart3,       roles: ['ADMIN'] },
  { to: '/admin/settings',  label: 'Cài đặt',   icon: SettingsIcon,    roles: ['ADMIN'] },
  // PARKING_MANAGER (Parking Lot PARKING_MANAGER)
  { to: '/PARKING_MANAGER/dashboard',   label: 'Tổng quan',         icon: LayoutDashboard, roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/floors',      label: 'Quản lý Tầng',     icon: Building2,       roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/zones',       label: 'Quản lý Khu vực',      icon: MapPin,          roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/parking-slots', label: 'Quản lý Chỗ đỗ',    icon: Grid3x3,         roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/slots',       label: 'Giám sát Chỗ đỗ',   icon: CircleDot,       roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/passes',      label: 'Vé tháng & Đặt trước', icon: CalendarCheck,   roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/exceptions',  label: 'Xử lý Ngoại lệ',        icon: AlertTriangle,   roles: ['PARKING_MANAGER'] },
  { to: '/PARKING_MANAGER/reports',     label: 'Báo cáo doanh thu',           icon: BarChart3,       roles: ['PARKING_MANAGER'] },
  // PARKING_STAFF
  { to: '/entry',       label: 'Cho xe vào',     icon: LogIn,           roles: ['PARKING_STAFF'] },
  { to: '/exit',        label: 'Cho xe ra',      icon: LogOut,          roles: ['PARKING_STAFF'] },
  { to: '/PARKING_STAFF/slots', label: 'Bản đồ chỗ đỗ',         icon: MapPin,          roles: ['PARKING_STAFF'] },
  // DRIVER
  { to: '/driver/dashboard',        label: 'Tổng quan',         icon: LayoutDashboard, roles: ['DRIVER'] },
  { to: '/driver/register-vehicle', label: 'Đăng ký xe',        icon: Car,             roles: ['DRIVER'] },
  { to: '/driver/my-vehicles',      label: 'Xe của tôi',        icon: BookOpen,        roles: ['DRIVER'] },
  { to: '/driver/monthly-pass',     label: 'Vé tháng',          icon: Ticket,          roles: ['DRIVER'] },
  { to: '/driver/slots',            label: 'Xem chỗ trống',     icon: MapPin,          roles: ['DRIVER'] },
  { to: '/driver/booking',          label: 'Đặt chỗ đỗ',        icon: Calendar,        roles: ['DRIVER'] },
  { to: '/driver/booking-history',  label: 'Lịch sử đặt chỗ',  icon: History,         roles: ['DRIVER'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:   'Quản trị viên',
  PARKING_MANAGER: 'Quản lý',
  PARKING_STAFF:   'Nhân viên',
  DRIVER:  'Lái xe',
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
