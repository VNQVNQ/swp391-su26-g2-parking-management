package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.pricingRule.request.PricingRuleRequest;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleDetailResponse;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleResponse;
import parking_Building_Management_System.entity.user.ParkingUserDetails;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.service.PricingRuleService;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pricing-rules")
@RequiredArgsConstructor
public class PricingRuleController {

    private final PricingRuleService pricingRuleService;

    /**
     * Create a new pricing rule
     * Extracts userId from JWT authentication context
     */
    @PostMapping
    public ResponseEntity<PricingRuleResponse> createPricingRule(@RequestBody PricingRuleRequest request) {
        ParkingUserDetails userDetails = (ParkingUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Long userId = userDetails.getUserId();

        PricingRuleResponse response = pricingRuleService.createPricingRule(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all pricing rules
     */
    @GetMapping
    public ResponseEntity<List<PricingRuleResponse>> getAllPricingRules() {
        List<PricingRuleResponse> responses = pricingRuleService.getAllPricingRules();
        return ResponseEntity.ok(responses);
    }

    /**
     * Get pricing rule by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PricingRuleDetailResponse> getPricingRuleById(@PathVariable UUID id) {
        PricingRuleDetailResponse response = pricingRuleService.getPricingRuleById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get pricing rules by vehicle type
     */
    @GetMapping("/vehicle-type/{vehicleType}")
    public ResponseEntity<List<PricingRuleResponse>> getPricingRulesByVehicleType(
            @PathVariable VehicleType vehicleType) {
        List<PricingRuleResponse> responses = pricingRuleService.getPricingRulesByVehicleType(vehicleType);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get pricing rules by zone
     */
    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<List<PricingRuleResponse>> getPricingRulesByZone(@PathVariable UUID zoneId) {
        List<PricingRuleResponse> responses = pricingRuleService.getPricingRulesByZone(zoneId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Find applicable pricing rule for a specific vehicle type, ticket type, zone, and date
     * Query parameters: vehicleType (required), ticketType (required), zoneId (optional), date (optional, defaults to today)
     */
    @GetMapping("/search")
    public ResponseEntity<List<PricingRuleDetailResponse>> findApplicablePricingRule(
            @RequestParam VehicleType vehicleType,
            @RequestParam TicketType ticketType,
            @RequestParam(required = false) UUID zoneId,
            @RequestParam(required = false) LocalDate date) {

        if (date == null) {
            date = LocalDate.now();
        }

        List<PricingRuleDetailResponse> responses = pricingRuleService.findApplicablePricingRule(
                vehicleType, ticketType, zoneId, date);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update pricing rule
     */
    @PutMapping("/{id}")
    public ResponseEntity<PricingRuleDetailResponse> updatePricingRule(
            @PathVariable UUID id,
            @RequestBody PricingRuleRequest request) {
        PricingRuleDetailResponse response = pricingRuleService.updatePricingRule(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Activate pricing rule
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activatePricingRule(@PathVariable UUID id) {
        pricingRuleService.activatePricingRule(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Deactivate pricing rule
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivatePricingRule(@PathVariable UUID id) {
        pricingRuleService.deactivatePricingRule(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Get pricing history for a specific vehicle type and ticket type
     * Query parameters: vehicleType (required), ticketType (required), zoneId (optional)
     */
    @GetMapping("/history")
    public ResponseEntity<List<PricingRuleDetailResponse>> getPricingHistory(
            @RequestParam VehicleType vehicleType,
            @RequestParam TicketType ticketType,
            @RequestParam(required = false) UUID zoneId) {
        List<PricingRuleDetailResponse> responses = pricingRuleService.getPricingHistory(
                vehicleType, ticketType, zoneId);
        return ResponseEntity.ok(responses);
    }
}
