import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();
  const registrationSuccess = location.state?.registrationSuccess;
  const passwordResetSuccess = location.state?.passwordResetSuccess;
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập Email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Định dạng email không hợp lệ';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải dài ít nhất 6 ký tự';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const result = await login({ email: form.email, password: form.password });
    setLoading(false);

    if (result.success) {
      // Role-aware redirect after login
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const role = stored.role || 'PARKING_STAFF';
      const defaults = { ADMIN: '/admin/dashboard', PARKING_MANAGER: '/PARKING_MANAGER/dashboard', PARKING_STAFF: '/entry' };
      navigate(defaults[role] || '/entry');
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background particles */}
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-container">
        {/* Left - Branding */}
        <div className="auth-branding">
          <div className="auth-brand-content">
            <div className="auth-logo-wrapper">
              <div className="auth-logo-ring">
                <div className="auth-logo-inner">
                  <Car size={36} />
                </div>
              </div>
            </div>
            <h1 className="auth-brand-title">ParkingPro</h1>
            <p className="auth-brand-subtitle">Hệ thống Quản lý Bãi đỗ xe Thông minh</p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4>Bảo mật An toàn</h4>
                  <p>Bảo mật dữ liệu bãi xe cấp doanh nghiệp</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div>
                  <h4>Quản lý Theo thời gian thực</h4>
                  <p>Theo dõi tất cả khu vực đỗ xe trong nháy mắt</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <div>
                  <h4>Thống kê Thông minh</h4>
                  <p>Phân tích số liệu để quản lý hiệu quả hơn</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <p>© 2026 ParkingPro. Đã đăng ký bản quyền.</p>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <Shield size={16} />
                <span>Đăng nhập An toàn</span>
              </div>
              <h2>Chào mừng trở lại</h2>
              <p>Nhập thông tin xác thực để truy cập hệ thống</p>
            </div>

            {registrationSuccess && !authError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Đăng ký thành công! Vui lòng đăng nhập.
              </div>
            )}

            {passwordResetSuccess && !authError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.
              </div>
            )}

            {authError && (
              <div className="auth-server-error" style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" id="login-form">
              <div className="auth-field">
                <label htmlFor="login-email">Địa chỉ Email</label>
                <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); clearError(); }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth-error">{errors.email}</span>}
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Mật khẩu</label>
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu của bạn"
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); clearError(); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="auth-error">{errors.password}</span>}
              </div>

              <div className="auth-options">
                <label className="auth-checkbox-label" htmlFor="remember-me">
                  <input type="checkbox" id="remember-me" />
                  <span className="auth-checkmark" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="auth-link" id="forgot-password-link">Quên mật khẩu?</Link>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                id="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-alt-actions">
              <p>
                Bạn chưa có tài khoản?{' '}
                <Link to="/register" className="auth-link-accent" id="go-to-register">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
