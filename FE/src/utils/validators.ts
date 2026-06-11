import type { PricingRuleFormData } from "../types/pricing.types";

export interface ValidationErrors {
  [field: string]: string;
}

// BR-11: ratePerHour > 0
// BR-12: minimumFee <= ratePerHour * 24
export function validatePricingForm(data: PricingRuleFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.vehicleType) {
    errors.vehicleType = "Vui lòng chọn loại xe";
  }

  if (!data.zone.trim()) {
    errors.zone = "Vui lòng nhập zone";
  }

  // BR-11
  if (!data.ratePerHour || data.ratePerHour <= 0) {
    errors.ratePerHour = "Giá/giờ phải lớn hơn 0 (BR-11)";
  }

  // BR-12
  if (data.minimumFee > data.ratePerHour * 24) {
    errors.minimumFee = `Phí tối thiểu không được vượt ${(data.ratePerHour * 24).toLocaleString("vi-VN")} ₫ (BR-12)`;
  }

  if (data.peakHourRate <= 0) {
    errors.peakHourRate = "Giá giờ cao điểm phải > 0";
  }

  if (data.overstayRate <= 0) {
    errors.overstayRate = "Phí overstay phải > 0 (BR-43)";
  }

  return errors;
}
