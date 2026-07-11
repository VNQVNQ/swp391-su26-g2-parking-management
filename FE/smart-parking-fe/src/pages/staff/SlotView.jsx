import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function SlotView() {
  const [zones,       setZones]       = useState([]);
  const [slots,       setSlots]       = useState([]);
  const [activeZone,  setActiveZone]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [hoveredSlot, setHoveredSlot] = useState(null);

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
  const loadSlots = useCallback(async (zone) => {
    if (!zone) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/parking-slots/zone/${zone.id}`);
      const data = res.data.data ?? res.data ?? [];
      setSlots(data);
    } catch {
      setSlots([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSlots(activeZone); }, [activeZone, loadSlots]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  // ── Stats ──────────────────────────────────────────────────────────────────
  const total       = slots.length || activeZone?.totalSlots || 0;
  const maintenance = slots.filter(s => s.maintenanceStatus === 'MAINTENANCE').length;
  const occupied    = slots.filter(s => s.currentSessionId !== null && s.currentSessionId !== undefined).length;
  const available   = Math.max(0, total - occupied - maintenance);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🅿️ Slot View</h2>
            <p>Tình trạng chỗ đỗ xe theo khu vực</p>
          </div>
          <button onClick={() => loadSlots(activeZone)}
            style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng slot',      value: total,       color: 'var(--text-primary)'   },
          { label: 'Đang đỗ',        value: occupied,    color: '#ef4444'               },
          { label: 'Còn trống',      value: available,   color: 'var(--accent-primary)' },
          { label: 'Bảo trì',        value: maintenance, color: '#f59e0b'               },
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
                      border: 'none',
                      borderLeft: activeZone?.id === zone.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
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
                    { label: 'Trống',      color: 'var(--accent-primary)' },
                    { label: 'Đang đỗ',    color: '#ef4444'               },
                    { label: 'Bảo trì',    color: '#f59e0b'               },
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                    {slots.map(slot => {
                      const isOccupied = slot.currentSessionId !== null && slot.currentSessionId !== undefined;
                      const isMaintenance = slot.maintenanceStatus === 'MAINTENANCE';
                      const isHovered  = hoveredSlot === slot.id;
                      return (
                        <div key={slot.id}
                          onMouseEnter={() => setHoveredSlot(slot.id)}
                          onMouseLeave={() => setHoveredSlot(null)}
                          style={{
                            position: 'relative',
                            background: isOccupied
                              ? (isHovered ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)')
                              : isMaintenance 
                                ? (isHovered ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.08)')
                                : (isHovered ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.08)'),
                            border: `1.5px solid ${isOccupied
                              ? (isHovered ? '#ef4444' : 'rgba(239,68,68,0.3)')
                              : isMaintenance
                                ? (isHovered ? '#f59e0b' : 'rgba(245,158,11,0.3)')
                                : (isHovered ? 'var(--accent-primary)' : 'rgba(16,185,129,0.3)')}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 6px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: isOccupied ? 82 : 60,
                            cursor: isOccupied ? 'pointer' : isMaintenance ? 'not-allowed' : 'default',
                            transition: 'all 0.15s',
                          }}>
                          {/* Slot code */}
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isOccupied ? '#ef4444' : isMaintenance ? '#f59e0b' : 'var(--accent-primary)' }}>
                            {slot.slotCode.split('-').slice(-1)[0] || slot.slotCode}
                          </span>

                          {/* Vehicle info nếu đang đỗ */}
                          {isOccupied && (
                            <>
                              <span style={{ fontSize: '1rem', marginTop: 2 }}>
                                {VEHICLE_ICON[slot.occupyingVehicleType] || '🚗'}
                              </span>
                              <span style={{
                                fontSize: '0.56rem', fontFamily: 'monospace', fontWeight: 700,
                                color: 'var(--text-primary)', marginTop: 2,
                                background: 'var(--bg-primary)', borderRadius: 3,
                                padding: '1px 4px', maxWidth: '98%', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
                              }}>
                                {slot.licensePlate || '—'}
                              </span>
                            </>
                          )}

                          {/* Tooltip khi hover vào slot đang đỗ hoặc bảo trì */}
                          {isOccupied && isHovered && (
                            <div style={{
                              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)', padding: '8px 12px', zIndex: 200,
                              boxShadow: '0 6px 24px rgba(0,0,0,0.35)', minWidth: 150, pointerEvents: 'none',
                            }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {VEHICLE_ICON[slot.occupyingVehicleType]} {slot.licensePlate || '—'}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Slot: {slot.slotCode}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Loại xe: {slot.occupyingVehicleType === 'MOTORBIKE' ? 'Xe máy' : slot.occupyingVehicleType === 'CAR' ? 'Ô tô' : slot.occupyingVehicleType === 'TRUCK' ? 'Xe tải' : '—'}
                              </p>
                            </div>
                          )}
                          {isMaintenance && isHovered && (
                            <div style={{
                              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)', padding: '8px 12px', zIndex: 200,
                              boxShadow: '0 6px 24px rgba(0,0,0,0.35)', minWidth: 120, pointerEvents: 'none',
                            }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Đang bảo trì</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Slot: {slot.slotCode}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar info - optional now since we removed the card, but let's keep the bar for visual filling */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tỉ lệ đỗ xe</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>
                        {total > 0 ? Math.round((occupied / total) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#ef4444', width: `${total > 0 ? Math.round((occupied / total) * 100) : 0}%`, transition: 'width 0.5s ease' }} />
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
