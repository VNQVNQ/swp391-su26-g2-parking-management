package parking_Building_Management_System.dto.user.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

/**
 * DTO dùng riêng cho luồng ADMIN tạo tài khoản người dùng.
 * Khác với UserRequest (đăng ký tự do, luôn bị ép role = DRIVER),
 * DTO này có thêm field roleCode để admin được phép chỉ định role
 * (DRIVER, STAFF, ADMIN, ...) cho tài khoản được tạo.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCreateUserRequest {

    String email;
    String password;
    String confirmPassword;
    String fullName;
    String phoneNumber;
    String identifyNumber;
    String gender;
    Date dateOfBirth;
    String address;

    // Field khác biệt duy nhất so với UserRequest: admin được quyền set role
    String roleCode;
}