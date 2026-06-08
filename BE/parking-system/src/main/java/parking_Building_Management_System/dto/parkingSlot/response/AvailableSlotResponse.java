package parking_Building_Management_System.dto.parkingSlot.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableSlotResponse {
    UUID id;
    String slotCode;
    UUID floorId;
    String floorName;
    UUID zoneId;
    String zoneName;
    VehicleType vehicleType;
}

