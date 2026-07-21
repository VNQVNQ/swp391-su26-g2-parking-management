import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Building2, Layers, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Maximize, ChevronRight } from 'lucide-react';
import '../../hung_style.css'; 

export default function BuildingOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  
  // Zoom state
  const [scale, setScale] = useState(1);

  const fetchData = async () => {
    try {
      const [floorsRes, zonesRes, slotsRes, sessionsRes] = await Promise.all([
        api.get('/api/v1/floors').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/zones').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/parking-slots').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/parking-sessions/active/all').catch(() => ({ data: { data: [] } }))
      ]);
      setFloors(floorsRes.data?.data || floorsRes.data || []);
      setZones(zonesRes.data?.data || zonesRes.data || []);
      setSlots(slotsRes.data?.data || slotsRes.data || []);
      setActiveSessions(sessionsRes.data?.data || sessionsRes.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu tổng quan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sort floors (e.g. Tầng 3, Tầng 2, Tầng 1, B1, B2)
  const sortedFloors = useMemo(() => {
    return [...floors].sort((a, b) => {
      if (a.levelNumber !== undefined && b.levelNumber !== undefined) {
        return a.levelNumber - b.levelNumber;
      }
      const nameA = a.name || a.floorName || '';
      const nameB = b.name || b.floorName || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }, [floors]);

  const aboveGroundFloors = useMemo(() => {
    return sortedFloors.filter(f => {
      if (f.levelNumber !== undefined) return f.levelNumber >= 0;
      const name = (f.name || f.floorName || '').toLowerCase();
      return !name.includes('hầm') && !name.match(/\bb\d/);
    }).reverse();
  }, [sortedFloors]);

  const belowGroundFloors = useMemo(() => {
    return sortedFloors.filter(f => {
      if (f.levelNumber !== undefined) return f.levelNumber < 0;
      const name = (f.name || f.floorName || '').toLowerCase();
      return name.includes('hầm') || name.match(/\bb\d/);
    }).reverse(); // -1, -2 so B1 is just below ground
  }, [sortedFloors]);

  const { floorStats, totalSlots, totalOccupied } = useMemo(() => {
    const stats = {};
    let tSlots = 0;
    let tOccupied = 0;
    const activeSlotIds = new Set(activeSessions.map(s => s.slotId || s.slot?.id).filter(Boolean));

    const zoneToFloor = {};
    const zoneMap = {};
    zones.forEach(z => {
      const fId = z.floor?.id || z.floorId;
      zoneToFloor[z.id] = fId;
      zoneMap[z.id] = { ...z, total: 0, occupied: 0 };
    });

    sortedFloors.forEach((f, idx) => {
      const fallbackName = `Tầng ${sortedFloors.length - idx}`;
      stats[f.id] = { 
        id: f.id,
        total: 0, 
        occupied: 0, 
        maintenance: 0, 
        available: 0, 
        name: f.name || f.floorName || fallbackName,
        zones: {} 
      };
    });

    slots.forEach(s => {
      const fId = s.zone?.floorId || zoneToFloor[s.zoneId] || s.floorId;
      if (!fId) return;
      if (!stats[fId]) {
        stats[fId] = { id: fId, total: 0, occupied: 0, maintenance: 0, available: 0, name: `Tầng ${fId}`, zones: {} };
      }
      
      const isOccupied = s.currentSessionId || activeSlotIds.has(s.id);
      
      tSlots++;
      stats[fId].total++;
      if (s.maintenanceStatus === 'MAINTENANCE') {
        stats[fId].maintenance++;
      } else if (isOccupied) {
        stats[fId].occupied++;
        tOccupied++;
      } else {
        stats[fId].available++;
      }

      // Track zone stats
      if (s.zoneId) {
        if (!stats[fId].zones[s.zoneId]) {
          stats[fId].zones[s.zoneId] = { id: s.zoneId, name: zoneMap[s.zoneId]?.name || `Khu ${s.zoneId}`, total: 0, occupied: 0 };
        }
        stats[fId].zones[s.zoneId].total++;
        if (isOccupied) stats[fId].zones[s.zoneId].occupied++;
      }
    });
    
    return { floorStats: stats, totalSlots: tSlots, totalOccupied: tOccupied };
  }, [sortedFloors, zones, slots, activeSessions]);


  if (loading && floors.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" style={{ marginRight: 8 }} /> Đang tải mặt cắt tòa nhà...
      </div>
    );
  }

  // Determine progress color
  const getProgressColor = (pct) => {
    if (pct >= 90) return '#ef4444'; // Red
    if (pct >= 70) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getProgressGradient = (pct) => {
    if (pct >= 90) return 'linear-gradient(90deg, #ef4444, #dc2626)'; // Red
    if (pct >= 70) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'; // Yellow
    return 'linear-gradient(90deg, #34d399, #10b981)'; // Green
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.5rem', margin: 0 }}>
            <Building2 size={24} color="var(--accent-primary)" />
            Tổng quan Tòa nhà
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Mặt cắt ngang hiển thị tỷ lệ lấp đầy theo từng tầng</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, alignItems: 'start', height: 'calc(100vh - 180px)' }}>
        {/* Cột trái: Vẽ tòa nhà (Canvas) */}
        <div className="card" style={{ 
          padding: 0, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 12, 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Scrollable Canvas area */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '40px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: scale !== 1 ? 'grab' : 'default'
          }}>
            <div style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: 800,
            }}>
              
              {/* Mái nhà (Modern Flat Roof) */}
              <div style={{ 
                width: '100%', 
                height: 24, 
                background: 'linear-gradient(to bottom, #4b5563, #374151)', 
                borderTopLeftRadius: 8, 
                borderTopRightRadius: 8, 
                border: '2px solid #1f2937',
                borderBottom: 'none',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{ position: 'absolute', top: -10, left: '20%', width: 10, height: 10, background: '#9ca3af', borderRadius: '2px 2px 0 0' }} />
                <div style={{ position: 'absolute', top: -16, right: '30%', width: 8, height: 16, background: '#6b7280', borderRadius: '2px 2px 0 0' }} />
              </div>
              
              {/* Khung ngoài tòa nhà - Phần thân */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '98%', 
                border: '4px solid #374151',
                borderTop: 'none',
                borderBottom: 'none',
                background: '#1f2937',
                padding: '12px 16px',
                gap: 12
              }}>
                {aboveGroundFloors.map((floor, index) => {
                  const stat = floorStats[floor.id] || { total: 0, occupied: 0, maintenance: 0, available: 0, name: floor.name || `Tầng ${aboveGroundFloors.length - index}`, zones: {} };
                  const fillPct = stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0;
                  const pctColor = getProgressColor(fillPct);
                  const isFull = stat.total > 0 && stat.available === 0;
                  const zoneList = Object.values(stat.zones);

                  return (
                    <div key={floor.id} 
                      onClick={() => navigate(`/PARKING_MANAGER/slots?floorId=${floor.id}`)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid #4b5563',
                        borderRadius: 6,
                        padding: '16px 20px',
                        position: 'relative',
                        height: '85px', // Reduced height for compactness
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                        transition: 'transform 0.15s, border-color 0.15s, background 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        {/* Tên tầng + Số slot trên cùng 1 dòng */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.name}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {stat.occupied} / {stat.total} chỗ
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px' }}>
                          Xem chi tiết <ChevronRight size={14} />
                        </div>
                      </div>

                      {/* Zone Distribution Mini-blocks */}
                      {zoneList.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {zoneList.map(z => {
                            const zFill = z.total > 0 ? (z.occupied / z.total) * 100 : 0;
                            return (
                              <div key={z.id} 
                                onClick={(e) => { e.stopPropagation(); navigate(`/PARKING_MANAGER/slots?zoneId=${z.id}`); }}
                                title={`${z.name}: ${z.occupied}/${z.total} (Bấm để xem khu vực)`} style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: 4,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                                transition: 'background 0.2s, border-color 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: getProgressColor(zFill) }} />
                                {z.name}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div style={{ position: 'relative', height: 12, background: 'var(--border-color)', borderRadius: 20, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ 
                          height: '100%',
                          width: `${fillPct}%`, 
                          background: getProgressGradient(fillPct),
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                        {stat.maintenance > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: 0, bottom: 0, right: 0,
                            width: `${(stat.maintenance / stat.total) * 100}%`,
                            background: 'linear-gradient(90deg, #9ca3af, #6b7280)',
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)'
                          }} title={`${stat.maintenance} bảo trì`} />
                        )}
                      </div>
                      
                      {/* Percent Label */}
                      <div style={{ position: 'absolute', right: 20, bottom: 12, fontSize: '0.9rem', fontWeight: 800, color: pctColor }}>
                        {fillPct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
                
              {/* Đế tòa nhà và Cổng ra vào giữa tầng nổi và tầng hầm */}
              <div style={{ width: '100%', height: 32, background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px', border: '4px solid #374151', borderTop: 'none', borderBottom: 'none' }}>
                <div style={{ width: 80, height: 16, background: '#374151', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                
                {/* Barrier Gate Simulation */}
                <div style={{ width: 140, height: 48, background: 'var(--bg-primary)', border: '4px solid #374151', borderBottom: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 3 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: 6, color: 'var(--text-muted)' }}>CỔNG CHÍNH</div>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s infinite', marginTop: 12 }} />
                  <div style={{ width: 70, height: 8, background: '#fbbf24', borderRadius: 4, transform: 'rotate(-15deg)', transformOrigin: 'left center', marginTop: 12 }} />
                </div>
                
                <div style={{ width: 80, height: 16, background: '#374151', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </div>

              {/* Tầng hầm (nếu có) */}
              {belowGroundFloors.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '98%', 
                  border: '4px solid #374151',
                  borderTop: 'none',
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  background: '#1f2937',
                  padding: '12px 16px',
                  gap: 12
                }}>
                  {belowGroundFloors.map((floor, index) => {
                    const stat = floorStats[floor.id] || { total: 0, occupied: 0, maintenance: 0, available: 0, name: floor.name || `Hầm B${index + 1}`, zones: {} };
                    const fillPct = stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0;
                    const pctColor = getProgressColor(fillPct);
                    const zoneList = Object.values(stat.zones);

                    return (
                      <div key={floor.id} 
                        onClick={() => navigate(`/PARKING_MANAGER/slots?floorId=${floor.id}`)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid #4b5563',
                          borderRadius: 6,
                          padding: '16px 20px',
                          position: 'relative',
                          height: '85px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                          transition: 'transform 0.15s, border-color 0.15s, background 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.name}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {stat.occupied} / {stat.total} chỗ
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px' }}>
                            Xem chi tiết <ChevronRight size={14} />
                          </div>
                        </div>

                        {zoneList.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            {zoneList.map(z => {
                              const zFill = z.total > 0 ? (z.occupied / z.total) * 100 : 0;
                              return (
                                <div key={z.id} 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/PARKING_MANAGER/slots?zoneId=${z.id}`); }}
                                  title={`${z.name}: ${z.occupied}/${z.total} (Bấm để xem khu vực)`} style={{
                                  padding: '2px 6px',
                                  fontSize: '0.7rem',
                                  borderRadius: 4,
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer',
                                  transition: 'background 0.2s, border-color 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: getProgressColor(zFill) }} />
                                  {z.name}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ position: 'relative', height: 12, background: 'var(--border-color)', borderRadius: 20, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ height: '100%', width: `${fillPct}%`, background: getProgressGradient(fillPct), transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                          {stat.maintenance > 0 && (
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(stat.maintenance / stat.total) * 100}%`, background: 'linear-gradient(90deg, #9ca3af, #6b7280)', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)' }} />
                          )}
                        </div>
                        <div style={{ position: 'absolute', right: 20, bottom: 12, fontSize: '0.9rem', fontWeight: 800, color: pctColor }}>
                          {fillPct.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {belowGroundFloors.length === 0 && (
                <div style={{ width: '98%', height: 16, background: '#1f2937', border: '4px solid #374151', borderTop: 'none', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}></div>
              )}
            </div>
          </div>

          {/* Floating Zoom Controls - Tucked away at bottom right, smaller */}
          <div style={{ 
            position: 'absolute', 
            bottom: 12, 
            right: 12, 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--bg-primary)', 
            padding: '2px 4px', 
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            gap: 2,
            zIndex: 10
          }}>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-primary)' }} title="Thu nhỏ">
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-primary)' }} title="Phóng to">
              <ZoomIn size={16} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 2px' }} />
            <button onClick={() => setScale(1)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Đặt lại (100%)">
              <Maximize size={16} color="var(--text-muted)" />
            </button>
          </div>

          <style>{`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}</style>
        </div>

        {/* Cột phải: Thống kê */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} /> Thống kê Tổng
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng công suất</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalSlots} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>chỗ</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Đang sử dụng</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{totalOccupied} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/ {totalSlots}</span></span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#475569', fontWeight: 500 }}>Tỷ lệ lấp đầy</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: getProgressColor(totalSlots > 0 ? (totalOccupied / totalSlots) * 100 : 0) }}>
                    {totalSlots > 0 ? ((totalOccupied / totalSlots) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%',
                    width: `${totalSlots > 0 ? (totalOccupied / totalSlots) * 100 : 0}%`, 
                    background: getProgressGradient(totalSlots > 0 ? (totalOccupied / totalSlots) * 100 : 0)
                  }} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ color: '#3b82f6', marginTop: 2 }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>💡 Mẹo nhanh</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                  Click vào tầng để xem chi tiết vị trí đỗ. Có thể cuộn hoặc dùng công cụ góc dưới để thu phóng toàn cảnh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
