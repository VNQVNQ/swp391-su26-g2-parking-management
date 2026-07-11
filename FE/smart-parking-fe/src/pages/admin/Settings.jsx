import { Settings as SettingsIcon, Bell, Shield, Monitor, Users, Server, Lock, Save, Edit2, Check, X, RefreshCw, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import api from '../../services/api';

// ── Cấu hình vai trò ──
const ROLE_OPTIONS = ['ADMIN', 'PARKING_MANAGER', 'PARKING_STAFF', 'DRIVER'];

const roleBadge = (r) => {
  const upper = (r || '').toUpperCase();
  const m = { ADMIN: 'badge-danger', PARKING_MANAGER: 'badge-warning', PARKING_STAFF: 'badge-info', DRIVER: 'badge-neutral' };
  return m[upper] || 'badge-neutral';
};

const roleLabel = (r) => {
  const upper = (r || '').toUpperCase();
  const m = { ADMIN: 'Quản trị viên', PARKING_MANAGER: 'Quản lý', PARKING_STAFF: 'Nhân viên', DRIVER: 'Lái xe' };
  return m[upper] || r;
};

// Lựa chọn vai trò khi tạo tài khoản mới (Loại bỏ ADMIN vì lý do bảo mật)
const CREATE_ROLE_OPTIONS = ['PARKING_MANAGER', 'PARKING_STAFF', 'DRIVER'];

export default function Settings() {
  const store = useParkingStore();
  
  // Trạng thái local cho các cấu hình
  const [notifications, setNotifications] = useState(store.settings.notifications);
  const [security, setSecurity] = useState(store.settings.security);
  const [lotInfo, setLotInfo] = useState(store.settings.lotInfo);
  const [isSaving, setIsSaving] = useState(false);

  // ── Trạng thái Quản lý Người dùng ──
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState(null); // { type: 'success'|'error', text }

  // ── Trạng thái Tạo tài khoản ──
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roleCode: 'DRIVER'
  });

  // Kiểm tra chế độ demo
  const isDemoMode = localStorage.getItem('accessToken') === 'demo-token';

  // Đồng bộ với store
  useEffect(() => {
    setNotifications(store.settings.notifications);
    setSecurity(store.settings.security);
    setLotInfo(store.settings.lotInfo);
  }, [store.settings]);

  // ── Lấy danh sách người dùng ──
  const fetchUsers = useCallback(async () => {
    if (isDemoMode) {
      setUsers([
        { id: 1, fullName: 'Phạm Văn Admin', email: 'admin@parking.com', roleCode: 'ADMIN', userIsActivated: true, phoneNumber: '0901000001' },
        { id: 2, fullName: 'Trần Thị Quản lý', email: 'manager@parking.com', roleCode: 'PARKING_MANAGER', userIsActivated: true, phoneNumber: '0901000002' },
        { id: 3, fullName: 'Nguyễn Văn Nhân viên 01', email: 'staff01@parking.com', roleCode: 'PARKING_STAFF', userIsActivated: true, phoneNumber: '0901000003' },
        { id: 4, fullName: 'Lê Văn Nhân viên 02', email: 'staff02@parking.com', roleCode: 'PARKING_STAFF', userIsActivated: true, phoneNumber: '0901000004' },
        { id: 5, fullName: 'Vương Driver', email: 'driver@email.com', roleCode: 'DRIVER', userIsActivated: true, phoneNumber: '0901000005' },
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
      setUsersError(err.response?.data?.message || err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setUsersLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Cập nhật vai trò người dùng ──
  const handleRoleUpdate = async (userId) => {
    if (!editingRole) return;

    setRoleUpdating(true);
    setRoleUpdateMsg(null);

    if (isDemoMode) {
      setTimeout(() => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleCode: editingRole } : u));
        setEditingUserId(null);
        setEditingRole('');
        setRoleUpdating(false);
        setRoleUpdateMsg({ type: 'success', text: `Cập nhật quyền thành ${roleLabel(editingRole)} (chế độ demo)` });
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
      setRoleUpdateMsg({ type: 'success', text: `Cập nhật quyền thành ${roleLabel(editingRole)} thành công!` });
      setTimeout(() => setRoleUpdateMsg(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cập nhật quyền thất bại';
      setRoleUpdateMsg({ type: 'error', text: msg });
      setTimeout(() => setRoleUpdateMsg(null), 5000);
    } finally {
      setRoleUpdating(false);
    }
  };

  // ── Tạo tài khoản mới dành cho ADMIN ──
  const handleCreateAccount = async () => {
    if (!createForm.fullName.trim()) { setCreateMsg({ type: 'error', text: 'Họ tên là bắt buộc' }); return; }
    if (!createForm.email.trim()) { setCreateMsg({ type: 'error', text: 'Email là bắt buộc' }); return; }
    if (!createForm.phone.trim()) { setCreateMsg({ type: 'error', text: 'Số điện thoại là bắt buộc' }); return; }
    if (!createForm.password) { setCreateMsg({ type: 'error', text: 'Mật khẩu là bắt buộc' }); return; }
    if (createForm.password !== createForm.confirmPassword) { setCreateMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); return; }

    setCreateLoading(true);
    setCreateMsg(null);

    if (isDemoMode) {
      setTimeout(() => {
        const mockNewUser = {
          id: Date.now(),
          fullName: createForm.fullName,
          email: createForm.email,
          phoneNumber: createForm.phone,
          roleCode: createForm.roleCode,
          userIsActivated: true
        };
        setUsers(prev => [...prev, mockNewUser]);
        setCreateMsg({ type: 'success', text: `Tạo tài khoản ${roleLabel(createForm.roleCode)} thành công! (demo)` });
        setCreateForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', roleCode: 'DRIVER' });
        setTimeout(() => { setCreateMsg(null); setShowCreateForm(false); }, 2000);
        setCreateLoading(false);
      }, 800);
      return;
    }

    try {
      await api.post('/auth/admin/register', {
        fullName: createForm.fullName,
        email: createForm.email,
        phoneNumber: createForm.phone,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        roleCode: createForm.roleCode,
      });
      setCreateMsg({ type: 'success', text: `Tạo tài khoản ${roleLabel(createForm.roleCode)} thành công!` });
      setCreateForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', roleCode: 'DRIVER' });
      fetchUsers();
      setTimeout(() => { setCreateMsg(null); setShowCreateForm(false); }, 2500);
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo tài khoản thất bại' });
    } finally {
      setCreateLoading(false);
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
    }, 500);
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>⚙️ Cài đặt Hệ thống</h2>
        <p>Quản lý cấu hình bãi xe và danh sách người dùng</p>
      </div>

      {/* Thông tin bãi đỗ xe */}
      <div className="settings-card">
        <div className="settings-card-title"><Monitor size={20} /> Thông tin bãi đỗ xe</div>
        <div className="settings-form-grid">
          <div className="form-group">
            <label className="form-label">Tên bãi đỗ xe</label>
            <input style={inputSt} value={lotInfo.name} onChange={e => setLotInfo(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input style={inputSt} value={lotInfo.phone} onChange={e => setLotInfo(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Địa chỉ bãi đỗ xe</label>
            <input style={inputSt} value={lotInfo.address} onChange={e => setLotInfo(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email hỗ trợ</label>
            <input style={inputSt} value={lotInfo.email} onChange={e => setLotInfo(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Thời gian mở cửa</label>
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
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      {/* Cài đặt Thông báo */}
      <div className="settings-card">
        <div className="settings-card-title"><Bell size={20} /> Cài đặt Thông báo</div>
        {[
          { key: 'overstay', title: 'Cảnh báo Đỗ quá hạn (> 24h)', desc: 'Gửi thông báo khi có xe gửi liên tục vượt quá 24 tiếng' },
          { key: 'capacity', title: 'Cảnh báo Bãi xe gần đầy', desc: 'Thông báo cảnh báo khi công suất bãi đạt trên 90%' },
          { key: 'passExpiry', title: 'Nhắc nhở Hết hạn vé tháng', desc: 'Gửi thông báo nhắc nhở 7 ngày trước khi vé tháng của khách hết hạn' },
          { key: 'dailyReport', title: 'Báo cáo Doanh thu mỗi ngày', desc: 'Tự động gửi email tổng hợp doanh thu cuối ngày cho Quản lý' },
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

      {/* Cài đặt Bảo mật */}
      <div className="settings-card">
        <div className="settings-card-title"><Shield size={20} /> Bảo mật</div>
        {[
          { key: 'twoFactor', title: 'Xác thực 2 yếu tố (2FA)', desc: 'Yêu cầu mã xác thực OTP khi đăng nhập tài khoản quản trị' },
          { key: 'autoLogout', title: 'Tự động Đăng xuất', desc: 'Tự động đăng xuất sau 30 phút tài khoản không có hoạt động' },
          { key: 'activityLog', title: 'Ghi nhật ký hoạt động', desc: 'Ghi chép lịch sử chi tiết mọi thao tác nghiệp vụ hệ thống' },
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

      {/* ═══════════════════════ Quản lý Người Dùng ═══════════════════════ */}
      <div className="settings-card" id="user-management-section">
        <div className="settings-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} /> Quản lý Người dùng
            {isDemoMode && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Chế độ Demo</span>}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-sm btn-sm-primary"
              onClick={() => { setShowCreateForm(!showCreateForm); setCreateMsg(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
            >
              <UserPlus size={14} />
              {showCreateForm ? 'Ẩn Form' : 'Tạo Tài Khoản'}
            </button>
            <button
              className="btn-sm btn-sm-secondary"
              onClick={fetchUsers}
              disabled={usersLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
              title="Tải lại danh sách"
            >
              <RefreshCw size={14} className={usersLoading ? 'spin-animation' : ''} />
              Tải lại
            </button>
          </div>
        </div>

        {/* Form tạo tài khoản mới */}
        {showCreateForm && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={16} /> Tạo tài khoản người dùng mới
            </h4>
            
            {createMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: createMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${createMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: createMsg.type === 'success' ? '#10b981' : '#ef4444',
              }}>
                {createMsg.type === 'success' ? <Check size={16} /> : <X size={16} />}
                {createMsg.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Họ tên *</label>
                <input style={inputSt} placeholder="Nguyễn Văn A" value={createForm.fullName} onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email *</label>
                <input style={inputSt} placeholder="email@parking.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Số điện thoại *</label>
                <input style={inputSt} placeholder="0901234567" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePassword ? 'text' : 'password'} style={inputSt} placeholder="Tối thiểu 6 ký tự" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
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
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Quyền hạn *</label>
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

        {/* Thông điệp phản hồi sửa đổi vai trò */}
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

        {/* Lỗi liên quan */}
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

        {/* Bảng danh sách người dùng */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Quyền hạn</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <RefreshCw size={18} className="spin-animation" />
                      Đang tải danh sách người dùng...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{u.id}</td>
                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phoneNumber || u.phone || '—'}</td>
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
                        {u.userIsActivated ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.roleCode === 'ADMIN' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Shield size={12} /> Hệ thống bảo vệ
                        </span>
                      ) : editingUserId === u.id ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleRoleUpdate(u.id)}
                            disabled={roleUpdating || editingRole === u.roleCode}
                            title="Lưu lại quyền hạn"
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
                            Lưu
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={roleUpdating}
                            title="Hủy thao tác"
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
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(u)}
                          title="Thay đổi quyền"
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
                          Đổi Quyền
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

      {/* Thông tin Hệ thống */}
      <div className="settings-card">
        <div className="settings-card-title"><Server size={20} /> Thông tin Hệ thống</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Phiên bản', value: '2.1.0' },
            { label: 'Trạng thái CSDL', value: 'Đã kết nối', badge: 'badge-success' },
            { label: 'Trạng thái Server', value: 'Hoạt động', badge: 'badge-success' },
            { label: 'Lần sao lưu cuối', value: '2026-07-11 23:00' },
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

      {/* Kiểm soát Truy cập */}
      <div className="settings-card">
        <div className="settings-card-title"><Lock size={20} /> Phân Quyền Truy Cập (BR-50)</div>
        <div className="rules-grid">
          {[
            { role: 'Quản trị viên (Admin)', desc: 'Toàn quyền truy cập và điều cấu hình hệ thống', color: '#ef4444' },
            { role: 'Quản lý (Parking Manager)', desc: 'Cấu hình bãi xe, xem báo cáo doanh thu, duyệt exception', color: '#f59e0b' },
            { role: 'Nhân viên (Parking Staff)', desc: 'Xử lý xe vào/ra bãi, kiểm tra thông tin xe và thu phí', color: '#3b82f6' },
            { role: 'Lái xe (Driver)', desc: 'Xem thông tin các slot trống, đặt chỗ đỗ trước trực tuyến', color: '#6b7280' },
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
