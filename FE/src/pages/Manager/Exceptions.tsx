import { useState } from 'react';
import { useParkingStore } from '../../store/parkingStore';

export default function Exceptions() {
  const store = useParkingStore() as any;
  const [showCreate,  setShowCreate]  = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [selected,    setSelected]    = useState<any>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [search,      setSearch]      = useState('');
  const [form,        setForm]        = useState({ type: 'Lost Ticket', desc: '', surcharge: '', plate: '' });

  const filtered = store.exceptions.filter((e: any) =>
    e.plate?.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase()) ||
    e.id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Pending',            value: store.exceptions.filter((e: any) => e.status === 'Pending').length,  color: 'text-amber-400',  bg: 'bg-amber-950/40 border-amber-900/50'  },
    { label: 'Resolved',           value: store.exceptions.filter((e: any) => e.status === 'Resolved').length, color: 'text-[#00c853]',  bg: 'bg-[#00c853]/5 border-[#00c853]/20'   },
    { label: 'Lost Tickets',       value: store.exceptions.filter((e: any) => e.type === 'Lost Ticket').length, color: 'text-red-400',    bg: 'bg-red-950/40 border-red-900/50'      },
    { label: 'Surcharge Collected',value: `₫${store.exceptions.filter((e: any) => e.status === 'Resolved').reduce((a: number, c: any) => a + (Number(c.surcharge) || 0), 0).toLocaleString('vi-VN')}`, color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-900/50' },
  ];

  const STATUS_STYLE: Record<string, string> = {
    Pending:  'bg-amber-950/60 text-amber-400 border-amber-800/50',
    Resolved: 'bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30',
    Rejected: 'bg-red-950/60 text-red-400 border-red-800/50',
  };

  const handleCreate = () => {
    if (!form.desc) { alert('Please provide a description'); return; }
    store.addException({ type: form.type, desc: form.desc, surcharge: Number(form.surcharge) || 0, plate: form.plate || 'N/A' });
    setShowCreate(false);
    setForm({ type: 'Lost Ticket', desc: '', surcharge: '', plate: '' });
  };

  const handleResolve = () => {
    store.resolveException(selected.id, resolveNote);
    setShowResolve(false);
    setSelected(null);
    setResolveNote('');
  };

  return (
    <div className="min-h-screen bg-[#080d08] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚠️ Exception Handling</h1>
          <p className="text-sm text-gray-500 mt-1">Manage lost tickets, overstays, and wrong zone parking</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-[#00c853] hover:bg-[#00e060] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2">
          ➕ Create Exception
        </button>
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

      {/* Search */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl p-5 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by plate, type or ID..."
          className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 transition"/>
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] border border-[#1e2a1e] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2a1e]">
              {['ID', 'Type', 'Plate', 'Description', 'Surcharge', 'Created By', 'Time', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.id} className="border-b border-[#1e2a1e]/50 hover:bg-[#0f1a0f] transition">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{e.id}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-[#1e2a1e] text-gray-300 px-2 py-0.5 rounded">{e.type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-white text-xs">{e.plate}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{e.desc}</td>
                <td className="px-4 py-3 text-xs">
                  {e.surcharge > 0 ? <span className="text-amber-400">₫{Number(e.surcharge).toLocaleString('vi-VN')}</span> : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{e.createdBy}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{e.time}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[e.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.status === 'Pending' && (
                    <button onClick={() => { setSelected(e); setResolveNote(''); setShowResolve(true); }}
                      className="text-xs bg-[#00c853]/10 hover:bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/20 px-2.5 py-1 rounded-lg transition">
                      ✓ Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-3xl mb-2">⚠️</p>
            <p>No exceptions found</p>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#0d1117] border border-[#1e2a1e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-white mb-5">➕ Create Exception</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Exception Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c853]/50">
                  {['Lost Ticket', 'Overstay', 'Wrong Zone', 'Unpaid Exit'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">License Plate</label>
                <input value={form.plate} onChange={e => setForm({...form, plate: e.target.value.toUpperCase()})}
                  placeholder="e.g. 51G-123.45"
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-gray-600 outline-none focus:border-[#00c853]/50"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description <span className="text-red-400">*</span></label>
                <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}
                  placeholder="Describe the exception..."
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 resize-none h-20"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Surcharge (₫)</label>
                <input type="number" value={form.surcharge} onChange={e => setForm({...form, surcharge: e.target.value})}
                  placeholder="0"
                  className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 border border-[#1e2a1e] hover:border-gray-600 text-gray-400 py-2.5 rounded-xl text-sm transition">Cancel</button>
              <button onClick={handleCreate}
                className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-2.5 rounded-xl text-sm transition">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {showResolve && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResolve(false)} />
          <div className="relative bg-[#0d1117] border border-[#1e2a1e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-white mb-2">✓ Resolve Exception</h3>
            <p className="text-xs text-gray-500 mb-4">{selected.id} · {selected.plate} · {selected.type}</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Resolution Notes</label>
              <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                placeholder="Describe how the exception was resolved..."
                className="w-full bg-[#080d08] border border-[#1e2a1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c853]/50 resize-none h-24"/>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowResolve(false)}
                className="flex-1 border border-[#1e2a1e] text-gray-400 py-2.5 rounded-xl text-sm transition">Cancel</button>
              <button onClick={handleResolve}
                className="flex-1 bg-[#00c853] hover:bg-[#00e060] text-black font-semibold py-2.5 rounded-xl text-sm transition">Mark Resolved</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
