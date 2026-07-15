import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';

interface PricingRule {
  pricingRuleId: string;
  vehicleType: string;
  ticketType: string;
  hourlyRate: number;
  dailyRate: number;
  peakHourMultiplier: number;
  effectiveDate: string;
  expiryDate: string;
  zoneId?: string;
  createdAt: string;
}

interface FormData {
  vehicleType: string;
  ticketType: string;
  hourlyRate: number;
  dailyRate: number;
  peakHourMultiplier: number;
  effectiveDate: string;
  expiryDate: string;
  zoneId?: string;
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: 'Ô tô',
  MOTORCYCLE: 'Xe máy',
  TRUCK: 'Xe tải',
};

const TICKET_TYPE_LABELS: Record<string, string> = {
  HOURLY: 'Theo giờ',
  DAILY: 'Theo ngày',
  MONTHLY: 'Theo tháng',
};

export default function PricingRuleManagement() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'CAR',
    ticketType: 'HOURLY',
    hourlyRate: 20000,
    dailyRate: 150000,
    peakHourMultiplier: 1.5,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/pricing-rules');
      setRules(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách bảng giá');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => ({
    vehicleType: 'CAR',
    ticketType: 'HOURLY',
    hourlyRate: 20000,
    dailyRate: 150000,
    peakHourMultiplier: 1.5,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/pricing-rules/${editingId}`, formData);
        toast.success('Cập nhật bảng giá thành công');
      } else {
        await axiosInstance.post('/pricing-rules', formData);
        toast.success('Tạo bảng giá thành công');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(resetForm());
      fetchRules();
    } catch (error) {
      toast.error('Không thể lưu bảng giá');
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setFormData({
      vehicleType: rule.vehicleType,
      ticketType: rule.ticketType,
      hourlyRate: rule.hourlyRate,
      dailyRate: rule.dailyRate,
      peakHourMultiplier: rule.peakHourMultiplier,
      effectiveDate: rule.effectiveDate,
      expiryDate: rule.expiryDate,
      zoneId: rule.zoneId,
    });
    setEditingId(rule.pricingRuleId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bảng giá này không?')) {
      try {
        await axiosInstance.delete(`/pricing-rules/${id}`);
        toast.success('Xóa bảng giá thành công');
        fetchRules();
      } catch (error) {
        toast.error('Không thể xóa bảng giá');
      }
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.ticketType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tiêu đề */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Bảng Giá</h1>
            <p className="text-gray-500 text-sm mt-1">Thiết lập mức phí gửi xe theo loại xe và loại vé</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData(resetForm());
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Thêm bảng giá
          </button>
        </div>

        {/* Tìm kiếm */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo loại xe hoặc loại vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* Form tạo / chỉnh sửa */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? '✏️ Chỉnh sửa bảng giá' : '➕ Tạo bảng giá mới'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại xe</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="CAR">Ô tô</option>
                  <option value="MOTORCYCLE">Xe máy</option>
                  <option value="TRUCK">Xe tải</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại vé</label>
                <select
                  value={formData.ticketType}
                  onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="HOURLY">Theo giờ</option>
                  <option value="DAILY">Theo ngày</option>
                  <option value="MONTHLY">Theo tháng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá theo giờ (VNĐ)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                  className={inputClass}
                  required
                  min="0"
                  placeholder="VD: 20000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá theo ngày (VNĐ)</label>
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                  className={inputClass}
                  required
                  min="0"
                  placeholder="VD: 150000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hệ số giờ cao điểm</label>
                <input
                  type="number"
                  value={formData.peakHourMultiplier}
                  onChange={(e) => setFormData({ ...formData, peakHourMultiplier: parseFloat(e.target.value) })}
                  className={inputClass}
                  required
                  min="1"
                  step="0.1"
                  placeholder="VD: 1.5"
                />
                <p className="text-xs text-gray-400 mt-1">Áp dụng trong giờ cao điểm (không áp dụng cho quá giờ)</p>
              </div>

              <div>
                {/* empty cell for grid alignment */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu hiệu lực</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hiệu lực</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? '💾 Cập nhật' : '✅ Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bảng danh sách */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại xe</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại vé</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giá/giờ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giá/ngày</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hệ số cao điểm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thời gian hiệu lực</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không tìm thấy bảng giá nào
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.pricingRuleId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {VEHICLE_TYPE_LABELS[rule.vehicleType] || rule.vehicleType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {TICKET_TYPE_LABELS[rule.ticketType] || rule.ticketType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        {rule.hourlyRate.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rule.dailyRate.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          x{rule.peakHourMultiplier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rule.effectiveDate} → {rule.expiryDate}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.pricingRuleId)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Tổng số bảng giá</p>
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Loại xe</p>
            <p className="text-3xl font-bold text-blue-600">{new Set(rules.map(r => r.vehicleType)).size}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Đang hoạt động</p>
            <p className="text-3xl font-bold text-green-600">
              {rules.filter(r => new Date(r.expiryDate) > new Date()).length}
            </p>
          </div>
        </div>

        {/* Ghi chú */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📌 Ghi chú về phí ngoại lệ</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Quá giờ:</strong> Tính thêm theo mức giá/giờ tiêu chuẩn — không có hệ số nhân phạt.</li>
            <li>• <strong>Mất vé / Sai khu vực:</strong> Nhân viên xác định mức phạt khi xử lý ngoại lệ, dựa trên bảng giá này.</li>
            <li>• Nhân viên tự xử lý ngoại lệ ngay lập tức, không cần chờ quản lý phê duyệt.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
