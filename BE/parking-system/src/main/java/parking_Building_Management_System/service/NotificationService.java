package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.response.NotificationResponse;
import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications();
    void markAsRead(UUID id);
    void markAllAsRead();
    long getUnreadCount();
}
