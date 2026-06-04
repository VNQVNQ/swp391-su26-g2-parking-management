package parking_Building_Management_System.entity.AuditLog;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.User.User;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "audit_logs", schema = "public", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_entity_type", columnList = "entity_type"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(name = "action", nullable = false, length = 50)
    String action;

    @Column(name = "entity_type", nullable = false, length = 50)
    String entityType;

    @Column(name = "entity_id", columnDefinition = "uuid")
    UUID entityId;

    @Column(name = "details", columnDefinition = "jsonb")
    String details;

    @Column(name = "timestamp", nullable = false)
    LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}

