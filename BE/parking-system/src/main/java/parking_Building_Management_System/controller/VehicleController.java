package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.vehicle.request.VehicleRequest;
import parking_Building_Management_System.dto.vehicle.response.MonthlyPassCheckResponse;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.user.ParkingUserDetails;
import parking_Building_Management_System.service.VehicleService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Validated
@Slf4j
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(@Valid @RequestBody VehicleRequest request) {
        log.info("POST /api/v1/vehicles - Creating vehicle with license plate: {}", request.getLicensePlate());
        try {
            VehicleResponse response = vehicleService.createVehicle(request);
            ApiResponse<VehicleResponse> apiResponse = ApiResponseFactory.created(response, "Vehicle created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error creating vehicle: {}", e.getMessage());
            throw e;
        }
    }

    // ── Lấy xe của DRIVER đang đăng nhập ────────────────────────────────────
    @GetMapping("/my-vehicles")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getMyVehicles() {
        log.info("GET /api/v1/vehicles/my-vehicles - Getting current user's vehicles");
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof ParkingUserDetails)) {
            // SỬA LỖI Ở ĐÂY: Thêm (ApiResponse) để ép kiểu, giúp Java bỏ qua việc check Generic khắt khe
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body((ApiResponse) ApiResponseFactory.error(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Người dùng chưa xác thực"));
        }

        ParkingUserDetails userDetails = (ParkingUserDetails) auth.getPrincipal();
        Long userId = userDetails.getUserId();
        List<VehicleResponse> responses = vehicleService.getVehiclesByUserId(userId);

        ApiResponse<List<VehicleResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " vehicles for current user");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAllVehicles() {
        log.info("GET /api/v1/vehicles - Getting all vehicles");
        List<VehicleResponse> responses = vehicleService.getAllVehicles();
        ApiResponse<List<VehicleResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " vehicles");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleById(@PathVariable UUID id) {
        log.info("GET /api/v1/vehicles/{} - Getting vehicle by ID", id);
        try {
            VehicleResponse response = vehicleService.getVehicleById(id);
            ApiResponse<VehicleResponse> apiResponse = ApiResponseFactory.success(response);
            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error getting vehicle: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/plate/{licensePlate}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleByLicensePlate(@PathVariable String licensePlate) {
        log.info("GET /api/v1/vehicles/plate/{} - Getting vehicle by license plate", licensePlate);
        try {
            VehicleResponse response = vehicleService.getVehicleByLicensePlate(licensePlate);
            ApiResponse<VehicleResponse> apiResponse = ApiResponseFactory.success(response);
            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error getting vehicle: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> searchByLicensePlate(
            @RequestParam String licensePlate,
            @RequestParam(defaultValue = "0.8") Double fuzzyThreshold) {
        log.info("GET /api/v1/vehicles/search - Searching vehicles by license plate: {}", licensePlate);
        List<VehicleResponse> responses;
        if (fuzzyThreshold < 1.0) {
            responses = vehicleService.fuzzySearchByLicensePlate(licensePlate, fuzzyThreshold);
            return ResponseEntity.ok(ApiResponseFactory.success(responses,
                    "Fuzzy search found " + responses.size() + " vehicles"));
        } else {
            responses = vehicleService.searchByLicensePlate(licensePlate);
            return ResponseEntity.ok(ApiResponseFactory.success(responses,
                    "Found " + responses.size() + " vehicles"));
        }
    }

    @GetMapping("/type/{vehicleType}")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getVehiclesByType(@PathVariable VehicleType vehicleType) {
        log.info("GET /api/v1/vehicles/type/{} - Getting vehicles by type", vehicleType);
        List<VehicleResponse> responses = vehicleService.getVehiclesByType(vehicleType);
        ApiResponse<List<VehicleResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Found " + responses.size() + " vehicles of type " + vehicleType.getDisplayName());
        return ResponseEntity.ok(apiResponse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(
            @PathVariable UUID id,
            @Valid @RequestBody VehicleRequest request) {
        log.info("PUT /api/v1/vehicles/{} - Updating vehicle", id);
        try {
            VehicleResponse response = vehicleService.updateVehicle(id, request);
            ApiResponse<VehicleResponse> apiResponse = ApiResponseFactory.success(response,
                    "Vehicle updated successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error updating vehicle: {}", e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable UUID id) {
        log.info("DELETE /api/v1/vehicles/{} - Deleting vehicle", id);
        try {
            vehicleService.deleteVehicle(id);
            ApiResponse<Void> apiResponse = ApiResponseFactory.success(null, "Vehicle deleted successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            log.error("Error deleting vehicle: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{licensePlate}/monthly-pass")
    public ResponseEntity<ApiResponse<MonthlyPassCheckResponse>> checkMonthlyPassValidity(
            @PathVariable String licensePlate) {
        log.info("GET /api/v1/vehicles/{}/monthly-pass - Checking monthly pass validity", licensePlate);
        try {
            MonthlyPassCheckResponse response = vehicleService.checkMonthlyPassValidity(licensePlate);
            return ResponseEntity.ok(ApiResponseFactory.success(response));
        } catch (RuntimeException e) {
            log.error("Error checking monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/id/{vehicleId}/monthly-pass")
    public ResponseEntity<ApiResponse<MonthlyPassCheckResponse>> checkMonthlyPassValidityById(
            @PathVariable UUID vehicleId) {
        log.info("GET /api/v1/vehicles/id/{}/monthly-pass - Checking monthly pass validity", vehicleId);
        try {
            MonthlyPassCheckResponse response = vehicleService.checkMonthlyPassValidityById(vehicleId);
            return ResponseEntity.ok(ApiResponseFactory.success(response));
        } catch (RuntimeException e) {
            log.error("Error checking monthly pass: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/stats/active-passes")
    public ResponseEntity<ApiResponse<Long>> countActiveVehiclesWithValidPass() {
        log.info("GET /api/v1/vehicles/stats/active-passes - Counting active vehicles with valid pass");
        long count = vehicleService.countActiveVehiclesWithValidPass();
        return ResponseEntity.ok(ApiResponseFactory.success(count,
                "Found " + count + " active vehicles with valid monthly passes"));
    }
}