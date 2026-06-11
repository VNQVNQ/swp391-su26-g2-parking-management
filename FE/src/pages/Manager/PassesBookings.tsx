import { useState } from 'react';
import { useParkingStore } from '../../store/parkingStore';

export default function PassesBookings() {
  const store = useParkingStore() as any;
  const [tab,           setTab]           = useState<'passes'|'bookings'>('passes');
  const [showPassModal, setShowPassModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [passForm,      setPassForm]      = useState({ plate: '', type: 'Car', owner: '', phone: '' });
  const [bookForm,      setBookForm]      = useState({ plate: '', type: 'Car', date: '', startTime: '', duration: '1' });

  const stats = [
    { label: 'Active Passes',     value: store.passes.filter((p: any) => p.status === 'Active').length,   color: 'text-[#00c853]',  bg: 'bg-[#00c853]/5 border-[#00c853]/20'   },
    { label: 'Pending Bookings',  value: store.bookings.filter((b: any) => b.status === 'Pending').length, color: 'text-amber-400',  bg: 'bg-amber-950/40 border-amber-900/50'  },
    { label: 'Car Passes',        value: store.passes.filter((p: any) => p.type === 'Car').length,         color: 'text-blue-400',   bg: 'bg-blue-950/40 border-blue-900/50'    },
    { label: 'Motorbike Passes',  value: store.passes.filter((p: any) => p.type === 'Motorbike').length,   color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-900/50'},
  ];

  const PASS_STATUS: Record<string,string> = {
    Active:  'bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30',
    Expired: 'bg-gray-800 text-gray-500 border-gray-700',
  };
  const BOOK_STATUS: Record<string,string> = {
    Confirmed: 'bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30',
    Pending:   'bg-amber-950/60 text-amber-400 border-amber-800/50',
    Cancelled: 'bg-gray-800 text-gray-500 border-gray-700',
  };

  const handleAddPass = () => {
    if (!passForm.plate || !passForm.owner) { alert('Please fill required fields'); return; }
    store.addPass(passForm);
    setShowPassModal(false);
    setPassForm({ plate: '', type: 'Car', owner: '', phone: '' });
  };

  const handleAddBooking = () => {
    if (!bookForm.plate || !bookForm.date || !bookForm.startTime) { alert('Please fill required fields'); return; }
    store.addBooking(bookForm);
    setShowBookModal(false);
    setBookForm({ plate: '', type: 'Car', date: '', startTime: '', duration: '1' });
  };

  const inputCls = "w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition";

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📋 Monthly Passes & Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage monthly passes and advance bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-5">
        {(['passes','bookings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition ${
              tab === t
                ? 'bg-[#00c853]/10 border-[#00c853]/30 text-[#00c853]'
                : 'bg-[#0d1117] border-[#1e2a1e] text-gray-500 hover:text-gray-300'
            }`}>
            {t === 'passes' ? 'Monthly Passes' : 'Advance Bookings'}
          </button>
        ))}
      </div>

      {/* ── PASSES TAB ── */}
      {tab === 'passes' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Monthly Pass List</h2>
            <button onClick={() => setShowPassModal(true)}
              className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5">
              ➕ Register Monthly Pass
            </button>
          </div>
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a1e]">
                  {['Plate','Type','Owner','Phone','Start','Expiry','Fee','Status'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.passes.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#1e2a1e]/50 hover:bg-[#0f1a0f] transition">
                    <td className="px-4 py-3 font-mono font-semibold text-white text-sm">{p.plate}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.type}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{p.owner}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.phone}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.start}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.expiry}</td>
                    <td className="px-4 py-3 text-[#00c853] text-xs font-semibold">₫{Number(p.fee).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PASS_STATUS[p.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {store.passes.length === 0 && (
              <div className="text-center py-12 text-gray-600"><p className="text-3xl mb-2">📋</p><p>No passes registered</p></div>
            )}
          </div>
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Advance Booking List</h2>
            <button onClick={() => setShowBookModal(true)}
              className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5">
              ➕ Create Booking
            </button>
          </div>
          <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a1e]">
                  {['Plate','Type','Slot','Start Time','End Time','Status',''].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-[#1e2a1e]/50 hover:bg-[#0f1a0f] transition">
                    <td className="px-4 py-3 font-mono font-semibold text-white text-sm">{b.plate}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.type}</td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{b.slot}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.startTime}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.endTime}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BOOK_STATUS[b.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => store.cancelBooking(b.id)}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 px-2.5 py-1 rounded-lg transition">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {store.bookings.length === 0 && (
              <div className="text-center py-12 text-gray-600"><p className="text-3xl mb-2">📅</p><p>No bookings found</p></div>
            )}
          </div>
        </>
      )}

      {/* ── Pass Modal ── */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPassModal(false)} />
          <div className="relative bg-[#0d1117] border border-[#1e2a1e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-white mb-5">➕ Register Monthly Pass</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-400 mb-1.5">License Plate <span className="text-red-400">*</span></label>
                <input value={passForm.plate} onChange={e => setPassForm({...passForm, plate: e.target.value.toUpperCase()})} placeholder="e.g. 51G-123.45" className={inputCls}/></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Vehicle Type</label>
                <select value={passForm.type} onChange={e => setPassForm({...passForm, type: e.target.value})} className={inputCls}>
                  <option>Car</option><option>Motorbike</option><option>Truck</option>
                </select></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Owner Name <span className="text-red-400">*</span></label>
                <input value={passForm.owner} onChange={e => setPassForm({...passForm, owner: e.target.value})} placeholder="Nguyen Van A" className={inputCls}/></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Phone</label>
                <input value={passForm.phone} onChange={e => setPassForm({...passForm, phone: e.target.value})} placeholder="09xxxxxxxx" className={inputCls}/></div>
            </div>
            <div className="bg-[#00c853]/5 border border-[#00c853]/20 rounded-xl p-3 mt-4 text-xs text-[#00c853]">
              Fee: {passForm.type === 'Car' ? '₫2,500,000' : passForm.type === 'Motorbike' ? '₫500,000' : '₫4,000,000'} / 6 months
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPassModal(false)} className="flex-1 border border-[#1e2a1e] text-gray-400 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAddPass} className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-2.5 rounded-xl text-sm transition">Register</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Modal ── */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBookModal(false)} />
          <div className="relative bg-[#0d1117] border border-[#1e2a1e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-white mb-5">📅 Create Booking</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-400 mb-1.5">License Plate <span className="text-red-400">*</span></label>
                <input value={bookForm.plate} onChange={e => setBookForm({...bookForm, plate: e.target.value.toUpperCase()})} placeholder="e.g. 51G-123.45" className={inputCls}/></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Vehicle Type</label>
                <select value={bookForm.type} onChange={e => setBookForm({...bookForm, type: e.target.value})} className={inputCls}>
                  <option>Car</option><option>Motorbike</option><option>Truck</option>
                </select></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Date <span className="text-red-400">*</span></label>
                <input type="date" value={bookForm.date} onChange={e => setBookForm({...bookForm, date: e.target.value})} className={`${inputCls} [color-scheme:dark]`}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Start Time <span className="text-red-400">*</span></label>
                  <input type="time" value={bookForm.startTime} onChange={e => setBookForm({...bookForm, startTime: e.target.value})} className={`${inputCls} [color-scheme:dark]`}/></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Duration (hrs)</label>
                  <input type="number" min="1" max="24" value={bookForm.duration} onChange={e => setBookForm({...bookForm, duration: e.target.value})} className={inputCls}/></div>
              </div>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3 mt-4 text-xs text-amber-400">
              ⚠️ Slot is held for 30 minutes after start time (BR-05)
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowBookModal(false)} className="flex-1 border border-[#1e2a1e] text-gray-400 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAddBooking} className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-2.5 rounded-xl text-sm transition">Create Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
