package parking_Building_Management_System.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentRequest;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentResponse;
import parking_Building_Management_System.service.VnPayService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.ApiResponseFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment/vnpay")
@RequiredArgsConstructor
@Tag(name = "VNPay Payment API", description = "Endpoints for creating and verifying VNPay online payments")
public class VnPayController {

    private final VnPayService vnPayService;

    @PostMapping("/create-url")
    @Operation(summary = "Create VNPay payment URL for redirection")
    public ResponseEntity<ApiResponse<VnPayPaymentResponse>> createPaymentUrl(
            @RequestBody VnPayPaymentRequest request,
            HttpServletRequest httpServletRequest) {
        VnPayPaymentResponse response = vnPayService.createPaymentUrl(request, httpServletRequest);
        return ResponseEntity.ok(ApiResponseFactory.success(response, "Payment URL created successfully"));
    }

    @GetMapping("/vnpay-return")
    @Operation(summary = "Process return callback from VNPay gateway")
    public ResponseEntity<ApiResponse<Map<String, Object>>> vnpayReturn(
            @RequestParam Map<String, String> allParams) {
        Map<String, Object> result = vnPayService.verifyAndProcessReturn(allParams);
        return ResponseEntity.ok(ApiResponseFactory.success(result, "VNPay return processed"));
    }

    @GetMapping("/ipn")
    @Operation(summary = "Instant Payment Notification (IPN) webhook for VNPay server")
    public ResponseEntity<Map<String, String>> vnpayIpn(
            @RequestParam Map<String, String> allParams) {
        Map<String, Object> result = vnPayService.verifyAndProcessReturn(allParams);
        boolean isValid = (boolean) result.getOrDefault("isValidSignature", false);
        String status = (String) result.getOrDefault("status", "FAILED");

        if (!isValid) {
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
        }
        if ("SUCCESS".equals(status)) {
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        } else {
            return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Order failed"));
        }
    }
}
