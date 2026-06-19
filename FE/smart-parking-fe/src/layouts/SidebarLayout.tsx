import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function SidebarLayout() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
