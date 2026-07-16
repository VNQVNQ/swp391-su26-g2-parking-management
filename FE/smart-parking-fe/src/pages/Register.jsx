import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, UserPlus, Calendar, MapPin, Users, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    identityNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
    clearError();
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Họ và tên là bắt buộc';
    if (!form.email.trim()) errs.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Định dạng email không hợp lệ';
    if (!form.phone.trim()) errs.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s|-/g, ''))) errs.phone = 'Số điện thoại không hợp lệ';
    if (!form.gender) errs.gender = 'Vui lòng chọn giới tính';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Ngày sinh là bắt buộc';
    else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 16) errs.dateOfBirth = 'Bạn phải từ 16 tuổi trở lên';
    }
    if (!form.address.trim()) errs.address = 'Địa chỉ là bắt buộc';
    if (!form.identityNumber.trim()) errs.identityNumber = 'Số CMND/CCCD là bắt buộc';
    else if (!/^[0-9]{9}$|^[0-9]{12}$/.test(form.identityNumber.replace(/\s/g, ''))) errs.identityNumber = 'Phải có 9 hoặc 12 chữ số';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!form.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp';
    if (!agreed) errs.agreed = 'Bạn phải đồng ý với các điều khoản';
    return errs;
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { level: 1, label: 'Yếu', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Trung bình', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Tốt', color: '#3b82f6' };
    return { level: 4, label: 'Mạnh', color: '#10b981' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const result = await register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      address: form.address,
      identityNumber: form.identityNumber,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    setLoading(false);

    if (result.success) {
      // Backend register doesn't return a token → redirect to login
      navigate('/login', { state: { registrationSuccess: true } });
    }
    // If registration failed, authError will be set by the context
  };

  return (
    <div className="auth-page">
      <Link to="/" style={{
        position: 'absolute', top: '24px', left: '24px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '8px',
        color: '#f1f5f9', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
        background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '999px',
        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none' }}
      >
        <ArrowLeft size={16} />
        Về trang chủ
      </Link>
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
            <p className="auth-brand-subtitle">Hệ thống quản lý đỗ xe thông minh</p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                  <h4>Thiết lập nhanh chóng</h4>
                  <p>Bắt đầu trong vòng chưa đầy 2 phút</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h4>Quản lý đội ngũ</h4>
                  <p>Mời và quản lý nhân viên bãi đỗ xe</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4>Dùng thử miễn phí</h4>
                  <p>Dùng thử miễn phí 30 ngày, không cần thẻ tín dụng</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <p>© 2026 ParkingPro. Bảo lưu mọi quyền.</p>
          </div>
        </div>

        {/* Right - Register Form */}
        <div className="auth-form-section">
          <div className="auth-form-card glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <UserPlus size={16} />
                <span>Tài khoản mới</span>
              </div>
              <h2>Tạo tài khoản</h2>
              <p>Điền thông tin chi tiết của bạn để bắt đầu</p>
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

            <form onSubmit={handleSubmit} className="auth-form" id="register-form">
              {/* Full Name */}
              <div className="auth-field">
                <label htmlFor="register-name">Họ và tên</label>
                <div className={`auth-input-wrapper ${errors.fullName ? 'error' : ''}`}>
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    autoComplete="name"
                  />
                </div>
                {errors.fullName && <span className="auth-error">{errors.fullName}</span>}
              </div>

              {/* Two columns: Email & Phone */}
              <div className="auth-field-row">
                <div className="auth-field">
                  <label htmlFor="register-email">Email</label>
                  <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      id="register-email"
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="auth-error">{errors.email}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="register-phone">Số điện thoại</label>
                  <div className={`auth-input-wrapper ${errors.phone ? 'error' : ''}`}>
                    <Phone size={18} className="auth-input-icon" />
                    <input
                      id="register-phone"
                      type="tel"
                      placeholder="0901234567"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className="auth-error">{errors.phone}</span>}
                </div>
              </div>

              {/* Gender & Date of Birth row */}
              <div className="auth-field-row">
                <div className="auth-field">
                  <label htmlFor="register-gender">Giới tính</label>
                  <div className={`auth-input-wrapper ${errors.gender ? 'error' : ''}`}>
                    <Users size={18} className="auth-input-icon" />
                    <select
                      id="register-gender"
                      value={form.gender}
                      onChange={(e) => update('gender', e.target.value)}
                      style={{ color: form.gender ? 'inherit' : '#94a3b8' }}
                    >
                      <option value="" disabled hidden>Chọn giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  {errors.gender && <span className="auth-error">{errors.gender}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="register-dob">Ngày sinh</label>
                  <div className={`auth-input-wrapper ${errors.dateOfBirth ? 'error' : ''}`}>
                    <Calendar size={18} className="auth-input-icon" />
                    <input
                      id="register-dob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => update('dateOfBirth', e.target.value)}
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                  {errors.dateOfBirth && <span className="auth-error">{errors.dateOfBirth}</span>}
                </div>
              </div>

              {/* Address */}
              <div className="auth-field">
                <label htmlFor="register-address">Địa chỉ</label>
                <div className={`auth-input-wrapper ${errors.address ? 'error' : ''}`}>
                  <MapPin size={18} className="auth-input-icon" />
                  <input
                    id="register-address"
                    type="text"
                    placeholder="123 Đường chính, Quận 1, TP. Hồ Chí Minh"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
                {errors.address && <span className="auth-error">{errors.address}</span>}
              </div>

              {/* Identity Number */}
              <div className="auth-field">
                <label htmlFor="register-identity">Số CMND/CCCD</label>
                <div className={`auth-input-wrapper ${errors.identityNumber ? 'error' : ''}`}>
                  <CreditCard size={18} className="auth-input-icon" />
                  <input
                    id="register-identity"
                    type="text"
                    placeholder="001234567890"
                    value={form.identityNumber}
                    onChange={(e) => update('identityNumber', e.target.value)}
                    maxLength={12}
                  />
                </div>
                {errors.identityNumber && <span className="auth-error">{errors.identityNumber}</span>}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="register-password">Mật khẩu</label>
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    autoComplete="new-password"
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
                {form.password && (
                  <div className="auth-password-strength">
                    <div className="auth-strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                           key={i}
                           className={`auth-strength-bar ${strength.level >= i ? 'active' : ''}`}
                           style={strength.level >= i ? { background: strength.color } : {}}
                        />
                      ))}
                    </div>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
                {errors.password && <span className="auth-error">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
                <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
              </div>

              {/* Terms */}
              <div className="auth-field">
                <label className="auth-checkbox-label register-terms-label" htmlFor="agree-terms">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); setErrors({ ...errors, agreed: '' }); }}
                  />
                  <span className="auth-checkmark" />
                  <span>
                    Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật
                  </span>
                </label>
                {errors.agreed && <span className="auth-error">{errors.agreed}</span>}
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                id="register-submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Tạo tài khoản</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>hoặc</span>
            </div>

            <div className="auth-alt-actions">
              <p>
                Đã có tài khoản?{' '}
                <Link to="/login" className="auth-link-accent" id="go-to-login">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

