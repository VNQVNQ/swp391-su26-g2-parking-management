package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleExitResponse {
    private UUID sessionId;
    private UUID vehicleId;
    private UUID slotId;
    private LocalDateTime exitTime;
    private String message;
}
