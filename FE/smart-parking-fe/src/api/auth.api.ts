import axiosInstance from "./axiosInstance";
import type { LoginPayload, LoginResponse, RegisterPayload } from "../types/auth.types";

// ── BE ApiResponse wrapper cho register ──────────────────────────────────────
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /auth/login → AuthResponse { auth, accessToken, refreshToken, user }
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>("/auth/login", payload);
  return response.data;
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
// POST /auth/Logout — chữ L hoa theo BE
export const logoutApi = async (): Promise<void> => {
  await axiosInstance.post("/auth/Logout");
};

// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /auth/register → ApiResponse<UserResponse>
// BE tự gán role PARKING_STAFF cho user mới
export const registerApi = async (payload: RegisterPayload): Promise<void> => {
  try {
    // Gọi BE thật
    await axiosInstance.post<ApiResponse<unknown>>("/auth/register", {
      email:           payload.email,
      password:        payload.password,
      confirmPassword: payload.confirmPassword,
      fullName:        payload.fullName,
      phoneNumber:     payload.phoneNumber,
      identifyNumber:  payload.identifyNumber,
      gender:          payload.gender,
      dateOfBirth:     payload.dateOfBirth || null,
      address:         payload.address,
    });
  } catch (err: unknown) {
    // Fallback mock khi BE chưa chạy (network error)
    const isNetworkError =
      err instanceof Error &&
      (err.message.includes("Network") || err.message.includes("ECONNREFUSED"));

    if (isNetworkError) {
      // Lưu vào localStorage để authStore.login() dùng được
      const users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
      const existed = users.find((u: { email: string }) => u.email === payload.email);
      if (existed) throw new Error("Email đã tồn tại");
      users.push({
        id:              Date.now(),
        email:           payload.email,
        password:        payload.password,
        fullName:        payload.fullName,
        phoneNumber:     payload.phoneNumber,
        identifyNumber:  payload.identifyNumber,
        gender:          payload.gender,
        dateOfBirth:     payload.dateOfBirth,
        address:         payload.address,
        roleCode:        "PARKING_STAFF",
        role:            "PARKING_STAFF",
      });
      localStorage.setItem("mockUsers", JSON.stringify(users));
      return;
    }

    // Lỗi từ BE (email trùng, validation...) → ném ra để AuthContext hiển thị
    // Giữ nguyên Axios error để AuthContext extract được response.data.message
    throw err;
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
// POST /auth/refresh
export const refreshTokenApi = async (refreshToken: string): Promise<LoginResponse> => {
  const res = await axiosInstance.post<LoginResponse>("/auth/refresh", { refreshToken });
  return res.data;
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// POST /auth/ForgotPassword
export const forgotPasswordApi = async (email: string): Promise<void> => {
  await axiosInstance.post("/auth/ForgotPassword", { email });
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
// PATCH /auth/ResetPassword/{token}
export const resetPasswordApi = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  await axiosInstance.patch(`/auth/ResetPassword/${token}`, {
    newPassword,
    confirmPassword,
  });
};
