package parking_Building_Management_System.dto.parkingSlot.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.SlotStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSlotResponse {
    UUID id;
    String slotCode;
    UUID floorId;
    String floorName;
    UUID zoneId;
    String zoneName;
    VehicleType vehicleType;
    SlotStatus status;
    UUID currentSessionId;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

