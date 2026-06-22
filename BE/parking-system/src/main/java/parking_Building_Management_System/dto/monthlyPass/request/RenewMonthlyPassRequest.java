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

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RenewMonthlyPassRequest {
    
    @NotNull(message = "End date is required")
    LocalDate endDate;
    
    @Positive(message = "Fee must be greater than 0 if provided")
    BigDecimal fee;
    
    Boolean autoRenew;
}
