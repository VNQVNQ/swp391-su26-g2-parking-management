import { useState } from "react";
import type { PricingRule, PricingRuleFormData } from "../../types/pricing.types";
import { mockPricingRules } from "../../data/mockPricing";
import PricingFormModal from "../../components/pricing/PricingFormModal";

export default function PricingConfig() {
  const [rules, setRules]       = useState<PricingRule[]>(mockPricingRules);
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState<PricingRule | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Add
  const handleAdd = () => { setEditing(null); setModal(true); };

  // Edit
  const handleEdit = (rule: PricingRule) => { setEditing(rule); setModal(true); };

  // Save (add or update)
  const handleSave = (data: PricingRuleFormData) => {
    if (editing) {
      setRules((prev) => prev.map((r) => r.id === editing.id ? { ...data, id: editing.id } : r));
    } else {
      const newId = Math.max(0, ...rules.map((r) => r.id)) + 1;
      setRules((prev) => [...prev, { ...data, id: newId }]);
    }
  };

  // Delete confirm
  const confirmDelete = (id: number) => setDeleteId(id);
  const handleDelete  = () => {
    if (deleteId !== null) {
      setRules((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    }
  };

  // Toggle status
  const toggleStatus = (id: number) =>
    setRules((prev) =>
      prev.map((r) => r.id === id
        ? { ...r, status: r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
        : r)
    );

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="p-6 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chỉ Manager được sửa cấu hình giá · BR-13
          </p>
        </div>
        {/* BR-13: chỉ Manager thấy nút Add */}
        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          ➕ Thêm rule
        </button>
      </div>

      {/* BR notices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon:"⚖️", label:"BR-11", desc:"ratePerHour > 0" },
          { icon:"📏", label:"BR-12", desc:"minimumFee ≤ rate×24" },
          { icon:"🕐", label:"BR-43", desc:"Overstay rate sau 24h" },
          { icon:"📍", label:"BR-42", desc:"Phụ phí sai zone" },
        ].map((b) => (
          <div key={b.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">{b.icon}</span>
            <div>
              <p className="text-xs font-bold text-indigo-400">{b.label}</p>
              <p className="text-xs text-gray-500">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Loại xe","Zone","Giá/giờ","Min fee","Peak rate","Overstay","Zone surcharge","Daily max","Status",""].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition">
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-lg">
                      {rule.vehicleType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{rule.zone}</td>
                  <td className="px-4 py-3 text-white font-medium">{fmt(rule.ratePerHour)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmt(rule.minimumFee)}</td>
                  <td className="px-4 py-3 text-amber-400 text-xs">{fmt(rule.peakHourRate)}</td>
                  <td className="px-4 py-3 text-red-400 text-xs">{fmt(rule.overstayRate)}</td>
                  <td className="px-4 py-3 text-orange-400 text-xs">{fmt(rule.zoneSurcharge)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmt(rule.dailyMaxFee)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(rule.id)}
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition ${
                        rule.status === "ACTIVE"
                          ? "bg-emerald-950/50 text-emerald-400 border-emerald-800 hover:bg-emerald-900"
                          : "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700"
                      }`}>
                      {rule.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(rule)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 hover:bg-indigo-950 px-2.5 py-1 rounded-lg transition">
                        ✏️ Sửa
                      </button>
                      <button onClick={() => confirmDelete(rule.id)}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 px-2.5 py-1 rounded-lg transition">
                        🗑 Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rules.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <p className="text-4xl mb-3">💰</p>
              <p>Chưa có pricing rule nào. Nhấn "Thêm rule" để tạo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <PricingFormModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onSave={handleSave}
        editing={editing}
      />

      {/* Delete confirm dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteId(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-semibold mb-2">⚠️ Xác nhận xóa</p>
            <p className="text-sm text-gray-400 mb-5">Bạn chắc chắn muốn xóa pricing rule này?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm bg-gray-800 text-gray-400 hover:text-white">
                Hủy
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-sm bg-red-600 hover:bg-red-500 text-white font-semibold">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
