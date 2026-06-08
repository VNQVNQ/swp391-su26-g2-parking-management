package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Payment;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findBySessionId(UUID sessionId);

    @Query("SELECT p FROM Payment p WHERE p.status = :status")
    List<Payment> findByStatus(@Param("status") PaymentStatus status);

    // ĐÃ CẬP NHẬT: p.collectedBy.user_id khớp hoàn toàn với thuộc tính trong User.java
    // ĐÃ ĐỔI: Kiểu dữ liệu tham số từ UUID sang Long cho đồng bộ với khóa chính của User
    @Query("SELECT p FROM Payment p WHERE p.collectedBy.user_id = :userId")
    List<Payment> findByCollectedById(@Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.paidAt BETWEEN :startTime AND :endTime")
    List<Payment> findPaymentsBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startTime AND :endTime")
    List<Payment> findCompletedPaymentsBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
}