import { TrendingUp, AlertCircle, Zap, Clock } from 'lucide-react';
import { useParkingStore } from '../store/parkingStore';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

// Status badge component
function StatusBadge({ status }) {
  const statusStyles = {
    'Parked': { bg: 'rgba(0, 208, 132, 0.12)', color: '#00d084', border: '1px solid rgba(0, 208, 132, 0.3)' },
    'Monthly Pass': { bg: 'rgba(0, 200, 200, 0.12)', color: '#00c8c8', border: '1px solid rgba(0, 200, 200, 0.3)' },
    'Overstay': { bg: 'rgba(255, 107, 107, 0.12)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
  };

  const style = statusStyles[status] || { bg: '#2a2a2a', color: '#aaa', border: '1px solid #333' };
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
      background: '#2a2a2a',
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
  const { vehicles, exitedVehicles, slotStats, todayRevenue, getFloorStats, zones } = useParkingStore();
  const navigate = useNavigate();

  const overstayCount = vehicles.filter(v => v.overstay).length;
  const utilizationRate = slotStats.total > 0 ? ((slotStats.occupied / slotStats.total) * 100).toFixed(1) : '0.0';

  const metricsData = useMemo(() => [
    {
      label: 'Utilization Rate',
      value: `${utilizationRate}%`,
      subtitle: `${slotStats.occupied}/${slotStats.total} slots in use`,
      icon: TrendingUp,
      color: '#00d084'
    },
    {
      label: 'Available Slots',
      value: String(slotStats.available),
      subtitle: `${zones.filter(z => z.vehicleType === 'Car').reduce((s, z) => s + z.slots.filter(sl => sl.status === 'available').length, 0)} cars, ${zones.filter(z => z.vehicleType === 'Motorbike').reduce((s, z) => s + z.slots.filter(sl => sl.status === 'available').length, 0)} motorbikes`,
      icon: Zap,
      color: '#00d084'
    },
    {
      label: "Today's Revenue",
      value: `₫${todayRevenue.toLocaleString()}`,
      subtitle: `${exitedVehicles.length} vehicles exited today`,
      icon: TrendingUp,
      color: '#00d084'
    },
    {
      label: 'Peak Hour',
      value: '08:00 - 09:00',
      subtitle: 'Busiest time of the day',
      icon: Clock,
      color: '#ffa500'
    },
  ], [utilizationRate, slotStats, todayRevenue, exitedVehicles.length, zones]);

  // Zone status from live data
  const zoneStatus = useMemo(() => {
    return zones.map(z => ({
      zone: z.name,
      location: z.location,
      available: z.slots.filter(s => s.status === 'available').length,
      total: z.total,
    }));
  }, [zones]);

  // Parked vehicles for table
  const parkedVehicles = useMemo(() => {
    return vehicles.map(v => ({
      plate: v.plate,
      type: v.type,
      slot: v.slot,
      entryTime: v.entryTime instanceof Date
        ? v.entryTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : v.entryTime,
      status: v.overstay ? 'Overstay' : v.hasPass ? 'Monthly Pass' : 'Parked',
    }));
  }, [vehicles]);

  // Alerts from live data
  const alerts = useMemo(() => {
    const list = [];
    if (overstayCount > 0) list.push({ text: `${overstayCount} vehicle overstay`, color: '#ff6b6b' });
    const nearCapFloors = getFloorStats.filter(f => f.total > 0 && (f.total - f.available) / f.total > 0.8);
    nearCapFloors.forEach(f => list.push({ text: `${f.name} near capacity`, color: '#ffa500' }));
    const maintenanceSlots = slotStats.maintenance;
    if (maintenanceSlots > 0) list.push({ text: `${maintenanceSlots} slots in maintenance`, color: '#00c8c8' });
    if (list.length === 0) list.push({ text: 'All systems normal', color: '#00d084' });
    return list;
  }, [overstayCount, getFloorStats, slotStats.maintenance]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
      {/* Main Content */}
      <div>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Overview of parking lot status</p>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {metricsData.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div className="card animate-slide-up" key={i} style={{
                animationDelay: `${i * 0.08}s`,
                padding: '20px',
                border: '1px solid #2a2a2a',
                background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '32px' }}>
          {/* Status by Floor */}
          <div className="card" style={{ padding: '24px', border: '1px solid #2a2a2a' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Status by Floor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {getFloorStats.map((floor, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {floor.name}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#00d084', fontWeight: 500 }}>
                      {floor.available}/{floor.total} available
                    </span>
                  </div>
                  <ProgressBar percentage={floor.total > 0 ? (floor.available / floor.total) * 100 : 0} />
                </div>
              ))}
            </div>
          </div>

          {/* Parked Vehicles Table */}
          <div className="card" style={{ padding: '24px', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Parked Vehicles ({parkedVehicles.length})
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
                  {overstayCount} overstay
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>License Plate</th>
                    <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Vehicle Type</th>
                    <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Slot</th>
                    <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Entry Time</th>
                    <th style={{ textAlign: 'left', padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parkedVehicles.map((vehicle, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Status by Zone */}
        <div className="card" style={{ padding: '24px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Status by Zone
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {zoneStatus.map((zone, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
                padding: '18px',
                borderRadius: '10px',
                border: '1px solid #2a2a2a',
                transition: 'all 0.3s ease',
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
                  available / {zone.total}
                </div>
                <ProgressBar percentage={(zone.available / zone.total) * 100} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Quick Actions */}
        <div className="card" style={{ padding: '20px', border: '1px solid #2a2a2a', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Vehicle Entry', icon: '📥', path: '/entry' },
              { label: 'Vehicle Exit', icon: '📤', path: '/exit' },
              { label: 'Check Availability', icon: '🔍', path: '/slots' },
              { label: 'Generate Report', icon: '📊', path: '/reports' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: 'var(--text-primary)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#252525';
                  e.currentTarget.style.borderColor = '#3a3a3a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                }}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="card" style={{ padding: '20px', border: '1px solid #2a2a2a', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Statistics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Total Capacity', value: String(slotStats.total), unit: 'slots' },
              { label: 'Occupied', value: String(slotStats.occupied), unit: 'vehicles' },
              { label: 'Revenue Today', value: `₫${(todayRevenue / 1000).toFixed(0)}K`, unit: '' },
            ].map((stat, i) => (
              <div key={i} style={{ paddingBottom: '14px', borderBottom: i < 2 ? '1px solid #2a2a2a' : 'none' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {stat.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#00d084' }}>
                    {stat.value}
                  </span>
                  {stat.unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {stat.unit}
                  </span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card" style={{ padding: '20px', border: '1px solid #2a2a2a', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
            Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  background: `${alert.color}15`,
                  border: `1px solid ${alert.color}40`,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: alert.color,
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
  );
}
