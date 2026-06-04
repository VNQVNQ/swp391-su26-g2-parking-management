import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
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
      const role = stored.role || 'STAFF';
      const defaults = { ADMIN: '/dashboard', MANAGER: '/dashboard', STAFF: '/entry' };
      navigate(defaults[role] || '/entry');
    }
    // If login failed, authError will be set by the context
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
            <p className="auth-brand-subtitle">Smart Parking Management System</p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4>Secure Access</h4>
                  <p>Enterprise-grade security for your parking data</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div>
                  <h4>Real-time Dashboard</h4>
                  <p>Monitor all parking zones at a glance</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <div>
                  <h4>Smart Analytics</h4>
                  <p>Data-driven insights for better management</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <p>© 2026 ParkingPro. All rights reserved.</p>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <Shield size={16} />
                <span>Secure Login</span>
              </div>
              <h2>Welcome Back</h2>
              <p>Enter your credentials to access the dashboard</p>
            </div>

            {/* Server-side error from AuthContext */}
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
                <label htmlFor="login-email">Email Address</label>
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
                <label htmlFor="login-password">Password</label>
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                  <span>Remember me</span>
                </label>
                <a href="#" className="auth-link">Forgot password?</a>
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
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <div className="auth-alt-actions">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link-accent" id="go-to-register">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
