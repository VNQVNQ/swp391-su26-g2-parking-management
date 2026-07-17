package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.entity.PenaltyConfig;
import parking_Building_Management_System.entity.enums.ExceptionType;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.PenaltyConfigRepository;
import parking_Building_Management_System.repository.UserRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/penalty-configs")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PenaltyConfigController {

    private final PenaltyConfigRepository penaltyConfigRepository;
    private final UserRepository userRepository;

    // ─── Helper: map entity → response ──────────────────────────────────────────
    private Map<String, Object> mapConfig(PenaltyConfig c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("vehicleType", c.getVehicleType().name());
        map.put("vehicleTypeLabel", c.getVehicleType().getDisplayName());
        map.put("exceptionType", c.getExceptionType().name());
        map.put("exceptionTypeLabel", c.getExceptionType().getDisplayName());
        map.put("penaltyAmount", c.getPenaltyAmount());
        map.put("description", c.getDescription());
        map.put("isActive", c.getIsActive());
        map.put("createdAt", c.getCreatedAt());
        map.put("updatedAt", c.getUpdatedAt());
        if (c.getCreatedBy() != null) {
            map.put("createdByName", c.getCreatedBy().getFullName());
        }
        return map;
    }

    // ─── GET /api/v1/penalty-configs ─────────────────────────────────────────────
    // Lấy tất cả cấu hình phí phạt (admin + staff xem được)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER', 'PARKING_STAFF')")
    public ResponseEntity<?> getAllPenaltyConfigs(
            @RequestParam(required = false) Boolean activeOnly) {
        try {
            List<PenaltyConfig> configs = (activeOnly != null && activeOnly)
                    ? penaltyConfigRepository.findByIsActiveTrue()
                    : penaltyConfigRepository.findAll();

            List<Map<String, Object>> response = configs.stream()
                    .map(this::mapConfig)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("data", response));
        } catch (Exception e) {
            log.error("Error fetching penalty configs: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── GET /api/v1/penalty-configs/lookup ──────────────────────────────────────
    // Tra cứu mức phạt theo vehicleType + exceptionType (staff dùng khi xử lý ngoại lệ)
    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER', 'PARKING_STAFF')")
    public ResponseEntity<?> lookupPenalty(
            @RequestParam String vehicleType,
            @RequestParam String exceptionType) {
        try {
            VehicleType vt = VehicleType.valueOf(vehicleType.toUpperCase());
            ExceptionType et = ExceptionType.valueOf(exceptionType.toUpperCase());

            Optional<PenaltyConfig> config = penaltyConfigRepository
                    .findByVehicleTypeAndExceptionTypeAndIsActiveTrue(vt, et);

            if (config.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "found", true,
                    "data", mapConfig(config.get())
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "found", false,
                    "message", "Chưa có cấu hình phí phạt cho loại này"
                ));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Loại xe hoặc loại ngoại lệ không hợp lệ"));
        } catch (Exception e) {
            log.error("Error looking up penalty: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── POST /api/v1/penalty-configs ────────────────────────────────────────────
    // Admin tạo/cập nhật cấu hình phí phạt
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<?> createPenaltyConfig(@RequestBody Map<String, Object> request) {
        try {
            String vehicleTypeStr = (String) request.get("vehicleType");
            String exceptionTypeStr = (String) request.get("exceptionType");
            Object penaltyAmountObj = request.get("penaltyAmount");
            String description = (String) request.get("description");

            VehicleType vehicleType = VehicleType.valueOf(vehicleTypeStr.toUpperCase());
            ExceptionType exceptionType = ExceptionType.valueOf(exceptionTypeStr.toUpperCase());
            BigDecimal penaltyAmount = new BigDecimal(penaltyAmountObj.toString());

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Kiểm tra nếu đã tồn tại → cập nhật
            Optional<PenaltyConfig> existing = penaltyConfigRepository
                    .findByVehicleTypeAndExceptionType(vehicleType, exceptionType);

            PenaltyConfig config;
            if (existing.isPresent()) {
                config = existing.get();
                config.setPenaltyAmount(penaltyAmount);
                config.setDescription(description);
                config.setIsActive(true);
            } else {
                config = new PenaltyConfig();
                config.setVehicleType(vehicleType);
                config.setExceptionType(exceptionType);
                config.setPenaltyAmount(penaltyAmount);
                config.setDescription(description);
                config.setCreatedBy(user);
                config.setIsActive(true);
            }

            penaltyConfigRepository.save(config);

            return ResponseEntity.ok(Map.of(
                "message", "Cấu hình phí phạt đã được lưu",
                "data", mapConfig(config)
            ));
        } catch (Exception e) {
            log.error("Error creating penalty config: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── PUT /api/v1/penalty-configs/{id} ────────────────────────────────────────
    // Admin cập nhật cấu hình phí phạt
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<?> updatePenaltyConfig(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        try {
            PenaltyConfig config = penaltyConfigRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình phí phạt"));

            if (request.containsKey("penaltyAmount")) {
                config.setPenaltyAmount(new BigDecimal(request.get("penaltyAmount").toString()));
            }
            if (request.containsKey("description")) {
                config.setDescription((String) request.get("description"));
            }
            if (request.containsKey("isActive")) {
                config.setIsActive((Boolean) request.get("isActive"));
            }

            penaltyConfigRepository.save(config);

            return ResponseEntity.ok(Map.of(
                "message", "Cập nhật thành công",
                "data", mapConfig(config)
            ));
        } catch (Exception e) {
            log.error("Error updating penalty config {}: ", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── DELETE /api/v1/penalty-configs/{id} ─────────────────────────────────────
    // Admin xóa cấu hình phí phạt (soft delete → isActive = false)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<?> deletePenaltyConfig(@PathVariable UUID id) {
        try {
            PenaltyConfig config = penaltyConfigRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình phí phạt"));

            config.setIsActive(false);
            penaltyConfigRepository.save(config);

            return ResponseEntity.ok(Map.of("message", "Đã vô hiệu hóa cấu hình phí phạt"));
        } catch (Exception e) {
            log.error("Error deleting penalty config {}: ", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
