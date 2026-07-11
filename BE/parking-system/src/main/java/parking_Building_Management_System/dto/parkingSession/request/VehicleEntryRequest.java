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
 * Phase 4: Support booking code for reserved entries
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
        regexp = "^[0-9]{2}[A-Z]{1,2}[0-9]?-[0-9]{4,5}$",
        message = "License plate must follow Vietnamese format: xe may: 21AC-21342 or 78D1-13290 | o to: 36D-24821"
    )
    String licensePlate;

    /**
     * Zone ID nơi xe muốn gửi
     */
    @NotNull(message = "Zone ID is required")
    UUID zoneId;

    /**
     * Phase 4: Optional booking code for pre-booked reservations
     */
    String bookingCode;

    /**
     * Phase 4: Optional flag to skip pricing rule lookup (for testing)
     */
    Boolean skipPricingLookup;

    /**
     * Loại xe (bắt buộc khi xe chưa đăng ký trong hệ thống).
     * Dùng để tự động tạo xe khách vãng lai.
     * Giá trị: MOTORBIKE | CAR | TRUCK
     */
    String vehicleType;
}

