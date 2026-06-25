import { CalendarCheck, CreditCard, Car, Bike, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useParkingStore } from '../../store/parkingStore';

export default function DriverPassesBookings() {
  const store = useParkingStore();
  const [tab, setTab] = useState('passes');
  const [showPassModal, setShowPassModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [passForm, setPassForm] = useState({ plate: '', type: 'Car', owner: '', phone: '' });
  const [bookForm, setBookForm] = useState({ plate: '', type: 'Car', date: '', startTime: '', duration: '1' });

  const handleAddPass = () => {
    if (!passForm.plate || !passForm.owner) {
      store.showToast('Please fill required fields');
      return;
    }
    store.addPass(passForm);
    setShowPassModal(false);
    setPassForm({ plate: '', type: 'Car', owner: '', phone: '' });
  };

  const handleAddBooking = () => {
    if (!bookForm.plate || !bookForm.date || !bookForm.startTime) {
      store.showToast('Please fill required fields');
      return;
    }
    store.addBooking(bookForm);
    setShowBookModal(false);
    setBookForm({ plate: '', type: 'Car', date: '', startTime: '', duration: '1' });
  };

  const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div className="page-full-width">
      <div className="page-header">
        <h2>My Passes & Bookings</h2>
        <p>Register monthly passes and book parking slots in advance</p>
      </div>

      {/* Tab Nav */}
      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'passes' ? 'active' : ''}`} onClick={() => setTab('passes')}>My Monthly Passes</button>
        <button className={`tab-btn ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>My Advance Bookings</button>
      </div>

      {/* Monthly Passes Tab */}
      {tab === 'passes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Registered Passes</h3>
            <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowPassModal(true)}>
              <Plus size={16} /> Register Monthly Pass
            </button>
          </div>
          <div className="card" style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Vehicle Type</th>
                  <th>Owner</th>
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

      {/* Advance Bookings Tab */}
      {tab === 'bookings' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>My Bookings</h3>
            <button className="btn-sm btn-sm-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowBookModal(true)}>
              <Plus size={16} /> New Booking
            </button>
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
        </>
      )}

      {/* Register Pass Modal */}
      {showPassModal && (
        <div className="modal-overlay" onClick={() => setShowPassModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Monthly Pass</h3>
              <button className="modal-close-btn" onClick={() => setShowPassModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">License Plate <span className="required">*</span></label>
              <input style={inputSt} value={passForm.plate} onChange={e => setPassForm(p => ({ ...p, plate: e.target.value }))} placeholder="e.g. 51A-123.45" />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select style={inputSt} value={passForm.type} onChange={e => setPassForm(p => ({ ...p, type: e.target.value }))}>
                <option>Car</option>
                <option>Motorbike</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name <span className="required">*</span></label>
              <input style={inputSt} value={passForm.owner} onChange={e => setPassForm(p => ({ ...p, owner: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input style={inputSt} value={passForm.phone} onChange={e => setPassForm(p => ({ ...p, phone: e.target.value }))} placeholder="0901234567" />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPassModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddPass}>
                <span>Register</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Booking</h3>
              <button className="modal-close-btn" onClick={() => setShowBookModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">License Plate <span className="required">*</span></label>
              <input style={inputSt} value={bookForm.plate} onChange={e => setBookForm(p => ({ ...p, plate: e.target.value }))} placeholder="e.g. 51A-123.45" />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select style={inputSt} value={bookForm.type} onChange={e => setBookForm(p => ({ ...p, type: e.target.value }))}>
                <option>Car</option>
                <option>Motorbike</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input style={inputSt} type="date" value={bookForm.date} onChange={e => setBookForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Start Time <span className="required">*</span></label>
                <input style={inputSt} type="time" value={bookForm.startTime} onChange={e => setBookForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours)</label>
                <select style={inputSt} value={bookForm.duration} onChange={e => setBookForm(p => ({ ...p, duration: e.target.value }))}>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddBooking}>
                <span>Book</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
