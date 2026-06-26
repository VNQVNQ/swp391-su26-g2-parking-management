package parking_Building_Management_System.dto.parkingSlot.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BulkParkingSlotRequest {
    UUID floorId;
    UUID zoneId;
    VehicleType vehicleType;
    List<String> slotCodes;
    SlotMaintenanceStatus maintenanceStatus; // Thêm dòng này
}