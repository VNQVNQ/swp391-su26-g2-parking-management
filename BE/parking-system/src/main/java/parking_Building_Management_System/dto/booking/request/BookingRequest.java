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
    
    @NotNull(message = "Vehicle ID is required")
    UUID vehicleId;
    
    UUID slotId;
    
    @NotNull(message = "Start time is required")
    LocalDateTime startTime;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be greater than 0")
    Integer durationMinutes;

    String notes;
}
