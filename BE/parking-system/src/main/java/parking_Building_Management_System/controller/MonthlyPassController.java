package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.monthlyPass.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.request.RenewMonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassDetailResponse;
import parking_Building_Management_System.service.MonthlyPassService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/monthly-passes")
@RequiredArgsConstructor
@Validated
@Slf4j
public class MonthlyPassController {

    private final MonthlyPassService monthlyPassService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PARKING_MANAGER', 'ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<MonthlyPassResponse>> createMonthlyPass(
            @Valid @RequestBody MonthlyPassRequest request) {
        log.info("POST /api/v1/monthly-passes - Creating monthly pass for vehicle ID: {}", request.getVehicleId());
        try {
            MonthlyPassResponse response = monthlyPassService.createMonthlyPass(request);
            ApiResponse<MonthlyPassResponse> apiResponse = ApiResponseFactory.created(response, "Monthly pass created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
        } catch (Exception e) {
            log.error("Error creating monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<List<MonthlyPassResponse>>> getAllMonthlyPasses() {
        log.info("GET /api/v1/monthly-passes - Getting all monthly passes");
        List<MonthlyPassResponse> responses = monthlyPassService.getAllMonthlyPasses();
        ApiResponse<List<MonthlyPassResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " monthly passes");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/stats/active-count")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<Long>> getActiveMonthlyPassCount() {
        log.info("GET /api/v1/monthly-passes/stats/active-count - Getting active monthly pass count");
        long count = monthlyPassService.getActiveMonthlyPassCount();
        ApiResponse<Long> apiResponse = ApiResponseFactory.success(count, "Active monthly pass count: " + count);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/stats/max-limit")
    @PreAuthorize("hasAnyRole('PARKING_MANAGER', 'DRIVER', 'PARKING_STAFF')")
    public ResponseEntity<ApiResponse<Long>> getMaxMonthlyPassLimit() {
        log.info("GET /api/v1/monthly-passes/stats/max-limit - Getting max monthly pass limit (70% total slots)");
        long maxLimit = monthlyPassService.getMaxActivePasses();
        ApiResponse<Long> apiResponse = ApiResponseFactory.success(maxLimit, "Max monthly pass limit: " + maxLimit);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<List<MonthlyPassResponse>>> getExpiringMonthlyPasses(
            @RequestParam(defaultValue = "7") int days) {
        log.info("GET /api/v1/monthly-passes/expiring?days={} - Getting expiring monthly passes", days);
        List<MonthlyPassResponse> responses = monthlyPassService.getExpiringMonthlyPasses(days);
        ApiResponse<List<MonthlyPassResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " expiring monthly passes");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/check/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<Boolean>> validateMonthlyPassValidity(@PathVariable UUID vehicleId) {
        log.info("GET /api/v1/monthly-passes/check/vehicle/{} - Validating monthly pass validity", vehicleId);
        boolean isValid = monthlyPassService.validateMonthlyPassValidity(vehicleId);
        ApiResponse<Boolean> apiResponse = ApiResponseFactory.success(isValid,
                "Monthly pass validity: " + (isValid ? "valid" : "invalid"));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/check/plate/{licensePlate}")
    public ResponseEntity<ApiResponse<Boolean>> validateMonthlyPassValidityByLicensePlate(
            @PathVariable String licensePlate) {
        log.info("GET /api/v1/monthly-passes/check/plate/{} - Validating monthly pass validity by plate", licensePlate);
        boolean isValid = monthlyPassService.validateMonthlyPassValidityByLicensePlate(licensePlate);
        ApiResponse<Boolean> apiResponse = ApiResponseFactory.success(isValid,
                "Monthly pass validity for plate: " + (isValid ? "valid" : "invalid"));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/vehicle/{vehicleId}/active")
    public ResponseEntity<ApiResponse<MonthlyPassDetailResponse>> getActiveMonthlyPassByVehicle(
            @PathVariable UUID vehicleId) {
        log.info("GET /api/v1/monthly-passes/vehicle/{}/active - Getting active monthly pass", vehicleId);
        try {
            MonthlyPassDetailResponse response = monthlyPassService.getActiveMonthlyPassByVehicle(vehicleId);
            ApiResponse<MonthlyPassDetailResponse> apiResponse = ApiResponseFactory.success(response);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting active monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<MonthlyPassResponse>>> getMonthlyPassesByVehicle(
            @PathVariable UUID vehicleId) {
        log.info("GET /api/v1/monthly-passes/vehicle/{} - Getting monthly passes for vehicle", vehicleId);
        List<MonthlyPassResponse> responses = monthlyPassService.getMonthlyPassesByVehicle(vehicleId);
        ApiResponse<List<MonthlyPassResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " monthly passes for vehicle");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/my-passes")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<List<MonthlyPassResponse>>> getMyMonthlyPasses() {
        log.info("GET /api/v1/monthly-passes/my-passes - Getting current user's monthly passes");

        List<MonthlyPassResponse> responses = monthlyPassService.getMyMonthlyPasses();

        ApiResponse<List<MonthlyPassResponse>> apiResponse =
                ApiResponseFactory.success(
                        responses,
                        "Retrieved " + responses.size() + " monthly passes for current user"
                );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MonthlyPassDetailResponse>> getMonthlyPassById(@PathVariable UUID id) {
        log.info("GET /api/v1/monthly-passes/{} - Getting monthly pass by ID", id);
        try {
            MonthlyPassDetailResponse response = monthlyPassService.getMonthlyPassById(id);
            ApiResponse<MonthlyPassDetailResponse> apiResponse = ApiResponseFactory.success(response);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('PARKING_MANAGER', 'ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<MonthlyPassDetailResponse>> renewMonthlyPass(
            @PathVariable UUID id,
            @Valid @RequestBody RenewMonthlyPassRequest request) {
        log.info("POST /api/v1/monthly-passes/{}/renew - Renewing monthly pass", id);
        try {
            MonthlyPassDetailResponse response = monthlyPassService.renewMonthlyPass(id, request);
            ApiResponse<MonthlyPassDetailResponse> apiResponse = ApiResponseFactory.success(response, "Monthly pass renewed successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error renewing monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARKING_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<MonthlyPassDetailResponse>> updateMonthlyPass(
            @PathVariable UUID id,
            @Valid @RequestBody MonthlyPassRequest request) {
        log.info("PUT /api/v1/monthly-passes/{} - Updating monthly pass", id);
        try {
            MonthlyPassDetailResponse response = monthlyPassService.updateMonthlyPass(id, request);
            ApiResponse<MonthlyPassDetailResponse> apiResponse = ApiResponseFactory.success(response, "Monthly pass updated successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error updating monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARKING_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancelMonthlyPass(@PathVariable UUID id) {
        log.info("DELETE /api/v1/monthly-passes/{} - Cancelling monthly pass", id);
        try {
            monthlyPassService.cancelMonthlyPass(id);
            ApiResponse<Void> apiResponse = ApiResponseFactory.success(null, "Monthly pass cancelled successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error cancelling monthly pass: {}", e.getMessage());
            throw e;
        }
    }
}
