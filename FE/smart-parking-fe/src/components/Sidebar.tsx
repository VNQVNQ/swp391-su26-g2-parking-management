import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  LayoutDashboard, LogIn, LogOut, Search,
  DollarSign, CalendarCheck, AlertTriangle,
  BarChart3, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Car, Power,
  BookOpen, MapPin, Calendar, Building2, Grid3x3, Ticket, History, SquareParking,
} from 'lucide-react';

// ── Role-based navigation items ──────────────────────────────────────────────
const navItems = [
  // ADMIN (System Administrator)
  { to: '/admin/dashboard', label: 'Tổng quan',  icon: LayoutDashboard, roles: ['ADMIN'], group: 'MAIN' },
  { to: '/admin/pricing',   label: 'Bảng giá',    icon: DollarSign,      roles: ['ADMIN'], group: 'MANAGEMENT' },
  { to: '/admin/reports',   label: 'Báo cáo',    icon: BarChart3,       roles: ['ADMIN'], group: 'MANAGEMENT' },
  { to: '/admin/settings',  label: 'Cài đặt',   icon: SettingsIcon,    roles: ['ADMIN'], group: 'SYSTEM' },
  // PARKING_MANAGER (Parking Lot PARKING_MANAGER)
  { to: '/PARKING_MANAGER/dashboard',   label: 'Tổng quan',         icon: LayoutDashboard, roles: ['PARKING_MANAGER'], group: 'MAIN' },
  { to: '/PARKING_MANAGER/floors',      label: 'Quản lý Tầng',     icon: Building2,       roles: ['PARKING_MANAGER'], group: 'MANAGEMENT' },
  { to: '/PARKING_MANAGER/zones',       label: 'Quản lý Khu vực',      icon: MapPin,          roles: ['PARKING_MANAGER'], group: 'MANAGEMENT' },
  { to: '/PARKING_MANAGER/parking-slots', label: 'Quản lý Chỗ đỗ',    icon: Grid3x3,         roles: ['PARKING_MANAGER'], group: 'MANAGEMENT' },
  { to: '/PARKING_MANAGER/slots',       label: 'Giám sát Chỗ đỗ',   icon: Search,       roles: ['PARKING_MANAGER'], group: 'MONITOR' },
  { to: '/PARKING_MANAGER/passes',      label: 'Vé tháng & Đặt trước', icon: CalendarCheck,   roles: ['PARKING_MANAGER'], group: 'MONITOR' },
  { to: '/PARKING_MANAGER/reports',     label: 'Báo cáo doanh thu',           icon: BarChart3,       roles: ['PARKING_MANAGER'], group: 'SYSTEM' },
  // PARKING_STAFF
  { to: '/entry',       label: 'Cho xe vào',     icon: LogIn,           roles: ['PARKING_STAFF'], group: 'ACTION' },
  { to: '/exit',        label: 'Cho xe ra',      icon: LogOut,          roles: ['PARKING_STAFF'], group: 'ACTION' },
  { to: '/PARKING_STAFF/slots', label: 'Bản đồ chỗ đỗ',         icon: MapPin,          roles: ['PARKING_STAFF'], group: 'MONITOR' },
  { to: '/PARKING_STAFF/exceptions',  label: 'Xử lý Ngoại lệ',        icon: AlertTriangle,   roles: ['PARKING_STAFF'], group: 'MONITOR' },
  // DRIVER
  { to: '/driver/dashboard',        label: 'Tổng quan',         icon: LayoutDashboard, roles: ['DRIVER'], group: 'MAIN' },
  { to: '/driver/register-vehicle', label: 'Đăng ký xe',        icon: Car,             roles: ['DRIVER'], group: 'VEHICLE' },
  { to: '/driver/my-vehicles',      label: 'Xe của tôi',        icon: BookOpen,        roles: ['DRIVER'], group: 'VEHICLE' },
  { to: '/driver/monthly-pass',     label: 'Vé tháng',          icon: Ticket,          roles: ['DRIVER'], group: 'SERVICE' },
  { to: '/driver/slots',            label: 'Xem chỗ trống',     icon: MapPin,          roles: ['DRIVER'], group: 'SERVICE' },
  { to: '/driver/booking',          label: 'Đặt chỗ đỗ',        icon: Calendar,        roles: ['DRIVER'], group: 'SERVICE' },
  { to: '/driver/booking-history',  label: 'Lịch sử đặt chỗ',  icon: History,         roles: ['DRIVER'], group: 'SERVICE' },
];

const GROUP_LABELS: Record<string, string> = {
  MAIN: 'Bảng điều khiển',
  MANAGEMENT: 'Quản lý',
  SYSTEM: 'Hệ thống',
  MONITOR: 'Giám sát',
  ACTION: 'Thao tác',
  VEHICLE: 'Phương tiện',
  SERVICE: 'Dịch vụ',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN:   'Quản trị viên',
  PARKING_MANAGER: 'Quản lý bãi đỗ',
  PARKING_STAFF:   'Nhân viên',
  DRIVER:  'Lái xe',
};

export default function Sidebar({ collapsed, onToggleCollapse, user, onLogout }: any) {
  const location = useLocation();

  const displayName = user?.fullName || user?.name || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const userRole  = user?.role || 'PARKING_STAFF';
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  const [exceptionStats, setExceptionStats] = useState({ pending: 0, inProgress: 0 });

  useEffect(() => {
    if (userRole === 'STAFF' || userRole === 'MANAGER' || userRole === 'PARKING_MANAGER' || userRole === 'PARKING_STAFF' || userRole === 'ADMIN') {
      const fetchExceptions = async () => {
        try {
          const res = await api.get('/api/v1/exceptions');
          const data = res.data.data || res.data;
          const pending = data.filter((e: any) => e.status === 'PENDING').length;
          const inProgress = data.filter((e: any) => e.status === 'IN_PROGRESS').length;
          setExceptionStats({ pending, inProgress });
        } catch (error) {
          console.error("Error fetching exception stats", error);
        }
      };
      fetchExceptions();
      const interval = setInterval(fetchExceptions, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const groupedItems = visibleItems.reduce((acc, item) => {
    const g = item.group || 'OTHER';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand & Header */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', flexDirection: collapsed ? 'column' : 'row', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: collapsed ? '16px 0 8px 0' : '0' }}>
        <Link to="/" className="sidebar-brand" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flex: 1, borderBottom: 'none', padding: collapsed ? '0 0 12px 0' : '20px 18px', width: collapsed ? 'auto' : '100%' }}>
          <div className="sidebar-logo" style={{ borderRadius: '8px', margin: collapsed ? '0 auto' : '0' }}><SquareParking /></div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <h1 style={{ lineHeight: '1.1' }}>ParkGuard</h1>
              <p style={{ fontSize: '11px', marginTop: '2px', letterSpacing: '0.02em', color: '#94a3b8', fontWeight: 500 }}>Parking management</p>
            </div>
          )}
        </Link>
        <button onClick={onToggleCollapse} title={collapsed ? 'Mở rộng' : 'Thu gọn'} style={{ 
            background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', 
            padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: collapsed ? '0' : '12px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {Object.entries(groupedItems).map(([group, items], index) => (
          <div key={group} className="nav-group" style={{ marginBottom: '16px', paddingTop: index > 0 ? '16px' : '0', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            {!collapsed && GROUP_LABELS[group] && (
              <div className="nav-group-label" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 14px', marginBottom: '8px' }}>
                {GROUP_LABELS[group]}
              </div>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              // Fix: location.pathname.startsWith(item.to + '/') ensures exact match or sub-route
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
              const isExceptionTab = item.label === 'Xử lý Ngoại lệ';
              return (
                <NavLink key={item.to} to={item.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}>
                  <Icon />
                  <span className="nav-label">{item.label}</span>
                  {!collapsed && isExceptionTab && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                      {exceptionStats.pending > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '12px', boxShadow: '0 0 10px rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px' }}>
                          {exceptionStats.pending}
                        </span>
                      )}
                      {exceptionStats.inProgress > 0 && (
                        <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '12px', boxShadow: '0 0 10px rgba(245,158,11,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px' }}>
                          {exceptionStats.inProgress}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="user-card hover-lift" style={{ padding: '4px' }}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <h4 style={{ color: '#f1f5f9' }}>{displayName}</h4>
              <p>{ROLE_LABELS[userRole] || userRole}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onLogout && (
              <button className="collapse-btn logout-btn" onClick={onLogout} title="Đăng xuất" style={{ 
                flex: 1, color: '#ef4444', justifyContent: 'center', background: 'transparent', 
                border: 'none', padding: '8px', fontSize: '0.85rem' 
              }}>
                <Power size={16} />
                <span className="collapse-text">Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
