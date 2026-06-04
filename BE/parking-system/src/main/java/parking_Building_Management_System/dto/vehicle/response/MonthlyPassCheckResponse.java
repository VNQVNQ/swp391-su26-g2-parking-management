package parking_Building_Management_System.dto.vehicle.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MonthlyPassCheckResponse {
    Boolean hasMonthlyPass;
    Boolean isExpired;
    Boolean isPaid;
    LocalDate expiryDate;
    String message;

    public MonthlyPassCheckResponse(Boolean hasMonthlyPass, LocalDate expiryDate) {
        this.hasMonthlyPass = hasMonthlyPass;
        this.expiryDate = expiryDate;
        
        if (!hasMonthlyPass) {
            this.isExpired = null;
            this.isPaid = null;
            this.message = "Vehicle does not have a monthly pass";
        } else {
            this.isExpired = expiryDate != null && expiryDate.isBefore(LocalDate.now());
            this.message = this.isExpired ? 
                    "Monthly pass has expired" : 
                    "Monthly pass is valid until " + expiryDate;
        }
    }
}
