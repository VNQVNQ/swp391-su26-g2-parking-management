import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ParkingProvider } from "./store/parkingStore";

import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Unauthorized    from "./pages/Unauthorized";
import Dashboard       from "./pages/manager/Dashboard";
import PricingConfig   from "./pages/manager/PricingConfig";
import Exceptions      from "./pages/manager/Exceptions";
import PassesBookings  from "./pages/manager/PassesBookings";
import StaffDashboard  from "./pages/staff/Dashboard";
import VehicleEntry    from "./pages/staff/VehicleEntry";
import VehicleExit     from "./pages/staff/VehicleExit";
import SlotView        from "./pages/staff/SlotView";
import DriverDashboard    from "./pages/driver/Dashboard";
import RegisterTicket     from "./pages/driver/RegisterTicket";
import MyTickets          from "./pages/driver/MyTickets";
import DriverSlotView     from "./pages/driver/SlotView";
import Booking            from "./pages/driver/Booking";
import SidebarLayout   from "./layouts/SidebarLayout";
import RouteGuard      from "./components/RouteGuard";

function App() {
  return (
    <BrowserRouter>
      {/* ParkingProvider bọc toàn bộ — cung cấp state chung cho VehicleEntry, VehicleExit, Exceptions, PassesBookings */}
      <ParkingProvider>
        <Routes>

          {/* Public */}
          <Route path="/"             element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* MANAGER only */}
          <Route element={
            <RouteGuard allowedRoles={["MANAGER"]}>
              <SidebarLayout />
            </RouteGuard>
          }>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/pricing"    element={<PricingConfig />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/passes"     element={<PassesBookings />} />
            <Route path="/reports"    element={<PlaceholderPage title="Reports" />} />
          </Route>

          {/* STAFF only */}
          <Route element={
            <RouteGuard allowedRoles={["STAFF"]}>
              <SidebarLayout />
            </RouteGuard>
          }>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/entry"     element={<VehicleEntry />} />
            <Route path="/staff/exit"      element={<VehicleExit />} />
            <Route path="/staff/slots"     element={<SlotView />} />
          </Route>

          {/* DRIVER only */}
          <Route element={
            <RouteGuard allowedRoles={["DRIVER"]}>
              <SidebarLayout />
            </RouteGuard>
          }>
            <Route path="/driver/dashboard"       element={<DriverDashboard />} />
            <Route path="/driver/register-ticket" element={<RegisterTicket />} />
            <Route path="/driver/my-tickets"      element={<MyTickets />} />
            <Route path="/driver/slots"           element={<DriverSlotView />} />
            <Route path="/driver/booking"         element={<Booking />} />
          </Route>

        </Routes>
      </ParkingProvider>
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
