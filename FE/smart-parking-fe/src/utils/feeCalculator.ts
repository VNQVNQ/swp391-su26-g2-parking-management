// BR-01: Fee = ceil((exitTime − entryTime) / 60) × hourlyRate
// Áp dụng minimumFee nếu thời gian < 1 giờ
export function calculateFee(
  entryTime:   Date,
  exitTime:    Date,
  hourlyRate:  number,
  minimumFee:  number,
  overstayRate?: number   // BR-43: áp dụng sau 24h
): number {
  const diffMs      = exitTime.getTime() - entryTime.getTime();
  const diffMinutes = diffMs / 60_000;
  const diffHours   = Math.ceil(diffMinutes / 60);

  // BR-43: session > 24h → dùng overstayRate
  if (diffHours > 24 && overstayRate) {
    const normalFee   = 24 * hourlyRate;
    const overstayFee = (diffHours - 24) * overstayRate;
    return normalFee + overstayFee;
  }

  const fee = diffHours * hourlyRate;

  // BR-01: áp dụng minimumFee nếu < 1 giờ
  return Math.max(fee, minimumFee);
}
