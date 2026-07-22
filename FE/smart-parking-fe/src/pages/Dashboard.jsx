import { TrendingUp, AlertCircle, Zap, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { compareSlotCodes } from '../utils/slotHelper';

// Status badge component
function StatusBadge({ status }) {
  const statusStyles = {
    'Đang đỗ': { bg: 'rgba(0, 208, 132, 0.12)', color: '#00d084', border: '1px solid rgba(0, 208, 132, 0.3)' },
    'Vé tháng': { bg: 'rgba(0, 200, 200, 0.12)', color: '#00c8c8', border: '1px solid rgba(0, 200, 200, 0.3)' },
    'Quá giờ': { bg: 'rgba(255, 107, 107, 0.12)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
  };

  const style = statusStyles[status] || { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      border: style.border,
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 600,
      display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

// Progress bar component
function ProgressBar({ percentage }) {
  return (
    <div style={{
      width: '100%',
      height: '6px',
      background: 'var(--bg-secondary)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '8px',
    }}>
      <div style={{
        width: `${Math.min(percentage, 100)}%`,
        height: '100%',
        background: percentage > 80 ? '#ff6b6b' : '#00d084',
        transition: 'width 0.3s ease',
        borderRadius: '3px',
      }} />
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [zonesRes, slotsRes, sessionsRes] = await Promise.all([
          api.get('/api/v1/zones'),
          api.get('/api/v1/parking-slots'),
          api.get('/api/v1/parking-sessions/active/all')
        ]);
        
        setZones(zonesRes.data.data || zonesRes.data || []);
        const sData = slotsRes.data.data || slotsRes.data || [];
        setSlots(Array.isArray(sData) ? [...sData].sort(compareSlotCodes) : []);
        setActiveSessions(sessionsRes.data.data || sessionsRes.data || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const slotStats = useMemo(() => {
    let available = 0, occupied = 0, maintenance = 0;
    slots.forEach(s => {
      if (s.maintenanceStatus === 'MAINTENANCE') maintenance++;
      else if (s.currentSessionId) occupied++;
      else available++;
    });
    return { available, occupied, maintenance, total: available + occupied + maintenance };
  }, [slots]);

  const parkedVehicles = useMemo(() => {
    return activeSessions.map(session => {
      const typeStr = session.vehicleType || session.vehicle?.vehicleType;
      const typeLabel = typeStr === 'CAR' ? 'Ô tô' : typeStr === 'MOTORBIKE' ? 'Xe máy' : 'Xe tải';
      
      let status = 'Đang đỗ';
      if (session.entryTime) {
        const ms = Date.now() - new Date(session.entryTime).getTime();
        if (ms > 24 * 3600 * 1000) status = 'Quá giờ';
      }
      if (session.ticketType === 'MONTHLY') status = 'Vé tháng';

      return {
        plate: session.licensePlate || session.vehicle?.licensePlate || '—',
        type: typeLabel,
        slot: session.slotCode || session.slot?.slotCode || '—',
        entryTime: session.entryTime 
          ? new Date(session.entryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) 
          : '—',
        status: status,
      };
    });
  }, [activeSessions]);

  const overstayCount = parkedVehicles.filter(v => v.status === 'Quá giờ').length;
  const utilizationRate = slotStats.total > 0 ? ((slotStats.occupied / slotStats.total) * 100).toFixed(1) : '0.0';

  const metricsData = useMemo(() => [
    {
      label: 'Tỷ lệ lấp đầy',
      value: `${utilizationRate}%`,
      subtitle: `${slotStats.occupied}/${slotStats.total} vị trí đang đỗ`,
      icon: TrendingUp,
      color: '#00d084'
    },
    {
      label: 'Vị trí trống',
      value: String(slotStats.available),
      subtitle: `Trong tổng số ${slotStats.total} vị trí`,
      icon: Zap,
      color: '#00d084'
    },
    {
      label: "Xe đang đỗ",
      value: String(activeSessions.length),
      subtitle: `${overstayCount > 0 ? `${overstayCount} xe đỗ quá giờ` : 'Tất cả trong thời gian quy định'}`,
      icon: TrendingUp,
      color: '#00d084'
    },
    {
      label: 'Bảo trì',
      value: String(slotStats.maintenance),
      subtitle: 'Vị trí đang tạm ngưng',
      icon: AlertCircle,
      color: '#ffa500'
    },
  ], [utilizationRate, slotStats, activeSessions.length, overstayCount]);

  const getFloorStats = useMemo(() => {
    const floorsMap = {};
    zones.forEach(z => {
      if (!floorsMap[z.floorName]) {
        floorsMap[z.floorName] = { name: z.floorName, total: 0, available: 0 };
      }
    });
    slots.forEach(s => {
      if (floorsMap[s.floorName]) {
        floorsMap[s.floorName].total++;
        if (s.maintenanceStatus !== 'MAINTENANCE' && !s.currentSessionId) {
          floorsMap[s.floorName].available++;
        }
      }
    });
    return Object.values(floorsMap);
  }, [zones, slots]);

  const zoneStatus = useMemo(() => {
    return zones.map(z => {
      const zoneSlots = slots.filter(s => s.zoneId === z.id);
      const available = zoneSlots.filter(s => s.maintenanceStatus !== 'MAINTENANCE' && !s.currentSessionId).length;
      return {
        zone: z.name,
        location: z.floorName,
        available: available,
        total: zoneSlots.length || z.totalSlots || 0,
      };
    });
  }, [zones, slots]);

  const alerts = useMemo(() => {
    const list = [];
    if (overstayCount > 0) list.push({ text: `${overstayCount} xe đỗ quá 24 giờ`, color: '#ff6b6b' });
    const nearCapFloors = getFloorStats.filter(f => f.total > 0 && (f.total - f.available) / f.total > 0.8);
    nearCapFloors.forEach(f => list.push({ text: `Khu vực ${f.name} sắp đầy`, color: '#ffa500' }));
    const maintenanceSlots = slotStats.maintenance;
    if (maintenanceSlots > 0) list.push({ text: `${maintenanceSlots} vị trí đang bảo trì`, color: '#00c8c8' });
    if (list.length === 0) list.push({ text: 'Mọi hệ thống hoạt động bình thường', color: '#00d084' });
    return list;
  }, [overstayCount, getFloorStats, slotStats.maintenance]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu tổng quan...</div>;
  }

  return (
    <div className="page-full">
      <div className="dashboard-main-grid">
        {/* Main Content */}
        <div>
          <div className="page-header">
            <h2>Bảng điều khiển</h2>
            <p>Tổng quan trạng thái bãi đỗ xe</p>
          </div>

          {/* Key Metrics */}
          <div className="dashboard-metrics-grid">
            {metricsData.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div className="glass-card hover-lift animate-fade-in-up" key={i} style={{
                  animationDelay: `${i * 0.08}s`,
                  padding: '24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {metric.label}
                      </p>
                      <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                        {metric.value}
                      </h3>
                    </div>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '10px',
                      background: `${metric.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={24} style={{ color: metric.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {metric.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Main content grid */}
          <div className="dashboard-tables-grid">
            {/* Status by Floor */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
                Trạng thái theo Tầng
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {getFloorStats.map((floor, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {floor.name}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#00d084', fontWeight: 500 }}>
                        Còn trống {floor.available}/{floor.total}
                      </span>
                    </div>
                    <ProgressBar percentage={floor.total > 0 ? ((floor.total - floor.available) / floor.total) * 100 : 0} />
                  </div>
                ))}
                {getFloorStats.length === 0 && (
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có dữ liệu tầng</div>
                )}
              </div>
            </div>

            {/* Parked Vehicles Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Xe đang đỗ ({parkedVehicles.length})
                </h3>
                {overstayCount > 0 && (
                  <div style={{
                    background: 'rgba(255, 107, 107, 0.15)',
                    color: '#ff6b6b',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                  }}>
                    <AlertCircle size={14} />
                    {overstayCount} quá giờ
                  </div>
                )}
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Biển số xe</th>
                      <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Loại xe</th>
                      <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Vị trí</th>
                      <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Thời gian vào</th>
                      <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkedVehicles.map((vehicle, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {vehicle.plate}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>
                          {vehicle.type}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>
                          {vehicle.slot}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>
                          {vehicle.entryTime}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <StatusBadge status={vehicle.status} />
                        </td>
                      </tr>
                    ))}
                    {parkedVehicles.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Hiện tại không có xe nào đang đỗ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Status by Zone */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
              Trạng thái theo Khu vực
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {zoneStatus.map((zone, i) => (
                <div key={i} className="glass-card hover-lift" style={{
                  padding: '18px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '2px' }}>
                        {zone.zone}
                      </h4>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 500 }}>
                    {zone.location}
                  </p>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00d084', marginBottom: '4px' }}>
                    {zone.available}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    còn trống / {zone.total}
                  </div>
                  <ProgressBar percentage={zone.total > 0 ? ((zone.total - zone.available) / zone.total) * 100 : 0} />
                </div>
              ))}
              {zoneStatus.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: 'span 4' }}>
                  Chưa có khu vực nào được cấu hình.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Statistics */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Thống kê Tổng quát
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Tổng sức chứa', value: String(slotStats.total), unit: 'vị trí' },
                { label: 'Đang sử dụng', value: String(slotStats.occupied), unit: 'xe' },
                { label: 'Vị trí trống', value: String(slotStats.available), unit: 'vị trí' },
              ].map((stat, i) => (
                <div key={i} style={{ paddingBottom: '14px', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                    {stat.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00d084' }}>
                      {stat.value}
                    </span>
                    {stat.unit && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {stat.unit}
                    </span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Cảnh báo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  style={{
                    background: `${alert.color}15`,
                    border: `1px solid ${alert.color}40`,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    color: alert.color,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>●</span>
                  {alert.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
