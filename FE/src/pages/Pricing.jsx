import { DollarSign, Clock, Settings, Shield, Plus, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParkingStore } from '../store/parkingStore';

export default function Pricing() {
  const store = useParkingStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    name: '', vehicleType: 'Car', ticketType: 'Hourly',
    rate: '', minFee: '', maxDaily: '', overstay: '',
    peakStart: '', peakEnd: '', peakMult: ''
  };
  const [form, setForm] = useState(initialForm);

  const stats = [
    { label: 'Active Policies', value: store.pricingConfigs.filter(p => p.active).length, icon: Shield, color: '#10b981' },
    { label: 'Total Policies', value: store.pricingConfigs.length, icon: Settings, color: '#3b82f6' },
    { label: 'Car Base Rate', value: '₫20,000/hr', icon: DollarSign, color: '#f59e0b' },
    { label: 'Peak Hours Active', value: '07:00 - 09:00', icon: Clock, color: '#8b5cf6' },
  ];

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      vehicleType: p.vehicleType,
      ticketType: p.ticketType,
      rate: p.rate || '',
      minFee: p.minFee || '',
      maxDaily: p.maxDaily || '',
      overstay: p.overstay || '',
      peakStart: p.peakStart || '',
      peakEnd: p.peakEnd || '',
      peakMult: p.peakMult || ''
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleSave = () => {
    const config = {
      name: form.name,
      vehicleType: form.vehicleType,
      ticketType: form.ticketType,
      rate: Number(form.rate),
      minFee: Number(form.minFee) || 0,
      maxDaily: Number(form.maxDaily) || 0,
      overstay: Number(form.overstay) || 0,
      peakStart: form.peakStart,
      peakEnd: form.peakEnd,
      peakMult: Number(form.peakMult) || 0
    };

    if (editingId) {
      store.updatePricing(editingId, config);
    } else {
      store.addPricing(config);
    }
    setShowModal(false);
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div className="page-full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Pricing & Policies</h2>
          <p>Configure parking rates, surcharges, and operational policies</p>
        </div>
        <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleCreate}>
          <Plus size={16} /> New Pricing Policy
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

      <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Vehicle Type</th>
              <th>Base Rate</th>
              <th>Max Daily</th>
              <th>Overstay Penalty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.pricingConfigs.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.vehicleType}</td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₫{p.rate.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.ticketType === 'Hourly' ? ' /hr' : p.ticketType === 'Daily' ? ' /day' : ' /mo'}</span>
                </td>
                <td>{p.maxDaily ? `₫${p.maxDaily.toLocaleString()}` : '—'}</td>
                <td>{p.overstay ? `₫${p.overstay.toLocaleString()}` : '—'}</td>
                <td>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={p.active} onChange={() => store.togglePricing(p.id)} />
                    <span className="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <button className="btn-sm btn-sm-secondary" onClick={() => handleEdit(p)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing Policy Rules */}
      <div className="rules-section">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Active Business Rules</h4>
        <div className="rules-grid">
          {[
            { code: 'BR-10', title: 'Car Base Rate', desc: 'Cars are charged 20,000 VND for the first hour and 20,000 VND for each subsequent hour.' },
            { code: 'BR-11', title: 'Motorbike Base Rate', desc: 'Motorbikes are charged 5,000 VND for the first 4 hours, and 5,000 VND per hour thereafter.' },
            { code: 'BR-12', title: 'Overnight Surcharge', desc: 'Vehicles parked between 22:00 and 06:00 incur a 50,000 VND surcharge.' },
            { code: 'BR-13', title: 'Lost Ticket', desc: 'Lost ticket replacement requires ID verification and a 50,000 VND fee.' },
          ].map((r, i) => (
            <div key={i} className="rule-card">
              <div className="rule-card-title"><span className="rule-code">{r.code}</span>{r.title}</div>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Pricing Policy' : 'Create Pricing Policy'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Policy Name</label>
                <input style={inputSt} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Premium Car Hourly" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select style={inputSt} value={form.vehicleType} onChange={e => setForm(p => ({...p, vehicleType: e.target.value}))}>
                  <option>Car</option><option>Motorbike</option><option>Truck</option><option>Bicycle</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ticket Type</label>
                <select style={inputSt} value={form.ticketType} onChange={e => setForm(p => ({...p, ticketType: e.target.value}))}>
                  <option>Hourly</option><option>Daily</option><option>Monthly</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Base Rate (VND)</label>
                <input style={inputSt} type="number" value={form.rate} onChange={e => setForm(p => ({...p, rate: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Fee (VND)</label>
                <input style={inputSt} type="number" value={form.minFee} onChange={e => setForm(p => ({...p, minFee: e.target.value}))} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Max Daily Cap (VND)</label>
                <input style={inputSt} type="number" value={form.maxDaily} onChange={e => setForm(p => ({...p, maxDaily: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Overstay Penalty (VND)</label>
                <input style={inputSt} type="number" value={form.overstay} onChange={e => setForm(p => ({...p, overstay: e.target.value}))} />
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '16px', marginBottom: '12px' }}>Peak Hours (Optional)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input style={inputSt} type="time" value={form.peakStart} onChange={e => setForm(p => ({...p, peakStart: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input style={inputSt} type="time" value={form.peakEnd} onChange={e => setForm(p => ({...p, peakEnd: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Multiplier</label>
                <input style={inputSt} type="number" step="0.1" value={form.peakMult} onChange={e => setForm(p => ({...p, peakMult: e.target.value}))} placeholder="e.g. 1.5" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                <span>Save Policy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
