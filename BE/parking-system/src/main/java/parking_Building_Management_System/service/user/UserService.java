package parking_Building_Management_System.service.user;

import parking_Building_Management_System.dto.user.request.AdminCreateUserRequest;
import parking_Building_Management_System.dto.user.request.ResetPasswordRequest;
import parking_Building_Management_System.dto.user.request.UserChangePasswordRequest;
import parking_Building_Management_System.dto.user.request.UserRequest;
import parking_Building_Management_System.dto.user.request.UserRequestForUpdate;
import parking_Building_Management_System.entity.AuditLog;
import parking_Building_Management_System.entity.role.Role;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.AuditLogRepository;
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
    final AuditLogRepository auditLogRepository;

    // Role mặc định cho mọi user tự đăng ký trên web (không cho phép tự chọn role)
    private static final String DEFAULT_SELF_REGISTER_ROLE = "DRIVER";
    private static final String ADMIN_ROLE_CODE = "ADMIN";

    @Transactional
    public void updateLastActive(Long userId) {
        userRepository.updateLastActive(userId, LocalDateTime.now());
    }

    public User getUserByToken(String token) {
        String email = jwtService.extractAllClaims(token).getSubject();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    /**
     * Luồng đăng ký công khai (web tự đăng ký).
     * Role LUÔN bị ép cứng về DRIVER, user không có quyền tự chọn role ở đây.
     */
    public User createUser(UserRequest userRequest) {
        // Kiểm tra trùng lặp trước khi lưu
        validateUniqueFields(userRequest.getEmail(), userRequest.getPhoneNumber(), userRequest.getIdentifyNumber());

        Role roleUser = roleRepository.findRoleByRoleCode(DEFAULT_SELF_REGISTER_ROLE);
        System.out.println("Role hệ thống tự gán mặc định nè: " + roleUser);

        if (roleUser == null) {
            throw new NoSuchElementException("Mã quyền 'DRIVER' không tồn tại trong hệ thống. Vui lòng kiểm tra lại SQL!");
        }
        if (!roleUser.isActive()) {
            throw new NoSuchElementException("Role code 'DRIVER' is not active");
        }

        User newUser = buildBaseUser(
                userRequest.getEmail(),
                userRequest.getPassword(),
                userRequest.getFullName(),
                userRequest.getPhoneNumber(),
                userRequest.getIdentifyNumber(),
                userRequest.getGender(),
                userRequest.getAddress(),
                userRequest.getDateOfBirth(),
                roleUser
        );

        userRepository.save(newUser);

        try {
            auditLogService.createAuditLog(newUser, "USER_SELF_REGISTER", LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Không thể ghi nhận Audit Log: " + e.getMessage());
        }

        return newUser;
    }

    /**
     * Admin thay đổi role cho user đã tồn tại.
     * Chỉ tài khoản ADMIN mới được phép thực hiện.
     *
     * @param userId   ID của user cần đổi role
     * @param roleCode mã role mới (DRIVER / PARKING_STAFF / PARKING_MANAGER / ADMIN)
     * @param token    JWT token của admin đang thực hiện
     */
    @Transactional
    public User updateUserRole(Long userId, String roleCode, String token) {
        User adminActor = getUserByToken(token);

        if (adminActor.getRole() == null || !ADMIN_ROLE_CODE.equalsIgnoreCase(adminActor.getRole().getRoleCode())) {
            throw new SecurityException("Chỉ tài khoản có role ADMIN mới được phép thay đổi role của user khác");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User với ID " + userId + " không tồn tại"));

        if (targetUser.getRole() != null && ADMIN_ROLE_CODE.equalsIgnoreCase(targetUser.getRole().getRoleCode())) {
            throw new SecurityException("Không thể thay đổi role của người dùng đang là ADMIN");
        }

        Role newRole = roleRepository.findRoleByRoleCode(roleCode);
        if (newRole == null) {
            throw new NoSuchElementException("Mã quyền '" + roleCode + "' không tồn tại trong hệ thống");
        }
        if (!newRole.isActive()) {
            throw new NoSuchElementException("Role code '" + roleCode + "' is not active");
        }

        // FIX: Lưu old role TRƯỚC khi ghi đè
        String oldRoleCode = targetUser.getRole() != null ? targetUser.getRole().getRoleCode() : "UNKNOWN";
        targetUser.setRole(newRole);
        userRepository.save(targetUser);

        try {
            // Store detailed info in new_values field (JSONB) instead of concatenating to action string
            String newValuesJson = String.format(
                    "{\"targetUserId\":%d,\"oldRole\":\"%s\",\"newRole\":\"%s\",\"changedByAdminId\":%d}",
                    targetUser.getUserId(),
                    oldRoleCode,
                    roleCode,
                    adminActor.getUserId()
            );

            // Create a custom audit log with new_values instead of action string
            AuditLog auditLog = new AuditLog();
            auditLog.setUser(adminActor);
            auditLog.setAction("ADMIN_UPDATE_USER_ROLE");
            auditLog.setEntityName("users");
            auditLog.setEntityId(String.valueOf(targetUser.getUserId()));
            auditLog.setNewValues(newValuesJson);
            auditLog.setCreatedAt(LocalDateTime.now());

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            System.err.println("Không thể ghi nhận Audit Log: " + e.getMessage());
        }

        return targetUser;
    }

    /**
     * Luồng admin tạo tài khoản cho người dùng khác.
     * Khác biệt duy nhất so với createUser(): admin được phép chỉ định roleCode
     * (DRIVER / PARKING_STAFF / ADMIN / ...) thay vì bị ép cứng về DRIVER.
     *
     * @param userRequest thông tin tài khoản cần tạo, kèm roleCode do admin chọn
     * @param token       token của admin đang thực hiện thao tác (để xác thực quyền + ghi audit log)
     */
    public User createUserByAdmin(AdminCreateUserRequest userRequest, String token) {
        User adminActor = getUserByToken(token);

        if (adminActor.getRole() == null || !ADMIN_ROLE_CODE.equalsIgnoreCase(adminActor.getRole().getRoleCode())) {
            throw new SecurityException("Chỉ tài khoản có role ADMIN mới được phép tạo user với role tùy chỉnh");
        }

        if (userRequest.getRoleCode() == null || userRequest.getRoleCode().isBlank()) {
            throw new IllegalArgumentException("roleCode is required when admin creates a user");
        }

        // Kiểm tra trùng lặp trước khi lưu
        validateUniqueFields(userRequest.getEmail(), userRequest.getPhoneNumber(), userRequest.getIdentifyNumber());

        Role role = roleRepository.findRoleByRoleCode(userRequest.getRoleCode());
        if (role == null) {
            throw new NoSuchElementException("Mã quyền '" + userRequest.getRoleCode() + "' không tồn tại trong hệ thống");
        }
        if (!role.isActive()) {
            throw new NoSuchElementException("Role code '" + userRequest.getRoleCode() + "' is not active");
        }

        User newUser = buildBaseUser(
                userRequest.getEmail(),
                userRequest.getPassword(),
                userRequest.getFullName(),
                userRequest.getPhoneNumber(),
                userRequest.getIdentifyNumber(),
                userRequest.getGender(),
                userRequest.getAddress(),
                userRequest.getDateOfBirth(),
                role
        );

        userRepository.save(newUser);

        try {
            String logDetails = String.format(
                    "{\"createdEmail\":\"%s\",\"role\":\"%s\",\"createdByAdminId\":%d}",
                    newUser.getEmail(),
                    role.getRoleCode(),
                    adminActor.getUserId()
            );
            auditLogService.createAuditLog(adminActor, "ADMIN_CREATE_USER:" + logDetails, LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Không thể ghi nhận Audit Log: " + e.getMessage());
        }

        return newUser;
    }

    /**
     * Kiểm tra các trường unique (email, phone, identifyNumber) trước khi lưu user.
     * Ném IllegalArgumentException với thông báo rõ ràng nếu bị trùng.
     */
    private void validateUniqueFields(String email, String phoneNumber, String identifyNumber) {
        if (email != null && userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email '" + email + "' đã được sử dụng. Vui lòng dùng email khác.");
        }
        if (phoneNumber != null && userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
            throw new IllegalArgumentException("Số điện thoại '" + phoneNumber + "' đã được sử dụng. Vui lòng dùng số khác.");
        }
        if (identifyNumber != null && userRepository.findByIdentifyNumber(identifyNumber).isPresent()) {
            throw new IllegalArgumentException("Số CMND/CCCD '" + identifyNumber + "' đã được sử dụng.");
        }
    }

    /**
     * Logic dùng chung giữa createUser() và createUserByAdmin():
     * tính tuổi, convert Date -> LocalDate, hash password, set các field cơ bản.
     * Điểm khác biệt giữa 2 luồng chỉ nằm ở việc role được truyền vào từ đâu.
     */
    private User buildBaseUser(String email, String rawPassword, String fullName, String phoneNumber,
                               String identifyNumber, String gender, String address,
                               Date dateOfBirth, Role role) {
        User newUser = new User();

        if (dateOfBirth != null) {
            Calendar birth = Calendar.getInstance();
            birth.setTime(dateOfBirth);
            Calendar today = Calendar.getInstance();

            int calculatedAge = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR);
            if (today.get(Calendar.DAY_OF_YEAR) < birth.get(Calendar.DAY_OF_YEAR)) {
                calculatedAge--;
            }
            newUser.setAge(calculatedAge);
            newUser.setDateOfBirth(dateOfBirth.toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        } else {
            newUser.setAge(0);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        newUser.setAddress(address);
        newUser.setGender(gender);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(rawPassword));
        newUser.setFullName(fullName);
        newUser.setPhoneNumber(phoneNumber);
        newUser.setIdentifyNumber(identifyNumber);

        newUser.setRole(role);
        newUser.setUserIsActive(true);
        newUser.setLastActive(LocalDateTime.now());

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

        if (userRequest.getAge() != null && userRequest.getAge() > 0) {
            user.setAge(userRequest.getAge());
        }
        if (userRequest.getPhoneNumber() != null) {
            user.setPhoneNumber(userRequest.getPhoneNumber());
        }
        if (userRequest.getEmail() != null) {
            user.setEmail(userRequest.getEmail());
        }
        if (userRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        if (userRequest.getAddress() != null) {
            user.setAddress(userRequest.getAddress());
        }
        if (userRequest.getFullName() != null) {
            user.setFullName(userRequest.getFullName());
        }
        if (userRequest.getIdentifyNumber() != null) {
            user.setIdentifyNumber(userRequest.getIdentifyNumber());
        }
        if (userRequest.getGender() != null) {
            user.setGender(userRequest.getGender());
        }
        if (userRequest.getDateOfBirth() != null) {
            user.setDateOfBirth(userRequest.getDateOfBirth().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }

        userRepository.save(user);

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "UPDATE_USER", LocalDateTime.now());

        return user;
    }

    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public boolean saveRefreshToken(String refreshToken, String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        return true;
    }

    public void saveTokenLockAccount(String token, String email) {
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
        User user = userRepository.findByRefreshToken(refreshToken).orElse(null);
        if (user == null) {
            return false;
        }
        user.setRefreshToken(null);
        userRepository.save(user);
        return true;
    }

    public boolean forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }
        String tokenResetPassword = jwtService.generateTokenResetPassword(user).get("TokenResetPassword");
        user.setTokenResetPassword(tokenResetPassword);
        userRepository.save(user); // Lưu token vào DB trước khi gửi mail
        emailService.sendMail(email, "Your password reset token (valid for 10 min)", "http://localhost:5173/reset-password/" + tokenResetPassword);

        auditLogService.createAuditLog(user, "FORGOT_PASSWORD", LocalDateTime.now());

        return true;
    }

    public Map<Integer, String> resetPassword(ResetPasswordRequest resetPasswordRequest, String tokenResetPassword) {
        String emailUser = jwtService.extractAllClaims(tokenResetPassword).getSubject();

        if (emailUser == null) {
            return Map.of(401, "You are not accessing the correct path");
        }

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