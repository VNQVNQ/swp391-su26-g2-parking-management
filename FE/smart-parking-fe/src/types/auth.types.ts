// BR-50: Role-based access control
export type Role = "PARKING_MANAGER" | "PARKING_STAFF" | "DRIVER" | "SYSTEM_ADMIN";

// Match BE UserResponse
export interface User {
  id?: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  identifyNumber?: string;
  gender?: string;
  userIsActivated?: boolean;
  age?: number;
  address?: string;
  dateOfBirth?: string;
  roleCode: string;      // field thật từ BE
  roleName?: string;
  lastActive?: string;
  role: Role;            // field FE dùng nội bộ (map từ roleCode)
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Match BE AuthResponse chính xác
export interface LoginResponse {
  auth: boolean;
  accessToken: string;   // BE trả về "accessToken"
  refreshToken: string;
  user: {
    id?: number;
    email: string;
    fullName: string;
    phoneNumber?: string;
    identifyNumber?: string;
    gender?: string;
    userIsActivated?: boolean;
    age?: number;
    address?: string;
    dateOfBirth?: string;
    roleCode: string;    // BE trả về "roleCode"
    roleName?: string;
    lastActive?: string;
  };
}

// Match BE UserRequest (dùng cho register)
export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  identifyNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}
