package parking_Building_Management_System.dto.user.request;

import parking_Building_Management_System.entity.role.Role;
import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRequest {

    String email;
    String password;
    String confirmPassword;
    String fullName;
    String phoneNumber;
    String identifyNumber;
    String gender;
    Date dateOfBirth;
    String address;
}
