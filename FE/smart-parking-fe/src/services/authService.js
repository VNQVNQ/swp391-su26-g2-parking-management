import api from './api';

// ── Auth API service ───────────────────────────────────────────────────
// Thin wrapper around the shared Axios instance for auth-specific
// endpoints. Connects to the Spring Boot backend at /auth/*.

const authService = {
  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {{ accessToken: string, refreshToken: string, user: object }}
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    console.log('Login response:', response.data);

    // Backend returns: { accessToken, refreshToken, user: UserResponse }
    const { accessToken, refreshToken, user } = response.data;

    return {
      accessToken,
      refreshToken,
      user: mapUserResponse(user),
    };
  },

  /**
   * POST /auth/register
   * Backend expects UserRequest: { email, password, confirmPassword, fullName, phoneNumber, identifyNumber, gender, dateOfBirth, address }
   * Backend returns: ApiResponse<UserResponse> = { statusCode, message, data: UserResponse }
   * NOTE: Register does NOT return a token. User must login after registering.
   * @param {object} data - Form data from Register page
   * @returns {{ success: boolean, message: string, user: object }}
   */
  register: async (data) => {
    const response = await api.post('/auth/register', {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phone,           // FE uses 'phone', BE expects 'phoneNumber'
      identifyNumber: data.identityNumber, // FE uses 'identityNumber', BE expects 'identifyNumber'
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,       // Send as ISO string (yyyy-MM-dd)
      address: data.address,
      password: data.password,
      confirmPassword: data.confirmPassword || data.password,
    });

    // Backend returns ApiResponse<UserResponse>: { statusCode, message, data }
    const apiResponse = response.data;
    return {
      success: true,
      message: apiResponse.message || 'Registration successful',
      user: apiResponse.data ? mapUserResponse(apiResponse.data) : null,
    };
  },

  /**
   * POST /auth/Logout (note: capital 'L' in backend)
   */
  logout: async () => {
    try {
      await api.post('/auth/Logout');
    } catch {
      // Ignore errors – we clear local state regardless
    }
    return true;
  },

  /**
   * GET /auth/users/me – validate token & fetch current user
   * Backend returns: ApiResponse<UserResponse> = { statusCode, message, data: UserResponse }
   * @returns {{ user: object }}
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/users/me');

    // Backend wraps in ApiResponse: { statusCode, message, data: UserResponse }
    const apiResponse = response.data;
    return {
      user: mapUserResponse(apiResponse.data),
    };
  },

  /**
   * POST /auth/refresh – refresh the access token
   * @param {string} refreshToken
   * @returns {{ accessToken: string }}
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

/**
 * Maps backend UserResponse to the frontend user object format.
 * Backend UserResponse fields:
 *   id, email, password, fullName, phoneNumber, identifyNumber,
 *   gender, userIsActivated, age, address, dateOfBirth, roleCode, roleName, lastActive
 *
 * Frontend expects:
 *   id, email, name, fullName, role, phone, gender, dateOfBirth, address,
 *   identityNumber, avatar, isActive, lastActive
 */
function mapUserResponse(backendUser) {
  if (!backendUser) return null;
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.fullName,         // Sidebar uses 'name' for display
    fullName: backendUser.fullName,
    role: backendUser.roleCode,          // FE uses 'role', BE sends 'roleCode'
    phone: backendUser.phoneNumber,
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
