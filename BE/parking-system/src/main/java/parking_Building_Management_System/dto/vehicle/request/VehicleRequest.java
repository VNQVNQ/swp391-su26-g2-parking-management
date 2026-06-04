package parking_Building_Management_System.dto.request;

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
    @Pattern(regexp = "^[A-Z]{2}-\\d{4,5}$|^[A-Z]{2}\\.\\d{4,5}$", 
            message = "License plate must follow Vietnamese format: XX-XXXXX or XX-XXXX")
    String licensePlate;

    @NotNull(message = "Vehicle type is required")
    VehicleType vehicleType;

    String ownerName;

    @Pattern(regexp = "^(\\+84|0)?[0-9]{9,10}$", 
            message = "Phone number must be a valid Vietnamese phone number")
    String phone;

    Boolean hasMonthlyPass;
}

