package parking_Building_Management_System.dto.parkingSession.response;

import lombok.Builder;
import lombok.Data;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ActiveSessionResponse {
    private UUID id;
    
    // Flattened fields for easy frontend consumption
    private String licensePlate;
    private VehicleType vehicleType;
    private String slotCode;
    private UUID slotId;
    private String zoneName;
    private String floorName;
    
    private LocalDateTime entryTime;
}
