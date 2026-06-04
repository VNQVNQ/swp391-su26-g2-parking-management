package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.TicketType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "parking_sessions", schema = "public", indexes = {
        @Index(name = "idx_parking_session_vehicle_id", columnList = "vehicle_id"),
        @Index(name = "idx_parking_session_slot_id", columnList = "slot_id"),
        @Index(name = "idx_parking_session_entry_time", columnList = "entry_time"),
        @Index(name = "idx_parking_session_payment_status", columnList = "payment_status"),
        @Index(name = "idx_parking_session_status", columnList = "status")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    ParkingSlot slot;

    @Column(name = "entry_time", nullable = false)
    LocalDateTime entryTime;

    @Column(name = "exit_time")
    LocalDateTime exitTime;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    ParkingSessionStatus status;

    @Column(name = "ticket_type", nullable = false)
    @Enumerated(EnumType.STRING)
    TicketType ticketType;

    @Column(name = "fee", precision = 15, scale = 2)
    BigDecimal fee;

    @Column(name = "payment_status", nullable = false)
    @Enumerated(EnumType.STRING)
    PaymentStatus paymentStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_entry_id", nullable = false)
    User staffEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_exit_id")
    User staffExit;

    @Column(name = "booking_id")
    UUID bookingId;

    @Column(name = "face_verified_at_exit")
    Boolean faceVerifiedAtExit;

    @Column(name = "staff_override_used")
    Boolean staffOverrideUsed;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ParkingSessionStatus.ACTIVE;
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.UNPAID;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

