// Match BE enum VehicleType (entity/enums/VehicleType.java)
export type VehicleType = "MOTORBIKE" | "CAR" | "TRUCK";

// Match BE enum SlotStatus
export type SlotStatus = "FREE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

// Match BE enum ParkingSessionStatus
export type SessionStatus = "ACTIVE" | "COMPLETED" | "OVERSTAY";

// Match BE enum PaymentStatus
export type PaymentStatus = "UNPAID" | "PAID" | "PENDING";

// Match BE enum TicketType
export type TicketType = "HOURLY" | "DAILY" | "MONTHLY";

// Match BE enum PaymentMethod
export type PaymentMethod = "CASH" | "INTERNAL" | "MONTHLY_PASS";

// Match BE enum ExceptionType
export type ExceptionType = "LOST_TICKET" | "OVERSTAY" | "WRONG_ZONE" | "UNPAID_EXIT";

// Match BE enum ExceptionStatus
export type ExceptionStatus = "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED";

// Match BE FloorResponse
export interface Floor {
  id: string;
  name: string;
  level: number;
  totalSlots: number;
}

// Match BE ParkingSlotResponse
export interface ParkingSlot {
  id: string;
  slotCode: string;
  floorId: string;
  floorName: string;
  zoneId: string;
  zoneName: string;
  vehicleType: VehicleType;
  status: SlotStatus;
  currentSessionId?: string;
}

// Match BE VehicleResponse
export interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: VehicleType;
  ownerName: string;
  phone: string;
  hasMonthlyPass: boolean;
  monthlyPassExpiry?: string;    // LocalDate → string
  faceDescriptor?: string;       // byte[] → base64 string
  isActive: boolean;
}

// Match BE ParkingSession entity
export interface ParkingSession {
  id: string;                    // UUID
  vehicleId: string;
  licensePlate: string;          // denormalized cho FE
  ownerName: string;             // denormalized
  vehicleType: VehicleType;
  slotId: string;
  slotCode: string;              // denormalized
  floorName: string;             // denormalized
  zoneName: string;              // denormalized
  entryTime: string;             // LocalDateTime → ISO string
  exitTime?: string;
  status: SessionStatus;
  ticketType: TicketType;        // match BE entity
  fee?: number;                  // BigDecimal → number
  paymentStatus: PaymentStatus;
  PARKING_STAFFEntryName: string;
  hasFaceData: boolean;          // faceDescriptor != null
  hasMonthlyPass: boolean;       // từ vehicle
  faceVerifiedAtExit?: boolean;  // match BE entity
  PARKING_STAFFOverrideUsed?: boolean;   // match BE entity
}
