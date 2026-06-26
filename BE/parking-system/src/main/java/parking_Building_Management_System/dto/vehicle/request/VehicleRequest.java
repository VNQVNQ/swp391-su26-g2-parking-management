package parking_Building_Management_System.dto.vehicle.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleRequest {
    @NotBlank(message = "License plate is required")
    @Pattern(
            regexp = "^\\d{2}[A-Z]{1,2}-\\d{4,5}$|^\\d{2}[A-Z]{1,2}\\.\\d{4,5}$",
            message = "Biển số không đúng định dạng Việt Nam. VD: 51G-12345 hoặc 30AB-1234"
    )
    String licensePlate;

    @NotNull(message = "Vehicle type is required")
    VehicleType vehicleType;

    Long userId;

    Boolean hasMonthlyPass;
}