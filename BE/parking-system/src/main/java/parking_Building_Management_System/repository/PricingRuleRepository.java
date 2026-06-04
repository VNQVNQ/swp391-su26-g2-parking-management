package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.UUID;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {
    List<PricingRule> findByVehicleTypeAndTicketType(VehicleType vehicleType, TicketType ticketType);

    List<PricingRule> findByVehicleType(VehicleType vehicleType);

    List<PricingRule> findByIsActiveTrue();
}

