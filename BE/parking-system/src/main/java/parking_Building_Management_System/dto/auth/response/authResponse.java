package parking_Building_Management_System.dto.auth.response;

import parking_Building_Management_System.dto.user.response.userResponse;
import parking_Building_Management_System.entity.User.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class authResponse {
    boolean auth;
    String accessToken;
    String refreshToken;
    userResponse user;
}
