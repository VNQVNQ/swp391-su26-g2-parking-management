package parking_Building_Management_System.entity.Vehicle;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "vehicles", schema = "public", indexes = {
    @Index(name = "idx_license_plate", columnList = "license_plate", unique = true)
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "license_plate", nullable = false, unique = true, length = 20)
    String licensePlate;

    @Column(name = "vehicle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @Column(name = "owner_name", length = 100)
    String ownerName;

    @Column(name = "phone", length = 20)
    String phone;

    @Column(name = "has_monthly_pass", nullable = false, columnDefinition = "boolean default false")
    Boolean hasMonthlyPass;

    @Column(name = "monthly_pass_expiry")
    LocalDate monthlyPassExpiry;

    @Column(name = "face_descriptor")
    byte[] faceDescriptor;

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
        if (hasMonthlyPass == null) {
            hasMonthlyPass = false;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

