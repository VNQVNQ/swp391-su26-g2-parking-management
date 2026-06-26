import type { VehicleType } from "../types/PARKING_STAFF.types";

// FIX: vehicleType phải là "CAR" | "MOTORBIKE" | "TRUCK" (match BE enum)
export interface MockVehicle {
  id: number;
  licensePlate: string;
  vehicleType: VehicleType;
  slotId: string;
  checkInTime: string;
  status: "PARKING" | "CHECKED_OUT";
}

export const vehicles: MockVehicle[] = [
  {
    id: 1,
    licensePlate: "59A-12345",
    vehicleType: "CAR",        // FIX: "Car" → "CAR"
    slotId: "A01",
    checkInTime: "2026-06-05 08:00",
    status: "PARKING",
  },
  {
    id: 2,
    licensePlate: "66B-67890",
    vehicleType: "MOTORBIKE",  // FIX: "Motorbike" → "MOTORBIKE"
    slotId: "A02",
    checkInTime: "2026-06-05 09:15",
    status: "PARKING",
  },
  {
    id: 3,
    licensePlate: "51H-99999",
    vehicleType: "CAR",        // FIX: "Car" → "CAR"
    slotId: "B01",
    checkInTime: "2026-06-05 07:30",
    status: "CHECKED_OUT",
  },
];
