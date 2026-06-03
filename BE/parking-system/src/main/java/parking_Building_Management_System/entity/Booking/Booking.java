package parking_Building_Management_System.entity.Booking;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.ParkingSlot.ParkingSlot;
import parking_Building_Management_System.entity.Vehicle.Vehicle;
import parking_Building_Management_System.entity.enums.BookingStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "bookings", schema = "public", indexes = {
    @Index(name = "idx_slot_id", columnList = "slot_id"),
    @Index(name = "idx_booking_start_time", columnList = "booking_start_time"),
    @Index(name = "idx_status", columnList = "status")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    Vehicle vehicle;

    @Column(name = "license_plate", length = 20)
    String licensePlate;

    @Column(name = "vehicle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    ParkingSlot slot;

    @Column(name = "booking_start_time", nullable = false)
    LocalDateTime bookingStartTime;

    @Column(name = "booking_end_time", nullable = false)
    LocalDateTime bookingEndTime;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    BookingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = BookingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

