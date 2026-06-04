package parking_Building_Management_System.entity; // Đã sửa lại package nằm trực tiếp trong entity

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import parking_Building_Management_System.entity.User.User;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "audit_logs", schema = "public", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_entity_type", columnList = "entity_type"),
        @Index(name = "idx_timestamp", columnList = "created_at")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuditLog { // Chữ A và L viết hoa chuẩn quy tắc Java
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(name = "action", nullable = false, length = 50)
    String action;

    @Column(name = "entity_type", length = 50) // Bỏ nullable để linh hoạt hơn
    String entityType;

    @Column(name = "entity_id", columnDefinition = "uuid")
    UUID entityId;

    @Column(name = "details", columnDefinition = "jsonb")
    String details;

    @Column(name = "created_at", nullable = false) // Đổi tên thành created_at để khớp với Service của bạn
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}