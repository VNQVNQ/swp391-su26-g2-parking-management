import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Save, CheckCircle2, AlertCircle, CreditCard, Users, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    identifyNumber: '',
    gender: 'Nam',
    dateOfBirth: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [pwdData, setPwdData] = useState({ password: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phoneNumber || user.phone || '',
        identifyNumber: user.identityNumber || user.identifyNumber || '',
        gender: user.gender || 'Nam',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setMessage({ type: 'error', text: 'Họ tên không được để trống' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      // Gọi API cập nhật thông tin (Dựa vào route @PutMapping("/users/{id}") trên BE)
      const res = await api.put(`/auth/users/${user.id}`, {
        ...user,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        email: user.email,
        roleCode: user.roleCode,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address,
        identifyNumber: formData.identifyNumber,
      });
      
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công! (Tải lại trang để thấy thay đổi)' });
      // Cập nhật localStorage và context nếu cần (Tạm thời yêu cầu user reload hoặc gọi lại fetchMe)
      const updatedUser = res.data?.data || res.data;
      if (updatedUser && updatedUser.fullName) {
        // Normalize object to match authService mapping so it won't break on reload
        const mappedUser = {
          ...user,
          ...updatedUser,
          identityNumber: updatedUser.identifyNumber,
          phone: updatedUser.phoneNumber
        };
        localStorage.setItem('user', JSON.stringify(mappedUser));
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể cập nhật hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwdData.password || !pwdData.newPassword || !pwdData.confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }

    setPwdLoading(true);
    setPwdMessage(null);
    try {
      await api.put(`/auth/users/change-password/${user.id}`, {
        password: pwdData.password,
        newPassword: pwdData.newPassword,
        newPasswordConfirm: pwdData.confirmPassword
      });
      setPwdMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPwdData({ password: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      setPwdMessage({ type: 'error', text: error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Đổi mật khẩu thất bại') });
    } finally {
      setPwdLoading(false);
    }
  };

  const getRoleLabel = (roleCode) => {
    const roles = {
      'ADMIN': 'Quản trị viên',
      'PARKING_MANAGER': 'Quản lý Bãi đỗ',
      'PARKING_STAFF': 'Nhân viên Bãi đỗ',
      'DRIVER': 'Lái xe'
    };
    return roles[roleCode?.toUpperCase()] || roleCode;
  };

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông tin...</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={28} color="var(--accent-primary)" /> Hồ sơ Cá nhân
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Quản lý thông tin cá nhân và tài khoản của bạn</p>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingBottom: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
          }}>
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: 'var(--text-primary)' }}>{user.fullName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              <Shield size={16} color="var(--accent-primary)" />
              {getRoleLabel(user.roleCode || user.role)}
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <User size={16} /> Họ và Tên
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Phone size={16} /> Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <CreditCard size={16} /> CCCD / CMND
              </label>
              <input
                type="text"
                value={formData.identifyNumber}
                onChange={e => setFormData({ ...formData, identifyNumber: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Users size={16} /> Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Calendar size={16} /> Ngày sinh
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <MapPin size={16} /> Địa chỉ
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              <Mail size={16} /> Email (Không thể thay đổi)
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)',
                fontSize: '0.95rem', cursor: 'not-allowed'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 8,
                fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
            >
              <Save size={18} />
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '32px', marginTop: 24 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} color="var(--accent-primary)" /> Đổi Mật Khẩu
        </h2>
        
        {pwdMessage && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
            background: pwdMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${pwdMessage.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: pwdMessage.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {pwdMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{pwdMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={pwdData.password}
              onChange={e => setPwdData({ ...pwdData, password: e.target.value })}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Mật khẩu mới</label>
              <input
                type="password"
                value={pwdData.newPassword}
                onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={pwdData.confirmPassword}
                onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', outline: 'none'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="submit"
              disabled={pwdLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 8,
                fontSize: '0.95rem', fontWeight: 600, cursor: pwdLoading ? 'not-allowed' : 'pointer',
                opacity: pwdLoading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Save size={18} />
              {pwdLoading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
