import { create } from "zustand";
import type { AuthState, LoginPayload, Role, RegisterPayload } from "../types/auth.types";
import { loginApi, logoutApi, registerApi } from "../api/auth.api";

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
    const data = await loginApi(payload);
    const user = { ...data.user, role: mapRole(data.user.roleCode) };
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token: data.accessToken, isLoggedIn: true });
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
