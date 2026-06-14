package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/**
 * Vehicle Entry Controller (Check-in)
 * Phase 3: Vehicle Entry Flow
 * Enforces BR-23 ~ BR-32
 */
@RestController
@RequestMapping("/api/v1/parking-sessions")
@RequiredArgsConstructor
@Validated
@Slf4j
public class ParkingSessionController {

    private final ParkingSessionService parkingSessionService;

    /**
     * Step 1: Validate vehicle before entry
     * BR-23: License plate bắt buộc
     *
     * GET /api/v1/parking-sessions/validate?licensePlate=51G-12345
     */
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<EntryValidationResponse>> validateVehicleForEntry(
            @RequestParam @NotBlank(message = "License plate is required") String licensePlate) {

        log.info("POST /api/v1/parking-sessions/validate - Validating vehicle: {}", licensePlate);

        try {
            EntryValidationResponse response = parkingSessionService.validateVehicleForEntry(licensePlate);

            ApiResponse<EntryValidationResponse> apiResponse = ApiResponseFactory.success(
                    response,
                    response.isValid() ? "Vehicle is valid for entry" : "Vehicle validation failed"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Vehicle validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<EntryValidationResponse>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Step 2: Get available slots in a zone
     * BR-26: Chỉ assign slot Free và Available
     * BR-15: Vehicles type phải match slot type
     *
     * GET /api/v1/parking-sessions/available-slots?zoneId=xxx&licensePlate=51G-12345
     */
    @GetMapping("/available-slots")
    public ResponseEntity<ApiResponse<List<AvailableSlotsForEntryResponse>>> findAvailableSlots(
            @RequestParam @NotNull(message = "Zone ID is required") UUID zoneId,
            @RequestParam @NotBlank(message = "License plate is required") String licensePlate) {

        log.info("GET /api/v1/parking-sessions/available-slots - Zone: {}, Vehicle: {}", zoneId, licensePlate);

        try {
            List<AvailableSlotsForEntryResponse> slots = parkingSessionService.findAvailableSlots(zoneId, licensePlate);

            ApiResponse<List<AvailableSlotsForEntryResponse>> apiResponse = ApiResponseFactory.success(
                    slots,
                    "Found " + slots.size() + " available slots"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error finding available slots: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<List<AvailableSlotsForEntryResponse>>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Step 3: Create parking session (Check-in)
     * BR-27: Slot → Occupied ngay khi tạo session (transactional)
     * BR-28: entry_time do server generate
     * BR-29: Chỉ Staff đăng nhập mới tạo được session
     * BR-30: vehicleType xe phải khớp vehicleType slot
     * BR-31: sessionID phải unique (UUID)
     *
     * POST /api/v1/parking-sessions/entry
     * {
     *   "licensePlate": "51G-12345",
     *   "zoneId": "xxx-xxx-xxx"
     * }
     */
    @PostMapping("/entry")
    public ResponseEntity<ApiResponse<VehicleEntryResponse>> createParkingSession(
            @Valid @RequestBody VehicleEntryRequest request,
            Authentication authentication) {

        log.info("POST /api/v1/parking-sessions/entry - Vehicle: {}", request.getLicensePlate());

        try {
            // BR-29: Extract staff ID from authentication
            Long staffId = extractStaffIdFromAuth(authentication);

            VehicleEntryResponse response = parkingSessionService.createParkingSession(request, staffId);

            ApiResponse<VehicleEntryResponse> apiResponse = ApiResponseFactory.created(
                    response,
                    "Vehicle check-in successful - Session: " + response.getSessionId()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error creating parking session: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<VehicleEntryResponse>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating parking session: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body((ApiResponse<VehicleEntryResponse>) (Object) ApiResponseFactory.internalServerError("Failed to create parking session"));
        }
    }

    /**
     * Get active session by vehicle ID
     * GET /api/v1/parking-sessions/vehicle/{vehicleId}
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<?>> getActiveSessionByVehicle(@PathVariable UUID vehicleId) {

        log.info("GET /api/v1/parking-sessions/vehicle/{} - Getting active session", vehicleId);

        try {
            var session = parkingSessionService.getActiveParkingSessionByVehicle(vehicleId);

            ApiResponse<?> apiResponse = ApiResponseFactory.success(
                    session,
                    "Session retrieved successfully"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.warn("No active session found for vehicle: {}", vehicleId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponseFactory.notFound(e.getMessage()));
        }
    }

    /**
     * Get session by ID
     * GET /api/v1/parking-sessions/{sessionId}
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<?>> getSessionById(@PathVariable UUID sessionId) {

        log.info("GET /api/v1/parking-sessions/{} - Getting session", sessionId);

        try {
            var session = parkingSessionService.getParkingSessionById(sessionId);

            ApiResponse<?> apiResponse = ApiResponseFactory.success(
                    session,
                    "Session retrieved successfully"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.warn("Session not found: {}", sessionId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponseFactory.notFound(e.getMessage()));
        }
    }

    /**
     * Get all active sessions
     * GET /api/v1/parking-sessions/active/all
     */
    @GetMapping("/active/all")
    public ResponseEntity<ApiResponse<List<?>>> getAllActiveSessions() {

        log.info("GET /api/v1/parking-sessions/active/all - Getting all active sessions");

        try {
            var sessions = parkingSessionService.getAllActiveSessions();

            ApiResponse<List<?>> apiResponse = ApiResponseFactory.success(
                    sessions,
                    "Found " + sessions.size() + " active sessions"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting active sessions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body((ApiResponse<List<?>>) (Object) ApiResponseFactory.internalServerError(e.getMessage()));
        }
    }

    // ============ Helper Methods ============

    /**
     * Extract staff ID from JWT token
     * BR-29: Ensure only authenticated staff can create sessions
     */
    private Long extractStaffIdFromAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User is not authenticated - Staff ID required");
        }

        // Extract from JWT or principal
        // This is a placeholder - adjust based on your security implementation
        try {
            return Long.parseLong(authentication.getName());
        } catch (Exception e) {
            throw new RuntimeException("Invalid staff ID in token");
        }
    }
}

