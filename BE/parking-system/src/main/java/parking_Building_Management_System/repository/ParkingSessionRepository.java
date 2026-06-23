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

    @Query("SELECT ps FROM ParkingSession ps WHERE ps.status = parking_Building_Management_System.entity.enums.ParkingSessionStatus.ACTIVE ORDER BY ps.entryTime ASC")
    List<ParkingSession> findActiveSessions();

    // BR-03: Xe còn nợ phí không được vào lại
    @Query("SELECT ps FROM ParkingSession ps WHERE ps.vehicle.id = :vehicleId AND ps.paymentStatus = parking_Building_Management_System.entity.enums.PaymentStatus.UNPAID")
    Optional<ParkingSession> findUnpaidSessionByVehicleId(@Param("vehicleId") UUID vehicleId);

    // Get active session by vehicle ID (for checkout)
    @Query("SELECT ps FROM ParkingSession ps WHERE ps.vehicle.id = :vehicleId AND ps.status = parking_Building_Management_System.entity.enums.ParkingSessionStatus.ACTIVE")
    Optional<ParkingSession> findActiveSessionByVehicleId(@Param("vehicleId") UUID vehicleId);

    // ĐÃ SỬA: Đổi s.totalFee thành s.finalFee (hoặc s.fee tùy logic của bạn) và đồng bộ đúng trường s.paymentStatus
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM ParkingSession s WHERE s.vehicle.id = ?1 AND s.finalFee IS NOT NULL AND s.paymentStatus = parking_Building_Management_System.entity.enums.PaymentStatus.UNPAID")
    boolean existsByVehicleIdAndTotalFeeIsNotNullAndIsPaidFalse(UUID vehicleId);

    // Phase 4: New query methods for monthly passes and bookings
    List<ParkingSession> findByMonthlyPassId(UUID monthlyPassId);

    List<ParkingSession> findByBookingId(UUID bookingId);

    @Query("SELECT COUNT(ps) FROM ParkingSession ps WHERE ps.monthlyPass.id = :monthlyPassId AND ps.paymentStatus = :paymentStatus AND ps.createdAt > :createdAt")
    long countByMonthlyPassIdAndPaymentStatusAndCreatedAtAfter(
        @Param("monthlyPassId") UUID monthlyPassId,
        @Param("paymentStatus") PaymentStatus paymentStatus,
        @Param("createdAt") LocalDateTime createdAt
    );
}