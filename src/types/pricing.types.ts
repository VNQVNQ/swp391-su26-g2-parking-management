import type { VehicleType } from "./slot.types";
// BR-09, BR-10, BR-11, BR-12, BR-42, BR-43
export interface PricingRule {
  id: number;
  vehicleType: VehicleType;
  zone: string;
  ratePerHour: number;       // BR-11: phải > 0
  minimumFee: number;        // BR-12: phải <= ratePerHour * 24
  peakHourRate: number;
  peakHourStart: string;     // "HH:mm"
  peakHourEnd: string;       // "HH:mm"
  overstayRate: number;      // BR-43: áp dụng sau 24h
  zoneSurcharge: number;     // BR-42: phụ phí sai zone
  dailyMaxFee: number;
  status: "ACTIVE" | "INACTIVE";
}

export type PricingRuleFormData = Omit<PricingRule, "id">;
