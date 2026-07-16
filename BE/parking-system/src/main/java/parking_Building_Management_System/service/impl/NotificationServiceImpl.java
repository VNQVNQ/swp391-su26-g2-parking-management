package parking_Building_Management_System.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.response.NotificationResponse;
import parking_Building_Management_System.entity.Notification;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.NotificationRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.service.NotificationService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationServiceImpl implements NotificationService {

    NotificationRepository notificationRepository;
    UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String getTitleFromType(String type) {
        if (type == null) return "Thông báo";
        return switch (type) {
            case "INFO" -> "Thông báo hệ thống";
            case "WARNING" -> "Cảnh báo";
            case "PAYMENT" -> "Thanh toán";
            case "ERROR" -> "Lỗi sự cố";
            case "SUCCESS" -> "Thành công";
            default -> "Thông báo";
        };
    }

    private NotificationResponse mapToResponse(Notification n) {
        String typeStr = n.getType() != null ? n.getType().name() : "INFO";
        return new NotificationResponse(
                n.getId(),
                typeStr.toLowerCase(), // info, warning, payment to match UI
                getTitleFromType(typeStr),
                n.getMessage(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }

    @Override
    public List<NotificationResponse> getMyNotifications() {
        User currentUser = getCurrentUser();
        List<Notification> notifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(currentUser.getUserId());
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(UUID id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getRecipient().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Not authorized to mark this notification as read");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsReadByRecipientUserId(currentUser.getUserId());
    }

    @Override
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(currentUser.getUserId());
    }
}
