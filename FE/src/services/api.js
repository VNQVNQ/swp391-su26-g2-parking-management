import axios from 'axios';

// ── Shared Axios instance ──────────────────────────────────────────────
// Every API call in the project should use this instance so that the
// Authorization header and error handling are applied automatically.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ────────────────────────────────────────────────
// Attaches the JWT token (if available) to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────────────────
// Centralised error handling:
//  • 401 → clear stored credentials and redirect to /login
//  • 403 → optional: surface "Forbidden" feedback
//  • Others → pass through to the caller
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid – force re-login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Only redirect if we are NOT already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
