package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.pricingRule.request.PricingRuleRequest;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleDetailResponse;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleResponse;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.PricingRuleRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.PricingRuleService;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PricingRuleServiceImpl implements PricingRuleService {

    private final PricingRuleRepository pricingRuleRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;

    @Override
    public PricingRuleResponse createPricingRule(PricingRuleRequest request, Long createdByUserId) {
        User createdByUser = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PricingRule pricingRule = new PricingRule();
        pricingRule.setName(request.getName());
        pricingRule.setVehicleType(request.getVehicleType());
        pricingRule.setTicketType(request.getTicketType());
        pricingRule.setRatePerHour(request.getRatePerHour());
        pricingRule.setMinimumFee(request.getMinimumFee());
        pricingRule.setMaximumDailyFee(request.getMaximumDailyFee());
        pricingRule.setOverstayRateMultiplier(request.getOverstayRateMultiplier());
        pricingRule.setPeakHourStart(request.getPeakHourStart());
        pricingRule.setPeakHourEnd(request.getPeakHourEnd());
        pricingRule.setPeakHourMultiplier(request.getPeakHourMultiplier());
        pricingRule.setEffectiveFrom(request.getEffectiveFrom());
        pricingRule.setEffectiveTo(request.getEffectiveTo());
        pricingRule.setIsActive(true);
        pricingRule.setCreatedBy(createdByUser);

        if (request.getZoneId() != null) {
            Zone zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new RuntimeException("Zone not found"));
            pricingRule.setZone(zone);
        }

        pricingRule = pricingRuleRepository.save(pricingRule);
        return mapToResponse(pricingRule);
    }

    @Override
    @Transactional(readOnly = true)
    public PricingRuleDetailResponse getPricingRuleById(UUID id) {
        PricingRule pricingRule = pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));
        return mapToDetailResponse(pricingRule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricingRuleResponse> getAllPricingRules() {
        return pricingRuleRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricingRuleResponse> getPricingRulesByVehicleType(VehicleType vehicleType) {
        return pricingRuleRepository.findByVehicleType(vehicleType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricingRuleResponse> getPricingRulesByZone(UUID zoneId) {
        return pricingRuleRepository.findByZoneIdAndIsActiveTrue(zoneId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricingRuleDetailResponse> findApplicablePricingRule(VehicleType vehicleType, TicketType ticketType, UUID zoneId, LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<PricingRuleDetailResponse> result = null;

        // First priority: zone-specific rule
        if (zoneId != null) {
            List<PricingRule> zoneRules = pricingRuleRepository.findApplicablePricingRulesForZone(vehicleType, ticketType, zoneId, date);
            if (!zoneRules.isEmpty()) {
                result = zoneRules.stream()
                        .map(this::mapToDetailResponse)
                        .collect(Collectors.toList());
                return result;
            }
        }

        // Second priority: global rule (zone_id = null)
        List<PricingRule> globalRules = pricingRuleRepository.findApplicableGlobalPricingRules(vehicleType, ticketType, date);
        if (!globalRules.isEmpty()) {
            result = globalRules.stream()
                    .map(this::mapToDetailResponse)
                    .collect(Collectors.toList());
            return result;
        }

        return result != null ? result : List.of();
    }

    @Override
    public PricingRuleDetailResponse updatePricingRule(UUID id, PricingRuleRequest request) {
        PricingRule pricingRule = pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));

        pricingRule.setName(request.getName());
        pricingRule.setVehicleType(request.getVehicleType());
        pricingRule.setTicketType(request.getTicketType());
        pricingRule.setRatePerHour(request.getRatePerHour());
        pricingRule.setMinimumFee(request.getMinimumFee());
        pricingRule.setMaximumDailyFee(request.getMaximumDailyFee());
        pricingRule.setOverstayRateMultiplier(request.getOverstayRateMultiplier());
        pricingRule.setPeakHourStart(request.getPeakHourStart());
        pricingRule.setPeakHourEnd(request.getPeakHourEnd());
        pricingRule.setPeakHourMultiplier(request.getPeakHourMultiplier());
        pricingRule.setEffectiveFrom(request.getEffectiveFrom());
        pricingRule.setEffectiveTo(request.getEffectiveTo());

        if (request.getZoneId() != null) {
            Zone zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new RuntimeException("Zone not found"));
            pricingRule.setZone(zone);
        } else {
            pricingRule.setZone(null);
        }

        pricingRule = pricingRuleRepository.save(pricingRule);
        return mapToDetailResponse(pricingRule);
    }

    @Override
    public void deactivatePricingRule(UUID id) {
        PricingRule pricingRule = pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));
        pricingRule.setIsActive(false);
        pricingRuleRepository.save(pricingRule);
    }

    @Override
    public void activatePricingRule(UUID id) {
        PricingRule pricingRule = pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));
        pricingRule.setIsActive(true);
        pricingRuleRepository.save(pricingRule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricingRuleDetailResponse> getPricingHistory(VehicleType vehicleType, TicketType ticketType, UUID zoneId) {
        List<PricingRule> history = pricingRuleRepository.findByVehicleTypeAndTicketTypeOrderByCreatedAtDesc(vehicleType, ticketType);

        if (zoneId != null) {
            history = history.stream()
                    .filter(rule -> rule.getZone() != null && rule.getZone().getId().equals(zoneId))
                    .collect(Collectors.toList());
        }

        return history.stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActivePricingRuleCount() {
        return pricingRuleRepository.countByIsActiveTrue();
    }

    private PricingRuleResponse mapToResponse(PricingRule pricingRule) {
        return new PricingRuleResponse(
                pricingRule.getId(),
                pricingRule.getName(),
                pricingRule.getVehicleType(),
                pricingRule.getTicketType(),
                pricingRule.getRatePerHour(),
                pricingRule.getMinimumFee(),
                pricingRule.getIsActive(),
                pricingRule.getCreatedAt(),
                pricingRule.getUpdatedAt()
        );
    }

    private PricingRuleDetailResponse mapToDetailResponse(PricingRule pricingRule) {
        return new PricingRuleDetailResponse(
                pricingRule.getId(),
                pricingRule.getName(),
                pricingRule.getVehicleType(),
                pricingRule.getTicketType(),
                pricingRule.getRatePerHour(),
                pricingRule.getMinimumFee(),
                pricingRule.getMaximumDailyFee(),
                pricingRule.getOverstayRateMultiplier(),
                pricingRule.getPeakHourStart(),
                pricingRule.getPeakHourEnd(),
                pricingRule.getPeakHourMultiplier(),
                pricingRule.getZone() != null ? pricingRule.getZone().getId() : null,
                pricingRule.getZone() != null ? pricingRule.getZone().getName() : null,
                pricingRule.getEffectiveFrom(),
                pricingRule.getEffectiveTo(),
                pricingRule.getIsActive(),
                pricingRule.getCreatedBy().getUserId(),
                pricingRule.getCreatedBy().getFullName(),
                pricingRule.getCreatedAt(),
                pricingRule.getUpdatedAt()
        );
    }
}
