package parking_Building_Management_System.dto.booking.request;

import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequest {
    
    UUID vehicleId;
    
    String licensePlate;
    
    String vehicleType;
    
    UUID slotId;
    
    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be greater than 0")
    Integer durationMinutes;
    
    @NotNull(message = "Start time is required")
    LocalDateTime startTime;
    
    String notes;
}
