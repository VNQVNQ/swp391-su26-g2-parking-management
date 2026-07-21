package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.UUID;

/**
 * DTO for available slots response when searching for parking
 * BR-26: Chỉ assign slot Free và Available
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableSlotsForEntryResponse {
    UUID slotId;
    String slotCode;
    UUID floorId;
    String floorName;
    UUID zoneId;
    String zoneCode;
    String zoneName;
    VehicleType vehicleType;
    Long availableCount;
    Long occupiedCount;
    Long totalSlots;
    Boolean hasUpcomingBooking;
}

