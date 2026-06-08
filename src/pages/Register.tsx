import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// ── Input component typed properly (không dùng any) ───────────────────────────
interface InputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 focus:ring-1 focus:ring-[#00c853]/20 transition"
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [form, setForm] = useState({
    email:           "",
    password:        "",
    confirmPassword: "",
    fullName:        "",
    phoneNumber:     "",
    identifyNumber:  "",
    gender:          "Male",
    dateOfBirth:     "",
    address:         "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim())    { setError("Vui lòng nhập email");    return; }
    if (!form.fullName.trim()) { setError("Vui lòng nhập họ và tên"); return; }
    if (!form.password)        { setError("Vui lòng nhập mật khẩu"); return; }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp"); return;
    }
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d08] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,200,83,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,200,83,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00c853]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl">

        {/* ── Logo ── */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00c853] shadow-lg shadow-[#00c853]/20 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h6M3 15h6"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ParkGuard BMS</h1>
          <p className="text-sm text-gray-500 mt-1">Parking Building Management System</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-7 shadow-2xl">

          <h2 className="text-lg font-semibold text-white mb-5">Đăng ký tài khoản</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Email */}
            <Input label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              placeholder="email@parking.vn" />

            {/* Họ và tên */}
            <Input label="Họ và tên" name="fullName"
              value={form.fullName} onChange={handleChange}
              placeholder="Nguyễn Văn A" />

            {/* Mật khẩu */}
            <Input label="Mật khẩu" name="password" type="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" />

            {/* Xác nhận mật khẩu */}
            <Input label="Xác nhận mật khẩu" name="confirmPassword" type="password"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="••••••••" />

            {/* Số điện thoại */}
            <Input label="Số điện thoại" name="phoneNumber"
              value={form.phoneNumber} onChange={handleChange}
              placeholder="09xxxxxxxx" />

            {/* CCCD */}
            <Input label="CCCD" name="identifyNumber"
              value={form.identifyNumber} onChange={handleChange}
              placeholder="0123456789xx" />

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Giới tính</label>
              <div className="relative">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full appearance-none bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c853]/50 cursor-pointer transition"
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                </select>
                <span className="absolute right-3 top-3 text-gray-600 pointer-events-none text-xs">▾</span>
              </div>
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c853]/50 transition [color-scheme:dark]"
              />
            </div>

            {/* Địa chỉ */}
            <div className="md:col-span-2">
              <Input label="Địa chỉ" name="address"
                value={form.address} onChange={handleChange}
                placeholder="123 Đường ABC, Quận 1, TP.HCM" />
            </div>

            {/* Error */}
            {error && (
              <div className="md:col-span-2 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5 text-xs text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00c853] hover:bg-[#00e060] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#00c853]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Đang đăng ký...
                  </span>
                ) : "Đăng ký"}
              </button>
            </div>

            {/* Login link */}
            <div className="md:col-span-2 text-center">
              <span className="text-xs text-gray-600">Đã có tài khoản? </span>
              <button type="button" onClick={() => navigate("/")}
                className="text-xs text-[#00c853] hover:text-[#00e060] font-medium transition">
                Đăng nhập
              </button>
            </div>

          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">SWP391 · SU26 · Group 2</p>
      </div>

      {/* ── Success Modal ── */}
      {success && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-8 shadow-2xl">

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#00c853]/10 border-2 border-[#00c853]/30 flex items-center justify-center">
                <span className="text-[#00c853] text-2xl">✓</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-1">Đăng ký thành công!</h2>
            <p className="text-sm text-gray-500 text-center mb-5">Tài khoản của bạn đã được tạo thành công</p>

            {/* Info */}
            <div className="bg-[#080d08] border border-[#1e2a1e] rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Họ và tên</span>
                <span className="text-white font-semibold">{form.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="text-[#00c853] font-semibold">{form.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Role</span>
                <span className="bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20 text-xs font-bold px-2 py-0.5 rounded">STAFF</span>
              </div>
            </div>

            <button
              onClick={() => { setSuccess(false); navigate("/"); }}
              className="w-full bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-[#00c853]/20"
            >
              Đi tới trang đăng nhập
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
