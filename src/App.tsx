import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Unauthorized    from "./pages/Unauthorized";
import Dashboard       from "./pages/manager/Dashboard";
import PricingConfig   from "./pages/manager/PricingConfig";
import StaffDashboard  from "./pages/staff/Dashboard";
import VehicleEntry    from "./pages/staff/VehicleEntry";
import VehicleExit     from "./pages/staff/VehicleExit";
import SlotView        from "./pages/staff/SlotView";
import SidebarLayout   from "./layouts/SidebarLayout";
import RouteGuard      from "./components/RouteGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public — không cần login */}
        <Route path="/"             element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Manager only — BR-13 */}
        <Route element={
          <RouteGuard allowedRoles={["MANAGER"]}>
            <SidebarLayout />
          </RouteGuard>
        }>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/pricing"    element={<PricingConfig />} />
          <Route path="/reports"    element={<PlaceholderPage title="Reports" />} />
          <Route path="/exceptions" element={<PlaceholderPage title="Exceptions" />} />
        </Route>

        {/* Staff only */}
        <Route element={
          <RouteGuard allowedRoles={["STAFF"]}>
            <SidebarLayout />
          </RouteGuard>
        }>
          {/* FIX: thêm route /staff/dashboard — Sidebar đang trỏ tới đây */}
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/entry"     element={<VehicleEntry />} />
          <Route path="/staff/exit"      element={<VehicleExit />} />
          <Route path="/staff/slots"     element={<SlotView />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center text-gray-600">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-lg font-medium text-gray-500">{title}</p>
        <p className="text-sm mt-1">Đang phát triển...</p>
      </div>
    </div>
  );
}

export default App;
