package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.entity.user.ParkingUserDetails;
import parking_Building_Management_System.dto.parkingSession.request.VehicleExitRequest;
import parking_Building_Management_System.dto.parkingSession.request.PaymentRequest;
import parking_Building_Management_System.dto.parkingSession.request.FeeCalculationRequest;
import parking_Building_Management_System.dto.parkingSession.response.VehicleExitResponse;
import parking_Building_Management_System.dto.parkingSession.response.FeeCalculationResponse;
import parking_Building_Management_System.dto.parkingSession.response.PaymentResponse;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.ActiveSessionResponse;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
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
            @RequestParam @NotBlank(message = "License plate is required") String licensePlate,
            @RequestParam(required = false) String bookingCode) {

        log.info("GET /api/v1/parking-sessions/available-slots - Zone: {}, Vehicle: {}, Booking: {}", 
                zoneId, licensePlate, bookingCode);

        try {
            List<AvailableSlotsForEntryResponse> slots = parkingSessionService.findAvailableSlots(zoneId, licensePlate, bookingCode);

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
     * "licensePlate": "51G-12345",
     * "zoneId": "xxx-xxx-xxx"
     * }
     */
    @PostMapping("/entry")
    public ResponseEntity<ApiResponse<VehicleEntryResponse>> createParkingSession(
            @Valid @RequestBody VehicleEntryRequest request,
            @RequestParam(required = false) String bookingCode,
            Authentication authentication) {

        log.info("POST /api/v1/parking-sessions/entry - Vehicle: {}, Booking: {}", request.getLicensePlate(), bookingCode);

        try {
            // BR-29: Extract staff ID from authentication
            Long staffId = extractStaffIdFromAuth(authentication);

            VehicleEntryResponse response = parkingSessionService.createParkingSession(request, staffId, bookingCode);

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
    public ResponseEntity<ApiResponse<List<ActiveSessionResponse>>> getAllActiveSessions() {

        log.info("GET /api/v1/parking-sessions/active/all - Getting all active sessions");

        try {
            List<ActiveSessionResponse> sessions = parkingSessionService.getAllActiveSessions();

            ApiResponse<List<ActiveSessionResponse>> apiResponse = ApiResponseFactory.success(
                    sessions,
                    "Found " + sessions.size() + " active sessions"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting active sessions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body((ApiResponse<List<ActiveSessionResponse>>) (Object) ApiResponseFactory.internalServerError(e.getMessage()));
        }
    }

    /**
     * Get all completed sessions
     * GET /api/v1/parking-sessions/completed/all
     */
    @GetMapping("/completed/all")
    public ResponseEntity<ApiResponse<List<parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse>>> getAllCompletedSessions() {
        log.info("GET /api/v1/parking-sessions/completed/all - Getting all completed sessions");
        try {
            List<parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse> sessions = parkingSessionService.getAllCompletedSessions();
            ApiResponse<List<parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse>> apiResponse = ApiResponseFactory.success(
                    sessions,
                    "Found " + sessions.size() + " completed sessions"
            );
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting completed sessions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body((ApiResponse<List<parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse>>) (Object) ApiResponseFactory.internalServerError(e.getMessage()));
        }
    }

    /**
     * Step 4: Vehicle exit (Check-out)
     * BR-32: Update session status to COMPLETED, release slot
     *
     * POST /api/v1/parking-sessions/exit
     * {
     * "sessionId": "xxx-xxx-xxx"
     * }
     */
    @PostMapping("/exit")
    public ResponseEntity<ApiResponse<VehicleExitResponse>> updateSessionOnExit(
            @Valid @RequestBody VehicleExitRequest request,
            Authentication authentication) {

        log.info("POST /api/v1/parking-sessions/exit - Session: {}", request.getSessionId());

        try {
            // Extract staff ID from authentication
            Long staffId = extractStaffIdFromAuth(authentication);

            var session = parkingSessionService.updateSessionOnExit(request.getSessionId(), staffId);

            VehicleExitResponse response = VehicleExitResponse.builder()
                    .sessionId(session.getId())
                    .exitTime(session.getExitTime())
                    .message("Vehicle check-out successful and slot released")
                    .build();

            ApiResponse<VehicleExitResponse> apiResponse = ApiResponseFactory.success(
                    response,
                    "Vehicle check-out successful"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error processing vehicle exit: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<VehicleExitResponse>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Calculate parking fee
     * BR-24: Calculate fee based on duration
     *
     * POST /api/v1/parking-sessions/calculate-fee
     * {
     * "sessionId": "xxx-xxx-xxx"
     * }
     */
    @PostMapping("/calculate-fee")
    public ResponseEntity<ApiResponse<FeeCalculationResponse>> calculateParkingFee(
            @Valid @RequestBody FeeCalculationRequest request) {

        log.info("POST /api/v1/parking-sessions/calculate-fee - Session: {}", request.getSessionId());

        try {
            FeeCalculationResponse response = parkingSessionService.calculateParkingFee(request.getSessionId());

            ApiResponse<FeeCalculationResponse> apiResponse = ApiResponseFactory.success(
                    response,
                    "Fee calculated successfully"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error calculating parking fee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<FeeCalculationResponse>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Process payment for parking session
     * BR-33: Update payment status after successful payment
     *
     * POST /api/v1/parking-sessions/payment
     * {
     * "sessionId": "xxx-xxx-xxx",
     * "amount": 50000
     * }
     */
    @PostMapping("/payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {

        log.info("POST /api/v1/parking-sessions/payment - Session: {}", request.getSessionId());

        try {
            Long staffId = extractStaffIdFromAuth(authentication);
            Long totalFee = parkingSessionService.processPayment(request, staffId);

            PaymentResponse response = PaymentResponse.builder()
                    .sessionId(request.getSessionId())
                    .amount(BigDecimal.valueOf(totalFee))
                    .paymentStatus("PAID")
                    .message("Payment processed successfully")
                    .build();

            ApiResponse<PaymentResponse> apiResponse = ApiResponseFactory.success(
                    response,
                    "Payment processed successfully"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error processing payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((ApiResponse<PaymentResponse>) (Object) ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Update payment status for session
     * PUT /api/v1/parking-sessions/{sessionId}/payment-status
     * {
     * "paymentStatus": "PAID"
     * }
     */
    @PutMapping("/{sessionId}/payment-status")
    public ResponseEntity<ApiResponse<?>> updatePaymentStatus(
            @PathVariable UUID sessionId,
            @RequestParam @NotBlank(message = "Payment status is required") String paymentStatus) {

        log.info("PUT /api/v1/parking-sessions/{}/payment-status - Status: {}", sessionId, paymentStatus);

        try {
            var session = parkingSessionService.updatePaymentStatus(sessionId, paymentStatus);

            ApiResponse<?> apiResponse = ApiResponseFactory.success(
                    session,
                    "Payment status updated successfully"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error updating payment status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseFactory.badRequest(e.getMessage()));
        }
    }

    /**
     * Find sessions with overstay > 24 hours
     * GET /api/v1/parking-sessions/overstay/24h
     */
    @GetMapping("/overstay/24h")
    public ResponseEntity<ApiResponse<List<?>>> findSessionsOverstay24Hours() {

        log.info("GET /api/v1/parking-sessions/overstay/24h - Getting overstay sessions");

        try {
            var sessions = parkingSessionService.findSessionsOverstay24Hours();

            ApiResponse<List<?>> apiResponse = ApiResponseFactory.success(
                    sessions,
                    "Found " + sessions.size() + " overstay sessions"
            );

            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error finding overstay sessions: {}", e.getMessage());
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

        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof ParkingUserDetails userDetails) {
                return userDetails.getUserId();
            }
            throw new RuntimeException("Invalid principal type");
        } catch (Exception e) {
            throw new RuntimeException("Invalid staff ID in token");
        }
    }
}