package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonthlyPassRepository extends JpaRepository<MonthlyPass, UUID> {

    List<MonthlyPass> findByVehicleId(UUID vehicleId);

    List<MonthlyPass> findByVehicle_User_Email(String email);

    List<MonthlyPass> findByPaymentStatus(PaymentStatus status);

    List<MonthlyPass> findByEndDateGreaterThanEqual(LocalDate endDate);

    Optional<MonthlyPass> findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
            UUID vehicleId, LocalDate date);

    boolean existsByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqual(UUID vehicleId, LocalDate date);

    @Query("SELECT mp FROM MonthlyPass mp WHERE mp.endDate BETWEEN :startDate AND :endDate " +
           "AND mp.isActive = true AND mp.paymentStatus = :status")
    List<MonthlyPass> findByEndDateBetweenAndIsActiveTrueAndPaymentStatus(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") PaymentStatus status);

    List<MonthlyPass> findByEndDateLessThanAndIsActiveTrue(LocalDate date);

    long countByIsActiveTrueAndPaymentStatus(PaymentStatus status);

    long countByIsActiveTrueAndEndDateGreaterThanEqual(LocalDate date);
}