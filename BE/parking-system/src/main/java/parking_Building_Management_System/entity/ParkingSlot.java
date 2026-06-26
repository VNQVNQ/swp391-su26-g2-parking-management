package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "parking_slots", schema = "public", indexes = {
    @Index(name = "idx_slot_code", columnList = "slot_code", unique = true),
    @Index(name = "idx_slots_zone_id", columnList = "zone_id"),
    @Index(name = "idx_slots_zone_free", columnList = "zone_id, current_session_id"),
    @Index(name = "idx_slots_maintenance", columnList = "maintenance_status")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "slot_code", nullable = false, unique = true, length = 20)
    String slotCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    Zone zone;

    @Column(name = "vehicle_type", nullable = false, columnDefinition = "vehicle_type_enum")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    VehicleType vehicleType;

    @Column(name = "maintenance_status", nullable = false, columnDefinition = "slot_maintenance_enum")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    SlotMaintenanceStatus maintenanceStatus;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_session_id", referencedColumnName = "id")
    ParkingSession currentSession;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (maintenanceStatus == null) {
            maintenanceStatus = SlotMaintenanceStatus.AVAILABLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

