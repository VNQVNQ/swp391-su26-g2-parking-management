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
import parking_Building_Management_System.service.AuditLogService; // Đã sửa chính tả tên import
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    final AuditLogService auditLogService; // ĐÚNG: Đổi kiểu dữ liệu thành AuditLogService (Viết hoa chữ A), tên biến viết thường chữ a.

    @Transactional
    public void updateLastActive(Long userId) {
        userRepository.updateLastActive(userId, new Date());
    }

    public User getUserByToken(String token){
        String email = jwtService.extractAllClaims(token).getSubject();
        User user = userRepository.findByEmail(email);
        return user;
    }

    public User createUser(UserRequest userRequest, String token){ // ĐÚNG: userRequest -> UserRequest
        User newUser = new User();

        System.out.println("Role code người dùng nhập nè: " + userRequest.getRoleCode());

        Role roleUser = roleRepository.findRoleByRoleCode(userRequest.getRoleCode());

        System.out.println("Role kiếm đc nè: " + roleUser);

        if(!roleUser.isActive()){
            throw new NoSuchElementException("Role code is not find");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        newUser.setAddress(userRequest.getAddress());
        newUser.setAge(userRequest.getAge());
        newUser.setGender(userRequest.getGender());
        newUser.setEmail(userRequest.getEmail());
        newUser.setRole(roleUser);
        newUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        newUser.setUserIsActive(true);
        newUser.setFullName(userRequest.getFullName());
        newUser.setDateOfBirth(userRequest.getDateOfBirth());
        newUser.setPhoneNumber(userRequest.getPhoneNumber());
        newUser.setLastActive(new Date());
        newUser.setIdentifyNumber(userRequest.getIdentifyNumber());
        userRepository.save(newUser);

        User actor = getUserByToken(token);

        auditLogService.createAuditLog(actor, "CREATE_USER", LocalDateTime.now()); // ĐÚNG: Sửa sang auditLogService và sửa tên hàm createAuditLog (thêm chữ t)
        return newUser;
    }

    public List<User> getAllUser(String token){
        List<User> users = this.userRepository.findAll();
        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "GET_ALL_USERS", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return users;
    }

    public User getUserById(Long id, String token){
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "GET_USER_BY_ID", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return user;
    }

    public void deleteUser(Long id, String token){
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setUserIsActive(false);
        this.userRepository.save(user);

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "DELETE_USER", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog
    }

    public User updateUser(Long id, UserRequestForUpdate userRequest, String token){ // ĐÚNG: userRequestForUpdate -> UserRequestForUpdate
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        if(userRequest.getAge() > 0){
            user.setAge(userRequest.getAge());
        }
        if(user.getPhoneNumber() != null) {
            user.setPhoneNumber(userRequest.getPhoneNumber());
        }
        if(user.getEmail() != null) {
            user.setEmail(userRequest.getEmail());
        }
        if(userRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        if(userRequest.getAddress() != null){
            user.setAddress(userRequest.getAddress());
        }

        userRepository.save(user);

        User userActor = getUserByToken(token);
        auditLogService.createAuditLog(userActor, "UPDATE_USER", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return user;
    }

    public User findUserByEmail(String email){
        User user = userRepository.findByEmail(email);
        return user;
    }

    public boolean saveRefreshToken(String refreshToken, String email){
        User user = userRepository.findByEmail(email);
        if(user == null){
            return false;
        }
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        return true;
    }

    public void saveTokenLockAccount(String token, String email) {
        User user = userRepository.findByEmail(email);
        user.setLockedToken(token);
        user.setLockedUntil(new Date(System.currentTimeMillis() + 10 * 60 * 1000));
        userRepository.save(user);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    public boolean logoutUser(String refreshToken){
        User user = userRepository.findByRefreshToken(refreshToken);
        if (user == null) {
            return false;
        }
        user.setRefreshToken(null);
        userRepository.save(user);
        return true;
    }

    public boolean forgotPassword(String email){
        User user = userRepository.findByEmail(email);
        if(user == null){
            return false;
        }
        String tokenResetPassword = jwtService.generateTokenResetPassword(user).get("TokenResetPassword");
        user.setTokenResetPassword(tokenResetPassword);
        emailService.sendMail(email, "Your password reset token (valid for 10 min)", "http://localhost:5173/reset-password/"+tokenResetPassword);

        auditLogService.createAuditLog(user, "FORGOT_PASSWORD", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return true;
    }

    public Map<Integer, String> resetPassword(ResetPasswordRequest resetPasswordRequest, String tokenResetPassword){ // ĐÚNG: resetPasswordRequest -> ResetPasswordRequest
        String emailUser = jwtService.extractAllClaims(tokenResetPassword).getSubject();

        if(emailUser == null){
            return Map.of(401, "You are not accessing the correct path");
        }

        User user = userRepository.findByEmail(emailUser);

        if(user == null){
            return Map.of(404, "Your email is not found");
        }

        boolean checkToken = jwtService.isTokenValid(tokenResetPassword, user.getEmail());

        if(!checkToken){
            return Map.of(401, "Path is expired");
        }

        if(!resetPasswordRequest.getNewPassword().equals(resetPasswordRequest.getConfirmPassword())){
            return Map.of(400, "Password and Confirm Password not match");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        user.setPassword(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        user.setTokenResetPassword(null);
        user.setRefreshToken(null);
        userRepository.save(user);

        auditLogService.createAuditLog(user, "RESET_PASSWORD", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return Map.of(200, "Reset password success");
    }

    public Map<Integer, String> userChangePassword(Long id, UserChangePasswordRequest userChangePasswordRequest){ // ĐÚNG: userChangePasswordRequest -> UserChangePasswordRequest
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        if(!passwordEncoder.matches(userChangePasswordRequest.getPassword(), user.getPassword())){
            return Map.of(401, "Your password is wrong");
        }
        if(!userChangePasswordRequest.getNewPassword().equals(userChangePasswordRequest.getNewPasswordConfirm())){
            return Map.of(400, "Your new password does not match with confirm password");
        }

        user.setPassword(passwordEncoder.encode(userChangePasswordRequest.getNewPassword()));
        user.setRefreshToken(null);
        userRepository.save(user);

        auditLogService.createAuditLog(user, "CHANGE_PASSWORD", LocalDateTime.now()); // ĐÚNG: createAudiLog -> createAuditLog

        return Map.of(200, "Change password success");
    }
}