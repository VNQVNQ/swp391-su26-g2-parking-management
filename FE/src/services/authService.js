import api from './api';

// ── Auth API service ───────────────────────────────────────────────────
// Thin wrapper around the shared Axios instance for auth-specific
// endpoints.  When the real backend is ready, only the endpoint paths
// here need updating.

const authService = {
  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {{ token: string, user: object }}
   */
  login: async (credentials) => {
    // TODO: Replace with real API call when backend is ready
    // const response = await api.post('/auth/login', credentials);
    // return response.data;

    // ── Mock implementation ──
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulate invalid credentials
    if (credentials.email === 'fail@test.com') {
      const error = new Error('Invalid email or password');
      error.response = { status: 401, data: { message: 'Invalid email or password' } };
      throw error;
    }

    const mockUser = {
      id: 1,
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: 'STAFF',
      avatar: null,
    };
    const mockToken = 'mock-jwt-token-' + Date.now();

    return { token: mockToken, user: mockUser };
  },

  /**
   * POST /auth/register
   * @param {{ fullName, email, phone, password }} data
   * @returns {{ token: string, user: object }}
   */
  register: async (data) => {
    // TODO: Replace with real API call when backend is ready
    // const response = await api.post('/auth/register', data);
    // return response.data;

    // ── Mock implementation ──
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (data.email === 'exists@test.com') {
      const error = new Error('Email already registered');
      error.response = { status: 409, data: { message: 'Email already registered' } };
      throw error;
    }

    const mockUser = {
      id: Date.now(),
      email: data.email,
      name: data.fullName,
      phone: data.phone,
      role: 'STAFF',
      avatar: null,
    };
    const mockToken = 'mock-jwt-token-' + Date.now();

    return { token: mockToken, user: mockUser };
  },

  /**
   * POST /auth/logout
   */
  logout: async () => {
    // TODO: Replace with real API call when backend is ready
    // await api.post('/auth/logout');
    return true;
  },

  /**
   * GET /auth/me  – validate token & fetch current user
   * @returns {{ user: object }}
   */
  getCurrentUser: async () => {
    // TODO: Replace with real API call when backend is ready
    // const response = await api.get('/auth/me');
    // return response.data;

    // ── Mock implementation ──
    const stored = localStorage.getItem('user');
    if (!stored) throw new Error('No user');
    return { user: JSON.parse(stored) };
  },
};

export default authService;
