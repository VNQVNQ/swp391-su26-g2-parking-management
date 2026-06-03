package parking_Building_Management_System.entity.ParkingSlot;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.Floor.Floor;
import parking_Building_Management_System.entity.Zone.Zone;
import parking_Building_Management_System.entity.enums.SlotStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "parking_slots", schema = "public", indexes = {
    @Index(name = "idx_slot_code", columnList = "slot_code", unique = true),
    @Index(name = "idx_floor_id", columnList = "floor_id"),
    @Index(name = "idx_zone_id", columnList = "zone_id"),
    @Index(name = "idx_status", columnList = "status")
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

    @Column(name = "vehicle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    SlotStatus status;

    @Column(name = "current_session_id")
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID currentSessionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = SlotStatus.FREE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

