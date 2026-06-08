package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.enums.ExceptionStatus;
import parking_Building_Management_System.entity.enums.ExceptionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "exceptions", schema = "public", indexes = {
    @Index(name = "idx_session_id", columnList = "session_id"),
    @Index(name = "idx_type", columnList = "type"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingException {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    ParkingSession session;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    ExceptionType type;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "surcharge", precision = 10, scale = 2)
    BigDecimal surcharge;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    ExceptionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "resolution", columnDefinition = "TEXT")
    String resolution;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "resolved_at")
    LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = ExceptionStatus.PENDING;
        }
    }
}

