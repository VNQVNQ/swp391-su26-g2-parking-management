package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private UUID sessionId;
    private UUID vehicleId;
    private BigDecimal amount;
    private String paymentStatus;
    private LocalDateTime paymentTime;
    private String message;
}
