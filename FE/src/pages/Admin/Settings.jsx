import { Settings as SettingsIcon, Bell, Shield, Monitor, Users, Server, Lock, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';

const usersData = [
  { id: 1, username: 'admin', fullName: 'Admin User', email: 'admin@parking.vn', role: 'Admin', active: true },
  { id: 2, username: 'manager1', fullName: 'Nguyen Van M', email: 'manager@parking.vn', role: 'Manager', active: true },
  { id: 3, username: 'staff1', fullName: 'Tran Thi S', email: 'staff1@parking.vn', role: 'Staff', active: true },
  { id: 4, username: 'staff2', fullName: 'Le Van S', email: 'staff2@parking.vn', role: 'Staff', active: true },
  { id: 5, username: 'driver1', fullName: 'Pham D', email: 'driver@email.vn', role: 'Driver', active: false },
];

const roleBadge = (r) => {
  const m = { Admin: 'badge-danger', Manager: 'badge-warning', Staff: 'badge-info', Driver: 'badge-neutral' };
  return m[r] || 'badge-neutral';
};

export default function Settings() {
  const store = useParkingStore();
  
  // Local state for forms
  const [notifications, setNotifications] = useState(store.settings.notifications);
  const [security, setSecurity] = useState(store.settings.security);
  const [lotInfo, setLotInfo] = useState(store.settings.lotInfo);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with store on mount in case it changed elsewhere
  useEffect(() => {
    setNotifications(store.settings.notifications);
    setSecurity(store.settings.security);
    setLotInfo(store.settings.lotInfo);
  }, [store.settings]);

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

      {/* User Management */}
      <div className="settings-card">
        <div className="settings-card-title"><Users size={20} /> User Management</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.fullName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.active ? 'badge-success' : 'badge-neutral'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
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
            { role: 'Manager', desc: 'Configuration, reports, approve exceptions', color: '#f59e0b' },
            { role: 'Staff', desc: 'Vehicle entry/exit, create exceptions', color: '#3b82f6' },
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
