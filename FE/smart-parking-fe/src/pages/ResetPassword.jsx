import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Car, Lock, Eye, EyeOff, ArrowLeft, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { resetPasswordApi } from '../api/auth.api';

export default function ResetPassword() {
  const { tokenResetPassword } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true); // assume valid initially

  // Basic token presence check
  useEffect(() => {
    if (!tokenResetPassword || tokenResetPassword.trim() === '') {
      setTokenValid(false);
    }
  }, [tokenResetPassword]);

  const validate = () => {
    const errs = {};
    if (!form.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (form.newPassword.length < 6) errs.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!form.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await resetPasswordApi(tokenResetPassword, form.newPassword, form.confirmPassword);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { state: { passwordResetSuccess: true } }), 3000);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Có lỗi xảy ra. Link có thể đã hết hạn.';

      const msgStr = typeof msg === 'string' ? msg : 'Link đặt lại mật khẩu đã hết hạn.';

      // Expired / invalid token errors
      if (msgStr.toLowerCase().includes('expired') || msgStr.toLowerCase().includes('invalid') || msgStr.toLowerCase().includes('path')) {
        setTokenValid(false);
      } else {
        setServerError(msgStr);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Token invalid / expired UI ── */
  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-bg-effects">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
          <div className="auth-grid-overlay" />
        </div>
        <div className="auth-container">
          <div className="auth-branding">
            <div className="auth-brand-content">
              <div className="auth-logo-wrapper">
                <div className="auth-logo-ring">
                  <div className="auth-logo-inner"><Car size={36} /></div>
                </div>
              </div>
              <h1 className="auth-brand-title">ParkingPro</h1>
              <p className="auth-brand-subtitle">Hệ thống Quản lý Bãi đỗ xe Thông minh</p>
            </div>
            <div className="auth-brand-footer"><p>© 2026 ParkingPro. Đã đăng ký bản quyền.</p></div>
          </div>
          <div className="auth-form-section">
            <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <AlertTriangle size={36} color="#ef4444" />
              </div>
              <h2 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Link đã hết hạn</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (sau 10 phút).
                <br />Vui lòng yêu cầu link mới.
              </p>
              <Link to="/forgot-password" className="auth-submit-btn" id="request-new-link"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                Gửi lại link đặt lại
              </Link>
              <div style={{ marginTop: '16px' }}>
                <Link to="/login" className="auth-link-accent" id="expired-back-to-login"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={15} /> Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success UI ── */
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-bg-effects">
          <div className="auth-orb auth-orb-1" /><div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" /><div className="auth-grid-overlay" />
        </div>
        <div className="auth-container">
          <div className="auth-branding">
            <div className="auth-brand-content">
              <div className="auth-logo-wrapper">
                <div className="auth-logo-ring"><div className="auth-logo-inner"><Car size={36} /></div></div>
              </div>
              <h1 className="auth-brand-title">ParkingPro</h1>
              <p className="auth-brand-subtitle">Hệ thống Quản lý Bãi đỗ xe Thông minh</p>
            </div>
            <div className="auth-brand-footer"><p>© 2026 ParkingPro. Đã đăng ký bản quyền.</p></div>
          </div>
          <div className="auth-form-section">
            <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <CheckCircle size={36} color="#10b981" />
              </div>
              <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Đặt lại thành công!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
                Mật khẩu của bạn đã được cập nhật.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '32px' }}>
                Đang chuyển hướng về trang đăng nhập...
              </p>
              <Link to="/login" className="auth-submit-btn" id="go-login-after-reset"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main reset form ── */
  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-container">
        {/* Left Branding */}
        <div className="auth-branding">
          <div className="auth-brand-content">
            <div className="auth-logo-wrapper">
              <div className="auth-logo-ring">
                <div className="auth-logo-inner"><Car size={36} /></div>
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
                  <h4>Mật Khẩu Bảo Mật</h4>
                  <p>Dùng tối thiểu 6 ký tự, kết hợp số và chữ</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <h4>Cập Nhật Ngay Lập Tức</h4>
                  <p>Mật khẩu mới có hiệu lực ngay sau khi đặt lại</p>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-brand-footer"><p>© 2026 ParkingPro. Đã đăng ký bản quyền.</p></div>
        </div>

        {/* Right - Form */}
        <div className="auth-form-section">
          <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <Shield size={16} />
                <span>Đặt Lại Mật Khẩu</span>
              </div>
              <h2>Tạo mật khẩu mới</h2>
              <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>

            {serverError && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', fontSize: '0.85rem', fontWeight: 500,
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" id="reset-password-form">
              {/* New Password */}
              <div className="auth-field">
                <label htmlFor="reset-new-password">Mật khẩu mới</label>
                <div className={`auth-input-wrapper ${errors.newPassword ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={form.newPassword}
                    onChange={(e) => { setForm({ ...form, newPassword: e.target.value }); setErrors({ ...errors, newPassword: '' }); }}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button" className="auth-toggle-password" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <span className="auth-error">{errors.newPassword}</span>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label htmlFor="reset-confirm-password">Xác nhận mật khẩu</label>
                <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="auth-toggle-password" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                id="reset-submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Đặt Lại Mật Khẩu</span>
                    <Lock size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-alt-actions">
              <p>
                <Link to="/login" className="auth-link-accent" id="reset-back-to-login"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={15} />
                  Quay lại đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
