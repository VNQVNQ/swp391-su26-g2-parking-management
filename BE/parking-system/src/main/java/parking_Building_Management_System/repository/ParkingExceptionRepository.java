package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
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
}



