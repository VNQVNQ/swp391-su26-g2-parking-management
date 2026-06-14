package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for vehicle entry response
 * BR-27: Slot → Occupied ngay khi tạo session
 * BR-28: entry_time do server generate
 * BR-31: sessionID phải unique (UUID)
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleEntryResponse {
    
    /**
     * BR-31: Session ID do server generate (UUID)
     */
    UUID sessionId;
    
    /**
     * Thông tin xe
     */
    UUID vehicleId;
    String licensePlate;
    VehicleType vehicleType;
    
    /**
     * Thông tin slot được assign
     */
    UUID slotId;
    String slotCode;
    String zoneCode;
    String zoneName;
    String floorName;
    
    /**
     * BR-28: entry_time được server tạo
     */
    LocalDateTime entryTime;
    
    /**
     * Trạng thái session
     */
    ParkingSessionStatus status;
    PaymentStatus paymentStatus;
    
    /**
     * Staff thực hiện check-in
     */
    Long staffId;
    String staffName;
    
    /**
     * Metadata
     */
    LocalDateTime createdAt;
}

