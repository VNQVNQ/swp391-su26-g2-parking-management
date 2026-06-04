package parking_Building_Management_System.controller;

import parking_Building_Management_System.dto.auth.request.AuthRequest;
import parking_Building_Management_System.dto.auth.request.ForgotPasswordRequest;
import parking_Building_Management_System.dto.auth.response.AuthResponse;
import parking_Building_Management_System.dto.user.request.ResetPasswordRequest;
import parking_Building_Management_System.dto.user.response.UserResponse;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.service.Auth.AuthenticationService;
import parking_Building_Management_System.service.Auth.JWTService;
import parking_Building_Management_System.service.User.UserService; // ĐÚNG: userService -> UserService
import parking_Building_Management_System.utils.UserUtils.CheckCountLogin;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class LoginLogOutController {

    private final AuthenticationService authenticationService;
    private final CheckCountLogin checkCountLogin; // ĐÚNG: checkCountLogin -> CheckCountLogin
    private final UserService userService; // ĐÚNG: userService -> UserService
    private final JWTService jwtService;

    private final ConcurrentHashMap<String, Integer> loginAttempts = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) { // ĐÚNG: authRequest -> AuthRequest
        String email = authRequest.getEmail();
        User user = userService.findUserByEmail(email);

        if (user.getLockedUntil() != null && user.getLockedUntil().after(new Date())) {
            long remaining = (user.getLockedUntil().getTime() - System.currentTimeMillis()) / 1000;
            Map<String, String> error = Map.of("message", "Tài khoản đang bị khóa. Vui lòng thử lại sau " + remaining / 60 + " phút.");
            return ResponseEntity.status(403).body(error);
        }

        boolean result = authenticationService.authenticate(authRequest);

        if (!result) {
            int count = loginAttempts.getOrDefault(email, 0) + 1;
            loginAttempts.put(email, count);

            if (count == 5) {
                Map<String, String> tokenLock = jwtService.generateTokenLockAccount(user);
            }

            String message = checkCountLogin.getMessage(count);
            Map<String, String> error = Map.of("message", message);
            return ResponseEntity.status(401).body(error);
        } else {
            loginAttempts.remove(email);
            user.setLockedToken(null);
            user.setLockedUntil(null);
            userService.saveUser(user);

            Map<String, String> token = jwtService.generateTokens(user);
            UserResponse responseData = UserResponse.builder() // ĐÚNG: userResponse -> UserResponse
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .roleCode(user.getRole().getRoleCode())
                    .lastActive(user.getLastActive())
                    .phoneNumber(user.getPhoneNumber())
                    .identifyNumber(user.getIdentifyNumber())
                    .gender(user.getGender())
                    .age(user.getAge())
                    .address(user.getAddress())
                    .dateOfBirth(user.getDateOfBirth())
                    .userIsActivated(user.getUserIsActive())
                    .build();
            AuthResponse authResponse = new AuthResponse(); // ĐÚNG: authResponse -> AuthResponse
            authResponse.setAccessToken(token.get("accessToken"));
            authResponse.setRefreshToken(token.get("refreshToken"));
            authResponse.setUser(responseData);
            return ResponseEntity.ok(authResponse);
        }
    }

    @PostMapping("/Logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String tokenHeader){
        String token = tokenHeader.replace("Bearer ", "");
        boolean result = userService.logoutUser(token);
        if (!result) {
            return ResponseEntity.status(400).body("Logout failed or token not found");
        }
        return ResponseEntity.ok("Logout successful");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Không tìm thấy refresh token trong session."));
        }

        Map<String, String> newToken = jwtService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(newToken);
    }

    @PostMapping("ForgotPassword")
    public ResponseEntity<String> ForgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest){ // ĐÚNG: forgotPasswordRequest -> ForgotPasswordRequest
        System.out.println("email bắt đc nè: " + forgotPasswordRequest.getEmail());
        boolean forgotPassword = userService.forgotPassword(forgotPasswordRequest.getEmail());
        if(!forgotPassword){
            return ResponseEntity.status(403).body("Email can't find");
        }
        return ResponseEntity.ok("Please enter link send email");
    }

    @PatchMapping("ResetPassword/{tokenResetPassword}")
    public ResponseEntity<String> ResetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest, @PathVariable String tokenResetPassword){ // ĐÚNG: resetPasswordRequest -> ResetPasswordRequest
        Map<Integer, String> resetPasswordResult = userService.resetPassword(resetPasswordRequest, tokenResetPassword);
        Integer statusCode = resetPasswordResult.keySet().iterator().next();
        String message = resetPasswordResult.get(statusCode);
        return ResponseEntity.status(statusCode).body(message);
    }
}