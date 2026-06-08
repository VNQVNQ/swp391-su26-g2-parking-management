package parking_Building_Management_System.dto.vehicle.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleSearchRequest {
    String licensePlate;
    Double fuzzyThreshold;

    public VehicleSearchRequest(String licensePlate) {
        this.licensePlate = licensePlate;
        this.fuzzyThreshold = 0.8; // Default 80% similarity
    }
}
