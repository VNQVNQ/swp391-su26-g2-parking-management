package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.ParkingException;
import parking_Building_Management_System.entity.enums.ExceptionStatus;
import parking_Building_Management_System.entity.enums.ExceptionType;
import java.util.List;
import java.util.UUID;

@Repository
public interface ParkingExceptionRepository extends JpaRepository<ParkingException, UUID> {
    List<ParkingException> findBySessionId(UUID sessionId);

    List<ParkingException> findByExceptionType(ExceptionType exceptionType);

    List<ParkingException> findByStatus(ExceptionStatus status);

    List<ParkingException> findByExceptionTypeAndStatus(ExceptionType exceptionType, ExceptionStatus status);

    @Query("SELECT e FROM ParkingException e WHERE e.session.vehicle.licensePlate = :licensePlate ORDER BY e.createdAt DESC")
    List<ParkingException> findByVehicleLicensePlate(@Param("licensePlate") String licensePlate);

    @Query("SELECT e FROM ParkingException e WHERE e.session.vehicle.id = :vehicleId ORDER BY e.createdAt DESC")
    List<ParkingException> findByVehicleId(@Param("vehicleId") UUID vehicleId);

    List<ParkingException> findByStatusAndResolvedAtBefore(ExceptionStatus status, java.time.LocalDateTime cutoffTime);
}




