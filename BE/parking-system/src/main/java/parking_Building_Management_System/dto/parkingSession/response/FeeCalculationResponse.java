package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeCalculationResponse {
    private UUID sessionId;
    private BigDecimal totalFee;
    private Long durationMinutes;
    private String message;
}
