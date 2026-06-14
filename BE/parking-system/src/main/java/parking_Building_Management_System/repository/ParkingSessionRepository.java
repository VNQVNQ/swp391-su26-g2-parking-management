package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, UUID> {
    List<ParkingSession> findByVehicleId(UUID vehicleId);

    List<ParkingSession> findByStatus(ParkingSessionStatus status);

    List<ParkingSession> findByPaymentStatus(PaymentStatus paymentStatus);

    Optional<ParkingSession> findBySlotIdAndStatus(UUID slotId, ParkingSessionStatus status);

    @Query("SELECT ps FROM ParkingSession ps WHERE ps.entryTime BETWEEN :startTime AND :endTime")
    List<ParkingSession> findSessionsBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT ps FROM ParkingSession ps WHERE ps.status = 'ACTIVE' ORDER BY ps.entryTime ASC")
    List<ParkingSession> findActiveSessions();

    // BR-03: Xe còn nợ phí không được vào lại
    @Query("SELECT ps FROM ParkingSession ps WHERE ps.vehicle.id = :vehicleId AND ps.paymentStatus = 'UNPAID'")
    Optional<ParkingSession> findUnpaidSessionByVehicleId(@Param("vehicleId") UUID vehicleId);

    // Get active session by vehicle ID (for checkout)
    @Query("SELECT ps FROM ParkingSession ps WHERE ps.vehicle.id = :vehicleId AND ps.status = 'ACTIVE'")
    Optional<ParkingSession> findActiveSessionByVehicleId(@Param("vehicleId") UUID vehicleId);
}

