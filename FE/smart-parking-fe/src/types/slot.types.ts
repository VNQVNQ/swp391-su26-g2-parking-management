// VehicleType
export type VehicleType = "Motorbike" | "Car" | "Truck";

// BR-14, BR-22, BR-26, BR-27, BR-37
export type SlotStatus = "FREE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface Floor {
  id: number;
  floorName: string;
  totalSlots: number;
}

export interface ParkingSlot {
  id: number;
  slotCode: string;       // BR-07: unique toàn hệ thống
  floorId: number;
  zone: string;
  vehicleType: VehicleType;
  status: SlotStatus;
}

export interface SlotGridByFloor {
  floor: Floor;
  slots: ParkingSlot[];
}

// BR-48
export interface UtilizationStat {
  floorName: string;
  totalSlots: number;
  occupiedSlots: number;
  utilizationRate: number; // occupiedSlots / totalSlots * 100
}
