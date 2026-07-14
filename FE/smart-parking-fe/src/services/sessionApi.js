import api from './api';

// ── Base path ─────────────────────────────────────────────────────────────────
const BASE = '/api/v1/parking-sessions';

// ── 1. Validate xe trước khi vào ─────────────────────────────────────────────
// GET /api/v1/parking-sessions/validate?licensePlate=51G-12345
// Response: { valid, message, vehicleId, licensePlate, foundVehicle, errorCode }
export const validateVehicle = async (licensePlate) => {
  const res = await api.get(`${BASE}/validate`, {
    params: { licensePlate },
  });
  return res.data.data; // unwrap ApiResponse<EntryValidationResponse>
};

// ── 2. Lấy zones có slot trống ───────────────────────────────────────────────
// GET /api/v1/zones
// Response: [{ id, name, vehicleType, floorId, floorName, totalSlots, availableSlots }]
export const getZones = async () => {
  const res = await api.get('/api/v1/zones');
  return res.data;
};

// ── 3. Lấy slot trống trong zone ────────────────────────────────────────────
// GET /api/v1/parking-sessions/available-slots?zoneId=xxx&licensePlate=51G-12345
// Response: ApiResponse<List<AvailableSlotsForEntryResponse>>
export const getAvailableSlots = async (zoneId, licensePlate) => {
  const res = await api.get(`${BASE}/available-slots`, {
    params: { zoneId, licensePlate },
  });
  return res.data.data;
};

// ── 4. Tạo session xe vào ────────────────────────────────────────────────────
// POST /api/v1/parking-sessions/entry
// Body: { licensePlate, zoneId }
// Response: ApiResponse<VehicleEntryResponse>
export const createSession = async (licensePlate, zoneId, vehicleType = null) => {
  const res = await api.post(`${BASE}/entry`, {
    licensePlate: licensePlate,
    zoneId,
    vehicleType,
  });
  return res.data.data;
};

// ── 5. Lấy tất cả session đang ACTIVE ───────────────────────────────────────
// GET /api/v1/parking-sessions/active/all
// Response: ApiResponse<List<ParkingSession>>
export const getActiveSessions = async () => {
  const res = await api.get(`${BASE}/active/all`);
  return res.data.data ?? res.data ?? [];
};

export const getCompletedSessions = async () => {
  const res = await api.get(`${BASE}/completed/all`);
  return res.data.data ?? res.data ?? [];
};

// ── 6. Lấy session theo ID ───────────────────────────────────────────────────
// GET /api/v1/parking-sessions/{sessionId}
export const getSessionById = async (sessionId) => {
  const res = await api.get(`${BASE}/${sessionId}`);
  return res.data.data;
};

// ── 7. Tính phí ──────────────────────────────────────────────────────────────
// POST /api/v1/parking-sessions/calculate-fee
// Body: { sessionId }
// Response: { sessionId, totalFee, durationMinutes, message }
export const calculateFee = async (sessionId) => {
  const res = await api.post(`${BASE}/calculate-fee`, { sessionId });
  return res.data.data;
};

// ── 8. Xe ra ────────────────────────────────────────────────────────────────
// POST /api/v1/parking-sessions/exit
// Body: { sessionId, slotId }
// Response: ApiResponse<VehicleExitResponse>
export const exitSession = async (sessionId, slotId) => {
  const res = await api.post(`${BASE}/exit`, { sessionId, slotId });
  return res.data.data;
};

// ── 9. Thanh toán ────────────────────────────────────────────────────────────
// POST /api/v1/parking-sessions/payment
// Body: { sessionId, amount, paymentMethod, notes }
export const processPayment = async (sessionId, amount, paymentMethod = 'CASH', notes = '') => {
  const res = await api.post(`${BASE}/payment`, {
    sessionId,
    amount,
    paymentMethod,
    notes,
  });
  return res.data.data;
};

// ── 10. Lấy xe overstay > 24h ───────────────────────────────────────────────
// GET /api/v1/parking-sessions/overstay/24h
export const getOverstaySessions = async () => {
  const res = await api.get(`${BASE}/overstay/24h`);
  return res.data.data ?? [];
};
