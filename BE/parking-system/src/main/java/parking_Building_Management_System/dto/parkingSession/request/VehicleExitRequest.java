package parking_Building_Management_System.dto.parkingSession.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleExitRequest {
    private UUID sessionId;
    private UUID slotId;
}
