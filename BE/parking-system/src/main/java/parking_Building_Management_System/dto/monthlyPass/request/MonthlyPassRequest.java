package parking_Building_Management_System.dto.monthlyPass.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MonthlyPassRequest {
    
    @NotNull(message = "Vehicle ID is required")
    UUID vehicleId;
    
    UUID slotId;
    
    @NotNull(message = "Fee is required")
    @Positive(message = "Fee must be greater than 0")
    BigDecimal fee;
    
    LocalDate startDate;
    
    @NotNull(message = "End date is required")
    LocalDate endDate;
    
    Boolean autoRenew;
    
    String paymentMethod;
}
