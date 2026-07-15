package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.enums.ExceptionType;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(
    name = "penalty_configs",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_penalty_vehicle_exception", columnNames = {"vehicle_type", "exception_type"})
    },
    indexes = {
        @Index(name = "idx_penalty_lookup", columnList = "vehicle_type, exception_type, is_active")
    }
)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PenaltyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "vehicle_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @Column(name = "exception_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    ExceptionType exceptionType;

    @Column(name = "penalty_amount", nullable = false, precision = 15, scale = 0)
    BigDecimal penaltyAmount;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    Boolean isActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
