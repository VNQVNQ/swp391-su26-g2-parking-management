package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findBySlotIdAndStatus(UUID slotId, BookingStatus status);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByVehicleId(UUID vehicleId);

    List<Booking> findByBookingStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
}

