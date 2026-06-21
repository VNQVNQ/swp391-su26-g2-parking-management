package parking_Building_Management_System.dto.pricingRule.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PricingRuleResponse {
    UUID id;
    String name;
    VehicleType vehicleType;
    TicketType ticketType;
    BigDecimal ratePerHour;
    BigDecimal minimumFee;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
