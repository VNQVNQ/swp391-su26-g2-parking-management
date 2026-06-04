import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import VehicleEntry from './pages/VehicleEntry';
import Dashboard from './pages/Dashboard';
import VehicleExit from './pages/VehicleExit';
import SlotManagement from './pages/SlotManagement';
import Pricing from './pages/Pricing';
import PassesBookings from './pages/PassesBookings';
import Exceptions from './pages/Exceptions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { ParkingProvider } from './store/parkingStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState } from 'react';

// ── Role → allowed routes mapping ──────────────────────────────────────
const ROLE_ROUTES = {
  ADMIN:   ['/dashboard', '/pricing', '/reports', '/settings'],
  MANAGER: ['/dashboard', '/slots', '/passes', '/exceptions'],
  STAFF:   ['/entry', '/exit'],
};

// ── Role → default landing page ────────────────────────────────────────
const ROLE_DEFAULT = {
  ADMIN:   '/dashboard',
  MANAGER: '/dashboard',
  STAFF:   '/entry',
};

/* ── Route guard: redirects if user role doesn't have access ─────────── */
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';

  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DEFAULT[role] || '/entry'} replace />;
  }
  return children;
}

/* ── Loading spinner shown while AuthContext checks stored session ──── */
function AuthLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #0a0e1a)',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div className="auth-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 200, 200, 0.15)',
          borderTopColor: '#00c8c8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'var(--text-secondary, #8892a4)', fontSize: '0.9rem' }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

/* ── App shell (uses AuthContext to decide what to render) ──────────── */
function AppShell() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show spinner while checking stored session
  if (loading) {
    return <AuthLoading />;
  }

  // If not logged in, show auth pages
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Determine role-based default page
  const userRole = user?.role || 'STAFF';
  const defaultPage = ROLE_DEFAULT[userRole] || '/entry';

  return (
    <ParkingProvider>
      <div className="app-layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          onLogout={logout}
        />
        <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to={defaultPage} replace />} />

            {/* Dashboard: Admin, Manager */}
            <Route path="/dashboard" element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Dashboard />
              </RoleRoute>
            } />

            {/* Vehicle Entry & Exit: Staff */}
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

            {/* Slot Management: Manager */}
            <Route path="/slots" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <SlotManagement />
              </RoleRoute>
            } />

            {/* Pricing: Admin */}
            <Route path="/pricing" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Pricing />
              </RoleRoute>
            } />

            {/* Passes & Bookings: Manager */}
            <Route path="/passes" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <PassesBookings />
              </RoleRoute>
            } />

            {/* Exceptions: Manager */}
            <Route path="/exceptions" element={
              <RoleRoute allowedRoles={['MANAGER']}>
                <Exceptions />
              </RoleRoute>
            } />

            {/* Reports: Admin */}
            <Route path="/reports" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Reports />
              </RoleRoute>
            } />

            {/* Settings: Admin */}
            <Route path="/settings" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Settings />
              </RoleRoute>
            } />

            {/* Catch-all: redirect to role-appropriate default */}
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

