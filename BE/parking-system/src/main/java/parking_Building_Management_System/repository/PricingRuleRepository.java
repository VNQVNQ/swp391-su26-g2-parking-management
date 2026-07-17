package parking_Building_Management_System.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {
    List<PricingRule> findByVehicleTypeAndTicketType(VehicleType vehicleType, TicketType ticketType);

    List<PricingRule> findByVehicleType(VehicleType vehicleType);
    List<PricingRule> findByVehicleType(VehicleType vehicleType, Sort sort);

    List<PricingRule> findByIsActiveTrue();
    List<PricingRule> findByIsActiveTrue(Sort sort);

    List<PricingRule> findByTicketTypeAndIsActiveTrue(TicketType ticketType);
    List<PricingRule> findByTicketTypeAndIsActiveTrue(TicketType ticketType, Sort sort);

    List<PricingRule> findByZoneIdAndIsActiveTrue(UUID zoneId);
    List<PricingRule> findByZoneIdAndIsActiveTrue(UUID zoneId, Sort sort);

    @Query("SELECT p FROM PricingRule p WHERE p.vehicleType = :vehicleType AND p.ticketType = :ticketType " +
           "AND p.zone.id = :zoneId AND p.effectiveFrom <= :date AND (p.effectiveTo IS NULL OR p.effectiveTo >= :date) " +
           "AND p.isActive = true")
    List<PricingRule> findApplicablePricingRulesForZone(
            @Param("vehicleType") VehicleType vehicleType,
            @Param("ticketType") TicketType ticketType,
            @Param("zoneId") UUID zoneId,
            @Param("date") LocalDate date);

    @Query("SELECT p FROM PricingRule p WHERE p.vehicleType = :vehicleType AND p.ticketType = :ticketType " +
           "AND p.zone IS NULL AND p.effectiveFrom <= :date AND (p.effectiveTo IS NULL OR p.effectiveTo >= :date) " +
           "AND p.isActive = true")
    List<PricingRule> findApplicableGlobalPricingRules(
            @Param("vehicleType") VehicleType vehicleType,
            @Param("ticketType") TicketType ticketType,
            @Param("date") LocalDate date);

    List<PricingRule> findByVehicleTypeAndTicketTypeOrderByCreatedAtDesc(VehicleType vehicleType, TicketType ticketType);

    Long countByIsActiveTrue();
}

