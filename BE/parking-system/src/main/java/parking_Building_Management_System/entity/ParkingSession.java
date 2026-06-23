package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.PricingRule;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "parking_sessions", schema = "public", indexes = {
        @Index(name = "idx_sessions_status", columnList = "status"),
        @Index(name = "idx_sessions_entry_time", columnList = "entry_time"),
        @Index(name = "idx_sessions_vehicle_id", columnList = "vehicle_id"),
        @Index(name = "idx_sessions_slot_active", columnList = "slot_id, status"),
        @Index(name = "idx_sessions_overstay", columnList = "overstay_flagged_at, entry_time"),
        @Index(name = "idx_session_pricing_rule", columnList = "applied_rule_id"),
        @Index(name = "idx_session_booking", columnList = "booking_id"),
        @Index(name = "idx_session_monthly_pass", columnList = "monthly_pass_id")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    Vehicle vehicle;

    @JsonIgnoreProperties({"currentSession", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    ParkingSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_entry_id", nullable = false)
    User staffEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_exit_id")
    User staffExit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applied_rule_id")
    PricingRule appliedRule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monthly_pass_id")
    MonthlyPass monthlyPass;

    @Column(name = "applied_monthly_pass_fee", precision = 15, scale = 0)
    BigDecimal appliedMonthlyPassFee;

    @Column(name = "entry_time", nullable = false)
    LocalDateTime entryTime;

    @Column(name = "exit_time")
    LocalDateTime exitTime;

    @Column(name = "fee", precision = 15, scale = 0)
    BigDecimal fee;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 0, columnDefinition = "numeric(15,0) default 0")
    BigDecimal discountAmount;

    @Column(name = "final_fee", precision = 15, scale = 0)
    BigDecimal finalFee;

    @Column(name = "payment_status", nullable = false)
    @Enumerated(EnumType.STRING)
    PaymentStatus paymentStatus;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    ParkingSessionStatus status;

    @Column(name = "ticket_type", nullable = false)
    @Enumerated(EnumType.STRING)
    TicketType ticketType;

    @Column(name = "face_verified_at_exit")
    Boolean faceVerifiedAtExit;

    @Column(name = "staff_override_used")
    Boolean staffOverrideUsed;

    @Column(name = "overstay_flagged_at")
    LocalDateTime overstayFlaggedAt;

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
        if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}



