package parking_Building_Management_System.dto.auth.response;

import parking_Building_Management_System.dto.user.response.UserResponse;
import parking_Building_Management_System.entity.User.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthResponse {
    boolean auth;
    String accessToken;
    String refreshToken;
    UserResponse user;
}
