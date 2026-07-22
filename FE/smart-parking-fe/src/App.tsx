import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
// @ts-ignore
import { ParkingProvider } from "./store/parkingStore";
// @ts-ignore
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// @ts-ignore
import HungDashboard from "./pages/Dashboard";
// @ts-ignore
import HungLogin from "./pages/Login";
// @ts-ignore
import HungRegister from "./pages/Register";
// @ts-ignore
import ForgotPassword from "./pages/ForgotPassword";
// @ts-ignore
import ResetPassword from "./pages/ResetPassword";
// @ts-ignore
import LandingPage from "./pages/LandingPage";
import HungSidebar from "./components/Sidebar";
// @ts-ignore
import Pricing from "./pages/admin/Pricing";
// @ts-ignore
import Reports from "./pages/admin/Reports";
// @ts-ignore
import Settings from "./pages/admin/Settings";
// @ts-ignore
import SlotManagement from "./pages/manager/SlotManagement";
// @ts-ignore
import PassesBookings from "./pages/manager/PassesBookings";
// @ts-ignore
import Exceptions from "./pages/staff/Exceptions";
// @ts-ignore
import VehicleEntry from "./pages/staff/VehicleEntry";
// @ts-ignore
import VehicleExit from "./pages/staff/VehicleExit";
// @ts-ignore
import SlotView from "./pages/staff/SlotView";
// @ts-ignore
import DriverDashboard from "./pages/driver/Dashboard";
// @ts-ignore
import RegisterVehicle from "./pages/driver/RegisterVehicle";
// @ts-ignore
import MyVehicles from "./pages/driver/MyVehicles";
// @ts-ignore
import DriverSlotView from "./pages/driver/SlotView";
// @ts-ignore
import Booking from "./pages/driver/Booking";
// @ts-ignore
import BookingHistory from "./pages/driver/BookingHistory";
// @ts-ignore
import MonthlyPass from "./pages/driver/MonthlyPass";
// @ts-ignore
import ManageFloors from "./pages/manager/ManageFloors";
// @ts-ignore
import BuildingOverview from "./pages/manager/BuildingOverview";
// @ts-ignore
import ManageZones from "./pages/manager/ManageZones";
// @ts-ignore
import ManageParkingSlots from "./pages/manager/ManageParkingSlots";
// @ts-ignore
import RevenueReport from "./pages/manager/RevenueReport";
// @ts-ignore
import Profile from "./pages/Profile";
// @ts-ignore
import VnPayReturn from "./pages/VnPayReturn";

// ── Role mapping ──────────────────────────────────────────────────────────────
// FIX: Đọc từ cả role lẫn roleCode, normalize về uppercase
function mapRole(user: any): string {
  // Lấy roleCode từ nhiều chỗ phòng khi user object không đồng nhất
  const rawRole = user?.role || user?.roleCode || user?.roleName || "";
  const r = String(rawRole).toUpperCase().trim();

  if (r.includes("ADMIN")) return "ADMIN";
  if (r.includes("MANAGER")) return "PARKING_MANAGER";
  if (r.includes("STAFF")) return "PARKING_STAFF";
  if (r.includes("DRIVER")) return "DRIVER";

  // FIX: Nếu không map được, log để debug thay vì silently fallback
  console.warn("[mapRole] Unknown role:", rawRole, "| user:", user);
  return "DRIVER"; // Fallback an toàn nhất (ít quyền nhất)
}

const ROLE_DEFAULT: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  PARKING_MANAGER: "/PARKING_MANAGER/dashboard",
  PARKING_STAFF: "/entry",
  DRIVER: "/driver/dashboard",
};

// ── Route guard ───────────────────────────────────────────────────────────────
function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth() as any;
  const role = mapRole(user);
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DEFAULT[role] || "/driver/dashboard"} replace />;
  }
  return <>{children}</>;
}

function hasStoredAuthSession() {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("refreshToken") ||
    localStorage.getItem("token");
  if (token) return true;

  const savedUser = localStorage.getItem("user");
  if (!savedUser) return false;

  try {
    const parsed = JSON.parse(savedUser);
    return Boolean(
      parsed && typeof parsed === "object" && Object.keys(parsed).length > 0,
    );
  } catch {
    return false;
  }
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function AuthLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary, #000000)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(10,132,255,0.15)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Loading...
        </span>
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, isAuthenticated, loading, logout } = useAuth() as any;
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return <AuthLoading />;

  const isPublicRoute =
    ["/", "/login", "/register", "/forgot-password", "/payment/vnpay-return"].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/payment/vnpay-return");
  const hasStoredSession = hasStoredAuthSession();

  if (!isAuthenticated && !hasStoredSession && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<HungLogin />} />
        <Route path="/register" element={<HungRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:tokenResetPassword"
          element={<ResetPassword />}
        />
        <Route path="/payment/vnpay-return" element={<VnPayReturn />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const role = mapRole(user);
  const defaultPage = ROLE_DEFAULT[role] || "/driver/dashboard";

  return (
    <ParkingProvider>
      <div className="app-layout">
        <HungSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={{ ...user, role }}
          onLogout={logout}
        />
        <main className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <Routes>
            <Route path="/" element={<Navigate to={defaultPage} replace />} />
            <Route path="/payment/vnpay-return" element={<VnPayReturn />} />

            {/* ═══ ADMIN ═══ */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <HungDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <Pricing />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <Reports />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <Settings />
                </RoleRoute>
              }
            />

            {/* ═══ PARKING_MANAGER ═══ */}
            <Route
              path="/PARKING_MANAGER/dashboard"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <HungDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/slots"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <SlotManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/floors"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <ManageFloors />
                </RoleRoute>
              }
            />
            <Route
              path="/building-overview"
              element={
                <RoleRoute allowedRoles={["ADMIN", "PARKING_MANAGER", "PARKING_STAFF", "DRIVER"]}>
                  <BuildingOverview />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/zones"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <ManageZones />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/parking-slots"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <ManageParkingSlots />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/passes"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <PassesBookings />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/reports"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <RevenueReport />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_MANAGER/revenue"
              element={
                <RoleRoute allowedRoles={["PARKING_MANAGER"]}>
                  <RevenueReport />
                </RoleRoute>
              }
            />

            {/* ═══ PARKING_STAFF ═══ */}
            <Route
              path="/entry"
              element={
                <RoleRoute allowedRoles={["PARKING_STAFF"]}>
                  <VehicleEntry />
                </RoleRoute>
              }
            />
            <Route
              path="/exit"
              element={
                <RoleRoute allowedRoles={["PARKING_STAFF"]}>
                  <VehicleExit />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_STAFF/slots"
              element={
                <RoleRoute allowedRoles={["PARKING_STAFF"]}>
                  <SlotView />
                </RoleRoute>
              }
            />
            <Route
              path="/PARKING_STAFF/exceptions"
              element={
                <RoleRoute allowedRoles={["PARKING_STAFF"]}>
                  <Exceptions />
                </RoleRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <RoleRoute allowedRoles={["ADMIN", "PARKING_MANAGER", "PARKING_STAFF", "DRIVER"]}>
                  <Profile />
                </RoleRoute>
              }
            />

            {/* ═══ DRIVER ═══ */}
            <Route
              path="/driver/dashboard"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <DriverDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/register-vehicle"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <RegisterVehicle />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/my-vehicles"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <MyVehicles />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/slots"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <DriverSlotView />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/booking"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <Booking />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/booking-history"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <BookingHistory />
                </RoleRoute>
              }
            />
            <Route
              path="/driver/monthly-pass"
              element={
                <RoleRoute allowedRoles={["DRIVER"]}>
                  <MonthlyPass />
                </RoleRoute>
              }
            />

            {/* Legacy redirects */}
            <Route
              path="/dashboard"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/pricing"
              element={<Navigate to="/admin/pricing" replace />}
            />
            <Route
              path="/reports"
              element={<Navigate to="/admin/reports" replace />}
            />
            <Route
              path="/settings"
              element={<Navigate to="/admin/settings" replace />}
            />
            <Route
              path="/slots"
              element={<Navigate to="/PARKING_MANAGER/slots" replace />}
            />
            <Route
              path="/passes"
              element={<Navigate to="/PARKING_MANAGER/passes" replace />}
            />
            <Route
              path="/exceptions"
              element={<Navigate to="/PARKING_STAFF/exceptions" replace />}
            />

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
