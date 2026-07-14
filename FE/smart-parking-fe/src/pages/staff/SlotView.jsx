import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const VEHICLE_ICON = { MOTORBIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function SlotView() {
  const [zones,        setZones]        = useState([]);
  const [slots,        setSlots]        = useState([]);
  const [activeZone,   setActiveZone]   = useState(null);
  const [bookedCount,  setBookedCount]  = useState(0);   // số slot đang bị đặt trước trong zone
  const [bookedSlots,  setBookedSlots]  = useState([]);  // mảng chứa ID các slot được đặt trước
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [hoveredSlot,  setHoveredSlot]  = useState(null);

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

  // ── Load slots + booking count khi đổi zone ────────────────────────────────
  const loadSlots = useCallback(async (zone) => {
    if (!zone) return;
    setLoading(true);
    try {
      const [slotsRes, bookingRes, bookedSlotsRes] = await Promise.all([
        api.get(`/api/v1/parking-slots/zone/${zone.id}`),
        api.get(`/api/v1/bookings/zone/${zone.id}/booked-count`).catch(() => ({ data: { data: 0 } })),
        api.get(`/api/v1/bookings/zone/${zone.id}/booked-slots`).catch(() => ({ data: { data: [] } })),
      ]);
      const data = slotsRes.data.data ?? slotsRes.data ?? [];
      setSlots(data);
      const bc = bookingRes.data?.data ?? bookingRes.data ?? 0;
      setBookedCount(typeof bc === 'number' ? bc : 0);
      const bs = bookedSlotsRes.data?.data ?? bookedSlotsRes.data ?? [];
      setBookedSlots(Array.isArray(bs) ? bs : []);
    } catch {
      setSlots([]);
      setBookedCount(0);
      setBookedSlots([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSlots(activeZone); }, [activeZone, loadSlots]);

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

      {/* Stats — 5 cards: thêm "Đã đặt trước" */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Tổng slot',      value: total,        color: 'var(--text-primary)'   },
          { label: 'Đang đỗ',        value: occupied,     color: '#ef4444'               },
          { label: 'Còn trống',      value: available,    color: 'var(--accent-primary)' },
          { label: 'Đã đặt trước',   value: bookedCount,  color: '#8b5cf6'               },
          { label: 'Bảo trì',        value: maintenance,  color: '#f59e0b'               },
        ].map(s => (
          <div key={s.label} className="stat-card" style={s.label === 'Đã đặt trước' ? { border: '1.5px solid rgba(139,92,246,0.25)' } : {}}>
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
                {floorZones.map(zone => {
                  const isActive = activeZone?.id === zone.id;
                  // Nếu là zone đang active thì tính từ slots thực tế
                  const zoneTotal       = isActive ? total       : (zone.totalSlots ?? 0);
                  const zoneAvailable   = isActive ? available   : null;
                  const zoneOccupied    = isActive ? occupied    : null;
                  const zoneMaintenance = isActive ? maintenance : null;
                  return (
                    <button key={zone.id} onClick={() => setActiveZone(zone)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                        border: 'none',
                        borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                      <p style={{ fontWeight: 600, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {VEHICLE_ICON[zone.vehicleType]} {zone.name}
                      </p>
                      {isActive ? (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{zoneAvailable} trống</span>
                          {' · '}
                          <span style={{ color: '#ef4444' }}>{zoneOccupied} đỗ</span>
                          {' · '}
                          <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{bookedCount} đặt</span>
                          {zoneMaintenance > 0 && (
                            <span style={{ color: '#f59e0b' }}> · {zoneMaintenance} BT</span>
                          )}
                          {' / '}{zoneTotal}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {zone.vehicleType} · {zoneTotal} slots
                        </p>
                      )}
                    </button>
                  );
                })}
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
                    {bookedCount > 0 && (
                      <span style={{ marginLeft: 8, color: '#8b5cf6', fontWeight: 600 }}>
                        · {bookedCount} chỗ đặt trước
                      </span>
                    )}
                  </p>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Trống',        color: 'var(--accent-primary)' },
                    { label: 'Đang đỗ',      color: '#ef4444'               },
                    { label: 'Đặt trước',    color: '#8b5cf6'               },
                    { label: 'Bảo trì',      color: '#f59e0b'               },
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
                      const isOccupied    = slot.currentSessionId !== null && slot.currentSessionId !== undefined;
                      const isMaintenance = slot.maintenanceStatus === 'MAINTENANCE';
                      const isBooked      = !isOccupied && !isMaintenance && bookedSlots.includes(slot.id);
                      const isHovered     = hoveredSlot === slot.id;

                      const slotColor = isOccupied
                        ? '#ef4444'
                        : isMaintenance
                          ? '#f59e0b'
                          : isBooked
                            ? '#8b5cf6'
                            : 'var(--accent-primary)';

                      const bgOpacity = isHovered ? 0.18 : 0.08;
                      const slotBg = isOccupied
                        ? `rgba(239,68,68,${bgOpacity})`
                        : isMaintenance
                          ? `rgba(245,158,11,${bgOpacity})`
                          : isBooked
                            ? `rgba(139,92,246,${bgOpacity})`
                            : `rgba(16,185,129,${bgOpacity})`;

                      const borderColor = isHovered ? slotColor : (
                        isOccupied ? 'rgba(239,68,68,0.3)' :
                        isMaintenance ? 'rgba(245,158,11,0.3)' :
                        isBooked ? 'rgba(139,92,246,0.3)' :
                        'rgba(16,185,129,0.3)'
                      );

                      return (
                        <div key={slot.id}
                          onMouseEnter={() => setHoveredSlot(slot.id)}
                          onMouseLeave={() => setHoveredSlot(null)}
                          style={{
                            position: 'relative',
                            background: slotBg,
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 6px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: (isOccupied || isBooked) ? 82 : 60,
                            cursor: (isOccupied || isBooked) ? 'pointer' : isMaintenance ? 'not-allowed' : 'default',
                            transition: 'all 0.15s',
                          }}>
                          {/* Slot code */}
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: slotColor }}>
                            {slot.slotCode.split('-').slice(-1)[0] || slot.slotCode}
                          </span>

                          {/* Xe đang đỗ */}
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
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {slot.licensePlate || '—'}
                              </span>
                            </>
                          )}

                          {/* Đặt trước indicator */}
                          {isBooked && (
                            <>
                              <span style={{ fontSize: '0.9rem', marginTop: 2 }}>📅</span>
                              <span style={{ fontSize: '0.56rem', fontWeight: 700, color: '#8b5cf6', marginTop: 2 }}>
                                Đặt trước
                              </span>
                            </>
                          )}

                          {/* Tooltip occupied */}
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
                                Loại: {slot.occupyingVehicleType === 'MOTORBIKE' ? 'Xe máy' : slot.occupyingVehicleType === 'CAR' ? 'Ô tô' : slot.occupyingVehicleType === 'TRUCK' ? 'Xe tải' : '—'}
                              </p>
                            </div>
                          )}

                          {/* Tooltip booked */}
                          {isBooked && isHovered && (
                            <div style={{
                              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)', padding: '8px 12px', zIndex: 200,
                              boxShadow: '0 6px 24px rgba(0,0,0,0.35)', minWidth: 130, pointerEvents: 'none',
                            }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>Đã đặt trước</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Slot: {slot.slotCode}</p>
                            </div>
                          )}

                          {/* Tooltip maintenance */}
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

                  {/* Progress bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Occupied rate */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tỉ lệ đỗ xe</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>
                          {total > 0 ? Math.round((occupied / total) * 100) : 0}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: '#ef4444', width: `${total > 0 ? Math.round((occupied / total) * 100) : 0}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* Booked rate */}
                    {bookedCount > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tỉ lệ đặt trước (24h tới)</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6' }}>
                            {total > 0 ? Math.round((bookedCount / total) * 100) : 0}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: '#8b5cf6', width: `${total > 0 ? Math.round((bookedCount / total) * 100) : 0}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    )}
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
