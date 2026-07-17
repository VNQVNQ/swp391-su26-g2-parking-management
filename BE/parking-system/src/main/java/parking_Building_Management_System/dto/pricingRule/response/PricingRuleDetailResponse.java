package parking_Building_Management_System.dto.pricingRule.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PricingRuleDetailResponse {
    UUID id;
    String name;
    VehicleType vehicleType;
    TicketType ticketType;
    BigDecimal ratePerHour;
    BigDecimal minimumFee;
    BigDecimal maximumDailyFee;
    BigDecimal monthlyFee;
    BigDecimal overstayRateMultiplier;
    LocalTime peakHourStart;
    LocalTime peakHourEnd;
    BigDecimal peakHourMultiplier;
    UUID zoneId;
    String zoneName;
    LocalDate effectiveFrom;
    LocalDate effectiveTo;
    Boolean isActive;
    Long createdByUserId;
    String createdByUserName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
