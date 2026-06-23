import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';

interface MonthlyPass {
  monthlyPassId: string;
  vehicleLicensePlate: string;
  passType: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  remainingDays: number;
  createdAt: string;
}

interface FormData {
  vehicleLicensePlate: string;
  passType: string;
  startDate: string;
  endDate: string;
}

export default function MonthlyPassManagement() {
  const [passes, setPasses] = useState<MonthlyPass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [formData, setFormData] = useState<FormData>({
    vehicleLicensePlate: '',
    passType: 'STANDARD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/monthly-passes');
      setPasses(response.data);
    } catch (error) {
      toast.error('Failed to fetch monthly passes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/monthly-passes/${editingId}`, formData);
        toast.success('Monthly pass updated successfully');
      } else {
        await axiosInstance.post('/monthly-passes', formData);
        toast.success('Monthly pass created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        vehicleLicensePlate: '',
        passType: 'STANDARD',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      });
      fetchPasses();
    } catch (error) {
      toast.error('Failed to save monthly pass');
    }
  };

  const handleRenew = async (passId: string, licensePlate: string) => {
    try {
      await axiosInstance.post(`/monthly-passes/${passId}/renew`, {
        vehicleLicensePlate: licensePlate,
        durationInMonths: 1,
      });
      toast.success('Monthly pass renewed successfully');
      fetchPasses();
    } catch (error) {
      toast.error('Failed to renew monthly pass');
    }
  };

  const handleEdit = (pass: MonthlyPass) => {
    setFormData({
      vehicleLicensePlate: pass.vehicleLicensePlate,
      passType: pass.passType,
      startDate: pass.startDate,
      endDate: pass.endDate,
    });
    setEditingId(pass.monthlyPassId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this monthly pass?')) {
      try {
        await axiosInstance.delete(`/monthly-passes/${id}`);
        toast.success('Monthly pass cancelled successfully');
        fetchPasses();
      } catch (error) {
        toast.error('Failed to cancel monthly pass');
      }
    }
  };

  let filteredPasses = passes.filter(pass =>
    pass.vehicleLicensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterStatus === 'active') {
    filteredPasses = filteredPasses.filter(pass => pass.isActive);
  } else if (filterStatus === 'expired') {
    filteredPasses = filteredPasses.filter(pass => !pass.isActive);
  }

  const getStatusBadge = (pass: MonthlyPass) => {
    if (!pass.isActive) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Expired</span>;
    }
    if (pass.remainingDays <= 7) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Expiring Soon</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</span>;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Monthly Pass Management</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                vehicleLicensePlate: '',
                passType: 'STANDARD',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            New Pass
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Passes</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Create'} Monthly Pass</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  value={formData.vehicleLicensePlate}
                  onChange={(e) => setFormData({ ...formData, vehicleLicensePlate: e.target.value.toUpperCase() })}
                  placeholder="ABC-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pass Type</label>
                <select
                  value={formData.passType}
                  onChange={(e) => setFormData({ ...formData, passType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Pass
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

        {/* Passes Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">License Plate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pass Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Remaining Days</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No monthly passes found
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((pass) => (
                    <tr key={pass.monthlyPassId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{pass.vehicleLicensePlate}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pass.passType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pass.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pass.endDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`font-medium ${pass.remainingDays <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {pass.remainingDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(pass)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {pass.isActive && (
                          <button
                            onClick={() => handleRenew(pass.monthlyPassId, pass.vehicleLicensePlate)}
                            className="text-green-600 hover:text-green-800 mr-4"
                            title="Renew Pass"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(pass)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pass.monthlyPassId)}
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
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Total Passes</p>
            <p className="text-3xl font-bold text-blue-600">{passes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              Active
            </p>
            <p className="text-3xl font-bold text-green-600">{passes.filter(p => p.isActive).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
              <Clock size={16} className="text-yellow-600" />
              Expiring Soon
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {passes.filter(p => p.isActive && p.remainingDays <= 7).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Expired</p>
            <p className="text-3xl font-bold text-red-600">{passes.filter(p => !p.isActive).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
