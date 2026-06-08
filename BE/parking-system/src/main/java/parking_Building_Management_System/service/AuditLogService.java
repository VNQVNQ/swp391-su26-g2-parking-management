package parking_Building_Management_System.service;

import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.entity.AuditLog;
import parking_Building_Management_System.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    // ĐÚNG: Đổi audiLogRepository -> AuditLogRepository (Thêm chữ t và viết hoa chữ A)
    private final AuditLogRepository auditLogRepository;

    // ĐÚNG: Đổi createAudiLog -> createAuditLog (Thêm chữ t)
    public void createAuditLog(User user, String action, LocalDateTime time){
        // ĐÚNG: Đổi AudiLog -> AuditLog (Thêm chữ t)
        AuditLog newAuditLog = new AuditLog();
        newAuditLog.setUser(user);
        newAuditLog.setCreatedAt(time);
        newAuditLog.setAction(action);

        // ĐÚNG: Gọi đúng tên biến đã sửa ở trên
        auditLogRepository.save(newAuditLog);
    }
}