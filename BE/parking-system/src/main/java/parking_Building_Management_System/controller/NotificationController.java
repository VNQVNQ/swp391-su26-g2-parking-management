package parking_Building_Management_System.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import parking_Building_Management_System.dto.response.NotificationResponse;
import parking_Building_Management_System.service.NotificationService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications() {
        return ApiResponseFactory.success(notificationService.getMyNotifications(), "Fetched notifications successfully");
    }
    
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount() {
        return ApiResponseFactory.success(notificationService.getUnreadCount(), "Fetched unread count successfully");
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ApiResponseFactory.success(null, "Notification marked as read");
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponseFactory.success(null, "All notifications marked as read");
    }
}
