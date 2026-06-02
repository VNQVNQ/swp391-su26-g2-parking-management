package parking_Building_Management_System.entity.User;

import parking_Building_Management_System.entity.Role.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users", schema = "public")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long user_id;

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

    @Column(name = "gender")
    String gender;

    @Column(name = "user_is_active", nullable = false)
    Boolean userIsActive = true;

    @Column(name = "age")
    int age;

    @Column(name = "address")
    String address;

    @Column(name = "date_of_birth")
    Date dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    Role role;

    @Column(name = "last_active")
    Date lastActive = new Date();

    @Column(name = "refreshToken")
    String refreshToken;

    @Column(name = "locked_token")
    String lockedToken;

    @Column(name = "locked_until")
    Date lockedUntil;

    @Column(name = "tokenResetPassword")
    String tokenResetPassword;
}