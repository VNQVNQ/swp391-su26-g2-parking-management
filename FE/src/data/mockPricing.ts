import type { PricingRule } from "../types/pricing.types";

// BR-09: chỉ 4 vehicleType hợp lệ
export const mockPricingRules: PricingRule[] = [
  {
    id: 1,
    vehicleType:  "Car",
    zone:         "Zone A",
    ratePerHour:  20_000,
    minimumFee:   10_000,
    peakHourRate: 30_000,
    peakHourStart:"07:00",
    peakHourEnd:  "09:00",
    overstayRate: 50_000,   // BR-43
    zoneSurcharge: 5_000,   // BR-42
    dailyMaxFee:  200_000,
    status: "ACTIVE",
  },
  {
    id: 2,
    vehicleType:  "Motorbike",
    zone:         "Zone A",
    ratePerHour:  5_000,
    minimumFee:   3_000,
    peakHourRate: 8_000,
    peakHourStart:"07:00",
    peakHourEnd:  "09:00",
    overstayRate: 15_000,
    zoneSurcharge: 2_000,
    dailyMaxFee:  50_000,
    status: "ACTIVE",
  },
  {
    id: 3,
    vehicleType:  "Truck",
    zone:         "Zone B",
    ratePerHour:  40_000,
    minimumFee:   20_000,
    peakHourRate: 60_000,
    peakHourStart:"06:00",
    peakHourEnd:  "08:00",
    overstayRate: 100_000,
    zoneSurcharge: 10_000,
    dailyMaxFee:  400_000,
    status: "INACTIVE",
  },
];
