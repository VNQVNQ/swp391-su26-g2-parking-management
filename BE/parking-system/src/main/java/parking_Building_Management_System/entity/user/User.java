package parking_Building_Management_System.entity.user;

import parking_Building_Management_System.entity.role.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users", schema = "public", indexes = {
        @Index(name = "idx_users_email_active", columnList = "email"),
        @Index(name = "idx_users_phone_active", columnList = "phone_number"),
        @Index(name = "idx_users_identify_active", columnList = "identify_number")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    Long userId;

    @Column(name = "email", nullable = false, unique = true)
    String email;

    @Column(name = "password", nullable = false)
    String password;

    @Column(name = "full_name", nullable = false)
    String fullName;

    @Column(name = "phone_number", unique = true)
    String phoneNumber;

    @Column(name = "identify_number", unique = true)
    String identifyNumber;

    @Column(name = "gender", length = 10)
    String gender;

    // ĐÃ THÊM: Khai báo trường age để sửa lỗi thiếu hàm getAge() và setAge()
    @Transient
    Integer age;

    @Column(name = "user_is_active", nullable = false)
    Boolean userIsActive;

    @Column(name = "address")
    String address;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    Role role;

    @Column(name = "last_active")
    LocalDateTime lastActive;

    @Column(name = "refresh_token")
    String refreshToken;

    @Column(name = "locked_token")
    String lockedToken;

    @Column(name = "locked_until")
    LocalDateTime lockedUntil;

    @Column(name = "token_reset_password")
    String tokenResetPassword;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (userIsActive == null) {
            userIsActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getAge() {
        if (dateOfBirth == null) {
            return null;
        }
        return java.time.Period.between(dateOfBirth, java.time.LocalDate.now()).getYears();
    }
}