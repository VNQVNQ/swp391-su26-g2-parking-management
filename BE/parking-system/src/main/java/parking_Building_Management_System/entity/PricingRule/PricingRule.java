package parking_Building_Management_System.entity.PricingRule;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.Zone.Zone;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pricing_rules", schema = "public", indexes = {
    @Index(name = "idx_vehicle_type", columnList = "vehicle_type"),
    @Index(name = "idx_ticket_type", columnList = "ticket_type")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PricingRule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "name", nullable = false, length = 100)
    String name;

    @Column(name = "vehicle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    Zone zone;

    @Column(name = "ticket_type", nullable = false)
    @Enumerated(EnumType.STRING)
    TicketType ticketType;

    @Column(name = "rate_per_hour", precision = 10, scale = 2)
    BigDecimal ratePerHour;

    @Column(name = "minimum_fee", precision = 10, scale = 2)
    BigDecimal minimumFee;

    @Column(name = "maximum_daily_fee", precision = 10, scale = 2)
    BigDecimal maximumDailyFee;

    @Column(name = "overstay_rate", precision = 10, scale = 2)
    BigDecimal overstayRate;

    @Column(name = "peak_hour_multiplier", precision = 3, scale = 2)
    BigDecimal peakHourMultiplier;

    @Column(name = "peak_hour_start")
    LocalTime peakHourStart;

    @Column(name = "peak_hour_end")
    LocalTime peakHourEnd;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    Boolean isActive;

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

