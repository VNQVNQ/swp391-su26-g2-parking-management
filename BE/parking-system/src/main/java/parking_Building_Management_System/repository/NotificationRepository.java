package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Notification;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);
    
    long countByRecipientUserIdAndIsReadFalse(Long recipientUserId);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.userId = :recipientUserId AND n.isRead = false")
    void markAllAsReadByRecipientUserId(Long recipientUserId);
}
