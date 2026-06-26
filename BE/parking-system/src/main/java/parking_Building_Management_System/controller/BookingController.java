package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.booking.request.BookingRequest;
import parking_Building_Management_System.dto.booking.request.UpdateBookingRequest;
import parking_Building_Management_System.dto.booking.response.BookingResponse;
import parking_Building_Management_System.dto.booking.response.BookingDetailResponse;
import parking_Building_Management_System.service.BookingService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Validated
@Slf4j
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'PARKING_STAFF', 'PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request) {
        log.info("POST /api/v1/bookings - Creating booking for vehicle ID: {}", request.getVehicleId());
        try {
            UUID vehicleId = request.getVehicleId();
            BookingResponse response = bookingService.createBooking(request, vehicleId);
            ApiResponse<BookingResponse> apiResponse = ApiResponseFactory.created(response, "Booking created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
        } catch (Exception e) {
            log.error("Error creating booking: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        log.info("GET /api/v1/bookings - Getting all bookings");
        List<BookingResponse> responses = bookingService.getAllBookings();
        ApiResponse<List<BookingResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " bookings");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getBookingById(@PathVariable UUID id) {
        log.info("GET /api/v1/bookings/{} - Getting booking by ID", id);
        BookingDetailResponse response = bookingService.getBookingById(id);
        ApiResponse<BookingDetailResponse> apiResponse = ApiResponseFactory.success(response, "Booking retrieved successfully");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/code/{bookingCode}")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getBookingByCode(@PathVariable String bookingCode) {
        log.info("GET /api/v1/bookings/code/{} - Getting booking by code", bookingCode);
        BookingDetailResponse response = bookingService.getBookingByCode(bookingCode);
        ApiResponse<BookingDetailResponse> apiResponse = ApiResponseFactory.success(response, "Booking retrieved successfully");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsByVehicle(@PathVariable UUID vehicleId) {
        log.info("GET /api/v1/bookings/vehicle/{} - Getting bookings for vehicle", vehicleId);
        List<BookingResponse> responses = bookingService.getBookingsByVehicle(vehicleId);
        ApiResponse<List<BookingResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " bookings for vehicle");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/vehicle/{vehicleId}/active")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getActiveBookingsByVehicle(@PathVariable UUID vehicleId) {
        log.info("GET /api/v1/bookings/vehicle/{}/active - Getting active bookings for vehicle", vehicleId);
        List<BookingResponse> responses = bookingService.getActiveBookingsByVehicle(vehicleId);
        ApiResponse<List<BookingResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " active bookings for vehicle");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/slot/{slotId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsBySlot(@PathVariable UUID slotId) {
        log.info("GET /api/v1/bookings/slot/{} - Getting bookings for slot", slotId);
        List<BookingResponse> responses = bookingService.getBookingsBySlot(slotId);
        ApiResponse<List<BookingResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " bookings for slot");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAvailableBookingsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        log.info("GET /api/v1/bookings/search - Getting available bookings between {} and {}", startTime, endTime);
        List<BookingResponse> responses = bookingService.getAvailableBookingsByDateRange(startTime, endTime);
        ApiResponse<List<BookingResponse>> apiResponse = ApiResponseFactory.success(responses,
                "Retrieved " + responses.size() + " available bookings");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/check/availability")
    public ResponseEntity<ApiResponse<Boolean>> checkSlotAvailability(
            @RequestParam UUID slotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        log.info("GET /api/v1/bookings/check/availability - Checking availability for slot {} between {} and {}", 
                slotId, startTime, endTime);
        boolean isAvailable = bookingService.isSlotAvailableForBooking(slotId, startTime, endTime);
        ApiResponse<Boolean> apiResponse = ApiResponseFactory.success(isAvailable,
                "Slot is " + (isAvailable ? "available" : "not available"));
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('PARKING_STAFF', 'PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> confirmBooking(@PathVariable UUID id) {
        log.info("POST /api/v1/bookings/{}/confirm - Confirming booking", id);
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            UUID PARKING_STAFFId = UUID.fromString(principal.toString());
            
            BookingDetailResponse response = bookingService.confirmBooking(id, PARKING_STAFFId);
            ApiResponse<BookingDetailResponse> apiResponse = ApiResponseFactory.success(response, "Booking confirmed successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error confirming booking: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('DRIVER', 'PARKING_STAFF', 'PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> cancelBooking(@PathVariable UUID id) {
        log.info("POST /api/v1/bookings/{}/cancel - Cancelling booking", id);
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            UUID userId = UUID.fromString(principal.toString());
            
            BookingDetailResponse response = bookingService.cancelBooking(id, userId);
            ApiResponse<BookingDetailResponse> apiResponse = ApiResponseFactory.success(response, "Booking cancelled successfully");
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error cancelling booking: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/stats/active-count")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<Long>> getActiveBookingsCount() {
        log.info("GET /api/v1/bookings/stats/active-count - Getting active bookings count");
        long count = bookingService.getActiveBookingsCount();
        ApiResponse<Long> apiResponse = ApiResponseFactory.success(count, "Active bookings count: " + count);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/stats/expiring-count")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<ApiResponse<Long>> getExpiringBookingsCount() {
        log.info("GET /api/v1/bookings/stats/expiring-count - Getting expiring bookings count");
        long count = bookingService.getExpiringBookingsCount();
        ApiResponse<Long> apiResponse = ApiResponseFactory.success(count, "Expiring bookings count: " + count);
        return ResponseEntity.ok(apiResponse);
    }
}
