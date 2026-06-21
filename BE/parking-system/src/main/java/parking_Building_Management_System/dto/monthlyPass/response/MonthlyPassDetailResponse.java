package parking_Building_Management_System.dto.monthlyPass.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.dto.parkingSlot.response.ParkingSlotResponse;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public class MonthlyPassDetailResponse {
    UUID id;
    UUID vehicleId;
    String licensePlate;
    BigDecimal fee;
    LocalDate startDate;
    LocalDate endDate;
    PaymentStatus paymentStatus;
    Boolean isActive;
    Long remainingDays;
    Boolean isExpiring;
    Boolean isDaysFromNow;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    
    VehicleResponse vehicleDetails;
    ParkingSlotResponse slotDetails;
}
