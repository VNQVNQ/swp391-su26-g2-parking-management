import axiosInstance from "./axiosInstance";
import type { Floor, ParkingSlot, Vehicle } from "../types/staff.types";

// ── BE trả về bọc trong ApiResponse<T> ───────────────────────────────────────
// { statusCode, message, data }
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ── Floors ────────────────────────────────────────────────────────────────────
// GET /api/v1/floors
export const getFloors = async (): Promise<Floor[]> => {
  const res = await axiosInstance.get<Floor[]>("/api/v1/floors");
  return res.data;
};

// GET /api/v1/floors/{id}
export const getFloorById = async (id: string): Promise<Floor> => {
  const res = await axiosInstance.get<Floor>(`/api/v1/floors/${id}`);
  return res.data;
};

// ── Parking Slots ─────────────────────────────────────────────────────────────
// GET /api/v1/parking-slots
export const getAllSlots = async (): Promise<ParkingSlot[]> => {
  const res = await axiosInstance.get<ParkingSlot[]>("/api/v1/parking-slots");
  return res.data;
};

// GET /api/v1/parking-slots/floor/{floorId}
export const getSlotsByFloor = async (floorId: string): Promise<ParkingSlot[]> => {
  const res = await axiosInstance.get<ParkingSlot[]>(`/api/v1/parking-slots/floor/${floorId}`);
  return res.data;
};

// GET /api/v1/parking-slots/zone/{zoneId}
export const getSlotsByZone = async (zoneId: string): Promise<ParkingSlot[]> => {
  const res = await axiosInstance.get<ParkingSlot[]>(`/api/v1/parking-slots/zone/${zoneId}`);
  return res.data;
};

// GET /api/v1/parking-slots/available/floor/{floorId}/vehicle-type/{vehicleType}
export const getAvailableSlots = async (
  floorId: string,
  vehicleType: string
): Promise<ParkingSlot[]> => {
  const res = await axiosInstance.get<ParkingSlot[]>(
    `/api/v1/parking-slots/available/floor/${floorId}/vehicle-type/${vehicleType}`
  );
  return res.data;
};

// PATCH /api/v1/parking-slots/{id}/status?status=FREE
export const updateSlotStatus = async (
  id: string,
  status: string
): Promise<ParkingSlot> => {
  const res = await axiosInstance.patch<ParkingSlot>(
    `/api/v1/parking-slots/${id}/status`,
    null,
    { params: { status } }
  );
  return res.data;
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
// GET /api/v1/vehicles/plate/{licensePlate}
// BE bọc trong ApiResponse<VehicleResponse>
export const getVehicleByPlate = async (licensePlate: string): Promise<Vehicle> => {
  const res = await axiosInstance.get<ApiResponse<Vehicle>>(
    `/api/v1/vehicles/plate/${encodeURIComponent(licensePlate)}`
  );
  return res.data.data;
};

// GET /api/v1/vehicles/search?licensePlate=&fuzzyThreshold=0.7
export const searchVehicles = async (
  licensePlate: string,
  fuzzyThreshold = 0.7
): Promise<Vehicle[]> => {
  const res = await axiosInstance.get<ApiResponse<Vehicle[]>>(
    `/api/v1/vehicles/search`,
    { params: { licensePlate, fuzzyThreshold } }
  );
  return res.data.data;
};

// POST /api/v1/vehicles — tạo xe mới
export const createVehicle = async (payload: {
  licensePlate: string;
  vehicleType: string;
  ownerName?: string;
  phone?: string;
}): Promise<Vehicle> => {
  const res = await axiosInstance.post<ApiResponse<Vehicle>>(
    "/api/v1/vehicles",
    payload
  );
  return res.data.data;
};

// ── Zones ─────────────────────────────────────────────────────────────────────
// GET /api/v1/zones/floor/{floorId}
export interface ZoneResponse {
  id: string;
  name: string;
  floorId: string;
  floorName: string;
  vehicleType: string;
  totalSlots: number;
  availableSlots: number;
}

export const getZonesByFloor = async (floorId: string): Promise<ZoneResponse[]> => {
  const res = await axiosInstance.get<ZoneResponse[]>(`/api/v1/zones/floor/${floorId}`);
  return res.data;
};

export const getAllZones = async (): Promise<ZoneResponse[]> => {
  const res = await axiosInstance.get<ZoneResponse[]>("/api/v1/zones");
  return res.data;
};
