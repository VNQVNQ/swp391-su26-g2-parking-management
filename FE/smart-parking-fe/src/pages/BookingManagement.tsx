import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Copy, Check, AlertCircle, Calendar } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';

interface Booking {
  bookingId: string;
  bookingCode: string;
  vehicleLicensePlate: string;
  parkingSlotId: string;
  scheduledStartTime: string;
  expectedEndTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
  createdAt: string;
}

interface FormData {
  vehicleLicensePlate: string;
  parkingSlotId: string;
  scheduledStartTime: string;
  durationInMinutes: number;
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    vehicleLicensePlate: '',
    parkingSlotId: '',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    durationInMinutes: 60,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/bookings', formData);
      toast.success('Booking created successfully');
      setShowForm(false);
      setFormData({
        vehicleLicensePlate: '',
        parkingSlotId: '',
        scheduledStartTime: new Date().toISOString().slice(0, 16),
        durationInMinutes: 60,
      });
      fetchBookings();
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await axiosInstance.delete(`/bookings/${bookingId}`);
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Booking code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  let filteredBookings = bookings.filter(booking =>
    booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.vehicleLicensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterStatus === 'active') {
    filteredBookings = filteredBookings.filter(booking => 
      ['PENDING', 'CONFIRMED'].includes(booking.status)
    );
  } else if (filterStatus === 'cancelled') {
    filteredBookings = filteredBookings.filter(booking => 
      ['CANCELLED', 'EXPIRED'].includes(booking.status)
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Calendar size={14} /> },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', icon: <Check size={14} /> },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: <Trash2 size={14} /> },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <AlertCircle size={14} /> },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Check size={14} /> },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 ${config.bg} ${config.text} rounded-full text-sm font-medium flex items-center gap-1 w-fit`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            New Booking
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by booking code or license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'cancelled')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Bookings</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Booking</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Parking Slot</label>
                <input
                  type="text"
                  value={formData.parkingSlotId}
                  onChange={(e) => setFormData({ ...formData, parkingSlotId: e.target.value })}
                  placeholder="A-F1-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledStartTime}
                  onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Minutes)</label>
                <input
                  type="number"
                  value={formData.durationInMinutes}
                  onChange={(e) => setFormData({ ...formData, durationInMinutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="30"
                  step="30"
                />
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Booking
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

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Booking Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">License Plate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Parking Slot</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Scheduled Start</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expected End</th>
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
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.bookingId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">{booking.bookingCode}</span>
                          <button
                            onClick={() => handleCopyCode(booking.bookingCode)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Copy code"
                          >
                            {copiedCode === booking.bookingCode ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.vehicleLicensePlate}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{booking.parkingSlotId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(booking.scheduledStartTime)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(booking.expectedEndTime)}</td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                          <button
                            onClick={() => handleCancel(booking.bookingId)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel booking"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Total Bookings</p>
            <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'CONFIRMED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">
              {bookings.filter(b => b.status === 'CANCELLED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm mb-2">Expired</p>
            <p className="text-3xl font-bold text-gray-600">
              {bookings.filter(b => b.status === 'EXPIRED').length}
            </p>
          </div>
        </div>

        {/* Booking Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 How to Use Bookings</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Create a booking by selecting a parking slot and time</li>
            <li>✓ Copy the booking code and present it at check-in</li>
            <li>✓ The slot will be reserved and unavailable to others</li>
            <li>✓ Booking expires 30 minutes after the scheduled start time if not used</li>
            <li>✓ Fee will be calculated based on pricing rules at exit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
