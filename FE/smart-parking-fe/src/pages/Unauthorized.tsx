import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-2">403 — Không có quyền truy cập</h1>
        <p className="text-gray-500 mb-6">
          Role <span className="text-red-400 font-mono">{user?.role}</span> không được phép vào trang này.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
