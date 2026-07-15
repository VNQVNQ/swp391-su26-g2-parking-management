import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, ArrowRight, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Vui lòng nhập email của bạn';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Định dạng email không hợp lệ';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const err = validate();
    if (err) { setEmailError(err); return; }

    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSubmitted(true);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại.';
      setServerError(typeof msg === 'string' ? msg : 'Email không tồn tại trong hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
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
                  <p>Link đặt lại mật khẩu hết hạn sau 10 phút</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <h4>Email Ngay Lập Tức</h4>
                  <p>Nhận link đặt lại mật khẩu qua email</p>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-brand-footer">
            <p>© 2026 ParkingPro. Đã đăng ký bản quyền.</p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="auth-form-section">
          <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem' }}>

            {!submitted ? (
              <>
                <div className="auth-form-header">
                  <div className="auth-form-badge">
                    <Shield size={16} />
                    <span>Quên Mật Khẩu</span>
                  </div>
                  <h2>Đặt lại mật khẩu</h2>
                  <p>Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu</p>
                </div>

                {serverError && (
                  <div style={{
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
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" id="forgot-password-form">
                  <div className="auth-field">
                    <label htmlFor="forgot-email">Địa chỉ Email</label>
                    <div className={`auth-input-wrapper ${emailError ? 'error' : ''}`}>
                      <Mail size={18} className="auth-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); setServerError(''); }}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {emailError && <span className="auth-error">{emailError}</span>}
                  </div>

                  <button
                    type="submit"
                    className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                    id="forgot-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="auth-spinner" />
                    ) : (
                      <>
                        <span>Gửi Link Đặt Lại</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-alt-actions">
                  <p>
                    <Link to="/login" className="auth-link-accent" id="back-to-login"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowLeft size={15} />
                      Quay lại đăng nhập
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <CheckCircle size={36} color="#10b981" />
                </div>
                <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Email đã được gửi!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
                  Chúng tôi đã gửi link đặt lại mật khẩu đến
                </p>
                <p style={{
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  marginBottom: '24px',
                  wordBreak: 'break-all',
                }}>
                  {email}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '32px' }}>
                  ⏱ Link có hiệu lực trong <strong>10 phút</strong>. Kiểm tra cả hòm thư Spam nếu không thấy.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => { setSubmitted(false); setEmail(''); setServerError(''); }}
                    className="auth-submit-btn"
                    id="resend-email-btn"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Gửi lại email
                  </button>
                  <Link to="/login" className="auth-link-accent" id="success-back-to-login"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px' }}>
                    <ArrowLeft size={15} />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
