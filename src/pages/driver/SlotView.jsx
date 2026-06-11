import { useState } from 'react';
import { MapPin } from 'lucide-react';

const FLOORS = [
  { id: 'b1', name: 'Basement 1', total: 20, free: 8,  type: 'CAR'       },
  { id: 'b2', name: 'Basement 2', total: 20, free: 12, type: 'CAR'       },
  { id: 'f1', name: 'Floor 1',    total: 16, free: 5,  type: 'MOTORBIKE' },
  { id: 'f2', name: 'Floor 2',    total: 16, free: 9,  type: 'MOTORBIKE' },
];

const STATUS_STYLE = {
  FREE:        { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)', color: '#10b981', label: 'Trống'    },
  OCCUPIED:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',  color: '#ef4444', label: 'Đang đỗ' },
  RESERVED:    { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)', color: '#f59e0b', label: 'Đã đặt'  },
  MAINTENANCE: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)',color: '#94a3b8', label: 'Bảo trì' },
};

function makeSlots(total, free) {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    status: i < total - free ? 'OCCUPIED' : 'FREE',
  }));
}

export default function DriverSlotView() {
  const [activeFloor, setActiveFloor] = useState('b1');
  const floor = FLOORS.find(f => f.id === activeFloor);
  const slots = makeSlots(floor.total, floor.free);

  const stats = Object.entries(STATUS_STYLE).map(([key, cfg]) => ({
    status: key, label: cfg.label, color: cfg.color,
    count: slots.filter(s => s.status === key).length,
  }));

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🅿️ Xem slot</h2>
        <p>Tình trạng chỗ đỗ xe hiện tại</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.status} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{s.label}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Floor tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FLOORS.map(f => (
          <button key={f.id} onClick={() => setActiveFloor(f.id)} style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid',
            borderColor: activeFloor === f.id ? 'var(--accent-primary)' : 'var(--border-color)',
            background: activeFloor === f.id ? 'var(--accent-primary-glow)' : 'var(--bg-secondary)',
            color: activeFloor === f.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {f.name}
          </button>
        ))}
      </div>

      {/* Slot grid */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              <MapPin size={18} /> {floor.name}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{floor.type} · {floor.free}/{floor.total} trống</p>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16 }}>
            {['FREE','OCCUPIED','RESERVED'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_STYLE[s].color }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{STATUS_STYLE[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 10, marginBottom: 20 }}>
          {slots.map(slot => {
            const cfg = STATUS_STYLE[slot.status];
            return (
              <div key={slot.id} style={{
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 6px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                height: 64, cursor: 'default',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color }}>
                  {String(slot.id).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tỉ lệ lấp đầy</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {Math.round(((floor.total - floor.free) / floor.total) * 100)}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--accent-gradient)',
              width: `${((floor.total - floor.free) / floor.total) * 100}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
