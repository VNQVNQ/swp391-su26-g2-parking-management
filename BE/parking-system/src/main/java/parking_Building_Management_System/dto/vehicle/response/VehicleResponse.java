package parking_Building_Management_System.dto.vehicle.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleResponse {
    UUID id;
    String licensePlate;
    VehicleType vehicleType;
    String ownerName;
    String phone;
    Boolean hasMonthlyPass;
    LocalDate monthlyPassExpiry;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

