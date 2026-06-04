package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserId(UUID userId);

    List<AuditLog> findByEntityType(String entityType);

    @Query("SELECT al FROM AuditLog al WHERE al.timestamp BETWEEN :startTime AND :endTime")
    List<AuditLog> findByTimestampBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
}

