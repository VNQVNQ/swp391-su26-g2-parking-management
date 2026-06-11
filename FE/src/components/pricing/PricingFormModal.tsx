import { useState, useEffect } from "react";
import type { PricingRule, PricingRuleFormData } from "../../types/pricing.types";
import type { VehicleType } from "../../types/slot.types";
import { validatePricingForm } from "../../utils/validators";

// BR-09: chỉ 4 loại xe này
const VEHICLE_TYPES: VehicleType[] = ["Motorbike", "Car", "Bicycle", "Truck"];
const ZONES = ["Zone A", "Zone B", "Zone C"];

const EMPTY_FORM: PricingRuleFormData = {
  vehicleType:   "Motorbike",
  zone:          "Zone A",
  ratePerHour:   0,
  minimumFee:    0,
  peakHourRate:  0,
  peakHourStart: "07:00",
  peakHourEnd:   "09:00",
  overstayRate:  0,
  zoneSurcharge: 0,
  dailyMaxFee:   0,
  status:        "ACTIVE",
};

interface Props {
  open:    boolean;
  onClose: () => void;
  onSave:  (data: PricingRuleFormData) => void;
  editing: PricingRule | null;
}

export default function PricingFormModal({ open, onClose, onSave, editing }: Props) {
  const [form, setForm] = useState<PricingRuleFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing) {
      const { id: _, ...rest } = editing;
      setForm(rest);
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editing, open]);

  if (!open) return null;

  const set = (field: keyof PricingRuleFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const errs = validatePricingForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
    onClose();
  };

  const numField = (label: string, field: keyof PricingRuleFormData, note?: string) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={form[field] as number}
        onChange={(e) => set(field, Number(e.target.value))}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition"
        min={0}
      />
      {note && <p className="text-xs text-gray-600 mt-0.5">{note}</p>}
      {errors[field] && <p className="text-xs text-red-400 mt-0.5">⚠️ {errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <h3 className="font-semibold text-white">
            {editing ? "✏️ Sửa Pricing Rule" : "➕ Thêm Pricing Rule"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* VehicleType + Zone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Loại xe (BR-09)</label>
              <select
                value={form.vehicleType}
                onChange={(e) => set("vehicleType", e.target.value as VehicleType)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
              {errors.vehicleType && <p className="text-xs text-red-400 mt-0.5">⚠️ {errors.vehicleType}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Zone</label>
              <select
                value={form.zone}
                onChange={(e) => set("zone", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            {numField("Giá/giờ (₫) — BR-11", "ratePerHour", "Phải > 0")}
            {numField("Phí tối thiểu (₫) — BR-12", "minimumFee", `≤ ratePerHour × 24`)}
            {numField("Giá giờ cao điểm (₫)", "peakHourRate")}
            {numField("Phí Overstay/giờ (₫) — BR-43", "overstayRate", "Áp dụng sau 24h")}
            {numField("Phụ phí sai Zone (₫) — BR-42", "zoneSurcharge")}
            {numField("Phí tối đa/ngày (₫)", "dailyMaxFee")}
          </div>

          {/* Peak hour range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Giờ cao điểm từ</label>
              <input type="time" value={form.peakHourStart}
                onChange={(e) => set("peakHourStart", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">đến</label>
              <input type="time" value={form.peakHourEnd}
                onChange={(e) => set("peakHourEnd", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Trạng thái</label>
            <div className="flex gap-3">
              {(["ACTIVE","INACTIVE"] as const).map((s) => (
                <button key={s} onClick={() => set("status", s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                    form.status === s
                      ? s === "ACTIVE"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-600 text-white"
                      : "bg-gray-800 text-gray-500 hover:text-gray-300"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 sticky bottom-0 bg-gray-900">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm bg-gray-800 text-gray-400 hover:text-white transition">
            Hủy
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-600/20">
            {editing ? "Lưu thay đổi" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
