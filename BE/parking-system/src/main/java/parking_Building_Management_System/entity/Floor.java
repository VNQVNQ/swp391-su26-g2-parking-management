package parking_Building_Management_System.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "floors", schema = "public", indexes = {
    @Index(name = "idx_floors_level_number", columnList = "level_number", unique = true)
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Floor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @Column(name = "name", nullable = false, length = 50)
    String name;

    @Column(name = "level_number", nullable = false, unique = true)
    Integer levelNumber;

    @Column(name = "description", length = 255)
    String description;

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



