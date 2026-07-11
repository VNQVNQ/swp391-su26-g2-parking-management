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
import parking_Building_Management_System.repository.UserRepository;

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

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<?> getAllExceptions() {
        try {
            List<ParkingException> exceptions = parkingExceptionRepository.findAll();
            List<Map<String, Object>> response = exceptions.stream().map(ex -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", ex.getId());
                if (ex.getSession() != null) {
                    map.put("sessionId", ex.getSession().getId());
                    if (ex.getSession().getVehicle() != null) {
                        map.put("licensePlate", ex.getSession().getVehicle().getLicensePlate());
                    }
                }
                map.put("exceptionType", ex.getExceptionType().name());
                map.put("reason", ex.getReason());
                map.put("resolution", ex.getResolution());
                map.put("status", ex.getStatus().name());
                map.put("createdAt", ex.getCreatedAt());
                if (ex.getCreatedBy() != null) {
                    map.put("createdBy", ex.getCreatedBy().getFullName());
                }
                return map;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("data", response));
        } catch (Exception e) {
            log.error("Error fetching exceptions: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<?> createException(@RequestBody Map<String, String> request) {
        try {
            String sessionId = request.get("sessionId");
            String licensePlate = request.get("licensePlate");
            String type = request.get("exceptionType");
            String reason = request.get("reason");

            ParkingSession session = null;
            if (sessionId != null && !sessionId.isEmpty()) {
                session = parkingSessionRepository.findById(UUID.fromString(sessionId))
                        .orElseThrow(() -> new RuntimeException("Session not found"));
            } else if (licensePlate != null && !licensePlate.isEmpty()) {
                // Find active session for plate
                session = parkingSessionRepository.findByVehicleLicensePlateAndExitTimeIsNull(licensePlate)
                        .stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No active session found for plate: " + licensePlate));
            }
            
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ParkingException exception = new ParkingException();
            exception.setSession(session);
            exception.setExceptionType(ExceptionType.valueOf(type));
            exception.setReason(reason);
            exception.setCreatedBy(user);
            exception.setStatus(ExceptionStatus.PENDING);

            parkingExceptionRepository.save(exception);
            return ResponseEntity.ok(Map.of("message", "Exception created successfully", "data", exception.getId()));
        } catch (Exception e) {
            log.error("Error creating exception: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('MANAGER')")
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
}
