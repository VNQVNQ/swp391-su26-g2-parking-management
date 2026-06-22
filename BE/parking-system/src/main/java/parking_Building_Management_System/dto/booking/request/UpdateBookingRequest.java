package parking_Building_Management_System.dto.booking.request;

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
public class UpdateBookingRequest {
    
    UUID slotId;
    
    LocalDateTime startTime;
    
    Integer durationMinutes;
    
    String notes;
}
