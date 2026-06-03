package parking_Building_Management_System.dto.user.response;

import parking_Building_Management_System.entity.Role.Role;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long id;
    String email;
    String password;
    String fullName;
    String phoneNumber;
    String identifyNumber;
    String gender;
    Boolean userIsActivated;
    int age;
    String address;
    Date dateOfBirth;
    String roleCode;
    String roleName;
    Date lastActive;
}
