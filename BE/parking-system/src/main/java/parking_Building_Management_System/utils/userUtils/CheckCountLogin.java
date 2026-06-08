package parking_Building_Management_System.utils.userUtils;

import parking_Building_Management_System.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CheckCountLogin {
    public String getMessage(int count) {
        if (count < 5) {
            return "Email or Password is incorrect";
        }
        return "Too many login attempts. Please try again later.";
    }
}
