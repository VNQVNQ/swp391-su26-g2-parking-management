import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp, Calendar, CreditCard, Car, Bike, Truck, RefreshCw, Download } from 'lucide-react';
import api from '../../services/api';

const fmt = (v) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

const fmtVND = (v) => `₫${Number(v || 0).toLocaleString('vi-VN')}`;

const VEHICLE_COLORS = { CAR: '#3b82f6', MOTORBIKE: '#8b5cf6', TRUCK: '#f59e0b' };
const VEHICLE_LABELS = { CAR: 'Ô tô', MOTORBIKE: 'Xe máy', TRUCK: 'Xe tải' };

// Group sessions by day/week/month and sum revenue
function groupByPeriod(sessions, mode) {
  const map = {};
  sessions.forEach(s => {
    const date = new Date(s.exitTime || s.entryTime || s.createdAt);
    if (isNaN(date)) return;
    let key;
    if (mode === 'day') {
      key = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } else if (mode === 'week') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay() + 1);
      key = `Tuần ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
    } else {
      key = date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
    }
    if (!map[key]) map[key] = { label: key, revenue: 0, count: 0 };
    map[key].revenue += Number(s.totalFee || s.fee || s.amount || 0);
    map[key].count += 1;
  });
  return Object.values(map);
}

// Group by vehicle type
function groupByVehicle(sessions) {
  const map = { CAR: 0, MOTORBIKE: 0, TRUCK: 0 };
  sessions.forEach(s => {
    const vt = (s.vehicleType || s.vehicle?.vehicleType || '').toUpperCase();
    if (map[vt] !== undefined) map[vt] += Number(s.totalFee || s.fee || s.amount || 0);
  });
  return Object.entries(map).map(([name, value]) => ({ name, value, label: VEHICLE_LABELS[name] || name }));
}

// Filter sessions by date range
function filterByRange(sessions, range) {
  const now = new Date();
  const from = new Date(now);
  if (range === '7d') from.setDate(now.getDate() - 7);
  else if (range === '30d') from.setDate(now.getDate() - 30);
  else if (range === '3m') from.setMonth(now.getMonth() - 3);
  else if (range === '1y') from.setFullYear(now.getFullYear() - 1);
  else return sessions;
  return sessions.filter(s => {
    const d = new Date(s.exitTime || s.entryTime || s.createdAt);
    return d >= from && d <= now;
  });
}

export default function RevenueReport() {
  const [sessions, setSessions] = useState([]);
  const [monthlyPasses, setMonthlyPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');
  const [mode, setMode] = useState('day'); // day | week | month

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [sessRes, passRes] = await Promise.all([
        api.get('/api/v1/parking-sessions/completed/all').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/monthly-passes').catch(() => ({ data: { data: [] } })),
      ]);
      setSessions(Array.isArray(sessRes.data?.data) ? sessRes.data.data : Array.isArray(sessRes.data) ? sessRes.data : []);
      setMonthlyPasses(Array.isArray(passRes.data?.data) ? passRes.data.data : Array.isArray(passRes.data) ? passRes.data : []);
    } catch (e) {
      setError('Không thể tải dữ liệu báo cáo');
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => filterByRange(sessions, range), [sessions, range]);
  const chartData = useMemo(() => groupByPeriod(filtered, mode), [filtered, mode]);
  const vehicleData = useMemo(() => groupByVehicle(filtered), [filtered]);

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.totalFee || x.fee || x.amount || 0), 0);
  const totalSessions = filtered.length;
  const avgRevenue = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;
  const passRevenue = monthlyPasses
    .filter(p => { const d = new Date(p.startDate); const now = new Date(); const from = new Date(now); from.setDate(now.getDate() - (range === '7d' ? 7 : range === '30d' ? 30 : range === '3m' ? 90 : 365)); return d >= from; })
    .reduce((s, p) => s + Number(p.fee || 0), 0);

  const stats = [
    { label: 'Tổng doanh thu (vé lẻ)', value: fmtVND(totalRevenue), icon: TrendingUp, color: '#10b981' },
    { label: 'Doanh thu vé tháng', value: fmtVND(passRevenue), icon: CreditCard, color: '#3b82f6' },
    { label: 'Số lượt xe', value: totalSessions, icon: Car, color: '#8b5cf6' },
    { label: 'Trung bình/lượt', value: fmtVND(avgRevenue), icon: Calendar, color: '#f59e0b' },
  ];

  const RANGE_OPTIONS = [
    { v: '7d', label: '7 ngày' },
    { v: '30d', label: '30 ngày' },
    { v: '3m', label: '3 tháng' },
    { v: '1y', label: '1 năm' },
  ];
  const MODE_OPTIONS = [
    { v: 'day', label: 'Theo ngày' },
    { v: 'week', label: 'Theo tuần' },
    { v: 'month', label: 'Theo tháng' },
  ];

  const tooltipStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 };
  const tickStyle = { fill: 'var(--text-muted)', fontSize: 11 };

  return (
    <div className="page-full-width">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>📊 Báo cáo Doanh thu</h2>
          <p>Thống kê doanh thu bãi đậu xe theo thời gian và loại xe</p>
        </div>
        <button onClick={loadData} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 9, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-card-value" style={{ fontSize: typeof s.value === 'string' && s.value.length > 8 ? '1.3rem' : '2rem' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Controls: Range + Mode */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Khoảng thời gian:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGE_OPTIONS.map(o => (
            <button key={o.v} onClick={() => setRange(o.v)}
              style={{ padding: '6px 14px', borderRadius: 7, border: `1.5px solid ${range === o.v ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: range === o.v ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)', color: range === o.v ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 4px' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hiển thị:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {MODE_OPTIONS.map(o => (
            <button key={o.v} onClick={() => setMode(o.v)}
              style={{ padding: '6px 14px', borderRadius: 7, border: `1.5px solid ${mode === o.v ? '#10b981' : 'var(--border-color)'}`, background: mode === o.v ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)', color: mode === o.v ? '#10b981' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{totalSessions} giao dịch</span>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : (
        <>
          {/* Revenue Bar Chart */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              💰 Doanh thu vé lẻ {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : range === '3m' ? '3 tháng' : '1 năm'} qua
            </h3>
            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barSize={Math.max(8, Math.min(36, 400 / chartData.length))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [fmtVND(v), 'Doanh thu']}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? '#10b981' : 'rgba(59,130,246,0.7)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bottom: Pie Chart + Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 20 }}>
            {/* Pie: by vehicle type */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>🚗 Doanh thu theo loại xe</h3>
              {vehicleData.every(d => d.value === 0) ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa có dữ liệu</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={vehicleData.filter(d => d.value > 0)} dataKey="value" nameKey="label"
                        cx="50%" cy="50%" outerRadius={80} innerRadius={44}
                        paddingAngle={3}>
                        {vehicleData.map((entry, i) => (
                          <Cell key={i} fill={VEHICLE_COLORS[entry.name] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [fmtVND(v)]} contentStyle={tooltipStyle} />
                      <Legend formatter={(value) => VEHICLE_LABELS[value] || value} wrapperStyle={{ fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {vehicleData.map(d => (
                      <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: `${VEHICLE_COLORS[d.name]}10`, borderRadius: 8, border: `1px solid ${VEHICLE_COLORS[d.name]}25` }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: VEHICLE_COLORS[d.name] }}>{VEHICLE_LABELS[d.name]}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{fmtVND(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Table: top revenue days */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>📋 Chi tiết doanh thu</h3>
              <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kỳ</th>
                      <th style={{ textAlign: 'right' }}>Doanh thu</th>
                      <th style={{ textAlign: 'right' }}>Số lượt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Không có dữ liệu</td></tr>
                    ) : (
                      [...chartData].sort((a, b) => b.revenue - a.revenue).map((row, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{row.label}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmtVND(row.revenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Trend line chart */}
          {chartData.length > 1 && (
            <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 20 }}>📈 Xu hướng doanh thu</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [fmtVND(v), 'Doanh thu']} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
