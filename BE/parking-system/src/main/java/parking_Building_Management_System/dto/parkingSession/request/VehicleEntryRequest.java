package parking_Building_Management_System.dto.parkingSession.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.UUID;

/**
 * DTO for vehicle entry request (Check-in)
 * BR-23: license_plate bắt buộc và không null
 * BR-24: license_plate đúng định dạng Việt Nam
 * BR-26: Chỉ assign slot Free và Available
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleEntryRequest {

    /**
     * BR-23: license_plate bắt buộc
     */
    @NotBlank(message = "License plate is required")
    @Pattern(
        regexp = "^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$",
        message = "License plate must follow Vietnamese format: 51G-12345 or 30AB-999"
    )
    String licensePlate;

    /**
     * Zone ID nơi xe muốn gửi
     */
    @NotNull(message = "Zone ID is required")
    UUID zoneId;
}

