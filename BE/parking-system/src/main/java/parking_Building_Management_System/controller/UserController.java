package parking_Building_Management_System.controller;

import parking_Building_Management_System.dto.user.request.UserChangePasswordRequest;
import parking_Building_Management_System.dto.user.request.UserRequestForUpdate;
import parking_Building_Management_System.dto.user.response.UserResponse;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.service.user.UserService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.userUtils.UtilsUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.user.request.UserRequest;

import java.util.List;
import java.util.Map;

@RequestMapping("/auth")
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UtilsUser utilsUser;

    @PostMapping("/register")
    // ĐÃ SỬA: Xóa @RequestHeader("Authorization") để cho phép đăng ký tự do công khai
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody UserRequest userRequest) {

        if(!userRequest.getPassword().equals(userRequest.getConfirmPassword())){
            ApiResponse<UserResponse> response = new ApiResponse<>(401, "Password and Confirm Password not match", new UserResponse());
            return ResponseEntity.status(401).body(response);
        }

        System.out.println("thông tin nhận được " + userRequest);

        // ĐÃ SỬA: Không truyền biến token vào hàm này nữa
        User newUser = userService.createUser(userRequest);

        UserResponse responseData = UserResponse.builder()
                .id(newUser.getUser_id())
                .fullName(newUser.getFullName())
                .email(newUser.getEmail())
                .roleCode(newUser.getRole().getRoleCode())
                .lastActive(newUser.getLastActive())
                .phoneNumber(newUser.getPhoneNumber())
                .identifyNumber(newUser.getIdentifyNumber())
                .gender(newUser.getGender())
                .age(newUser.getAge())
                .address(newUser.getAddress())
                .dateOfBirth(newUser.getDateOfBirth())
                .userIsActivated(newUser.getUserIsActive())
                .build();

        ApiResponse<UserResponse> response = new ApiResponse<>(201, "User created successfully", responseData);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/users/get")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUser(@RequestHeader("Authorization") String authorizationHeader){
        String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;
        List<User> user = userService.getAllUser(token);
        List<UserResponse> userResponses = utilsUser.getListUserResponses(user);
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(201, "Get user successfully", userResponses);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id, @RequestHeader("Authorization") String authorizationHeader){
        String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;
        User user = userService.getUserById(id, token);
        UserResponse userResponse = utilsUser.toUserResponse(user);
        ApiResponse<UserResponse> response = new ApiResponse<>(201, "Get user" + id + "successfully", userResponse);
        return ResponseEntity.status(201).body(response);
    }

    @PatchMapping("/deleteUser/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, @RequestHeader("Authorization") String authorizationHeader){
        String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;
        userService.deleteUser(id, token);
        return ResponseEntity.status(201).body("Delete success");
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id, @RequestBody UserRequestForUpdate userRequest, @RequestHeader("Authorization") String authorizationHeader){
        String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;
        User user = userService.updateUser(id, userRequest, token);

        UserResponse responseData = UserResponse.builder()
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
        ApiResponse<UserResponse> response = new ApiResponse<>(201, "Update user successfully", responseData);
        return ResponseEntity.status(201).body(response);
    }

    @PutMapping("/users/change-password/{id}")
    public ResponseEntity<String> userChangePassword(@PathVariable Long id, @RequestBody UserChangePasswordRequest userChangePasswordRequest){
        System.out.println("user " + id + " bắt được để thay đổi các dữ liệu " + userChangePasswordRequest);
        Map<Integer, String> changePassword = userService.userChangePassword(id, userChangePasswordRequest);
        Integer statusCode = changePassword.keySet().iterator().next();
        String message = changePassword.get(statusCode);
        return ResponseEntity.status(statusCode).body(message);
    }

    @GetMapping("/users/me")
    public ResponseEntity<ApiResponse<UserResponse>> getUserFromToken(@RequestHeader("Authorization") String authorizationHeader){
        String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;

        User user = userService.getUserByToken(token);
        UserResponse userResponse = utilsUser.toUserResponse(user);

        ApiResponse<UserResponse> response = new ApiResponse<>(200, "Get user from token successfully", userResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/by-email")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(@RequestParam("email") String email){
        User user = userService.findUserByEmail(email);
        UserResponse userResponse = utilsUser.toUserResponse(user);
        ApiResponse<UserResponse> response = new ApiResponse<>(200, "Get user from email successfully", userResponse);
        return ResponseEntity.ok(response);
    }
}