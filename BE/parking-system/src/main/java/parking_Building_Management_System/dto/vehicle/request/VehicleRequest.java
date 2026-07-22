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
            regexp = "^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3}\\.?[0-9]{2}$",
            message = "Biển số không đúng định dạng Việt Nam. VD: 29A-123.45, 59F2-67890, 80NG-123.45"
    )
    String licensePlate;

    @NotNull(message = "Vehicle type is required")
    VehicleType vehicleType;

    Long userId;

    Boolean hasMonthlyPass;

    String paymentMethod;
}