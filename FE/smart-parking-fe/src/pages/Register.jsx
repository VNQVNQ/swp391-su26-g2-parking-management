import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, UserPlus, Calendar, MapPin, Users, CreditCard } from 'lucide-react';
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
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s|-/g, ''))) errs.phone = 'Invalid phone number';
    if (!form.gender) errs.gender = 'Please select your gender';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 16) errs.dateOfBirth = 'You must be at least 16 years old';
    }
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.identityNumber.trim()) errs.identityNumber = 'Identity number is required';
    else if (!/^[0-9]{9}$|^[0-9]{12}$/.test(form.identityNumber.replace(/\s/g, ''))) errs.identityNumber = 'Must be 9 or 12 digits';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreed) errs.agreed = 'You must agree to the terms';
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

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: '#10b981' };
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
            <p className="auth-brand-subtitle">Smart Parking Management System</p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                  <h4>Quick Setup</h4>
                  <p>Get started in less than 2 minutes</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h4>Team Management</h4>
                  <p>Invite and manage your parking PARKING_STAFF</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4>Free Trial</h4>
                  <p>30-day free trial, no credit card required</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <p>© 2026 ParkingPro. All rights reserved.</p>
          </div>
        </div>

        {/* Right - Register Form */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <UserPlus size={16} />
                <span>New Account</span>
              </div>
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
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
                <label htmlFor="register-name">Full Name</label>
                <div className={`auth-input-wrapper ${errors.fullName ? 'error' : ''}`}>
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="John Smith"
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
                  <label htmlFor="register-phone">Phone</label>
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
                  <label htmlFor="register-gender">Gender</label>
                  <div className={`auth-input-wrapper ${errors.gender ? 'error' : ''}`}>
                    <Users size={18} className="auth-input-icon" />
                    <select
                      id="register-gender"
                      value={form.gender}
                      onChange={(e) => update('gender', e.target.value)}
                      style={{ color: form.gender ? 'inherit' : 'rgba(255,255,255,0.4)' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  {errors.gender && <span className="auth-error">{errors.gender}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="register-dob">Date of Birth</label>
                  <div className={`auth-input-wrapper ${errors.dateOfBirth ? 'error' : ''}`}>
                    <Calendar size={18} className="auth-input-icon" />
                    <input
                      id="register-dob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => update('dateOfBirth', e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  {errors.dateOfBirth && <span className="auth-error">{errors.dateOfBirth}</span>}
                </div>
              </div>

              {/* Address */}
              <div className="auth-field">
                <label htmlFor="register-address">Address</label>
                <div className={`auth-input-wrapper ${errors.address ? 'error' : ''}`}>
                  <MapPin size={18} className="auth-input-icon" />
                  <input
                    id="register-address"
                    type="text"
                    placeholder="123 Main Street, District 1, Ho Chi Minh City"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
                {errors.address && <span className="auth-error">{errors.address}</span>}
              </div>

              {/* Identity Number */}
              <div className="auth-field">
                <label htmlFor="register-identity">Identity Number (CMND/CCCD)</label>
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
                <label htmlFor="register-password">Password</label>
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
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
                <label htmlFor="register-confirm">Confirm Password</label>
                <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
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
                <label className="auth-checkbox-label" htmlFor="agree-terms">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); setErrors({ ...errors, agreed: '' }); }}
                  />
                  <span className="auth-checkmark" />
                  <span>
                    I agree to the <a href="#" className="auth-link-accent">Terms of Service</a> and{' '}
                    <a href="#" className="auth-link-accent">Privacy Policy</a>
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
                    <span>Create Account</span>
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
                Already have an account?{' '}
                <Link to="/login" className="auth-link-accent" id="go-to-login">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
