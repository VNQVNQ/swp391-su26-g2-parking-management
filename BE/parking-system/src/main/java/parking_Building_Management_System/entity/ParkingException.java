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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "exceptions", schema = "public", indexes = {
    @Index(name = "idx_exceptions_session_type", columnList = "session_id, exception_type"),
    @Index(name = "idx_exceptions_status", columnList = "status"),
    @Index(name = "idx_exceptions_staff", columnList = "created_by")
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

    @Column(name = "exception_type", nullable = false)
    @Enumerated(EnumType.STRING)
    ExceptionType exceptionType;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    String reason;

    @Column(name = "resolution", columnDefinition = "TEXT")
    String resolution;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    ExceptionStatus status;

    @Column(name = "resolved_at")
    LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ExceptionStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


