interface Props {
  totalSlots:    number;
  occupiedSlots: number;
  reservedSlots: number;
  availableSlots: number;
  revenueToday:  number;
}

export default function StatCards({
  totalSlots, occupiedSlots, reservedSlots, availableSlots, revenueToday
}: Props) {
  // BR-48
  const utilizationRate = Math.round((occupiedSlots / totalSlots) * 100);

  const cards = [
    {
      label: "Tổng slot",
      value: totalSlots,
      sub: "toàn bãi",
      color: "text-white",
      bg: "bg-gray-800 border-gray-700",
      icon: "🅿️",
    },
    {
      label: "Đang đỗ",
      value: occupiedSlots,
      sub: `${utilizationRate}% lấp đầy`,
      color: "text-red-400",
      bg: "bg-red-950/40 border-red-900/50",
      icon: "🚗",
    },
    {
      label: "Đã đặt trước",
      value: reservedSlots,
      sub: "chờ xe vào",
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-900/50",
      icon: "📌",
    },
    {
      label: "Còn trống",
      value: availableSlots,
      sub: "sẵn sàng",
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-900/50",
      icon: "✅",
    },
    {
      label: "Doanh thu hôm nay",
      value: revenueToday.toLocaleString("vi-VN") + " ₫",
      sub: "session đã thanh toán",
      color: "text-indigo-400",
      bg: "bg-indigo-950/40 border-indigo-900/50",
      icon: "💰",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} border rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">{c.label}</span>
            <span className="text-lg">{c.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-gray-600 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
