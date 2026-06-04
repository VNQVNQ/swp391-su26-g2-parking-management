package parking_Building_Management_System.service.Auth;

import parking_Building_Management_System.dto.auth.request.AuthRequest;
import parking_Building_Management_System.entity.User.User;
import parking_Building_Management_System.service.User.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationService {
    // ĐÚNG: Sửa kiểu dữ liệu thành UserService (viết hoa chữ U)
    final UserService userService;

    // ĐÚNG: Sửa kiểu dữ liệu tham số thành AuthRequest (viết hoa chữ A)
    public boolean authenticate(AuthRequest authRequest){
        System.out.println(authRequest);

        // Gọi đến bean userService (tên biến viết thường thì giữ nguyên)
        User user = userService.findUserByEmail(authRequest.getEmail());

        if (user == null) {
            System.out.println("Không tìm thấy user");
            return false;
        }

        if(!user.getUserIsActive()){
            System.out.println("User không được kích hoạt");
            return false;
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        return passwordEncoder.matches(authRequest.getPassword(), user.getPassword());
    }
}