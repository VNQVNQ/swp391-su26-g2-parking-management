package parking_Building_Management_System.dto.booking.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.BookingStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingDetailResponse {
    UUID id;
    String bookingCode;
    UUID vehicleId;
    String licensePlate;
    VehicleType vehicleType;
    String slotCode;
    UUID slotId;
    String zoneName;
    String floorName;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Integer durationMinutes;
    BookingStatus status;
    LocalDateTime bookingExpiryAt;
    Boolean isExpired;
    Long minutesUntilExpiry;
    String notes;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
