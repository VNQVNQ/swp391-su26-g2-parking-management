package parking_Building_Management_System.dto.zone.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ZoneResponse {
    UUID id;
    UUID floorId;
    String floorName;
    String name;
    VehicleType vehicleType;
    Integer totalSlots;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

