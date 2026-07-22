package parking_Building_Management_System.service;

import jakarta.servlet.http.HttpServletRequest;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentRequest;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentResponse;
import java.util.Map;

public interface VnPayService {
    VnPayPaymentResponse createPaymentUrl(VnPayPaymentRequest request, HttpServletRequest httpServletRequest);
    Map<String, Object> verifyAndProcessReturn(Map<String, String> vnpayParams);
}
