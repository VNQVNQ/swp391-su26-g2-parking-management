package parking_Building_Management_System.dto.parkingSession.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeCalculationRequest {
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
}
