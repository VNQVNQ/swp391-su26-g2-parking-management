package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.user.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "audit_logs", schema = "public", indexes = {
        @Index(name = "idx_audit_user", columnList = "user_id"),
        @Index(name = "idx_audit_entity", columnList = "entity_name, entity_id"),
        @Index(name = "idx_audit_time", columnList = "created_at")
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

    @Column(name = "action", nullable = false, length = 100)
    String action;

    @Column(name = "entity_name", length = 100)
    String entityName;

    @Column(name = "entity_id", length = 100)
    String entityId;

    @Column(name = "old_values", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    String oldValues;

    @Column(name = "new_values", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    String newValues;

    @Column(name = "ip_address", length = 45)
    String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

