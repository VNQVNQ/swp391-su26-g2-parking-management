import { create } from "zustand";
import type { AuthState, LoginPayload, Role, RegisterPayload } from "../types/auth.types";
import { loginApi, logoutApi, registerApi } from "../api/auth.api";

// Mock fallback khi BE chưa chạy
const MOCK_USERS = [
  { email: "PARKING_MANAGER@parking.vn", password: "123456", id: 1, fullName: "Nguyễn PARKING_MANAGER", roleCode: "PARKING_MANAGER", role: "PARKING_MANAGER" as Role },
  { email: "PARKING_STAFF@parking.vn",   password: "123456", id: 2, fullName: "Trần PARKING_STAFF",     roleCode: "PARKING_STAFF",   role: "PARKING_STAFF"   as Role },
];

const getLocalUsers = () =>
  JSON.parse(localStorage.getItem("mockUsers") || "[]");

// Map roleCode từ BE → Role dùng trong FE
const mapRole = (roleCode: string): Role => {
  const upper = roleCode?.toUpperCase();
  if (upper === "PARKING_MANAGER")      return "PARKING_MANAGER";
  if (upper === "PARKING_STAFF")        return "PARKING_STAFF";
  if (upper === "DRIVER")       return "DRIVER";
  if (upper === "SYSTEM_ADMIN") return "SYSTEM_ADMIN";
  return "PARKING_STAFF";
};

export const useAuthStore = create<AuthState>((set) => ({
  user:       JSON.parse(localStorage.getItem("user") || "null"),
  token:      localStorage.getItem("token") || null,
  isLoggedIn: !!localStorage.getItem("token"),

  // ── LOGIN ────────────────────────────────────────────────────────────────
  login: async (payload: LoginPayload) => {
    try {
      const data = await loginApi(payload);
      const user = { ...data.user, role: mapRole(data.user.roleCode) };
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, token: data.accessToken, isLoggedIn: true });

    } catch (err: unknown) {
      // Fallback mock — chỉ khi BE chưa chạy (network error)
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes("Network") || err.message.includes("ECONNREFUSED"));

      if (isNetworkError) {
        const ALL_USERS = [...MOCK_USERS, ...getLocalUsers()];
        const found = ALL_USERS.find(
          (u) => u.email === payload.email && u.password === payload.password
        );
        if (!found) throw new Error("Email hoặc mật khẩu không đúng");
        const { password: _, ...user } = found;
        const fakeToken = `mock-token-${user.role}-${Date.now()}`;
        localStorage.setItem("token", fakeToken);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token: fakeToken, isLoggedIn: true });
        return;
      }

      if (err instanceof Error) throw err;
      throw new Error("Đăng nhập thất bại");
    }
  },

  // ── REGISTER ─────────────────────────────────────────────────────────────
  register: async (payload: RegisterPayload) => {
    await registerApi(payload);
  },

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  logout: async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
