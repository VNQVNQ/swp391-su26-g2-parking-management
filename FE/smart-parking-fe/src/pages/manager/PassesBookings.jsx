import { CalendarCheck, CreditCard, Car, Bike } from 'lucide-react';
import { useState } from 'react';
import { useParkingStore } from '../../store/parkingStore';

export default function PassesBookings() {
  const store = useParkingStore();
  const [tab, setTab] = useState('passes');

  const stats = [
    { label: 'Active Passes', value: store.passes.filter(p => p.status === 'Active').length, icon: CreditCard, color: '#10b981' },
    { label: 'Pending Bookings', value: store.bookings.filter(b => b.status === 'Pending').length, icon: CalendarCheck, color: '#f59e0b' },
    { label: 'Car Passes', value: store.passes.filter(p => p.type === 'Car').length, icon: Car, color: '#3b82f6' },
    { label: 'Motorbike Passes', value: store.passes.filter(p => p.type === 'Motorbike').length, icon: Bike, color: '#8b5cf6' },
  ];

  // Handlers moved to Driver page - Manager can only view


  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>Monthly Passes & Bookings</h2>
        <p>Manage monthly passes and advance bookings</p>
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

      {/* Tab Nav */}
      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'passes' ? 'active' : ''}`} onClick={() => setTab('passes')}>Monthly Passes</button>
        <button className={`tab-btn ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Advance Bookings</button>
      </div>

       {/* Monthly Passes Tab - READ ONLY */}
       {tab === 'passes' && (
         <>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <div>
               <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Pass List</h3>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>View only - Drivers register passes from their account</p>
             </div>
           </div>
          <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Vehicle Type</th>
                  <th>Owner</th>
                  <th>Phone</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Fee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {store.passes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.plate}</td>
                    <td>{p.type}</td>
                    <td>{p.owner}</td>
                    <td>{p.phone}</td>
                    <td>{p.start}</td>
                    <td>{p.expiry}</td>
                    <td style={{ fontWeight: 600 }}>₫{p.fee.toLocaleString()}</td>
                    <td><span className={`badge ${p.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly Pass Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6', textAlign: 'center', padding: '28px' }}>
              <Car size={28} style={{ color: '#3b82f6', marginBottom: '8px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Car</h4>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫2,500,000</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/month</span>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #8b5cf6', textAlign: 'center', padding: '28px' }}>
              <Bike size={28} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Motorbike</h4>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>₫500,000</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/month</span>
            </div>
          </div>
        </>
      )}

       {/* Advance Bookings Tab - READ ONLY */}
       {tab === 'bookings' && (
         <>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <div>
               <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Bookings List</h3>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>View only - Drivers make bookings from their account</p>
             </div>
           </div>
          <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Vehicle Type</th>
                  <th>Reserved Slot</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {store.bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.plate}</td>
                    <td>{b.type}</td>
                    <td>{b.slot}</td>
                    <td>{b.startTime}</td>
                    <td>{b.endTime}</td>
                    <td><span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span></td>
                    <td>
                      <button className="btn-sm btn-sm-danger" onClick={() => store.cancelBooking(b.id)}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Booking Rules */}
          <div className="rules-section">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Booking Rules</h4>
            <div className="rules-grid">
              {[
                { code: 'BR-30', title: 'Slot Hold', desc: 'Reserved slots are held for maximum 30 minutes after start time' },
                { code: 'BR-31', title: 'Cancellation', desc: 'Bookings can be cancelled up to 1 hour before start time' },
                { code: 'BR-32', title: 'Auto-Release', desc: 'Unredeemed bookings are automatically released after hold period' },
              ].map((r, i) => (
                <div key={i} className="rule-card">
                  <div className="rule-card-title"><span className="rule-code">{r.code}</span>{r.title}</div>
                  <p>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

       {/* Modals removed - Managers cannot create passes/bookings */}
    </div>
  );
}
