import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell,
} from "recharts";
import type { UtilizationStat } from "../../types/slot.types";

// ─── Revenue Chart (BR-47) ────────────────────────────────────────────────────
interface RevenueProps { data: { day: string; revenue: number }[] }

export function RevenueChart({ data }: RevenueProps) {
  const fmt = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-5">💰 Doanh thu 7 ngày (BR-47)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} ₫`, "Doanh thu"]}
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Bar dataKey="revenue" radius={[6,6,0,0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 2 ? "#6366f1" : "#312e81"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Peak Hour Chart (BR-49) ──────────────────────────────────────────────────
interface PeakProps { data: { hour: string; sessions: number }[] }

export function PeakHourChart({ data }: PeakProps) {
  const maxSessions = Math.max(...data.map((d) => d.sessions));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-1">⏰ Giờ cao điểm (BR-49)</h2>
      <p className="text-xs text-gray-600 mb-5">
        Peak: <span className="text-amber-400 font-semibold">
          {data.find((d) => d.sessions === maxSessions)?.hour}
        </span> ({maxSessions} sessions)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [Number(value), "Sessions"]}
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Bar dataKey="sessions" radius={[6,6,0,0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.sessions === maxSessions ? "#f59e0b" : "#78350f"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Utilization Chart (BR-48) ────────────────────────────────────────────────
interface UtilProps { data: UtilizationStat[] }

export function UtilizationChart({ data }: UtilProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-5">📊 Tỉ lệ lấp đầy theo tầng (BR-48)</h2>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.floorName}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{d.floorName}</span>
              <span className="text-gray-500">{d.occupiedSlots}/{d.totalSlots} · <span className="text-indigo-400 font-semibold">{d.utilizationRate}%</span></span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  d.utilizationRate >= 80 ? "bg-red-500" :
                  d.utilizationRate >= 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${d.utilizationRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
