package parking_Building_Management_System.service.user;

import parking_Building_Management_System.dto.user.request.ResetPasswordRequest;
import parking_Building_Management_System.dto.user.request.UserChangePasswordRequest;
import parking_Building_Management_System.dto.user.request.UserRequest;
import parking_Building_Management_System.dto.user.request.UserRequestForUpdate;
import parking_Building_Management_System.entity.role.Role;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.RoleRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.service.auth.EmailService;
import parking_Building_Management_System.service.auth.JWTService;
import parking_Building_Management_System.service.AuditLogService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserService {
    final UserRepository userRepository;
    final RoleRepository roleRepository;
    final JWTService jwtService;
    final EmailService emailService;
    final AuditLogService auditLogService;

    @Transactional
    public void updateLastActive(Long userId) {
        // ĐÃ SỬA: new Date() thành LocalDateTime.now()
        userRepository.updateLastActive(userId, LocalDateTime.now());
    }

    public User getUserByToken(String token) {
        String email = jwtService.extractAllClaims(token).getSubject();
        // ĐÃ SỬA: Thêm .orElseThrow() vì findByEmail trả về Optional
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    public User createUser(UserRequest userRequest) {
        User newUser = new User();

        Role roleUser = roleRepository.findRoleByRoleCode("DRIVER");
        System.out.println("Role hệ thống tự gán mặc định nè: " + roleUser);

        if (roleUser == null) {
            throw new NoSuchElementException("Mã quyền 'DRIVER' không tồn tại trong hệ thống. Vui lòng kiểm tra lại SQL!");
        }

        if (!roleUser.isActive()) {
            throw new NoSuchElementException("Role code 'DRIVER' is not active");
        }

        if (userRequest.getDateOfBirth() != null) {
            Calendar birth = Calendar.getInstance();
            birth.setTime(userRequest.getDateOfBirth());
            Calendar today = Calendar.getInstance();

            int calculatedAge = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR);

            if (today.get(Calendar.DAY_OF_YEAR) < birth.get(Calendar.DAY_OF_YEAR)) {
                calculatedAge--;
            }
            newUser.setAge(calculatedAge);

            // ĐÃ SỬA: Ép kiểu Date (từ Request) sang LocalDate (cho Entity)
            LocalDate dob = userRequest.getDateOfBirth().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            newUser.setDateOfBirth(dob);
        } else {
            newUser.setAge(0);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        newUser.setAddress(userRequest.getAddress());
        newUser.setGender(userRequest.getGender());
        newUser.setEmail(userRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        newUser.setFullName(userRequest.getFullName());
        newUser.setPhoneNumber(userRequest.getPhoneNumber());
        newUser.setIdentifyNumber(userRequest.getIdentifyNumber());

        newUser.setRole(roleUser);
        newUser.setUserIsActive(true);
        // ĐÃ SỬA: Đổi new Date() thành LocalDateTime.now()
        newUser.setLastActive(LocalDateTime.now());

        userRepository.save(newUser);

        try {
            String logDetails = String.format(
                    "{\"email\":\"%s\",\"fullName\":\"%s\",\"action\":\"Self Registration\"}",
                    newUser.getEmail(),
                    newUser.getFullName()
            );

            auditLogService.createAuditLog(newUser, "USER_SELF_REGISTER", LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Không thể ghi nhận Audit Log: " + e.getMessage());
        }

        return newUser;
    }

    public List<User> getAllUser(String token) {
        List<User> users = this.userRepository.findAll();
        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "GET_ALL_USERS", LocalDateTime.now());
        return users;
    }

    public User getUserById(Long id, String token) {
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "GET_USER_BY_ID", LocalDateTime.now());

        return user;
    }

    public void deleteUser(Long id, String token) {
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setUserIsActive(false);
        this.userRepository.save(user);

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "DELETE_USER", LocalDateTime.now());
    }

    public User updateUser(Long id, UserRequestForUpdate userRequest, String token) {
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        if (userRequest.getAge() > 0) {
            user.setAge(userRequest.getAge());
        }
        if (user.getPhoneNumber() != null) {
            user.setPhoneNumber(userRequest.getPhoneNumber());
        }
        if (user.getEmail() != null) {
            user.setEmail(userRequest.getEmail());
        }
        if (userRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        if (userRequest.getAddress() != null) {
            user.setAddress(userRequest.getAddress());
        }

        userRepository.save(user);

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "UPDATE_USER", LocalDateTime.now());

        return user;
    }

    public User findUserByEmail(String email) {
        // ĐÃ SỬA: Xử lý Optional
        return userRepository.findByEmail(email).orElse(null);
    }

    public boolean saveRefreshToken(String refreshToken, String email) {
        // ĐÃ SỬA: Xử lý Optional
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        return true;
    }

    public void saveTokenLockAccount(String token, String email) {
        // ĐÃ SỬA: Xử lý Optional và cộng thời gian bằng LocalDateTime
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setLockedToken(token);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    public boolean logoutUser(String refreshToken) {
        // ĐÃ SỬA: Xử lý Optional
        User user = userRepository.findByRefreshToken(refreshToken).orElse(null);
        if (user == null) {
            return false;
        }
        user.setRefreshToken(null);
        userRepository.save(user);
        return true;
    }

    public boolean forgotPassword(String email) {
        // ĐÃ SỬA: Xử lý Optional
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }
        String tokenResetPassword = jwtService.generateTokenResetPassword(user).get("TokenResetPassword");
        user.setTokenResetPassword(tokenResetPassword);
        emailService.sendMail(email, "Your password reset token (valid for 10 min)", "http://localhost:5173/reset-password/" + tokenResetPassword);

        auditLogService.createAuditLog(user, "FORGOT_PASSWORD", LocalDateTime.now());

        return true;
    }

    public Map<Integer, String> resetPassword(ResetPasswordRequest resetPasswordRequest, String tokenResetPassword) {
        String emailUser = jwtService.extractAllClaims(tokenResetPassword).getSubject();

        if (emailUser == null) {
            return Map.of(401, "You are not accessing the correct path");
        }

        // ĐÃ SỬA: Xử lý Optional
        User user = userRepository.findByEmail(emailUser).orElse(null);

        if (user == null) {
            return Map.of(404, "Your email is not found");
        }

        boolean checkToken = jwtService.isTokenValid(tokenResetPassword, user.getEmail());

        if (!checkToken) {
            return Map.of(401, "Path is expired");
        }

        if (!resetPasswordRequest.getNewPassword().equals(resetPasswordRequest.getConfirmPassword())) {
            return Map.of(400, "Password and Confirm Password not match");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        user.setPassword(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        user.setTokenResetPassword(null);
        user.setRefreshToken(null);
        userRepository.save(user);

        auditLogService.createAuditLog(user, "RESET_PASSWORD", LocalDateTime.now());

        return Map.of(200, "Reset password success");
    }

    public Map<Integer, String> userChangePassword(Long id, UserChangePasswordRequest userChangePasswordRequest) {
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        if (!passwordEncoder.matches(userChangePasswordRequest.getPassword(), user.getPassword())) {
            return Map.of(401, "Your password is wrong");
        }
        if (!userChangePasswordRequest.getNewPassword().equals(userChangePasswordRequest.getNewPasswordConfirm())) {
            return Map.of(400, "Your new password does not match with confirm password");
        }

        user.setPassword(passwordEncoder.encode(userChangePasswordRequest.getNewPassword()));
        user.setRefreshToken(null);
        userRepository.save(user);

        auditLogService.createAuditLog(user, "CHANGE_PASSWORD", LocalDateTime.now());

        return Map.of(200, "Change password success");
    }
}