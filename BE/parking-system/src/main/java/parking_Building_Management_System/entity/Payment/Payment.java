package parking_Building_Management_System.entity.Payment;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.ParkingSession.ParkingSession;
import parking_Building_Management_System.entity.User.User;
import parking_Building_Management_System.entity.enums.PaymentMethod;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payments", schema = "public", indexes = {
    @Index(name = "idx_session_id", columnList = "session_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_paid_at", columnList = "paid_at"),
    @Index(name = "idx_collected_by", columnList = "collected_by")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    ParkingSession session;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @Column(name = "method", nullable = false)
    @Enumerated(EnumType.STRING)
    PaymentMethod method;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    PaymentStatus status;

    @Column(name = "paid_at")
    LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by", nullable = false)
    User collectedBy;

    @Column(name = "reference_code", length = 50)
    String referenceCode;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Column(name = "refunded_at")
    LocalDateTime refundedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refunded_by")
    User refundedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

