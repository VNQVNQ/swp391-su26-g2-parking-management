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

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/entry', label: 'Vehicle Entry', icon: LogIn },
  { to: '/exit', label: 'Vehicle Exit', icon: LogOut },
  { to: '/slots', label: 'Slot Management', icon: CircleDot },
  { to: '/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/passes', label: 'Passes & Bookings', icon: CalendarCheck },
  { to: '/exceptions', label: 'Exceptions', icon: AlertTriangle },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ collapsed, onToggleCollapse, user, onLogout }) {
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

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
        {navItems.map((item) => {
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
            <p>Staff</p>
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
