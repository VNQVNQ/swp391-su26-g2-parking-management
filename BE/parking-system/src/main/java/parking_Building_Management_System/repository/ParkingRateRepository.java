package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.ParkingRate;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.enums.TicketType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParkingRateRepository extends JpaRepository<ParkingRate, UUID> {

    // Lấy rule áp dụng cho loại xe và ticket type tại ngày cụ thể
    @Query("""
            SELECT pr FROM ParkingRate pr
            WHERE pr.vehicleType = :vehicleType
            AND pr.ticketType = :ticketType
            AND pr.isActive = true
            AND pr.effectiveFrom <= :date
            AND (pr.effectiveTo IS NULL OR pr.effectiveTo >= :date)
            AND (pr.zoneId IS NULL OR pr.zoneId = :zoneId)
            ORDER BY pr.zoneId DESC, pr.effectiveFrom DESC
            LIMIT 1
            """)
    Optional<ParkingRate> findApplicableRate(
            @Param("vehicleType") VehicleType vehicleType,
            @Param("ticketType") TicketType ticketType,
            @Param("date") LocalDate date,
            @Param("zoneId") UUID zoneId
    );

    // Lấy tất cả rule theo loại xe (để hiển thị bảng giá)
    List<ParkingRate> findByVehicleTypeAndIsActiveTrueOrderByEffectiveFromDesc(VehicleType vehicleType);

    // Lấy rule theo zone
    List<ParkingRate> findByZoneIdAndIsActiveTrueOrderByEffectiveFromDesc(UUID zoneId);

    // Lấy rule toàn bộ bãi (zoneId IS NULL)
    List<ParkingRate> findByZoneIdIsNullAndIsActiveTrueOrderByEffectiveFromDesc();

    // Kiểm tra rule trùng lặp
    @Query("""
            SELECT COUNT(pr) > 0 FROM ParkingRate pr
            WHERE pr.vehicleType = :vehicleType
            AND pr.ticketType = :ticketType
            AND pr.zoneId = :zoneId
            AND pr.isActive = true
            AND pr.effectiveFrom <= :date
            AND (pr.effectiveTo IS NULL OR pr.effectiveTo >= :date)
            """)
    boolean existsActiveRuleForDate(
            @Param("vehicleType") VehicleType vehicleType,
            @Param("ticketType") TicketType ticketType,
            @Param("zoneId") UUID zoneId,
            @Param("date") LocalDate date
    );
}
