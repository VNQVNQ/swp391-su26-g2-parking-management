package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findBySlotIdAndStatus(UUID slotId, BookingStatus status);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByVehicleId(UUID vehicleId);

    List<Booking> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByVehicleIdAndStatus(UUID vehicleId, BookingStatus status);

    List<Booking> findByStatusAndBookingExpiryAtBefore(BookingStatus status, LocalDateTime expiryTime);

    List<Booking> findByStatusAndUpdatedAtBefore(BookingStatus status, LocalDateTime updatedAt);

    @Query("SELECT b FROM Booking b WHERE b.status IN (:statuses) AND b.updatedAt < :updatedAt AND NOT EXISTS (SELECT 1 FROM ParkingSession p WHERE p.booking = b)")
    List<Booking> findByStatusesAndUpdatedAtBeforeAndNotReferencedBySession(
            @Param("statuses") java.util.List<BookingStatus> statuses,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime > :startTime")
    List<Booking> findByStatusAndStartTimeAfter(@Param("status") BookingStatus status, @Param("startTime") LocalDateTime startTime);

    @Query("SELECT b FROM Booking b WHERE b.slot.id = :slotId AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findBySlotIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
            @Param("slotId") UUID slotId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime
    );

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status IN :statuses AND b.startTime > :startTime")
    long countByStatusInAndStartTimeAfter(@Param("statuses") List<BookingStatus> statuses, @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status AND b.bookingExpiryAt < :expiryTime")
    long countByStatusAndBookingExpiryAtBefore(@Param("status") BookingStatus status, @Param("expiryTime") LocalDateTime expiryTime);

    @Query("SELECT b FROM Booking b WHERE b.user.userId = :userId OR (b.user IS NULL AND b.vehicle.user.userId = :userId) ORDER BY b.createdAt DESC")
    List<Booking> findByVehicleOwnerUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.slot.zone.id = :zoneId AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime")
    long countBookedSlotsByZone(
            @Param("zoneId") UUID zoneId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT DISTINCT b.slot.id FROM Booking b WHERE b.slot.zone.id = :zoneId AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime AND b.slot IS NOT NULL")
    List<UUID> findBookedSlotIdsByZone(
            @Param("zoneId") UUID zoneId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}



