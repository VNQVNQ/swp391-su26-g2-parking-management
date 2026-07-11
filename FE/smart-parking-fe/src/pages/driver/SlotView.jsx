import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DriverSlotView() {
  const [zones,      setZones]      = useState([]);
  const [slots,      setSlots]      = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    api.get('/api/v1/zones').then(res => {
      const data = res.data.data ?? res.data ?? [];
      setZones(data);
      if (data.length > 0) setActiveZone(data[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeZone) return;
    setLoading(true);
    api.get(`/api/v1/parking-slots/zone/${activeZone.id}`).then(res => {
      setSlots(res.data.data ?? res.data ?? []);
    }).catch(() => setSlots([])).finally(() => setLoading(false));
  }, [activeZone]);

  const total     = slots.length;
  const occupied  = slots.filter(s => s.currentSessionId).length;
  const available = total - occupied;
  const pct       = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

  const floorMap = zones.reduce((acc, z) => {
    const key = z.floorName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(z);
    return acc;
  }, {});

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🅿️ Xem slot</h2>
        <p>Tình trạng chỗ đỗ xe hiện tại</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng slot',      value: total,     color: 'var(--text-primary)'   },
          { label: 'Đang đỗ',        value: occupied,  color: '#ef4444'               },
          { label: 'Còn trống',      value: available, color: 'var(--accent-primary)'  },
          { label: 'Tỉ lệ lấp đầy', value: `${pct}%`, color: '#f59e0b'               },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>
        {/* Zone sidebar */}
        <div className="card" style={{ padding: 0, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Khu vực</span>
          </div>
          {Object.entries(floorMap).map(([floor, floorZones]) => (
            <div key={floor}>
              <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {floor}
              </div>
              {floorZones.map(zone => (
                <button key={zone.id} onClick={() => setActiveZone(zone)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 24px',
                    background: activeZone?.id === zone.id ? 'var(--accent-primary-glow)' : 'transparent',
                    border: 'none', borderLeft: activeZone?.id === zone.id ? '4px solid var(--accent-primary)' : '4px solid transparent',
                    borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <p style={{ fontWeight: 700, color: activeZone?.id === zone.id ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {VEHICLE_ICON[zone.vehicleType]} {zone.name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {zone.vehicleType} · {zone.totalSlots} slots
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Slot grid */}
        <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {activeZone && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div className="card-title" style={{ marginBottom: 4 }}>
                    {VEHICLE_ICON[activeZone.vehicleType]} {activeZone.name}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {activeZone.floorName} · {available}/{total} trống
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ label: 'Trống', color: 'var(--accent-primary)' }, { label: 'Đang đỗ', color: '#ef4444' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Đang tải...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                  {slots.map(slot => {
                    const isOccupied = !!slot.currentSessionId;
                    return (
                      <div key={slot.id} title={`${slot.slotCode} — ${isOccupied ? 'Đang đỗ' : 'Trống'}`}
                        style={{
                          background: isOccupied ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          border: `1.5px solid ${isOccupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          borderRadius: 16, padding: '10px 4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: 64, transition: 'all 0.2s', cursor: 'default'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isOccupied ? '#ef4444' : 'var(--accent-primary)' }}>
                          {slot.slotCode.split('-')[1] || slot.slotCode}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
