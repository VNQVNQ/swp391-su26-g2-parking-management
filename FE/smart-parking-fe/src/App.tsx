import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
// @ts-ignore
import { ParkingProvider } from './store/parkingStore';
// @ts-ignore
import { AuthProvider, useAuth } from './contexts/AuthContext';
// @ts-ignore
import HungDashboard from './pages/Dashboard';
// @ts-ignore
import HungLogin from './pages/Login';
// @ts-ignore
import HungRegister from './pages/Register';
import HungSidebar from './components/Sidebar';
// @ts-ignore
import Pricing from './pages/admin/Pricing';
// @ts-ignore
import Reports from './pages/admin/Reports';
// @ts-ignore
import Settings from './pages/admin/Settings';
// @ts-ignore
import SlotManagement from './pages/manager/SlotManagement';
// @ts-ignore
import PassesBookings from './pages/manager/PassesBookings';
// @ts-ignore
import Exceptions from './pages/manager/Exceptions';
// @ts-ignore
import VehicleEntry from './pages/staff/VehicleEntry';
// @ts-ignore
import VehicleExit from './pages/staff/VehicleExit';
// @ts-ignore
import SlotView from './pages/staff/SlotView';
// @ts-ignore
import DriverDashboard from './pages/driver/Dashboard';
// @ts-ignore
import RegisterVehicle from './pages/driver/RegisterVehicle';
// @ts-ignore
import MyVehicles from './pages/driver/MyVehicles';
// @ts-ignore
import DriverSlotView from './pages/driver/SlotView';
import DriverPassesBookings from './pages/driver/DriverPassesBookings';
// ── Role mapping ──────────────────────────────────────────────────────────────
// BE role → App role
const mapRole = (roleCode: string): string => {
  const r = roleCode?.toUpperCase();
  if (r === 'SYSTEM_ADMIN' || r === 'ADMIN') return 'ADMIN';
  if (r === 'MANAGER') return 'MANAGER';
  if (r === 'STAFF') return 'STAFF';
  if (r === 'DRIVER') return 'DRIVER';
  return 'STAFF';
};

const ROLE_DEFAULT: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  STAFF: '/entry',
  DRIVER: '/driver/dashboard',
};

// ── Route guard ───────────────────────────────────────────────────────────────
function RoleRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user } = useAuth() as any;
  const role = mapRole(user?.role || user?.roleCode || 'STAFF');
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DEFAULT[role] || '/entry'} replace />;
  }
  return <>{children}</>;
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function AuthLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #0b0f19)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.15)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, isAuthenticated, loading, logout } = useAuth() as any;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return <AuthLoading />;

  // Not logged in → show auth pages
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<HungLogin />} />
        <Route path="/register" element={<HungRegister />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const role = mapRole(user?.role || user?.roleCode || 'STAFF');
  const defaultPage = ROLE_DEFAULT[role] || '/entry';

  return (
    <ParkingProvider>
      <div className="app-layout">
        <HungSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={{ ...user, role }}
          onLogout={logout}
        />
        <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to={defaultPage} replace />} />

            {/* ═══ ADMIN (System Admin) ═══ */}
            <Route path="/admin/dashboard" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <HungDashboard />
              </RoleRoute>
            } />
            <Route path="/admin/pricing" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Pricing />
              </RoleRoute>
            } />
            <Route path="/admin/reports" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Reports />
              </RoleRoute>
            } />
            <Route path="/admin/settings" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Settings />
              </RoleRoute>
            } />

            {/* ═══ MANAGER ═══ */}
            <Route path="/manager/dashboard" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <HungDashboard />
              </RoleRoute>
            } />
            <Route path="/manager/slots" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <SlotManagement />
              </RoleRoute>
            } />
            <Route path="/manager/passes" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <PassesBookings />
              </RoleRoute>
            } />
            <Route path="/manager/exceptions" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <Exceptions />
              </RoleRoute>
            } />
            <Route path="/manager/reports" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <Reports />
              </RoleRoute>
            } />

            {/* ═══ STAFF ═══ */}
            <Route path="/entry" element={
              <RoleRoute allowedRoles={['STAFF']}>
                <VehicleEntry />
              </RoleRoute>
            } />
            <Route path="/exit" element={
              <RoleRoute allowedRoles={['STAFF']}>
                <VehicleExit />
              </RoleRoute>
            } />
            <Route path="/staff/slots" element={
              <RoleRoute allowedRoles={['STAFF']}>
                <SlotView />
              </RoleRoute>
            } />

            {/* ═══ DRIVER ═══ */}
            <Route path="/driver/register-vehicle" element={<RoleRoute allowedRoles={['DRIVER']}><RegisterVehicle /></RoleRoute>} />
            <Route path="/driver/my-vehicles" element={<RoleRoute allowedRoles={['DRIVER']}><MyVehicles /></RoleRoute>} />
            <Route path="/driver/passes-bookings" element={<RoleRoute allowedRoles={['DRIVER']}><DriverPassesBookings /></RoleRoute>} />

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/pricing" element={<Navigate to="/admin/pricing" replace />} />
            <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
            <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/slots" element={<Navigate to="/manager/slots" replace />} />
            <Route path="/passes" element={<Navigate to="/manager/passes" replace />} />
            <Route path="/exceptions" element={<Navigate to="/manager/exceptions" replace />} />

            <Route path="*" element={<Navigate to={defaultPage} replace />} />
          </Routes>
        </main>
      </div>
    </ParkingProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
