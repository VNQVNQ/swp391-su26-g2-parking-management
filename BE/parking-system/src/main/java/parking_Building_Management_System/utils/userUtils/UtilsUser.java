package parking_Building_Management_System.utils.UserUtils;

import parking_Building_Management_System.dto.user.response.UserResponse;
import parking_Building_Management_System.entity.user.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UtilsUser {

    // ĐÚNG: Sửa kiểu dữ liệu Generic trong List thành UserResponse (Viết hoa chữ U)
    public List<UserResponse> getListUserResponses(List<User> users) {
        return users.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    // ĐÚNG: Sửa kiểu dữ liệu trả về thành UserResponse (Viết hoa chữ U)
    public UserResponse toUserResponse(User user) {
        // ĐÚNG: Gọi Builder từ Class viết hoa UserResponse
        return UserResponse.builder()
                .id(user.getUser_id())
                .email(user.getEmail())
                .password(user.getPassword())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .identifyNumber(user.getIdentifyNumber())
                .gender(user.getGender())
                .userIsActivated(user.getUserIsActive())
                .address(user.getAddress())
                .dateOfBirth(user.getDateOfBirth())
                .roleCode(user.getRole().getRoleCode())
                .roleName(user.getRole().getRoleName())
                .lastActive(user.getLastActive())
                .build();
    }
}