package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.enums.NotificationType;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "notifications", schema = "public", indexes = {
    @Index(name = "idx_notif_unread", columnList = "recipient_id, is_read"),
    @Index(name = "idx_notif_created", columnList = "created_at")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    User recipient;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    NotificationType type;

    @Column(name = "reference_id", columnDefinition = "uuid")
    UUID referenceId;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    String message;

    @Column(name = "is_read", nullable = false, columnDefinition = "boolean default false")
    Boolean isRead;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
    }
}

