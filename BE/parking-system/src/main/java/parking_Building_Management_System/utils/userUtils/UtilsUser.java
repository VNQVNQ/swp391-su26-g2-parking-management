package parking_Building_Management_System.utils.userUtils;

import parking_Building_Management_System.dto.user.response.UserResponse;
import parking_Building_Management_System.entity.user.User;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class UtilsUser {

    public List<UserResponse> getListUserResponses(List<User> users) {
        return users.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    public UserResponse toUserResponse(User user) {
        // ĐÃ SỬA: Convert LocalDateTime và LocalDate sang Date
        Date lastActiveDate = user.getLastActive() != null
                ? Date.from(user.getLastActive().atZone(ZoneId.systemDefault()).toInstant())
                : null;
        Date dobDate = user.getDateOfBirth() != null
                ? Date.from(user.getDateOfBirth().atStartOfDay(ZoneId.systemDefault()).toInstant())
                : null;

        return UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .password(user.getPassword())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .identifyNumber(user.getIdentifyNumber())
                .gender(user.getGender())
                .userIsActivated(user.getUserIsActive())
                .address(user.getAddress())
                .dateOfBirth(dobDate) // ĐÃ SỬA
                .roleCode(user.getRole() != null ? user.getRole().getRoleCode() : null)
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : null)
                .lastActive(lastActiveDate) // ĐÃ SỬA
                .build();
    }
}