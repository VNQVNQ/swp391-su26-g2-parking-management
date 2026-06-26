import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    console.log('Login response:', response.data);
    const { accessToken, refreshToken, user } = response.data;
    return {
      accessToken,
      refreshToken,
      user: mapUserResponse(user),
    };
  },

  register: async (data) => {
    const response = await api.post('/auth/register', {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phone,
      identifyNumber: data.identityNumber,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      password: data.password,
      confirmPassword: data.confirmPassword || data.password,
    });
    const apiResponse = response.data;
    return {
      success: true,
      message: apiResponse.message || 'Registration successful',
      user: apiResponse.data ? mapUserResponse(apiResponse.data) : null,
    };
  },

  logout: async () => {
    try {
      await api.post('/auth/Logout');
    } catch {
      // Ignore
    }
    return true;
  },

  /**
   * GET /auth/users/me
   * BE trả về: ApiResponse<UserResponse> = { statusCode, message, data: UserResponse }
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/users/me');
    // FIX: BE bọc trong ApiResponse, data nằm ở response.data.data
    const userRaw = response.data?.data ?? response.data;
    return {
      user: mapUserResponse(userRaw),
    };
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

/**
 * FIX: Map đầy đủ tất cả field, đặc biệt id và role không được null
 * BE UserResponse fields: id, email, fullName, phoneNumber, identifyNumber,
 *   gender, userIsActivated, age, address, dateOfBirth, roleCode, roleName, lastActive
 */
function mapUserResponse(backendUser) {
  if (!backendUser) return null;
  
  // FIX: roleCode có thể nằm ở nhiều chỗ tùy endpoint BE
  const roleCode = backendUser.roleCode || backendUser.role || null;
  
  return {
    id: backendUser.id ?? backendUser.userId ?? null,
    email: backendUser.email,
    name: backendUser.fullName,
    fullName: backendUser.fullName,
    // FIX: Lưu cả 'role' lẫn 'roleCode' để App.tsx || operator không bị miss
    role: roleCode,
    roleCode: roleCode,
    phone: backendUser.phoneNumber,
    phoneNumber: backendUser.phoneNumber,
    identityNumber: backendUser.identifyNumber,
    gender: backendUser.gender,
    dateOfBirth: backendUser.dateOfBirth,
    address: backendUser.address,
    age: backendUser.age,
    isActive: backendUser.userIsActivated,
    lastActive: backendUser.lastActive,
    roleName: backendUser.roleName,
    avatar: null,
  };
}

export default authService;
