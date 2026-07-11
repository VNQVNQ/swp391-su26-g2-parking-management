import { AlertTriangle, Clock, CheckCircle, Ticket, DollarSign, Plus, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedException, setSelectedException] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [form, setForm] = useState({ type: 'LOST_TICKET', desc: '', surcharge: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/exceptions');
      const data = res.data.data ?? res.data ?? [];
      // Sắp xếp mới nhất lên đầu
      setExceptions(Array.isArray(data) ? data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu ngoại lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (ex) => {
    setSelectedException(ex);
    setResolveNotes('');
    setShowResolveModal(true);
  };

  const handleConfirmResolve = async () => {
    setSubmitting(true);
    try {
      await api.put(`/api/v1/exceptions/${selectedException.id}/resolve`, {
        resolution: resolveNotes,
        status: 'RESOLVED'
      });
      await loadExceptions();
      setShowResolveModal(false);
      setSelectedException(null);
      setResolveNotes('');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể giải quyết ngoại lệ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateException = async () => {
    if (!form.desc) {
      alert('Vui lòng nhập mô tả chi tiết');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/v1/exceptions', {
        exceptionType: form.type,
        reason: form.desc,
        licensePlate: search,
        // Send surcharge inside reason for now since backend doesn't have surcharge field natively
        ...(form.surcharge && { reason: `${form.desc} [Phụ phí: ${form.surcharge}đ]` })
      });
      
      await loadExceptions();
      setShowCreateModal(false);
      setForm({ type: 'LOST_TICKET', desc: '', surcharge: '' });
      setSearch('');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo ngoại lệ');
    } finally {
      setSubmitting(false);
    }
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  const stats = [
    { label: 'Đang chờ', value: exceptions.filter(e => e.status === 'PENDING').length, icon: Clock, color: '#f59e0b' },
    { label: 'Đã giải quyết', value: exceptions.filter(e => e.status === 'RESOLVED' || e.status === 'APPROVED').length, icon: CheckCircle, color: '#10b981' },
    { label: 'Mất vé', value: exceptions.filter(e => e.exceptionType === 'LOST_TICKET').length, icon: Ticket, color: '#ef4444' },
    { label: 'Tổng số bản ghi', value: exceptions.length, icon: DollarSign, color: '#8b5cf6' },
  ];

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>🚨 Xử lý Ngoại lệ</h2>
          <p>Quản lý vé mất, đỗ quá giờ, đỗ sai khu vực</p>
        </div>
        <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Tạo Ngoại lệ mới
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <Icon size={20} className="stat-card-icon" style={{ color: s.color }} />
              </div>
              <div className="stat-card-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Exceptions Table */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={20} /> Nhật ký Ngoại lệ</h3>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
        ) : exceptions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có ngoại lệ nào trong hệ thống</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Mô tả</th>
                <th>Biển số xe</th>
                <th>Người tạo</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(ex => (
                <tr key={ex.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ex.id.substring(0, 8)}</td>
                  <td>
                    <span className={`badge ${ex.exceptionType === 'LOST_TICKET' ? 'badge-danger' : ex.exceptionType === 'OVERSTAY' ? 'badge-warning' : 'badge-info'}`}>
                      {ex.exceptionType === 'LOST_TICKET' ? 'Mất vé' : ex.exceptionType === 'OVERSTAY' ? 'Quá giờ' : ex.exceptionType === 'WRONG_ZONE' ? 'Sai khu vực' : 'Khác'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '250px', color: 'var(--text-secondary)' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ex.reason}
                    </div>
                    {ex.resolution && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ↳ {ex.resolution}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ex.licensePlate || 'N/A'}</td>
                  <td>{ex.createdBy || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{new Date(ex.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`badge ${ex.status === 'PENDING' ? 'badge-warning' : ex.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}`}>
                      {ex.status === 'PENDING' ? 'Đang chờ' : ex.status === 'RESOLVED' ? 'Đã giải quyết' : ex.status === 'REJECTED' ? 'Từ chối' : ex.status}
                    </span>
                  </td>
                  <td>
                    {ex.status === 'PENDING' && (
                      <button className="btn-sm btn-sm-primary" onClick={() => handleResolveClick(ex)}>
                        Giải quyết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Handling Rules */}
      <div className="rules-section">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Quy định Xử lý</h4>
        <div className="rules-grid">
          {[
            { code: 'BR-41', title: 'Mất vé', desc: 'Bắt buộc tạo bản ghi ngoại lệ khi mất vé. Phụ phí bồi thường: 50,000 VND' },
            { code: 'BR-04', title: 'Đỗ quá 24h', desc: 'Xe đỗ quá 24h tự động bị đánh dấu là Quá giờ và thông báo đến Quản lý' },
            { code: 'BR-42', title: 'Sai khu vực', desc: 'Xe đỗ sai khu vực quy định sẽ bị tính thêm phụ phí' },
            { code: 'BR-44', title: 'Phê duyệt', desc: 'Bản ghi ngoại lệ chỉ được đóng sau khi Quản lý phê duyệt' },
          ].map((r, i) => (
            <div key={i} className="rule-card">
              <div className="rule-card-title"><span className="rule-code">{r.code}</span>{r.title}</div>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Exception Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo Ngoại lệ mới</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tìm biển số xe (Tuỳ chọn)</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input style={{ ...inputSt, paddingLeft: '42px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập biển số xe (nếu có)..." />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Loại ngoại lệ</label>
              <select style={inputSt} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="LOST_TICKET">Mất vé</option>
                <option value="OVERSTAY">Quá giờ</option>
                <option value="WRONG_ZONE">Sai khu vực</option>
                <option value="UNPAID_EXIT">Nợ phí</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết <span className="required">*</span></label>
              <textarea 
                style={{ ...inputSt, minHeight: '100px', resize: 'vertical' }} 
                value={form.desc} 
                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                placeholder="Nhập chi tiết sự việc..."
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Phí thu thêm (nếu có)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="number"
                  style={{ ...inputSt, paddingLeft: '42px' }} 
                  value={form.surcharge} 
                  onChange={e => setForm(p => ({ ...p, surcharge: e.target.value }))}
                  placeholder="Nhập số tiền..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ padding: '10px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }} onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px' }} onClick={handleCreateException} disabled={submitting}>
                {submitting ? 'Đang tạo...' : 'Tạo ngoại lệ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedException && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Giải quyết Ngoại lệ #{selectedException.id.substring(0, 8)}</h3>
              <button className="modal-close-btn" onClick={() => setShowResolveModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Loại: <strong style={{ color: 'var(--text-primary)' }}>{selectedException.exceptionType === 'LOST_TICKET' ? 'Mất vé' : selectedException.exceptionType === 'OVERSTAY' ? 'Quá giờ' : selectedException.exceptionType === 'WRONG_ZONE' ? 'Sai khu vực' : 'Khác'}</strong></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Biển số xe: <strong style={{ color: 'var(--text-primary)' }}>{selectedException.licensePlate || 'N/A'}</strong></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mô tả: <strong style={{ color: 'var(--text-primary)' }}>{selectedException.reason}</strong></p>
            </div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Ghi chú giải quyết <span className="required">*</span></label>
              <textarea 
                style={{ ...inputSt, minHeight: '100px', resize: 'vertical' }} 
                value={resolveNotes} 
                onChange={e => setResolveNotes(e.target.value)}
                placeholder="Nhập kết quả xử lý..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-sm" style={{ padding: '10px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }} onClick={() => setShowResolveModal(false)}>Hủy</button>
              <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', background: '#10b981' }} onClick={handleConfirmResolve} disabled={submitting || !resolveNotes}>
                {submitting ? 'Đang xử lý...' : '✓ Hoàn tất giải quyết'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
