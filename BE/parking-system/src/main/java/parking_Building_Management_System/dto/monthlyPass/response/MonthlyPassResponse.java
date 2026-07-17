package parking_Building_Management_System.dto.monthlyPass.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MonthlyPassResponse {
    UUID id;
    UUID vehicleId;
    String licensePlate;
    VehicleType vehicleType;
    BigDecimal fee;
    LocalDate startDate;
    LocalDate endDate;
    PaymentStatus paymentStatus;
    Boolean isActive;
    Long remainingDays;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
