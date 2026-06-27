import { Settings as SettingsIcon, Bell, Shield, Monitor, Users, Server, Lock, Save, Edit2, Check, X, RefreshCw, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import api from '../../services/api';

// ── Role config (phải khớp với DB: PARKING_PARKING_MANAGER, PARKING_PARKING_STAFF) ──
const ROLE_OPTIONS = ['ADMIN', 'PARKING_PARKING_MANAGER', 'PARKING_PARKING_STAFF', 'DRIVER'];

const roleBadge = (r) => {
  const upper = (r || '').toUpperCase();
  const m = { ADMIN: 'badge-danger', PARKING_PARKING_MANAGER: 'badge-warning', PARKING_PARKING_STAFF: 'badge-info', DRIVER: 'badge-neutral' };
  return m[upper] || 'badge-neutral';
};

const roleLabel = (r) => {
  const upper = (r || '').toUpperCase();
  const m = { ADMIN: 'Admin', PARKING_PARKING_MANAGER: 'Parking Manager', PARKING_PARKING_STAFF: 'Parking Staff', DRIVER: 'Driver' };
  return m[upper] || r;
};

// Role options for admin create account (exclude ADMIN for safety)
const CREATE_ROLE_OPTIONS = ['PARKING_PARKING_MANAGER', 'PARKING_PARKING_STAFF', 'DRIVER'];

export default function Settings() {
  const store = useParkingStore();
  
  // Local state for forms
  const [notifications, setNotifications] = useState(store.settings.notifications);
  const [security, setSecurity] = useState(store.settings.security);
  const [lotInfo, setLotInfo] = useState(store.settings.lotInfo);
  const [isSaving, setIsSaving] = useState(false);

  // ── User Management state ─────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState(null); // { type: 'success'|'error', text }

  // ── Admin Create Account state ─────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '', email: '', phone: '', gender: 'MALE',
    dateOfBirth: '', address: '', identityNumber: '',
    password: '', confirmPassword: '', roleCode: 'DRIVER'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Check if we're in demo mode
  const isDemoMode = localStorage.getItem('accessToken') === 'demo-token';

  // Sync with store on mount in case it changed elsewhere
  useEffect(() => {
    setNotifications(store.settings.notifications);
    setSecurity(store.settings.security);
    setLotInfo(store.settings.lotInfo);
  }, [store.settings]);

  // ── Fetch users from backend ──────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (isDemoMode) {
      // Demo mode: use mock data
      setUsers([
        { id: 1, fullName: 'Admin User', email: 'admin@parking.vn', roleCode: 'ADMIN', userIsActivated: true, phoneNumber: '0901000001' },
        { id: 2, fullName: 'Nguyen Van PARKING_MANAGER', email: 'PARKING_MANAGER@parking.vn', roleCode: 'PARKING_MANAGER', userIsActivated: true, phoneNumber: '0901000002' },
        { id: 3, fullName: 'Tran Thi PARKING_STAFF', email: 'PARKING_STAFF1@parking.vn', roleCode: 'PARKING_STAFF', userIsActivated: true, phoneNumber: '0901000003' },
        { id: 4, fullName: 'Le Van PARKING_STAFF', email: 'PARKING_STAFF2@parking.vn', roleCode: 'PARKING_STAFF', userIsActivated: true, phoneNumber: '0901000004' },
        { id: 5, fullName: 'Pham Driver', email: 'driver@email.vn', roleCode: 'DRIVER', userIsActivated: false, phoneNumber: '0901000005' },
      ]);
      return;
    }

    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await api.get('/auth/users/get');
      const data = res.data?.data || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsersError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Update user role ──────────────────────────────────────────────────────
  const handleRoleUpdate = async (userId) => {
    if (!editingRole) return;

    setRoleUpdating(true);
    setRoleUpdateMsg(null);

    if (isDemoMode) {
      // Demo mode: update locally
      setTimeout(() => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleCode: editingRole } : u));
        setEditingUserId(null);
        setEditingRole('');
        setRoleUpdating(false);
        setRoleUpdateMsg({ type: 'success', text: `Role updated to ${roleLabel(editingRole)} (demo mode)` });
        setTimeout(() => setRoleUpdateMsg(null), 3000);
      }, 500);
      return;
    }

    try {
      const res = await api.patch(`/auth/users/${userId}/role`, { roleCode: editingRole });
      const updatedUser = res.data?.data;
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleCode: updatedUser.roleCode || editingRole } : u));
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleCode: editingRole } : u));
      }
      setEditingUserId(null);
      setEditingRole('');
      setRoleUpdateMsg({ type: 'success', text: `Role updated to ${roleLabel(editingRole)} successfully` });
      setTimeout(() => setRoleUpdateMsg(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update role';
      setRoleUpdateMsg({ type: 'error', text: msg });
      setTimeout(() => setRoleUpdateMsg(null), 5000);
    } finally {
      setRoleUpdating(false);
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditingRole(user.roleCode);
    setRoleUpdateMsg(null);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditingRole('');
  };

  // ── Admin Create Account handler ───────────────────────────────────────
  const handleCreateAccount = async () => {
    // Validation
    if (!createForm.fullName.trim()) { setCreateMsg({ type: 'error', text: 'Họ tên là bắt buộc' }); return; }
    if (!createForm.email.trim()) { setCreateMsg({ type: 'error', text: 'Email là bắt buộc' }); return; }
    if (!createForm.phone.trim()) { setCreateMsg({ type: 'error', text: 'Số điện thoại là bắt buộc' }); return; }
    if (!createForm.password) { setCreateMsg({ type: 'error', text: 'Mật khẩu là bắt buộc' }); return; }
    if (createForm.password !== createForm.confirmPassword) { setCreateMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); return; }

    setCreateLoading(true);
    setCreateMsg(null);
    try {
      await api.post('/auth/admin/register', {
        fullName: createForm.fullName,
        email: createForm.email,
        phoneNumber: createForm.phone,
        identifyNumber: createForm.identityNumber,
        gender: createForm.gender,
        dateOfBirth: createForm.dateOfBirth || null,
        address: createForm.address,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        roleCode: createForm.roleCode,
      });
      setCreateMsg({ type: 'success', text: `Tạo tài khoản ${roleLabel(createForm.roleCode)} thành công!` });
      setCreateForm({ fullName: '', email: '', phone: '', gender: 'MALE', dateOfBirth: '', address: '', identityNumber: '', password: '', confirmPassword: '', roleCode: 'DRIVER' });
      fetchUsers();
      setTimeout(() => { setCreateMsg(null); setShowCreateForm(false); }, 2500);
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo tài khoản thất bại' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleNotif = (k) => {
    const newVal = { ...notifications, [k]: !notifications[k] };
    setNotifications(newVal);
    store.updateSettings('notifications', newVal);
  };

  const handleToggleSec = (k) => {
    const newVal = { ...security, [k]: !security[k] };
    setSecurity(newVal);
    store.updateSettings('security', newVal);
  };

  const handleSaveLotInfo = () => {
    setIsSaving(true);
    setTimeout(() => {
      store.updateSettings('lotInfo', lotInfo);
      setIsSaving(false);
    }, 500); // Simulate network delay for UX
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>System Settings</h2>
        <p>Manage system configuration and users</p>
      </div>

      {/* Parking Lot Information */}
      <div className="settings-card">
        <div className="settings-card-title"><Monitor size={20} /> Parking Lot Information</div>
        <div className="settings-form-grid">
          <div className="form-group">
            <label className="form-label">Parking Lot Name</label>
            <input style={inputSt} value={lotInfo.name} onChange={e => setLotInfo(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input style={inputSt} value={lotInfo.phone} onChange={e => setLotInfo(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address</label>
            <input style={inputSt} value={lotInfo.address} onChange={e => setLotInfo(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input style={inputSt} value={lotInfo.email} onChange={e => setLotInfo(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Operating Hours</label>
            <input style={inputSt} value={lotInfo.hours} onChange={e => setLotInfo(p => ({ ...p, hours: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <button 
            className="btn-sm btn-sm-primary" 
            style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleSaveLotInfo}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="settings-card">
        <div className="settings-card-title"><Bell size={20} /> Notification Settings</div>
        {[
          { key: 'overstay', title: 'Overstay Notification (> 24h)', desc: 'Send notification when vehicle is parked over 24 hours' },
          { key: 'capacity', title: 'Near Full Capacity Alert', desc: 'Alert when utilization exceeds 90%' },
          { key: 'passExpiry', title: 'Monthly Pass Expiry Notice', desc: 'Send notification 7 days before pass expires' },
          { key: 'dailyReport', title: 'Daily Revenue Report', desc: 'Send email revenue report at end of day' },
        ].map(item => (
          <div key={item.key} className="setting-row">
            <div className="setting-info">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={notifications[item.key]} onChange={() => handleToggleNotif(item.key)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* Security Settings */}
      <div className="settings-card">
        <div className="settings-card-title"><Shield size={20} /> Security</div>
        {[
          { key: 'twoFactor', title: 'Two-Factor Authentication', desc: '2FA for accounts' },
          { key: 'autoLogout', title: 'Auto Logout', desc: 'After 30 minutes inactive' },
          { key: 'activityLog', title: 'Activity Logging', desc: 'Log all operations' },
        ].map(item => (
          <div key={item.key} className="setting-row">
            <div className="setting-info">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={security[item.key]} onChange={() => handleToggleSec(item.key)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* ═══════════════════════ User Management ═══════════════════════ */}
      <div className="settings-card" id="user-management-section">
        <div className="settings-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} /> User Management
            {isDemoMode && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Demo Mode</span>}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setCreateMsg(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.82rem',
                background: 'var(--accent-gradient)', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)'; }}
            >
              <UserPlus size={15} />
              {showCreateForm ? 'Ẩn Form' : 'Tạo Tài Khoản'}
            </button>
            <button
              className="btn-sm btn-sm-secondary"
              onClick={fetchUsers}
              disabled={usersLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
              title="Refresh user list"
            >
              <RefreshCw size={14} className={usersLoading ? 'spin-animation' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Admin Create Account Form ─────────────────────────────────── */}
        {showCreateForm && (
          <div style={{
            padding: '20px', marginBottom: '16px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={18} style={{ color: '#10b981' }} /> Tạo Tài Khoản Mới
            </h4>

            {createMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '8px',
                background: createMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${createMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: createMsg.type === 'success' ? '#10b981' : '#ef4444',
              }}>
                {createMsg.type === 'success' ? <Check size={16} /> : <X size={16} />}
                {createMsg.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Họ tên *</label>
                <input style={inputSt} placeholder="Nguyễn Văn A" value={createForm.fullName} onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email *</label>
                <input style={inputSt} placeholder="email@example.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Số điện thoại *</label>
                <input style={inputSt} placeholder="0901234567" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>CMND/CCCD</label>
                <input style={inputSt} placeholder="001234567890" maxLength={12} value={createForm.identityNumber} onChange={e => setCreateForm(p => ({ ...p, identityNumber: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Giới tính</label>
                <select style={inputSt} value={createForm.gender} onChange={e => setCreateForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Ngày sinh</label>
                <input type="date" style={{ ...inputSt, colorScheme: 'dark' }} value={createForm.dateOfBirth} onChange={e => setCreateForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Địa chỉ</label>
              <input style={inputSt} placeholder="123 Đường ABC, TP.HCM" value={createForm.address} onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePassword ? 'text' : 'password'} style={inputSt} placeholder="Min 6 ký tự" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Xác nhận MK *</label>
                <input type={showCreatePassword ? 'text' : 'password'} style={inputSt} placeholder="Nhập lại mật khẩu" value={createForm.confirmPassword} onChange={e => setCreateForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Quyền *</label>
                <select style={{ ...inputSt, fontWeight: 600 }} value={createForm.roleCode} onChange={e => setCreateForm(p => ({ ...p, roleCode: e.target.value }))}>
                  {CREATE_ROLE_OPTIONS.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowCreateForm(false); setCreateMsg(null); }}
                style={{
                  padding: '8px 20px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
                }}
              >Hủy</button>
              <button
                onClick={handleCreateAccount}
                disabled={createLoading}
                style={{
                  padding: '8px 24px', background: 'var(--accent-gradient)', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: createLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  opacity: createLoading ? 0.7 : 1, transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                }}
              >
                {createLoading ? <RefreshCw size={15} className="spin-animation" /> : <UserPlus size={15} />}
                {createLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
              </button>
            </div>
          </div>
        )}

        {/* Role update feedback message */}
        {roleUpdateMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: roleUpdateMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${roleUpdateMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: roleUpdateMsg.type === 'success' ? '#10b981' : '#ef4444',
          }}>
            {roleUpdateMsg.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {roleUpdateMsg.text}
          </div>
        )}

        {/* Error message */}
        {usersError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.85rem',
          }}>
            ⚠️ {usersError}
          </div>
        )}

        {/* Users table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <RefreshCw size={18} className="spin-animation" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{u.id}</td>
                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phoneNumber || '—'}</td>
                    <td>
                      {editingUserId === u.id ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          disabled={roleUpdating}
                          style={{
                            padding: '6px 10px',
                            background: 'var(--bg-input, #1a1f2e)',
                            border: '1.5px solid var(--accent-primary, #10b981)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '110px',
                          }}
                        >
                          {ROLE_OPTIONS.map(role => (
                            <option key={role} value={role}>{roleLabel(role)}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${roleBadge(u.roleCode)}`}>{roleLabel(u.roleCode)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.userIsActivated ? 'badge-success' : 'badge-neutral'}`}>
                        {u.userIsActivated ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.roleCode === 'ADMIN' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Shield size={12} /> Protected
                        </span>
                      ) : editingUserId === u.id ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleRoleUpdate(u.id)}
                            disabled={roleUpdating || editingRole === u.roleCode}
                            title="Save role"
                            style={{
                              padding: '5px 12px',
                              background: roleUpdating ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '6px',
                              color: '#10b981',
                              cursor: roleUpdating || editingRole === u.roleCode ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              opacity: editingRole === u.roleCode ? 0.5 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {roleUpdating ? <RefreshCw size={13} className="spin-animation" /> : <Check size={13} />}
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={roleUpdating}
                            title="Cancel"
                            style={{
                              padding: '5px 12px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: roleUpdating ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'all 0.2s',
                            }}
                          >
                            <X size={13} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(u)}
                          title="Change role"
                          style={{
                            padding: '5px 12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                        >
                          <Edit2 size={13} />
                          Change Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Information */}
      <div className="settings-card">
        <div className="settings-card-title"><Server size={20} /> System Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Version', value: '2.1.0' },
            { label: 'Database Status', value: 'Connected', badge: 'badge-success' },
            { label: 'Server Status', value: 'Online', badge: 'badge-success' },
            { label: 'Last Backup', value: '2025-06-02 23:00' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.04em' }}>{item.label}</span>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {item.badge ? <span className={`badge ${item.badge}`}>{item.value}</span> : item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Access Control */}
      <div className="settings-card">
        <div className="settings-card-title"><Lock size={20} /> Access Control (BR-50)</div>
        <div className="rules-grid">
          {[
            { role: 'Admin', desc: 'Full system access', color: '#ef4444' },
            { role: 'PARKING_MANAGER', desc: 'Configuration, reports, approve exceptions', color: '#f59e0b' },
            { role: 'PARKING_STAFF', desc: 'Vehicle entry/exit, create exceptions', color: '#3b82f6' },
            { role: 'Driver', desc: 'View slots, make bookings', color: '#6b7280' },
          ].map((r, i) => (
            <div key={i} className="rule-card" style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="rule-card-title">{r.role}</div>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
