package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.enums.ReportType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "reports", schema = "public", indexes = {
    @Index(name = "idx_reports_manager", columnList = "generated_by"),
    @Index(name = "idx_reports_period", columnList = "period_from, period_to")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by", nullable = false)
    User generatedBy;

    @Column(name = "report_type", nullable = false)
    @Enumerated(EnumType.STRING)
    ReportType reportType;

    @Column(name = "period_from", nullable = false)
    LocalDate periodFrom;

    @Column(name = "period_to", nullable = false)
    LocalDate periodTo;

    @Column(name = "total_vehicles")
    Integer totalVehicles;

    @Column(name = "total_revenue", precision = 15, scale = 0)
    BigDecimal totalRevenue;

    @Column(name = "utilization_rate", precision = 5, scale = 2)
    BigDecimal utilizationRate;

    @Column(name = "peak_hour")
    LocalTime peakHour;

    @Column(name = "snapshot_data", columnDefinition = "jsonb")
    String snapshotData;

    @Column(name = "generated_at", nullable = false, updatable = false)
    LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}

