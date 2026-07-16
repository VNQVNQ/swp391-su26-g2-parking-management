import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

// ── Context ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // true while checking stored session
  const [error, setError] = useState(null);

  // ── Bootstrap: restore session from localStorage on mount ───────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // Demo mode: skip server validation for demo tokens
        if (token === 'demo-token') {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        } else {
          try {
            // Validate the token with the server
            const { user: freshUser } = await authService.getCurrentUser();
            setUser(freshUser);
            // Update stored user with fresh data
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch {
            // Token invalid / expired – clean up
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Helper to translate error messages to Vietnamese
  const translateErrorMessage = (msg) => {
    if (!msg) return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('bad credentials') || lowerMsg.includes('invalid credentials') || lowerMsg.includes('wrong password') || lowerMsg.includes('user not found')) {
      return 'Sai tên tài khoản hoặc mật khẩu.';
    }
    if (lowerMsg.includes('email already exists') || lowerMsg.includes('username already exists') || lowerMsg.includes('already taken')) {
      return 'Email hoặc tên tài khoản đã tồn tại.';
    }
    if (lowerMsg.includes('network error') || lowerMsg.includes('failed to fetch')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại.';
    }
    if (lowerMsg.includes('login failed')) return 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
    if (lowerMsg.includes('registration failed')) return 'Đăng ký thất bại. Vui lòng thử lại.';
    return msg; // Fallback
  };

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const { accessToken, refreshToken, user: userData } = await authService.login(credentials);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      const originalMessage = err.response?.data?.message || err.message || 'Login failed';
      const message = translateErrorMessage(originalMessage);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────────
  // NOTE: Backend register does NOT return a token.
  // After successful registration, user must navigate to login page.
  const register = useCallback(async (data) => {
    setError(null);
    try {
      const result = await authService.register(data);
      // Do NOT auto-login: backend register endpoint doesn't return tokens
      return { success: true, message: translateErrorMessage(result.message) || 'Đăng ký thành công!' };
    } catch (err) {
      // Extract message from BE's ApiResponse format: { statusCode, message, data }
      const originalMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed';
      const message = translateErrorMessage(originalMessage);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore – we clear local state regardless
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  // ── Clear error ────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  // ── Derived helpers ────────────────────────────────────────────────
  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      clearError,
    }),
    [user, loading, error, isAuthenticated, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
