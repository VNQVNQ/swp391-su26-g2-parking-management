package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.pricingRule.request.PricingRuleRequest;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleDetailResponse;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleResponse;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PricingRuleService {
    PricingRuleResponse createPricingRule(PricingRuleRequest request, Long createdByUserId);

    PricingRuleDetailResponse getPricingRuleById(UUID id);

    List<PricingRuleResponse> getAllPricingRules();

    List<PricingRuleResponse> getPricingRulesByVehicleType(VehicleType vehicleType);

    List<PricingRuleResponse> getPricingRulesByZone(UUID zoneId);

    List<PricingRuleDetailResponse> findApplicablePricingRule(VehicleType vehicleType, TicketType ticketType, UUID zoneId, LocalDate date);

    PricingRuleDetailResponse updatePricingRule(UUID id, PricingRuleRequest request);

    void deactivatePricingRule(UUID id);

    void activatePricingRule(UUID id);

    List<PricingRuleDetailResponse> getPricingHistory(VehicleType vehicleType, TicketType ticketType, UUID zoneId);

    Long getActivePricingRuleCount();
}
