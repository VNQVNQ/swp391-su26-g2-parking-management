package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.entity.AuditLog;
import parking_Building_Management_System.repository.AuditLogRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /**
     * GET /api/v1/audit-logs
     * Returns all audit logs, ordered by createdAt descending (newest first).
     * Each log is returned as a flat map with userId and userName extracted.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAll();

        // Sort newest first
        logs.sort((a, b) -> {
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        List<Map<String, Object>> result = logs.stream().map(log -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", log.getId());
            map.put("action", log.getAction());
            map.put("entityName", log.getEntityName());
            map.put("entityId", log.getEntityId());
            map.put("oldValues", log.getOldValues());
            map.put("newValues", log.getNewValues());
            map.put("ipAddress", log.getIpAddress());
            map.put("createdAt", log.getCreatedAt());

            // Extract user info safely
            if (log.getUser() != null) {
                map.put("userId", log.getUser().getUserId());
                map.put("userName", log.getUser().getFullName());
                map.put("userEmail", log.getUser().getEmail());
            } else {
                map.put("userId", null);
                map.put("userName", "Hệ thống");
                map.put("userEmail", null);
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
