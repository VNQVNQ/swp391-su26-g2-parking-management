package parking_Building_Management_System.dto.parkingSession.response;

import lombok.Builder;
import lombok.Data;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CompletedSessionResponse {
    private UUID id;
    private String licensePlate;
    private VehicleType vehicleType;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private BigDecimal totalFee;
}
