import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SlotView() {
  const [zones,       setZones]       = useState([]);
  const [slots,       setSlots]       = useState([]);
  const [activeZone,  setActiveZone]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── Load zones khi mount ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/v1/zones');
        const data = res.data.data ?? res.data ?? [];
        setZones(data);
        if (data.length > 0) {
          setActiveZone(data[0]);
        }
      } catch (err) {
        setError('Không thể tải dữ liệu zones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Load slots khi đổi zone ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeZone) return;
    const loadSlots = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/parking-slots/zone/${activeZone.id}`);
        const data = res.data.data ?? res.data ?? [];
        setSlots(data);
      } catch {
        setSlots([]);
      } finally { setLoading(false); }
    };
    loadSlots();
  }, [activeZone]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total     = slots.length;
  const occupied  = slots.filter(s => s.currentSessionId !== null && s.currentSessionId !== undefined).length;
  const available = total - occupied;
  const pct       = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

  // ── Group zones by floor ───────────────────────────────────────────────────
  const floorMap = zones.reduce((acc, z) => {
    const key = z.floorName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(z);
    return acc;
  }, {});

  return (
    <div className="page-full">
      <div className="page-header">
        <h2>🅿️ Slot View</h2>
        <p>Tình trạng chỗ đỗ xe theo khu vực</p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng slot',    value: total,     color: 'var(--text-primary)'  },
          { label: 'Đang đỗ',     value: occupied,  color: '#ef4444'              },
          { label: 'Còn trống',   value: available, color: 'var(--accent-primary)' },
          { label: 'Tỉ lệ lấp đầy', value: `${pct}%`, color: '#f59e0b'           },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{s.label}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>

        {/* ── Zone sidebar ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Khu vực</span>
          </div>
          {loading && zones.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: 16, fontSize: '0.85rem' }}>Đang tải...</p>
          ) : (
            Object.entries(floorMap).map(([floor, floorZones]) => (
              <div key={floor}>
                <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {floor}
                </div>
                {floorZones.map(zone => (
                  <button key={zone.id} onClick={() => setActiveZone(zone)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 16px',
                      background: activeZone?.id === zone.id ? 'var(--accent-primary-glow)' : 'transparent',
                      border: 'none', borderLeft: activeZone?.id === zone.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    <p style={{ fontWeight: 600, color: activeZone?.id === zone.id ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {VEHICLE_ICON[zone.vehicleType]} {zone.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {zone.vehicleType} · {zone.totalSlots} slots
                    </p>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Slot grid ── */}
        <div className="card">
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
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Trống',    color: 'var(--accent-primary)' },
                    { label: 'Đang đỗ', color: '#ef4444'               },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Đang tải slots...</p>
              ) : slots.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Không có slot nào</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 20 }}>
                    {slots.map(slot => {
                      const isOccupied = slot.currentSessionId !== null && slot.currentSessionId !== undefined;
                      return (
                        <div key={slot.id} title={`${slot.slotCode} — ${isOccupied ? 'Đang đỗ' : 'Trống'}`}
                          style={{
                            background: isOccupied ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            border: `1.5px solid ${isOccupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 4px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: 60, cursor: 'default',
                          }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isOccupied ? '#ef4444' : 'var(--accent-primary)' }}>
                            {slot.slotCode.split('-')[1] || slot.slotCode}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tỉ lệ lấp đầy</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent-gradient)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
