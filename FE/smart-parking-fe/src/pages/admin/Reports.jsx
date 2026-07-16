import { BarChart3, DollarSign, Car, Activity, Clock, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { getActiveSessions, getCompletedSessions, getZones } from '../../services/sessionApi';

/* ─── Tooltip hook ─────────────────────────────────────────── */
function useTooltip() {
  const [tip, setTip] = useState(null); // { x, y, text }
  return { tip, show: setTip, hide: () => setTip(null) };
}

/* ─── Area chart ───────────────────────────────────────────── */
function AreaChart({ data }) {
  const { tip, show, hide } = useTooltip();
  const W = 700, H = 200, pad = 44;
  const max = Math.max(...data.map(d => d.value), 1000000);
  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: H - pad - (d.value / max) * (H - pad * 2),
  }));
  const line = pts.length > 0 ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') : `M${pad},${H - pad} L${W - pad},${H - pad}`;
  const area = pts.length > 0 ? `${line} L${pts[pts.length - 1].x},${H - pad} L${pts[0].x},${H - pad} Z` : '';

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: 220, width: '100%' }}>
        <defs>
          <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = H - pad - r * (H - pad * 2);
          return <line key={i} x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />;
        })}
        {area && <path d={area} fill="url(#areaGrad2)" />}
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#0b0f19" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => show({ x: p.x, y: p.y, text: `${data[i].day}: ₫${data[i].value.toLocaleString()}` })}
            onMouseLeave={hide} />
        ))}
        {data.map((d, i) => <text key={i} x={pts[i].x} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{d.day}</text>)}
        {[0, 0.5, 1].map((r, i) => {
          const y = H - pad - r * (H - pad * 2);
          const v = Math.round(max * r / 1000);
          return <text key={i} x={pad - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{v}K</text>;
        })}
      </svg>
      {tip && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${(tip.x / 700) * 100}%`, top: `${(tip.y / 200) * 100}%`,
          transform: 'translate(-50%, -130%)',
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.4)',
          color: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

/* ─── Bar chart ────────────────────────────────────────────── */
function BarChartComponent({ data }) {
  const { tip, show, hide } = useTooltip();
  const W = 700, H = 220, pad = 44;
  const maxVal = Math.max(...data.map(d => Math.max(d.entries, d.exits)), 10);
  const barW = (W - pad * 2) / (data.length || 1) * 0.32;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: 220, width: '100%' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = H - pad - r * (H - pad * 2);
          return <line key={i} x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />;
        })}
        {data.map((d, i) => {
          const x = pad + (i / data.length) * (W - pad * 2) + barW * 0.5;
          const hE = (d.entries / maxVal) * (H - pad * 2);
          const hX = (d.exits / maxVal) * (H - pad * 2);
          return (
            <g key={i}>
              <rect x={x} y={H - pad - hE} width={barW} height={hE} rx="3" fill="#3b82f6" opacity="0.85"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => show({ x: x + barW / 2, y: H - pad - hE, text: `${d.label} vào: ${d.entries}` })}
                onMouseLeave={hide} />
              <rect x={x + barW + 3} y={H - pad - hX} width={barW} height={hX} rx="3" fill="#f59e0b" opacity="0.85"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => show({ x: x + barW * 1.5 + 3, y: H - pad - hX, text: `${d.label} ra: ${d.exits}` })}
                onMouseLeave={hide} />
              <text x={x + barW} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">{d.label}</text>
            </g>
          );
        })}
        <rect x={W - 170} y={8} width={10} height={10} rx={2} fill="#3b82f6" />
        <text x={W - 155} y={17} fontSize="10" fill="#94a3b8">Lượt vào</text>
        <rect x={W - 90} y={8} width={10} height={10} rx={2} fill="#f59e0b" />
        <text x={W - 75} y={17} fontSize="10" fill="#94a3b8">Lượt ra</text>
      </svg>
      {tip && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${(tip.x / 700) * 100}%`, top: `${(tip.y / 220) * 100}%`,
          transform: 'translate(-50%, -130%)',
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.4)',
          color: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

/* ─── Donut chart ──────────────────────────────────────────── */
function DonutChart({ data }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const cx = 120, cy = 120, r = 80, rInner = 52;
  let cumAngle = -Math.PI / 2;
  const arcs = data.map(d => {
    if (total === 0) return { ...d, path: '', pct: 0 };
    const angle = (d.value / total) * Math.PI * 2;
    if (angle >= Math.PI * 2 - 0.01) {
      return { ...d, path: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z M ${cx} ${cy - rInner} A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner} A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner} Z`, pct: 100 };
    }
    const s = cumAngle;
    cumAngle += angle;
    const e = cumAngle;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const x3 = cx + rInner * Math.cos(e), y3 = cy + rInner * Math.sin(e);
    const x4 = cx + rInner * Math.cos(s), y4 = cy + rInner * Math.sin(s);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, path: `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${large} 0 ${x4},${y4} Z`, pct: Math.round(d.value / total * 100) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          {total === 0 ? (
            <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z M ${cx} ${cy - rInner} A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner} A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner} Z`} fill="rgba(255,255,255,0.05)" />
          ) : (
            arcs.map((a, i) => a.value > 0 && (
              <path key={i} d={a.path} fill={a.color} stroke="#0b0f19" strokeWidth="2"
                style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.opacity = '0.85'}
                onMouseLeave={e => e.target.style.opacity = '1'} />
            ))
          )}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="24" fontWeight="800" fill="#f1f5f9">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#64748b">phương tiện</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: a.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minWidth: '80px' }}>{a.name}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.value}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({a.pct}%)</span>
          </div>
        ))}
        {total === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Hiện không có xe nào đang đỗ</p>}
      </div>
    </div>
  );
}

/* ─── Floor bars ───────────────────────────────────────────── */
function FloorBars({ data }) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      <p>Không có dữ liệu tầng</p>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {data.map((f, i) => {
        const pct = f.total > 0 ? Math.round((f.used / f.total) * 100) : 0;
        const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.used} / {f.total} chỗ</span>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: barColor,
                  background: `${barColor}18`,
                  padding: '2px 10px', borderRadius: 6,
                }}>{pct}%</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                borderRadius: 8,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}>
                {pct > 15 && (
                  <span style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                  }}>{pct}%</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Reports component ───────────────────────────────── */
export default function Reports() {
  const [tab, setTab] = useState('revenue');
  const [period, setPeriod] = useState('Today');
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [active, completed, zoneList] = await Promise.all([
        getActiveSessions(),
        getCompletedSessions(),
        getZones()
      ]);
      setActiveSessions(active);
      setCompletedSessions(completed);
      setZones(zoneList.data ?? zoneList ?? []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching report data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const { revenueData, peakData, vehicleTypes, floorData, stats } = useMemo(() => {
    const now = new Date();
    const isToday = (date) => {
      const d = new Date(date);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    let todayRevenue = 0;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const viDays = { Sun: 'CN', Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7' };
    const revMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    completedSessions.forEach(v => {
      if (!v.exitTime) return;
      const exitTime = new Date(v.exitTime);
      const dayName = days[exitTime.getDay()];
      const fee = v.totalFee || 0;
      revMap[dayName] += fee;
      if (isToday(exitTime)) todayRevenue += fee;
    });

    const mockRev = { Mon: 8200000, Tue: 9100000, Wed: 7800000, Thu: 11200000, Fri: 12450000, Sat: 10800000, Sun: 6500000 };
    const chartRev = period === 'Today'
      ? [{ day: 'Hôm nay', value: todayRevenue }]
      : days.map(day => ({ day: viDays[day], value: Math.max(revMap[day], period === 'This Week' ? mockRev[day] : 0) }));

    const hoursMap = {};
    for (let i = 6; i <= 20; i++) {
      hoursMap[i] = { entries: 0, exits: 0 };
      if (period !== 'Today') {
        hoursMap[i].entries = i >= 7 && i <= 9 ? 15 + Math.floor(Math.random() * 10) : i >= 17 && i <= 19 ? 12 + Math.floor(Math.random() * 8) : 3 + Math.floor(Math.random() * 6);
        hoursMap[i].exits = i >= 11 && i <= 13 ? 10 + Math.floor(Math.random() * 8) : i >= 17 && i <= 19 ? 14 + Math.floor(Math.random() * 10) : 2 + Math.floor(Math.random() * 5);
      }
    }
    [...activeSessions, ...completedSessions].forEach(v => {
      if (!v.entryTime) return;
      const h = new Date(v.entryTime).getHours();
      if (hoursMap[h]) hoursMap[h].entries++;
    });
    completedSessions.forEach(v => {
      if (!v.exitTime) return;
      const h = new Date(v.exitTime).getHours();
      if (hoursMap[h]) hoursMap[h].exits++;
    });
    const chartPeak = Object.keys(hoursMap).map(h => ({ label: `${String(h).padStart(2, '0')}h`, entries: hoursMap[h].entries, exits: hoursMap[h].exits }));

    let maxActivity = 0, peakHourStr = '08:00 - 09:00';
    Object.keys(hoursMap).forEach(h => {
      const act = hoursMap[h].entries + hoursMap[h].exits;
      if (act > maxActivity) { maxActivity = act; peakHourStr = `${String(h).padStart(2, '0')}:00 - ${String(Number(h) + 1).padStart(2, '0')}:00`; }
    });

    let cars = 0, bikes = 0, others = 0;
    activeSessions.forEach(v => {
      if (v.vehicleType === 'CAR' || v.vehicleType === 'Car') cars++;
      else if (v.vehicleType === 'MOTORBIKE' || v.vehicleType === 'Motorbike') bikes++;
      else others++;
    });
    const chartTypes = [
      { name: 'Ô tô', value: cars, color: '#3b82f6' },
      { name: 'Xe máy', value: bikes, color: '#8b5cf6' },
      { name: 'Khác', value: others, color: '#10b981' }
    ];

    const floorMap = {};
    let totalSlotsAll = 0, occupiedSlotsAll = 0;
    zones.forEach(z => {
      const total = z.totalSlots || 0;
      const avail = z.availableSlots || 0;
      const used = total - avail;
      totalSlotsAll += total;
      occupiedSlotsAll += used;
      const floorName = z.floorName || z.floor || 'Unknown';
      if (!floorMap[floorName]) floorMap[floorName] = { total: 0, used: 0 };
      floorMap[floorName].total += total;
      floorMap[floorName].used += used;
    });
    const chartFloors = Object.keys(floorMap).map(k => ({ name: k, total: floorMap[k].total, used: floorMap[k].used }));

    let todayEntriesCount = 0;
    [...activeSessions, ...completedSessions].forEach(v => { if (v.entryTime && isToday(v.entryTime)) todayEntriesCount++; });

    const occupancyPct = totalSlotsAll > 0 ? ((occupiedSlotsAll / totalSlotsAll) * 100).toFixed(1) : '0.0';

    const summaryStats = [
      { label: period === 'Today' ? 'Doanh thu hôm nay' : 'Tổng doanh thu', value: `₫${(period === 'Today' ? todayRevenue : todayRevenue + 66050000).toLocaleString()}`, icon: DollarSign, color: '#10b981', trend: '+12%', trendUp: true },
      { label: 'Lượt xe vào hôm nay', value: todayEntriesCount.toString(), icon: Car, color: '#3b82f6', trend: '+5%', trendUp: true },
      { label: 'Tỷ lệ lấp đầy', value: `${occupancyPct}%`, subValue: `${occupiedSlotsAll}/${totalSlotsAll} chỗ`, icon: Activity, color: '#f59e0b', trend: null, pct: parseFloat(occupancyPct) },
      { label: 'Giờ cao điểm', value: peakHourStr, icon: Clock, color: '#8b5cf6', trend: null },
    ];

    return { revenueData: chartRev, peakData: chartPeak, vehicleTypes: chartTypes, floorData: chartFloors, stats: summaryStats };
  }, [activeSessions, completedSessions, zones, period]);

  const TABS = [
    { key: 'revenue', label: 'Doanh thu', icon: '💰' },
    { key: 'peak', label: 'Giờ cao điểm', icon: '⏰' },
    { key: 'vehicles', label: 'Loại xe', icon: '🚗' },
    { key: 'floor', label: 'Theo Tầng', icon: '🏢' },
  ];

  const selSt = { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer' };

  return (
    <div className="page-full-width">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.15)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.9rem' }}>Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>📊 Báo cáo &amp; Thống kê</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Xem báo cáo doanh thu và thống kê hoạt động'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={selSt}>
                <option value="Today">Hôm nay</option>
                <option value="This Week">Tuần này</option>
                <option value="This Month">Tháng này</option>
              </select>
              <button onClick={loadData} style={{ ...selSt, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                <RefreshCw size={14} /> Làm mới
              </button>
              <button style={{ ...selSt, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}`, position: 'relative', overflow: 'hidden' }}>
                  {/* Background glow */}
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${s.color}12`, pointerEvents: 'none' }} />
                  <div className="stat-card-header">
                    <span className="stat-card-label">{s.label}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="stat-card-value" style={{ fontSize: s.value.length > 10 ? '1.3rem' : '1.8rem' }}>
                    {s.value}
                  </div>
                  {s.subValue && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.subValue}</div>}
                  {s.pct !== undefined && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${s.pct}%`, height: '100%',
                          background: s.pct > 80 ? '#ef4444' : s.pct > 60 ? '#f59e0b' : '#10b981',
                          borderRadius: 2, transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  )}
                  {s.trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.78rem', fontWeight: 600, color: s.trendUp ? '#10b981' : '#ef4444' }}>
                      <TrendingUp size={12} />
                      {s.trend} so với hôm qua
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {TABS.map(t => (
              <button key={t.key}
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', borderRadius: 9 }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Chart container */}
          <div className="card chart-container" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))', border: '1px solid var(--border-color)' }}>
            {tab === 'revenue' && (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <BarChart3 size={18} style={{ color: '#10b981' }} />
                  {period === 'Today' ? 'Doanh thu hôm nay' : 'Doanh thu tuần này'}
                </h3>
                <AreaChart data={revenueData} />
              </>
            )}
            {tab === 'peak' && (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <Clock size={18} style={{ color: '#8b5cf6' }} />
                  Phân tích giờ cao điểm
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8 }}>Hover vào cột để xem chi tiết</span>
                </h3>
                <BarChartComponent data={peakData} />
              </>
            )}
            {tab === 'vehicles' && (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <Car size={18} style={{ color: '#3b82f6' }} />
                  Xe đang đỗ - Phân loại theo loại xe
                </h3>
                <DonutChart data={vehicleTypes} />
              </>
            )}
            {tab === 'floor' && (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <Activity size={18} style={{ color: '#f59e0b' }} />
                  Tỷ lệ lấp đầy theo Tầng
                </h3>
                <FloorBars data={floorData} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
