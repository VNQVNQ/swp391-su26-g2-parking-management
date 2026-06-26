// Mock data cho PARKING_STAFF Dashboard — match v0 prototype

export const dashboardStats = {
  utilizationRate: 62.8,
  totalSlots: 290,
  usedSlots: 182,
  availableCars: 37,
  availableMotorbikes: 43,
  availableTotal: 98,
  revenueToday: 12_450_000,
  vehiclesToday: 156,
  peakHourStart: "08:00",
  peakHourEnd: "09:00",
};

// Status by Floor — match prototype: Basement 1, Basement 2, Floor 1, Floor 2
export const floorStatus = [
  { floor: "Basement 1", available: 35, total: 100 },
  { floor: "Basement 2", available: 18, total: 80  },
  { floor: "Floor 1",    available: 30, total: 60  },
  { floor: "Floor 2",    available: 25, total: 50  },
];

// Parked Vehicles table — match prototype data
export interface ParkedVehicle {
  id: string;
  licensePlate: string;
  vehicleType: "Car" | "Motorbike" | "Truck";
  slot: string;
  entryTime: string;
  status: "Parked" | "Monthly Pass" | "Overstay";
}

export const parkedVehicles: ParkedVehicle[] = [
  { id: "v1", licensePlate: "30A-123.45", vehicleType: "Car",      slot: "A1-001", entryTime: "08:47 AM", status: "Parked"       },
  { id: "v2", licensePlate: "29B-567.89", vehicleType: "Motorbike", slot: "B1-001", entryTime: "08:54 AM", status: "Parked"       },
  { id: "v3", licensePlate: "51F-111.22", vehicleType: "Car",      slot: "A1-002", entryTime: "08:32 AM", status: "Monthly Pass"  },
  { id: "v4", licensePlate: "30H-999.88", vehicleType: "Motorbike", slot: "B1-002", entryTime: "08:02 AM", status: "Overstay"     },
  { id: "v5", licensePlate: "29A-333.44", vehicleType: "Car",      slot: "A1-003", entryTime: "08:57 AM", status: "Parked"       },
];

// Status by Zone — 8 zones matching prototype grid
export interface ZoneStats {
  name: string;
  floor: string;
  vehicleType: "Cars" | "Motorbikes" | "Trucks";
  icon: string;
  available: number;
  total: number;
}

export const zoneStatus: ZoneStats[] = [
  { name: "Zone A - Cars",       floor: "Basement 1", vehicleType: "Cars",       icon: "🚗", available: 15, total: 50 },
  { name: "Zone B - Motorbikes", floor: "Basement 1", vehicleType: "Motorbikes", icon: "🏍️", available: 20, total: 50 },
  { name: "Zone A - Cars",       floor: "Basement 2", vehicleType: "Cars",       icon: "🚗", available: 10, total: 40 },
  { name: "Zone B - Motorbikes", floor: "Basement 2", vehicleType: "Motorbikes", icon: "🏍️", available: 8,  total: 40 },
  { name: "Zone A - Cars",       floor: "Floor 1",    vehicleType: "Cars",       icon: "🚗", available: 12, total: 30 },
  { name: "Zone B - Trucks",     floor: "Floor 1",    vehicleType: "Trucks",     icon: "🚛", available: 18, total: 30 },
  { name: "Zone A - Motorbikes", floor: "Floor 2",    vehicleType: "Motorbikes", icon: "🏍️", available: 15, total: 25 },
  { name: "Zone B - Trucks",     floor: "Floor 2",    vehicleType: "Trucks",     icon: "🚛", available: 10, total: 25 },
];
