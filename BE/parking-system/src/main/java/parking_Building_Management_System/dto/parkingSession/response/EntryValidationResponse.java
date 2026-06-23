package parking_Building_Management_System.dto.parkingSession.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import java.util.UUID;

/**
 * DTO for validation response before creating parking session
 * BR-03: Xe còn nợ phí không được vào lại
 * BR-30: vehicleType xe phải khớp vehicleType slot
 * Phase 4: Include monthly pass validation status
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EntryValidationResponse {

    boolean valid;
    String message;

    // Nếu valid, return thông tin xe
    UUID vehicleId;
    String licensePlate;
    boolean foundVehicle;

    // Phase 4: Monthly pass info
    boolean hasActiveMonthlyPass;
    UUID monthlyPassId;

    // Nếu có vấn đề
    String errorCode;
}

