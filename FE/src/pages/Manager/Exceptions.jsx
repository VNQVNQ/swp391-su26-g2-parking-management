import { AlertTriangle, Clock, CheckCircle, Ticket, DollarSign, Plus, X, Search, FileText } from 'lucide-react';
import { useState } from 'react';
import { useParkingStore } from '../../store/parkingStore';

export default function Exceptions() {
  const store = useParkingStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedException, setSelectedException] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [form, setForm] = useState({ type: 'Lost Ticket', desc: '', surcharge: '' });

  const stats = [
    { label: 'Pending', value: store.exceptions.filter(e => e.status === 'Pending').length, icon: Clock, color: '#f59e0b' },
    { label: 'Resolved', value: store.exceptions.filter(e => e.status === 'Resolved').length, icon: CheckCircle, color: '#10b981' },
    { label: 'Lost Tickets', value: store.exceptions.filter(e => e.type === 'Lost Ticket').length, icon: Ticket, color: '#ef4444' },
    { label: 'Surcharge Collected', value: `₫${store.exceptions.filter(e => e.status === 'Resolved').reduce((acc, curr) => acc + (Number(curr.surcharge) || 0), 0).toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
  ];

  const handleResolveClick = (ex) => {
    setSelectedException(ex);
    setResolveNotes('');
    setShowResolveModal(true);
  };

  const handleConfirmResolve = () => {
    store.resolveException(selectedException.id, resolveNotes);
    setShowResolveModal(false);
    setSelectedException(null);
    setResolveNotes('');
  };

  const handleCreateException = () => {
    if (!form.desc) {
      store.showToast('Please provide a description', 'error');
      return;
    }

    if (search) {
      // Validate against parked vehicles if plate is provided
      const found = store.vehicles.find(v => v.plate.toLowerCase() === search.toLowerCase());
      if (!found) {
        store.showToast(`Vehicle ${search} is not currently parked`, 'error');
        return;
      }
    }

    store.addException({
      type: form.type,
      desc: form.desc,
      surcharge: Number(form.surcharge) || 0,
      plate: search || 'N/A'
    });
    
    setShowCreateModal(false);
    setForm({ type: 'Lost Ticket', desc: '', surcharge: '' });
    setSearch('');
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Exception Handling</h2>
          <p>Manage lost tickets, overstays, and wrong zone parking</p>
        </div>
        <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create Exception
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

      {/* Exceptions Table */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <h3 className="card-title"><AlertTriangle size={20} /> Exception Log</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Plate</th>
              <th>Surcharge</th>
              <th>Created By</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {store.exceptions.map(ex => (
              <tr key={ex.id}>
                <td style={{ fontWeight: 600 }}>{ex.id}</td>
                <td>
                  <span className={`badge ${ex.type === 'Lost Ticket' ? 'badge-danger' : ex.type === 'Overstay' ? 'badge-warning' : 'badge-info'}`}>
                    {ex.type}
                  </span>
                </td>
                <td style={{ maxWidth: '200px', color: 'var(--text-secondary)' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ex.desc}
                  </div>
                  {ex.resolutionNotes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      ↳ {ex.resolutionNotes}
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{ex.plate}</td>
                <td style={{ fontWeight: 600, color: ex.surcharge > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                  {ex.surcharge > 0 ? `₫${ex.surcharge.toLocaleString()}` : '—'}
                </td>
                <td>{ex.createdBy}</td>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ex.time}</td>
                <td>
                  <span className={`badge ${ex.status === 'Pending' ? 'badge-warning' : 'badge-success'}`}>
                    {ex.status}
                  </span>
                </td>
                <td>
                  {ex.status === 'Pending' && (
                    <button className="btn-sm btn-sm-primary" onClick={() => handleResolveClick(ex)}>
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Handling Rules */}
      <div className="rules-section">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Handling Rules</h4>
        <div className="rules-grid">
          {[
            { code: 'BR-41', title: 'Lost Ticket', desc: 'ExceptionRecord is required when handling lost tickets. Surcharge: 50,000 VND' },
            { code: 'BR-04', title: '24h Overstay', desc: 'Sessions over 24h automatically marked as Overstay and Manager is notified' },
            { code: 'BR-42', title: 'Wrong Zone', desc: 'Vehicles parked in wrong zone are charged additional surcharge per policy' },
            { code: 'BR-44', title: 'Approval', desc: 'ExceptionRecord can only be resolved after Manager approval' },
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
              <h3>Create New Exception</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Find Parking Session (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input style={{ ...inputSt, paddingLeft: '42px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Enter license plate..." />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Exception Type</label>
              <select style={inputSt} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option>Lost Ticket</option>
                <option>Overstay</option>
                <option>Wrong Zone</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description <span className="required">*</span></label>
              <textarea 
                className="form-input" 
                style={{ ...inputSt, minHeight: '100px', resize: 'vertical' }} 
                value={form.desc} 
                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} 
                placeholder="Describe the exception..." 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Surcharge (VND)</label>
              <input style={inputSt} type="number" value={form.surcharge} onChange={e => setForm(p => ({ ...p, surcharge: e.target.value }))} placeholder="e.g. 50000" />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateException}>
                <span>Create Exception</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Exception Modal */}
      {showResolveModal && selectedException && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#10b981', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CheckCircle size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Resolve Exception</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowResolveModal(false)}><X size={16} /></button>
            </div>

            {/* Exception Summary */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ID</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedException.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Type</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedException.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Plate</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedException.plate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Surcharge</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedException.surcharge > 0 ? '#ef4444' : 'inherit' }}>
                  {selectedException.surcharge > 0 ? `₫${selectedException.surcharge.toLocaleString()}` : 'None'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Resolution Notes <span className="optional">(Optional)</span>
              </label>
              <div className="form-input-wrapper">
                <FileText className="input-icon" style={{ top: '16px', transform: 'none' }} />
                <textarea 
                  className="form-input" 
                  style={{ ...inputSt, minHeight: '100px', paddingLeft: '42px', paddingTop: '12px', resize: 'vertical' }} 
                  value={resolveNotes} 
                  onChange={e => setResolveNotes(e.target.value)} 
                  placeholder="Enter details about how this exception was resolved..." 
                />
              </div>
            </div>
            
            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmResolve}>
                <CheckCircle size={18} />
                <span>Mark as Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
