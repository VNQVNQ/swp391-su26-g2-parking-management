import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';

interface PricingRule {
  pricingRuleId: string;
  vehicleType: string;
  ticketType: string;
  hourlyRate: number;
  dailyRate: number;
  peakHourMultiplier: number;
  overstayMultiplier: number;
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
  overstayMultiplier: number;
  effectiveDate: string;
  expiryDate: string;
  zoneId?: string;
}

export default function PricingRuleManagement() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'CAR',
    ticketType: 'HOURLY',
    hourlyRate: 50000,
    dailyRate: 300000,
    peakHourMultiplier: 1.5,
    overstayMultiplier: 2.0,
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
      toast.error('Failed to fetch pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/pricing-rules/${editingId}`, formData);
        toast.success('Pricing rule updated successfully');
      } else {
        await axiosInstance.post('/pricing-rules', formData);
        toast.success('Pricing rule created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        vehicleType: 'CAR',
        ticketType: 'HOURLY',
        hourlyRate: 50000,
        dailyRate: 300000,
        peakHourMultiplier: 1.5,
        overstayMultiplier: 2.0,
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      });
      fetchRules();
    } catch (error) {
      toast.error('Failed to save pricing rule');
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setFormData({
      vehicleType: rule.vehicleType,
      ticketType: rule.ticketType,
      hourlyRate: rule.hourlyRate,
      dailyRate: rule.dailyRate,
      peakHourMultiplier: rule.peakHourMultiplier,
      overstayMultiplier: rule.overstayMultiplier,
      effectiveDate: rule.effectiveDate,
      expiryDate: rule.expiryDate,
      zoneId: rule.zoneId,
    });
    setEditingId(rule.pricingRuleId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      try {
        await axiosInstance.delete(`/pricing-rules/${id}`);
        toast.success('Pricing rule deleted successfully');
        fetchRules();
      } catch (error) {
        toast.error('Failed to delete pricing rule');
      }
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.ticketType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pricing Rule Management</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                vehicleType: 'CAR',
                ticketType: 'HOURLY',
                hourlyRate: 50000,
                dailyRate: 300000,
                peakHourMultiplier: 1.5,
                overstayMultiplier: 2.0,
                effectiveDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            New Rule
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by vehicle type or ticket type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Create'} Pricing Rule</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CAR">Car</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="TRUCK">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type</label>
                <select
                  value={formData.ticketType}
                  onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (VND)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (VND)</label>
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peak Hour Multiplier</label>
                <input
                  type="number"
                  value={formData.peakHourMultiplier}
                  onChange={(e) => setFormData({ ...formData, peakHourMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overstay Multiplier</label>
                <input
                  type="number"
                  value={formData.overstayMultiplier}
                  onChange={(e) => setFormData({ ...formData, overstayMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rules Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vehicle Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ticket Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hourly Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Daily Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Peak Multiplier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Overstay Multiplier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Effective Period</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No pricing rules found
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.pricingRuleId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.vehicleType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.ticketType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.hourlyRate.toLocaleString()} VND</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.dailyRate.toLocaleString()} VND</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.peakHourMultiplier}x</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rule.overstayMultiplier}x</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rule.effectiveDate} ~ {rule.expiryDate}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.pricingRuleId)}
                          className="text-red-600 hover:text-red-800"
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Total Rules</p>
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Vehicle Types</p>
            <p className="text-3xl font-bold text-blue-600">{new Set(rules.map(r => r.vehicleType)).size}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Active Rules</p>
            <p className="text-3xl font-bold text-blue-600">
              {rules.filter(r => new Date(r.expiryDate) > new Date()).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
