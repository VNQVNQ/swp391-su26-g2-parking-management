import type { ParkingSlot, Floor, UtilizationStat } from "../types/slot.types";

export const mockFloors: Floor[] = [
  { id: 1, floorName: "Tầng B1", totalSlots: 20 },
  { id: 2, floorName: "Tầng 1",  totalSlots: 20 },
  { id: 3, floorName: "Tầng 2",  totalSlots: 16 },
];

// BR-07: slotCode unique; BR-09: vehicleType hợp lệ; BR-14/22/26/27: status đúng
const makeSlots = (
  floorId: number,
  prefix: string,
  count: number,
  occupied: number[],
  reserved: number[],
  maintenance: number[]
): ParkingSlot[] =>
  Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const status =
      maintenance.includes(n) ? "MAINTENANCE" :
      reserved.includes(n)    ? "RESERVED"    :
      occupied.includes(n)    ? "OCCUPIED"    : "FREE";
    return {
      id: floorId * 100 + n,
      slotCode: `${prefix}${String(n).padStart(2, "0")}`,
      floorId,
      zone: n <= count / 2 ? "Zone A" : "Zone B",
      vehicleType: floorId === 1 ? "Car" : "Motorbike",
      status,
    };
  });

export const mockSlotsByFloor = [
  {
    floor: mockFloors[0],
    slots: makeSlots(1, "B1-", 20, [1,3,5,7,9,11,13], [15,16], [19,20]),
  },
  {
    floor: mockFloors[1],
    slots: makeSlots(2, "F1-", 20, [2,4,6,8,10,12], [14], []),
  },
  {
    floor: mockFloors[2],
    slots: makeSlots(3, "F2-", 16, [1,2,3,4,5], [], [15,16]),
  },
];

export const dashboardStats = {
  totalSlots:    56,
  occupiedSlots: 26,
  reservedSlots: 3,
  availableSlots: 24,
  revenueToday:  18_500_000,
};

// BR-48: utilizationRate = occupiedSlots / totalSlots * 100
export const utilizationData: UtilizationStat[] = mockSlotsByFloor.map(({ floor, slots }) => {
  const occupied = slots.filter((s) => s.status === "OCCUPIED").length;
  return {
    floorName: floor.floorName,
    totalSlots: floor.totalSlots,
    occupiedSlots: occupied,
    utilizationRate: Math.round((occupied / floor.totalSlots) * 100),
  };
});

// BR-47: doanh thu session Paid theo ngày
export const revenueData = [
  { day: "T2", revenue: 12_400_000 },
  { day: "T3", revenue: 15_200_000 },
  { day: "T4", revenue: 9_800_000  },
  { day: "T5", revenue: 18_500_000 },
  { day: "T6", revenue: 21_000_000 },
  { day: "T7", revenue: 25_500_000 },
  { day: "CN", revenue: 19_300_000 },
];

// BR-49: peak hour = khung giờ có số session entry cao nhất
export const peakHourData = [
  { hour: "06:00", sessions: 12 },
  { hour: "07:00", sessions: 34 },
  { hour: "08:00", sessions: 67 },
  { hour: "09:00", sessions: 45 },
  { hour: "12:00", sessions: 38 },
  { hour: "13:00", sessions: 29 },
  { hour: "17:00", sessions: 72 },
  { hour: "18:00", sessions: 58 },
  { hour: "19:00", sessions: 31 },
];
