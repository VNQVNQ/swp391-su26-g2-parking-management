import type { Floor, ParkingSlot, ParkingSession } from "../types/staff.types";

export const mockFloors: Floor[] = [
  { id: "b1", name: "Basement 1", level: -2, totalSlots: 100 },
  { id: "b2", name: "Basement 2", level: -1, totalSlots: 80  },
  { id: "f1", name: "Floor 1",    level: 1,  totalSlots: 60  },
  { id: "f2", name: "Floor 2",    level: 2,  totalSlots: 50  },
];

const makeSlots = (
  floorId: string, floorName: string, prefix: string,
  total: number, occupied: number[], reserved: number[], maintenance: number[],
  type: "CAR" | "MOTORBIKE" | "TRUCK"
): ParkingSlot[] =>
  Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const status =
      maintenance.includes(n) ? "MAINTENANCE" :
      reserved.includes(n)    ? "RESERVED"    :
      occupied.includes(n)    ? "OCCUPIED"    : "FREE";
    return {
      id: `${floorId}-${n}`,
      slotCode: `${prefix}${String(n).padStart(3, "0")}`,
      floorId, floorName,
      zoneId:   n <= total / 2 ? `${floorId}-zA` : `${floorId}-zB`,
      zoneName: n <= total / 2 ? "Zone A" : "Zone B",
      vehicleType: type,
      status,
      currentSessionId: occupied.includes(n) ? `ses-${floorId}-${n}` : undefined,
    };
  });

export const mockSlotsByFloor: Record<string, ParkingSlot[]> = {
  b1: makeSlots("b1","Basement 1","B1-",100,
    [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65],
    [70,71,72,73,74,75],[99,100],"CAR"),
  b2: makeSlots("b2","Basement 2","B2-",80,
    [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62],
    [65,66,67],[79,80],"CAR"),
  f1: makeSlots("f1","Floor 1","F1-",60,
    [1,2,3,4,5,6,7,8,9,10,11,12,31,32,33,34,35,36,37,38,39,40,41,42],
    [45,46],[59,60],"MOTORBIKE"),
  f2: makeSlots("f2","Floor 2","F2-",50,
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,26,27,28,29,30,31,32,33,34,35],
    [40,41],[49,50],"MOTORBIKE"),
};

export interface FloorSummary {
  floor: Floor;
  occupied: number;
  available: number;
  motorbike: number;
  car: number;
}

export function getFloorSummaries(): FloorSummary[] {
  return mockFloors.map((floor) => {
    const slots = mockSlotsByFloor[floor.id] ?? [];
    const occupied  = slots.filter((s) => s.status === "OCCUPIED").length;
    const motorbike = slots.filter((s) => s.vehicleType === "MOTORBIKE" && s.status === "FREE").length;
    const car       = slots.filter((s) => s.vehicleType === "CAR" && s.status === "FREE").length;
    return {
      floor, occupied,
      available: slots.filter((s) => s.status === "FREE").length,
      motorbike, car,
    };
  });
}

export function autoAssignSlot(vehicleType: "MOTORBIKE" | "CAR" | "TRUCK"): ParkingSlot | null {
  for (const slots of Object.values(mockSlotsByFloor)) {
    const found = slots.find((s) => s.status === "FREE" && s.vehicleType === vehicleType);
    if (found) return found;
  }
  for (const slots of Object.values(mockSlotsByFloor)) {
    const found = slots.find((s) => s.status === "FREE");
    if (found) return found;
  }
  return null;
}

// Active sessions — match prototype data
export const mockActiveSessions: ParkingSession[] = [
  {
    id: "s001", vehicleId: "v1", licensePlate: "29B-567.89",
    ownerName: "Jane Doe", vehicleType: "MOTORBIKE",
    slotId: "b1-1", slotCode: "B1-001", floorName: "Basement 1", zoneName: "Zone A",
    entryTime: new Date(Date.now() - 9 * 60000).toISOString(),
    status: "ACTIVE", paymentStatus: "UNPAID", staffEntryName: "Staff",
    ticketType: "HOURLY", hasFaceData: false, hasMonthlyPass: false,
  },
  {
    id: "s002", vehicleId: "v2", licensePlate: "51F-111.22",
    ownerName: "John Smith", vehicleType: "CAR",
    slotId: "f1-2", slotCode: "A1-002", floorName: "Floor 1", zoneName: "Zone A",
    entryTime: new Date(Date.now() - 31 * 60000).toISOString(),
    status: "ACTIVE", paymentStatus: "UNPAID", staffEntryName: "Staff",
    ticketType: "MONTHLY", hasFaceData: true, hasMonthlyPass: true,
  },
  {
    id: "s003", vehicleId: "v3", licensePlate: "30H-999.88",
    ownerName: "Bob Wilson", vehicleType: "MOTORBIKE",
    slotId: "b1-2", slotCode: "B1-002", floorName: "Basement 1", zoneName: "Zone B",
    entryTime: new Date(Date.now() - 25 * 60 * 60000 - 60000).toISOString(),
    status: "OVERSTAY", paymentStatus: "UNPAID", staffEntryName: "Staff",
    ticketType: "HOURLY", hasFaceData: false, hasMonthlyPass: false,
  },
  {
    id: "s004", vehicleId: "v4", licensePlate: "29A-333.44",
    ownerName: "Emily Davis", vehicleType: "CAR",
    slotId: "f1-3", slotCode: "A1-003", floorName: "Floor 1", zoneName: "Zone A",
    entryTime: new Date(Date.now() - 6 * 60000).toISOString(),
    status: "ACTIVE", paymentStatus: "UNPAID", staffEntryName: "Staff",
    ticketType: "HOURLY", hasFaceData: false, hasMonthlyPass: false,
  },
];

// BR-01
export const RATE_PER_HOUR: Record<string, number> = {
  MOTORBIKE: 5_000,
  CAR:       20_000,
  TRUCK:     40_000,
};
export const MINIMUM_FEE: Record<string, number> = {
  MOTORBIKE: 3_000,
  CAR:       10_000,
  TRUCK:     20_000,
};

export const LOST_TICKET_SURCHARGE = 50_000;
