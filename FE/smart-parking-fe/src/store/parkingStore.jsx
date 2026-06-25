import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/* ============================================================
   INITIAL DATA
   ============================================================ */

// Slot generation helper
const mkSlots = (n, occupiedPlates = []) => {
  return Array.from({ length: n }, (_, i) => {
    const id = String(i + 1).padStart(3, '0');
    const occupiedEntry = occupiedPlates.find(op => op.slotIndex === i);
    return {
      id,
      status: occupiedEntry ? 'occupied' : 'available',
      vehicle: occupiedEntry ? occupiedEntry.plate : null,
    };
  });
};

// Pre-parked vehicles
const initialVehicles = [
  {
    plate: '30A-123.45', type: 'Car', slot: 'A-001', entryTime: new Date(2026, 5, 3, 7, 14),
    owner: 'Nguyen Van A', ticketType: 'hourly', faceRegistered: false, zoneId: 'zone-a',
  },
  {
    plate: '29B-567.89', type: 'Motorbike', slot: 'B-001', entryTime: new Date(2026, 5, 3, 7, 21),
    owner: 'Jane Doe', ticketType: 'hourly', faceRegistered: false, zoneId: 'zone-b',
  },
  {
    plate: '51F-111.22', type: 'Car', slot: 'A-002', entryTime: new Date(2026, 5, 3, 6, 59),
    owner: 'John Smith', ticketType: 'hourly', faceRegistered: false, hasPass: true, zoneId: 'zone-a',
  },
  {
    plate: '30H-999.88', type: 'Motorbike', slot: 'B-002', entryTime: new Date(2026, 5, 3, 6, 29),
    owner: 'Mike Wilson', ticketType: 'hourly', faceRegistered: false, overstay: true, zoneId: 'zone-b',
  },
  {
    plate: '29A-333.44', type: 'Car', slot: 'A-003', entryTime: new Date(2026, 5, 3, 7, 24),
    owner: 'Sarah Johnson', ticketType: 'hourly', faceRegistered: false, zoneId: 'zone-a',
  },
];

const initialZones = [
  { id: 'zone-a', name: 'Zone A - Cars', location: 'Basement 1', floor: 'Basement 1', vehicleType: 'Car', total: 50, slots: mkSlots(50, [{ slotIndex: 0, plate: '30A-123.45' }, { slotIndex: 1, plate: '51F-111.22' }, { slotIndex: 2, plate: '29A-333.44' }]) },
  { id: 'zone-b', name: 'Zone B - Motorbikes', location: 'Basement 1', floor: 'Basement 1', vehicleType: 'Motorbike', total: 50, slots: mkSlots(50, [{ slotIndex: 0, plate: '29B-567.89' }, { slotIndex: 1, plate: '30H-999.88' }]) },
  { id: 'zone-c', name: 'Zone C - Cars', location: 'Basement 2', floor: 'Basement 2', vehicleType: 'Car', total: 40, slots: mkSlots(40, []) },
  { id: 'zone-d', name: 'Zone D - Motorbikes', location: 'Basement 2', floor: 'Basement 2', vehicleType: 'Motorbike', total: 40, slots: mkSlots(40, []) },
  { id: 'zone-e', name: 'Zone E - Cars', location: 'Floor 1', floor: 'Floor 1', vehicleType: 'Car', total: 30, slots: mkSlots(30, []) },
  { id: 'zone-f', name: 'Zone F - Bicycles', location: 'Floor 1', floor: 'Floor 1', vehicleType: 'Bicycle', total: 30, slots: mkSlots(30, []) },
  { id: 'zone-g', name: 'Zone G - Cars', location: 'Floor 2', floor: 'Floor 2', vehicleType: 'Car', total: 25, slots: mkSlots(25, []) },
  { id: 'zone-h', name: 'Zone H - Motorbikes', location: 'Floor 2', floor: 'Floor 2', vehicleType: 'Motorbike', total: 25, slots: mkSlots(25, []) },
];

const initialPricing = [
  { id: 1, name: 'Car Hourly', vehicleType: 'Car', ticketType: 'Hourly', rate: 20000, minFee: 20000, maxDaily: 150000, overstay: 30000, peakStart: '07:00', peakEnd: '09:00', peakMult: 1.5, active: true },
  { id: 2, name: 'Motorbike Hourly', vehicleType: 'Motorbike', ticketType: 'Hourly', rate: 5000, minFee: 5000, maxDaily: 30000, overstay: 8000, peakStart: '07:00', peakEnd: '09:00', peakMult: 1.5, active: true },
  { id: 3, name: 'Truck Hourly', vehicleType: 'Truck', ticketType: 'Hourly', rate: 30000, minFee: 30000, maxDaily: 250000, overstay: 50000, peakStart: '', peakEnd: '', peakMult: 0, active: true },
  { id: 4, name: 'Car Daily', vehicleType: 'Car', ticketType: 'Daily', rate: 150000, minFee: 0, maxDaily: 0, overstay: 0, peakStart: '', peakEnd: '', peakMult: 0, active: true },
  { id: 5, name: 'Motorbike Daily', vehicleType: 'Motorbike', ticketType: 'Daily', rate: 30000, minFee: 0, maxDaily: 0, overstay: 0, peakStart: '', peakEnd: '', peakMult: 0, active: true },
  { id: 6, name: 'Truck Daily', vehicleType: 'Truck', ticketType: 'Daily', rate: 250000, minFee: 0, maxDaily: 0, overstay: 0, peakStart: '', peakEnd: '', peakMult: 0, active: false },
  { id: 7, name: 'Car Monthly', vehicleType: 'Car', ticketType: 'Monthly', rate: 2500000, minFee: 0, maxDaily: 0, overstay: 0, peakStart: '', peakEnd: '', peakMult: 0, active: true },
  { id: 8, name: 'Motorbike Monthly', vehicleType: 'Motorbike', ticketType: 'Monthly', rate: 500000, minFee: 0, maxDaily: 0, overstay: 0, peakStart: '', peakEnd: '', peakMult: 0, active: true },
];

const initialPasses = [
  { id: 1, plate: '51F-111.22', type: 'Car', owner: 'John Smith', phone: '0901234567', start: '2025-01-01', expiry: '2026-07-01', fee: 2500000, status: 'Active' },
  { id: 2, plate: '59B-456.78', type: 'Motorbike', owner: 'Tran Thi B', phone: '0912345678', start: '2025-02-15', expiry: '2026-08-15', fee: 500000, status: 'Active' },
  { id: 3, plate: '30H-789.01', type: 'Car', owner: 'Le Van C', phone: '0923456789', start: '2025-03-01', expiry: '2025-06-01', fee: 2500000, status: 'Expired' },
];

const initialBookings = [
  { id: 1, plate: '51A-222.33', type: 'Car', slot: 'A-015', startTime: '2026-06-03 08:00', endTime: '2026-06-03 18:00', status: 'Confirmed' },
  { id: 2, plate: '59C-444.55', type: 'Motorbike', slot: 'B-022', startTime: '2026-06-04 09:00', endTime: '2026-06-04 17:00', status: 'Pending' },
];

const initialExceptions = [
  { id: 'EX-001', type: 'Lost Ticket', desc: 'Customer reported lost motorbike ticket', surcharge: 50000, createdBy: 'Staff A', time: '2 hours ago', status: 'Pending', plate: '59B-456.78', resolutionNotes: '' },
  { id: 'EX-002', type: 'Overstay', desc: 'Vehicle parked over 24 hours', surcharge: 0, createdBy: 'System', time: '5 hours ago', status: 'Resolved', plate: '30H-789.01', resolutionNotes: 'Owner contacted and vehicle removed' },
  { id: 'EX-003', type: 'Wrong Zone', desc: 'Car parked in motorbike zone', surcharge: 100000, createdBy: 'Staff B', time: '1 day ago', status: 'Resolved', plate: '51A-123.45', resolutionNotes: 'Vehicle relocated and surcharge paid' },
];

const initialSettings = {
  lotInfo: { name: 'ParkingPro Central', address: '123 Nguyen Hue, District 1, HCMC', phone: '028-1234-5678', email: 'info@parkingpro.vn', hours: '06:00 - 22:00' },
  notifications: { overstay: true, capacity: true, passExpiry: true, dailyReport: false },
  security: { twoFactor: false, autoLogout: true, activityLog: true },
};

/* ============================================================
   CONTEXT
   ============================================================ */
const ParkingContext = createContext(null);

export function useParkingStore() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParkingStore must be used within ParkingProvider');
  return ctx;
}

/* ============================================================
   PROVIDER
   ============================================================ */
export function ParkingProvider({ children }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [exitedVehicles, setExitedVehicles] = useState([]);
  const [zones, setZones] = useState(initialZones);
  const [pricingConfigs, setPricingConfigs] = useState(initialPricing);
  const [passes, setPasses] = useState(initialPasses);
  const [bookings, setBookings] = useState(initialBookings);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [settings, setSettings] = useState(initialSettings);
  const [toastMessage, setToastMessage] = useState('');

  // --- Toast ---
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // --- Computed Stats ---
  const slotStats = useMemo(() => {
    let available = 0, occupied = 0, reserved = 0, maintenance = 0;
    zones.forEach(z => z.slots.forEach(s => {
      if (s.status === 'available') available++;
      else if (s.status === 'occupied') occupied++;
      else if (s.status === 'reserved') reserved++;
      else if (s.status === 'maintenance') maintenance++;
    }));
    return { available, occupied, reserved, maintenance, total: available + occupied + reserved + maintenance };
  }, [zones]);

  const todayRevenue = useMemo(() => {
    return exitedVehicles.reduce((sum, v) => sum + (v.totalFee || 0), 0);
  }, [exitedVehicles]);

  // --- Vehicle Actions ---
  const findAvailableSlot = useCallback((vehicleType) => {
    const typeMap = { Car: 'Car', Motorbike: 'Motorbike', Truck: 'Car', Bicycle: 'Bicycle' };
    const matchType = typeMap[vehicleType] || vehicleType;
    for (const zone of zones) {
      if (zone.vehicleType !== matchType) continue;
      const slotIdx = zone.slots.findIndex(s => s.status === 'available');
      if (slotIdx !== -1) {
        const slotCode = `${zone.id.replace('zone-', '').toUpperCase()}-${zone.slots[slotIdx].id}`;
        return { zoneId: zone.id, slotId: zone.slots[slotIdx].id, slotCode, floor: zone.floor };
      }
    }
    return null;
  }, [zones]);

  const registerVehicle = useCallback((data) => {
    const slot = findAvailableSlot(data.type);
    if (!slot) return { success: false, error: 'No available slots for this vehicle type' };

    // Check for duplicate plate
    const dup = vehicles.find(v => v.plate.toLowerCase() === data.plate.toLowerCase());
    if (dup) return { success: false, error: 'Vehicle with this plate is already parked' };

    const now = new Date();
    const newVehicle = {
      plate: data.plate,
      type: data.type,
      slot: slot.slotCode,
      entryTime: now,
      owner: data.owner,
      ticketType: data.ticketType || 'hourly',
      faceRegistered: data.faceRegistered || false,
      zoneId: slot.zoneId,
      hasPass: passes.some(p => p.plate.toLowerCase() === data.plate.toLowerCase() && p.status === 'Active'),
    };

    setVehicles(prev => [...prev, newVehicle]);
    setZones(prev => prev.map(z => z.id !== slot.zoneId ? z : {
      ...z,
      slots: z.slots.map(s => s.id !== slot.slotId ? s : { ...s, status: 'occupied', vehicle: data.plate }),
    }));

    showToast(`Vehicle ${data.plate} registered successfully`);
    return { success: true, vehicle: newVehicle, slot: slot.slotCode, floor: slot.floor };
  }, [vehicles, zones, passes, findAvailableSlot, showToast]);

  const exitVehicle = useCallback((plate, totalFee, isLostTicket = false) => {
    const vehicle = vehicles.find(v => v.plate === plate);
    if (!vehicle) return { success: false, error: 'Vehicle not found' };

    const exitRecord = {
      ...vehicle,
      exitTime: new Date(),
      totalFee: totalFee || 0,
      isLostTicket,
    };

    setExitedVehicles(prev => [...prev, exitRecord]);
    setVehicles(prev => prev.filter(v => v.plate !== plate));
    setZones(prev => prev.map(z => z.id !== vehicle.zoneId ? z : {
      ...z,
      slots: z.slots.map(s => s.vehicle === plate ? { ...s, status: 'available', vehicle: null } : s),
    }));

    showToast(`Vehicle ${plate} exited successfully`);
    return { success: true, receipt: exitRecord };
  }, [vehicles, showToast]);

  // --- Fee Calculation ---
  const calculateFee = useCallback((vehicle) => {
    if (!vehicle) return 0;

    // Monthly pass holders pay nothing
    if (vehicle.hasPass || passes.some(p => p.plate.toLowerCase() === vehicle.plate.toLowerCase() && p.status === 'Active')) {
      return 0;
    }

    const now = new Date();
    const entryTime = vehicle.entryTime instanceof Date ? vehicle.entryTime : new Date(vehicle.entryTime);
    const diffMs = now - entryTime;
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.ceil(diffMinutes / 60) || 1;

    // Find matching pricing config
    const ticketType = (vehicle.ticketType || 'hourly').charAt(0).toUpperCase() + (vehicle.ticketType || 'hourly').slice(1);
    const config = pricingConfigs.find(p =>
      p.vehicleType === vehicle.type &&
      p.ticketType === ticketType &&
      p.active
    );

    if (!config) {
      // Fallback: 25000 per hour
      return Math.ceil(hours) * 25000;
    }

    if (ticketType === 'Daily') {
      return config.rate;
    }

    let fee = hours * config.rate;

    // Apply minimum fee
    if (config.minFee && fee < config.minFee) {
      fee = config.minFee;
    }

    // Apply max daily cap
    if (config.maxDaily && config.maxDaily > 0 && fee > config.maxDaily) {
      fee = config.maxDaily;
    }

    return fee;
  }, [pricingConfigs, passes]);

  const getOverstayPenalty = useCallback((vehicle) => {
    if (!vehicle || !vehicle.overstay) return 0;
    const config = pricingConfigs.find(p => p.vehicleType === vehicle.type && p.ticketType === 'Hourly' && p.active);
    return config?.overstay || 100000;
  }, [pricingConfigs]);

  // --- Slot Actions ---
  const updateSlotStatus = useCallback((zoneId, slotId, newStatus) => {
    setZones(prev => prev.map(z => z.id !== zoneId ? z : {
      ...z,
      slots: z.slots.map(s => s.id !== slotId ? s : { ...s, status: newStatus, vehicle: newStatus === 'occupied' ? s.vehicle : null }),
    }));
    showToast(`Slot status updated to ${newStatus}`);
  }, [showToast]);

  const addZone = useCallback((zone) => {
    const newZone = {
      ...zone,
      id: `zone-${Date.now()}`,
      slots: Array.from({ length: zone.total || 10 }, (_, i) => ({
        id: String(i + 1).padStart(3, '0'),
        status: 'available',
        vehicle: null,
      }))
    };
    setZones(prev => [...prev, newZone]);
    showToast(`Zone ${zone.name} added`);
  }, [showToast]);

  const updateZone = useCallback((id, data) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...data } : z));
    showToast(`Zone updated`);
  }, [showToast]);

  const deleteZone = useCallback((id) => {
    setZones(prev => prev.filter(z => z.id !== id));
    showToast(`Zone deleted`);
  }, [showToast]);

  const addSlot = useCallback((zoneId) => {
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      // Find max ID to avoid duplicates if slots were deleted
      const maxNum = z.slots.reduce((max, s) => {
        const num = parseInt(s.id, 10);
        return num > max ? num : max;
      }, 0);
      const newSlotId = String(maxNum + 1).padStart(3, '0');
      const newSlot = { id: newSlotId, status: 'available', vehicle: null };
      return { ...z, total: z.total + 1, slots: [...z.slots, newSlot] };
    }));
    showToast(`Slot added to zone`);
  }, [showToast]);

  const deleteSlot = useCallback((zoneId, slotId) => {
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      return { 
        ...z, 
        total: z.total - 1, 
        slots: z.slots.filter(s => s.id !== slotId) 
      };
    }));
    showToast(`Slot deleted`);
  }, [showToast]);

  // --- Pricing Actions ---
  const addPricing = useCallback((config) => {
    const newConfig = { ...config, id: Date.now(), active: true };
    setPricingConfigs(prev => [...prev, newConfig]);
    showToast('Pricing configuration added');
  }, [showToast]);

  const updatePricing = useCallback((id, data) => {
    setPricingConfigs(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    showToast('Pricing configuration updated');
  }, [showToast]);

  const togglePricing = useCallback((id) => {
    setPricingConfigs(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }, []);

  // --- Pass Actions ---
  const addPass = useCallback((data) => {
    const fee = data.type === 'Car' ? 2500000 : 500000;
    const newPass = {
      id: Date.now(),
      plate: data.plate,
      type: data.type,
      owner: data.owner,
      phone: data.phone,
      start: new Date().toISOString().split('T')[0],
      expiry: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      fee,
      status: 'Active',
    };
    setPasses(prev => [...prev, newPass]);

    // Update any currently parked vehicle with this plate to have hasPass
    setVehicles(prev => prev.map(v =>
      v.plate.toLowerCase() === data.plate.toLowerCase() ? { ...v, hasPass: true } : v
    ));

    showToast(`Monthly pass registered for ${data.plate}`);
    return newPass;
  }, [showToast]);

  // --- Booking Actions ---
  const addBooking = useCallback((data) => {
    const slot = findAvailableSlot(data.type);
    const newBooking = {
      id: Date.now(),
      plate: data.plate,
      type: data.type,
      slot: slot ? slot.slotCode : 'Auto',
      startTime: `${data.date} ${data.startTime}`,
      endTime: `${data.date} ${String(parseInt(data.startTime) + parseInt(data.duration)).padStart(2, '0')}:00`,
      status: 'Pending',
    };
    setBookings(prev => [...prev, newBooking]);
    showToast(`Booking created for ${data.plate}`);
    return newBooking;
  }, [findAvailableSlot, showToast]);

  const cancelBooking = useCallback((id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    showToast('Booking cancelled');
  }, [showToast]);

  // --- Exception Actions ---
  const addException = useCallback((data) => {
    const id = `EX-${String(exceptions.length + 1).padStart(3, '0')}`;
    const newException = {
      id,
      type: data.type,
      desc: data.desc,
      surcharge: data.surcharge || 0,
      createdBy: 'Current User',
      time: 'Just now',
      status: 'Pending',
      plate: data.plate || 'N/A',
      resolutionNotes: '',
    };
    setExceptions(prev => [...prev, newException]);
    showToast('Exception created');
    return newException;
  }, [exceptions.length, showToast]);

  const resolveException = useCallback((id, notes) => {
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'Resolved', resolutionNotes: notes || '' } : e));
    showToast('Exception resolved');
  }, [showToast]);

  // --- Settings Actions ---
  const updateSettings = useCallback((section, data) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
    showToast('Settings saved successfully');
  }, [showToast]);

  // --- Helpers ---
  const getVehicleAvailability = useCallback((vehicleType) => {
    const typeMap = { motorbike: 'Motorbike', car: 'Car', truck: 'Car', bicycle: 'Bicycle' };
    const matchType = typeMap[vehicleType] || vehicleType;
    let available = 0;
    zones.forEach(z => {
      if (z.vehicleType === matchType) {
        z.slots.forEach(s => { if (s.status === 'available') available++; });
      }
    });
    return available;
  }, [zones]);

  const getFloorStats = useMemo(() => {
    const floors = {};
    zones.forEach(z => {
      if (!floors[z.floor]) floors[z.floor] = { name: z.floor, total: 0, available: 0, occupied: 0 };
      z.slots.forEach(s => {
        floors[z.floor].total++;
        if (s.status === 'available') floors[z.floor].available++;
        else if (s.status === 'occupied') floors[z.floor].occupied++;
      });
    });
    return Object.values(floors);
  }, [zones]);

  const value = useMemo(() => ({
    // State
    vehicles, exitedVehicles, zones, pricingConfigs, passes, bookings, exceptions, settings, toastMessage,
    // Computed
    slotStats, todayRevenue, getFloorStats,
    // Actions
    registerVehicle, exitVehicle, calculateFee, getOverstayPenalty,
    updateSlotStatus, addZone, updateZone, deleteZone, addSlot, deleteSlot,
    addPricing, updatePricing, togglePricing,
    addPass, addBooking, cancelBooking,
    addException, resolveException, updateSettings,
    getVehicleAvailability, showToast,
  }), [
    vehicles, exitedVehicles, zones, pricingConfigs, passes, bookings, exceptions, settings, toastMessage,
    slotStats, todayRevenue, getFloorStats,
    registerVehicle, exitVehicle, calculateFee, getOverstayPenalty,
    updateSlotStatus, addZone, updateZone, deleteZone, addSlot, deleteSlot,
    addPricing, updatePricing, togglePricing,
    addPass, addBooking, cancelBooking,
    addException, resolveException, updateSettings,
    getVehicleAvailability, showToast,
  ]);

  return (
    <ParkingContext.Provider value={value}>
      {children}
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '1.1rem' }}>✓</span>
          {toastMessage}
        </div>
      )}
    </ParkingContext.Provider>
  );
}
