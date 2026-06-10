import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) redirectByRole(user.role);
  }, [isLoggedIn, user]);

  const redirectByRole = (role: string) => {
    if      (role === "MANAGER")      navigate("/dashboard",        { replace: true });
    else if (role === "STAFF")        navigate("/staff/dashboard",  { replace: true });
    else if (role === "DRIVER")       navigate("/driver/dashboard", { replace: true });
    else if (role === "SYSTEM_ADMIN") navigate("/dashboard",        { replace: true });
    else                              navigate("/driver/dashboard", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Vui lòng nhập email");    return; }
    if (!password)     { setError("Vui lòng nhập mật khẩu"); return; }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d08] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,200,83,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,200,83,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00c853]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00c853] shadow-lg shadow-[#00c853]/20 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h6M3 15h6"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ParkGuard BMS</h1>
          <p className="text-sm text-gray-500 mt-1">Parking Building Management System</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-7 shadow-2xl">

          <h2 className="text-lg font-semibold text-white mb-5">Đăng nhập</h2>

          {/* Demo hint */}
          <div className="bg-[#00c853]/5 border border-[#00c853]/20 rounded-xl p-3 mb-5">
            <p className="text-xs text-[#00c853] font-semibold mb-1">Demo accounts:</p>
            <p className="text-xs text-gray-400">manager@parking.vn / 123456</p>
            <p className="text-xs text-gray-400">staff@parking.vn / 123456</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@parking.vn"
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 focus:ring-1 focus:ring-[#00c853]/20 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 focus:ring-1 focus:ring-[#00c853]/20 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5 text-xs text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#00c853]/20 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>

            {/* Register link */}
            <div className="text-center pt-1">
              <span className="text-xs text-gray-600">Chưa có tài khoản? </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-xs text-[#00c853] hover:text-[#00e060] font-medium transition"
              >
                Đăng ký tài khoản
              </button>
            </div>

          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          SWP391 · SU26 · Group 2
        </p>

      </div>
    </div>
  );
}
