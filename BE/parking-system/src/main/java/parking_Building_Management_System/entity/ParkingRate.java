package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.enums.TicketType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pricing_rules", schema = "public", indexes = {
        @Index(name = "idx_pricing_rules_vehicle_type", columnList = "vehicle_type"),
        @Index(name = "idx_pricing_rules_ticket_type", columnList = "ticket_type"),
        @Index(name = "idx_pricing_rules_zone_id", columnList = "zone_id"),
        @Index(name = "idx_pricing_rules_effective_from", columnList = "effective_from")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingRate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "zone_id", columnDefinition = "uuid")
    UUID zoneId; // NULL = áp toàn bộ bãi

    @Column(name = "name", nullable = false, length = 100)
    String name;

    @Column(name = "vehicle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @Column(name = "ticket_type", nullable = false)
    @Enumerated(EnumType.STRING)
    TicketType ticketType;

    @Column(name = "rate_per_hour", nullable = false, precision = 15, scale = 0)
    Long ratePerHour; // VND/giờ

    @Column(name = "minimum_fee", nullable = false, precision = 15, scale = 0)
    Long minimumFee; // VND - phí tối thiểu

    @Column(name = "maximum_daily_fee", precision = 15, scale = 0)
    Long maximumDailyFee; // VND - phí tối đa/ngày

    @Column(name = "overstay_rate_multiplier", precision = 3, scale = 2)
    Double overstayRateMultiplier; // VD: 2.00 = gấp 2 lần phí thường

    @Column(name = "peak_hour_start")
    LocalTime peakHourStart;

    @Column(name = "peak_hour_end")
    LocalTime peakHourEnd;

    @Column(name = "peak_hour_multiplier", precision = 3, scale = 2)
    Double peakHourMultiplier; // VD: 1.5 = gấp 1.5 lần phí thường

    @Column(name = "effective_from", nullable = false)
    LocalDate effectiveFrom;

    @Column(name = "effective_to")
    LocalDate effectiveTo; // NULL = vô thời hạn

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    Boolean isActive;

    @Column(name = "created_by", nullable = false)
    Long createdBy; // User ID của manager tạo rule

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
        if (effectiveFrom == null) {
            effectiveFrom = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
