package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MonthlyPassRepository extends JpaRepository<MonthlyPass, UUID> {

    List<MonthlyPass> findByVehicleId(UUID vehicleId);

    // ĐÃ SỬA: Đổi từ findByStatus thành findByPaymentStatus để khớp với Entity
    List<MonthlyPass> findByPaymentStatus(PaymentStatus status);

    List<MonthlyPass> findByEndDateGreaterThanEqual(LocalDate endDate);
}