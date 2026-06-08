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

    // Sử dụng @Query để map trực tiếp vào thuộc tính u.user_id kiểu Long trong Entity User
    @Query("SELECT al FROM AuditLog al WHERE al.user.user_id = :userId")
    List<AuditLog> findByUserId(@Param("userId") Long userId);

    List<AuditLog> findByEntityType(String entityType);

    // ĐÃ SỬA: Thêm chữ "endTime" bị thiếu vào sau LocalDateTime
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :startTime AND :endTime")
    List<AuditLog> findByTimestampBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
}