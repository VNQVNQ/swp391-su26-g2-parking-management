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
            regexp = "^\\d{2}[A-Z]-\\d{4,5}$",
            message = "License plate must follow format: 51A-12345"
    )
    String licensePlate;

    @NotNull(message = "Vehicle type is required")
    VehicleType vehicleType;

    Long userId;

    Boolean hasMonthlyPass;
}

