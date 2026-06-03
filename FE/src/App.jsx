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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entry" element={<VehicleEntry />} />
            <Route path="/exit" element={<VehicleExit />} />
            <Route path="/slots" element={<SlotManagement />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/passes" element={<PassesBookings />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
