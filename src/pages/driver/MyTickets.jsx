import { useState } from 'react';
import { BookOpen } from 'lucide-react';

const MOCK_TICKETS = [
  { id: 'T001', licensePlate: '51G-123.45', vehicleType: 'MOTORBIKE', ticketType: 'MONTHLY', startDate: '2026-06-01', endDate: '2026-06-30', status: 'Active',  fee: 500_000  },
  { id: 'T002', licensePlate: '51F-987.65', vehicleType: 'CAR',       ticketType: 'DAILY',   startDate: '2026-06-08', endDate: '2026-06-08', status: 'Expired', fee: 120_000  },
];

const STATUS_BADGE = {
  Active:  'badge badge-success',
  Expired: 'badge badge-neutral',
  Pending: 'badge badge-warning',
};

export default function MyTickets() {
  const [filter, setFilter] = useState('ALL');

  const filtered = MOCK_TICKETS.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>📋 Vé của tôi</h2>
        <p>Danh sách vé đỗ xe đã đăng ký</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL','Active','Expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid',
            borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-color)',
            background: filter === f ? 'var(--accent-primary-glow)' : 'var(--bg-secondary)',
            color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {f === 'ALL' ? 'Tất cả' : f === 'Active' ? 'Đang dùng' : 'Hết hạn'}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(ticket => (
          <div key={ticket.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{ticket.licensePlate}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>{ticket.vehicleType} · {ticket.ticketType}</p>
              </div>
              <span className={STATUS_BADGE[ticket.status] || 'badge badge-neutral'}>{ticket.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Mã vé',    value: ticket.id },
                { label: 'Phí',      value: `₫${ticket.fee.toLocaleString('vi-VN')}` },
                { label: 'Từ ngày', value: ticket.startDate },
                { label: 'Đến ngày',value: ticket.endDate },
              ].map(r => (
                <div key={r.label} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.label}</p>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <p style={{ color: 'var(--text-secondary)' }}>Không có vé nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
