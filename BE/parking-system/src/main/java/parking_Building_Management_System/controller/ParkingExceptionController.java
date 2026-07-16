package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.entity.ParkingException;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.enums.ExceptionStatus;
import parking_Building_Management_System.entity.enums.ExceptionType;
import parking_Building_Management_System.repository.ParkingExceptionRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.PenaltyConfigRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.service.MonthlyPassService;
import parking_Building_Management_System.service.ParkingSessionService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/exceptions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ParkingExceptionController {

    private final ParkingExceptionRepository parkingExceptionRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final PenaltyConfigRepository penaltyConfigRepository;
    private final ParkingSessionService parkingSessionService;
    private final MonthlyPassService monthlyPassService;

    private void validateExceptionAllowedForSession(ParkingSession session, ExceptionType type) {
        if (session != null && session.getVehicle() != null) {
            boolean hasActiveMonthlyPass = monthlyPassService.findActiveMonthlyPassByVehicle(session.getVehicle().getId()).isPresent();
            if (hasActiveMonthlyPass) {
                if (type != ExceptionType.WRONG_ZONE && type != ExceptionType.WRONG_SPOT && type != ExceptionType.LOST_TICKET) {
                    throw new RuntimeException("Xe có vé tháng chỉ được xử lý ngoại lệ Đỗ sai vị trí và Mất thẻ/vé.");
                }
            }
        }
    }

    // ─── Helper: map exception entity → response map ───────────────────────────
    private Map<String, Object> mapException(ParkingException ex) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", ex.getId());
        map.put("exceptionType", ex.getExceptionType().name());
        map.put("reason", ex.getReason());
        map.put("resolution", ex.getResolution());
        map.put("status", ex.getStatus().name());
        map.put("createdAt", ex.getCreatedAt());
        map.put("resolvedAt", ex.getResolvedAt());
        map.put("evidenceNote", ex.getEvidenceNote());
        map.put("subType", ex.getSubType());
        map.put("penaltyFee", ex.getPenaltyFee());

        if (ex.getSession() != null) {
            map.put("sessionId", ex.getSession().getId());
            map.put("entryTime", ex.getSession().getEntryTime());
            if (ex.getSession().getVehicle() != null) {
                map.put("licensePlate", ex.getSession().getVehicle().getLicensePlate());
                map.put("vehicleType", ex.getSession().getVehicle().getVehicleType().name());
                if (ex.getSession().getVehicle().getUser() != null) {
                    map.put("ownerName", ex.getSession().getVehicle().getUser().getFullName());
                    map.put("ownerPhone", ex.getSession().getVehicle().getUser().getPhoneNumber());
                }
            }
            if (ex.getSession().getSlot() != null) {
                map.put("slotCode", ex.getSession().getSlot().getSlotCode());
            }
        }
        if (ex.getCreatedBy() != null) {
            map.put("createdBy", ex.getCreatedBy().getFullName());
        }
        if (ex.getApprovedBy() != null) {
            map.put("approvedBy", ex.getApprovedBy().getFullName());
        }
        return map;
    }

    // ─── GET /api/v1/exceptions ─────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> getAllExceptions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID sessionId) {
        try {
            List<ParkingException> exceptions;

            if (sessionId != null) {
                exceptions = parkingExceptionRepository.findBySessionId(sessionId);
            } else if (type != null && status != null) {
                exceptions = parkingExceptionRepository.findByExceptionTypeAndStatus(
                        ExceptionType.valueOf(type), ExceptionStatus.valueOf(status));
            } else if (type != null) {
                exceptions = parkingExceptionRepository.findByExceptionType(ExceptionType.valueOf(type));
            } else if (status != null) {
                exceptions = parkingExceptionRepository.findByStatus(ExceptionStatus.valueOf(status));
            } else {
                exceptions = parkingExceptionRepository.findAll();
            }

            List<Map<String, Object>> response = exceptions.stream()
                    .map(this::mapException)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("data", response));
        } catch (Exception e) {
            log.error("Error fetching exceptions: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── GET /api/v1/exceptions/{id} ────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> getExceptionById(@PathVariable UUID id) {
        try {
            ParkingException ex = parkingExceptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Exception not found"));
            return ResponseEntity.ok(Map.of("data", mapException(ex)));
        } catch (Exception e) {
            log.error("Error fetching exception {}: ", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── GET /api/v1/exceptions/by-plate/{licensePlate} ─────────────────────────
    @GetMapping("/by-plate/{licensePlate}")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> getExceptionsByPlate(@PathVariable String licensePlate) {
        try {
            List<ParkingException> exceptions = parkingExceptionRepository.findByVehicleLicensePlate(licensePlate);
            List<Map<String, Object>> response = exceptions.stream()
                    .map(this::mapException)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("data", response));
        } catch (Exception e) {
            log.error("Error fetching exceptions by plate {}: ", licensePlate, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── POST /api/v1/exceptions ────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> createException(@RequestBody Map<String, String> request) {
        try {
            String sessionId = request.get("sessionId");
            String licensePlate = request.get("licensePlate");
            String type = request.get("exceptionType");
            String reason = request.get("reason");
            String evidenceNote = request.get("evidenceNote");
            String subType = request.get("subType");
            String penaltyFeeStr = request.get("penaltyFee");

            ParkingSession session = null;
            if (sessionId != null && !sessionId.isEmpty()) {
                session = parkingSessionRepository.findById(UUID.fromString(sessionId))
                        .orElseThrow(() -> new RuntimeException("Session not found"));
            } else if (licensePlate != null && !licensePlate.isEmpty()) {
                session = parkingSessionRepository.findByVehicleLicensePlateAndExitTimeIsNull(licensePlate)
                        .stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No active session found for plate: " + licensePlate));
            }

            if (session != null) {
                validateExceptionAllowedForSession(session, ExceptionType.valueOf(type));
            }

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ParkingException exception = new ParkingException();
            exception.setSession(session);
            exception.setExceptionType(ExceptionType.valueOf(type));
            exception.setReason(reason);
            exception.setEvidenceNote(evidenceNote);
            exception.setSubType(subType);
            if (penaltyFeeStr != null && !penaltyFeeStr.isEmpty()) {
                exception.setPenaltyFee(new BigDecimal(penaltyFeeStr));
            }
            exception.setCreatedBy(user);
            exception.setStatus(ExceptionStatus.PENDING);

            parkingExceptionRepository.save(exception);
            return ResponseEntity.ok(Map.of("message", "Exception created successfully", "data", exception.getId()));
        } catch (Exception e) {
            log.error("Error creating exception: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── PUT /api/v1/exceptions/{id}/resolve ─────────────────────────────────────
    // Manager resolve (APPROVED/REJECTED/RESOLVED)
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> resolveException(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        try {
            ParkingException exception = parkingExceptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Exception not found"));

            String resolution = request.get("resolution");
            String status = request.get("status"); // APPROVED, REJECTED, RESOLVED

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            exception.setResolution(resolution);
            if (status != null) {
                exception.setStatus(ExceptionStatus.valueOf(status));
            } else {
                exception.setStatus(ExceptionStatus.RESOLVED);
            }
            exception.setApprovedBy(user);
            exception.setResolvedAt(LocalDateTime.now());

            parkingExceptionRepository.save(exception);
            return ResponseEntity.ok(Map.of("message", "Exception resolved successfully"));
        } catch (Exception e) {
            log.error("Error resolving exception: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── POST /api/v1/exceptions/staff-handle ────────────────────────────────────
    // Staff tự xử lý ngoại lệ ngay lập tức (RESOLVED), không cần chờ Manager
    @PostMapping("/staff-handle")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'PARKING_MANAGER', 'PARKING_STAFF', 'ADMIN')")
    public ResponseEntity<?> staffHandleException(@RequestBody Map<String, String> request) {
        try {
            String sessionId = request.get("sessionId");
            String licensePlate = request.get("licensePlate");
            String type = request.get("exceptionType");
            String reason = request.get("reason");
            String resolution = request.get("resolution");
            String evidenceNote = request.get("evidenceNote");
            String penaltyFeeStr = request.get("penaltyFee");

            ParkingSession session = null;
            if (sessionId != null && !sessionId.isEmpty()) {
                session = parkingSessionRepository.findById(UUID.fromString(sessionId))
                        .orElseThrow(() -> new RuntimeException("Session not found"));
            } else if (licensePlate != null && !licensePlate.isEmpty()) {
                session = parkingSessionRepository.findByVehicleLicensePlateAndExitTimeIsNull(licensePlate)
                        .stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No active session found for plate: " + licensePlate));
            }

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ExceptionType targetType = ExceptionType.valueOf(type);
            ParkingException exception = null;
            if (session != null) {
                validateExceptionAllowedForSession(session, targetType);
                boolean alreadyApplied = parkingExceptionRepository.findBySessionId(session.getId()).stream()
                        .anyMatch(e -> (e.getExceptionType() == targetType
                                || (targetType == ExceptionType.WRONG_ZONE && e.getExceptionType() == ExceptionType.WRONG_SPOT)
                                || (targetType == ExceptionType.WRONG_SPOT && e.getExceptionType() == ExceptionType.WRONG_ZONE))
                                && (e.getStatus() == ExceptionStatus.RESOLVED || e.getStatus() == ExceptionStatus.APPROVED));
                if (alreadyApplied) {
                    throw new RuntimeException("Ngoại lệ '" + targetType.getDisplayName() + "' đã được áp dụng cho phiên gửi xe này trước đó.");
                }

                exception = parkingExceptionRepository.findBySessionId(session.getId()).stream()
                        .filter(e -> (e.getExceptionType() == targetType
                                || (targetType == ExceptionType.WRONG_ZONE && e.getExceptionType() == ExceptionType.WRONG_SPOT)
                                || (targetType == ExceptionType.WRONG_SPOT && e.getExceptionType() == ExceptionType.WRONG_ZONE))
                                && e.getStatus() == ExceptionStatus.PENDING)
                        .findFirst()
                        .orElse(null);
            }

            if (exception == null) {
                exception = new ParkingException();
                exception.setSession(session);
                exception.setExceptionType(ExceptionType.valueOf(type));
                exception.setCreatedBy(user);
            } else {
                exception.setExceptionType(ExceptionType.valueOf(type));
            }
            if (reason != null && !reason.isEmpty()) {
                exception.setReason(reason);
            }
            exception.setResolution(resolution != null ? resolution : "Đã xử lý bởi nhân viên");
            if (evidenceNote != null && !evidenceNote.isEmpty()) {
                exception.setEvidenceNote(evidenceNote);
            }
            if (session != null && session.getVehicle() != null) {
                try {
                    var configOpt = penaltyConfigRepository.findByVehicleTypeAndExceptionTypeAndIsActiveTrue(
                            session.getVehicle().getVehicleType(), ExceptionType.valueOf(type));
                    if (!configOpt.isPresent() && ExceptionType.valueOf(type) == ExceptionType.WRONG_ZONE) {
                        configOpt = penaltyConfigRepository.findByVehicleTypeAndExceptionTypeAndIsActiveTrue(
                                session.getVehicle().getVehicleType(), ExceptionType.WRONG_SPOT);
                    }
                    if (configOpt.isPresent() && configOpt.get().getPenaltyAmount() != null) {
                        exception.setPenaltyFee(configOpt.get().getPenaltyAmount());
                        log.info("Auto-applied admin penalty fee {} for session {}", configOpt.get().getPenaltyAmount(), session.getId());
                    } else if (penaltyFeeStr != null && !penaltyFeeStr.isEmpty()) {
                        exception.setPenaltyFee(new BigDecimal(penaltyFeeStr));
                    }
                } catch (Exception exOpt) {
                    if (penaltyFeeStr != null && !penaltyFeeStr.isEmpty()) {
                        exception.setPenaltyFee(new BigDecimal(penaltyFeeStr));
                    }
                }
            } else if (penaltyFeeStr != null && !penaltyFeeStr.isEmpty()) {
                exception.setPenaltyFee(new BigDecimal(penaltyFeeStr));
            }
            if (exception.getCreatedBy() == null) {
                exception.setCreatedBy(user);
            }
            exception.setApprovedBy(user);
            exception.setStatus(ExceptionStatus.RESOLVED);
            exception.setResolvedAt(LocalDateTime.now());

            parkingExceptionRepository.save(exception);

            if (session != null) {
                try {
                    parkingSessionService.calculateParkingFee(session.getId());
                } catch (Exception eFee) {
                    log.warn("Failed to recalculate session fee after adding penalty: {}", eFee.getMessage());
                }
            }

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("id", exception.getId());
            responseData.put("penaltyFee", exception.getPenaltyFee());
            responseData.put("status", exception.getStatus().name());
            responseData.put("resolution", exception.getResolution());

            return ResponseEntity.ok(Map.of(
                "message", "Ngoại lệ đã được xử lý thành công",
                "data", responseData
            ));
        } catch (Exception e) {
            log.error("Error handling exception by staff: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
