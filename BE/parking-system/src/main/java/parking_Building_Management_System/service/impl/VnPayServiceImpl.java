package parking_Building_Management_System.service.impl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.config.VnPayConfig;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentRequest;
import parking_Building_Management_System.dto.vnpay.VnPayPaymentResponse;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.enums.BookingStatus;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.repository.BookingRepository;
import parking_Building_Management_System.repository.MonthlyPassRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.service.VnPayService;
import parking_Building_Management_System.utils.VnPayUtil;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnPayServiceImpl implements VnPayService {

    private final VnPayConfig vnPayConfig;
    private final MonthlyPassRepository monthlyPassRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public VnPayPaymentResponse createPaymentUrl(VnPayPaymentRequest request, HttpServletRequest httpServletRequest) {
        log.info("Creating VNPay payment URL for target: {} id: {} amount: {}", 
                 request.getTargetType(), request.getTargetId(), request.getAmount());

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVnpVersion());
        vnp_Params.put("vnp_Command", vnPayConfig.getVnpCommand());
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(request.getAmount() * 100));
        vnp_Params.put("vnp_CurrCode", "VND");

        String targetPrefix = (request.getTargetType() != null && !request.getTargetType().trim().isEmpty()) 
                ? request.getTargetType().trim() : "GENERAL";
        String targetIdStr = (request.getTargetId() != null && !request.getTargetId().trim().isEmpty()) 
                ? request.getTargetId().trim() : "NONE";
        String txnRef = targetPrefix + "_" + targetIdStr + "_" + VnPayUtil.getRandomNumber(6);

        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", request.getOrderInfo() != null ? request.getOrderInfo() : "Thanh toan VNPay " + txnRef);
        vnp_Params.put("vnp_OrderType", request.getOrderType() != null ? request.getOrderType() : "other");
        vnp_Params.put("vnp_Locale", "vn");

        String returnUrl = (request.getReturnUrl() != null && !request.getReturnUrl().trim().isEmpty())
                ? request.getReturnUrl().trim() : vnPayConfig.getVnpReturnUrl();
        vnp_Params.put("vnp_ReturnUrl", returnUrl);

        String ipAddr = VnPayUtil.getIpAddress(httpServletRequest);
        vnp_Params.put("vnp_IpAddr", ipAddr != null ? ipAddr : "127.0.0.1");

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = VnPayUtil.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl;

        return VnPayPaymentResponse.builder()
                .code("00")
                .message("Successfully generated VNPay payment URL")
                .paymentUrl(paymentUrl)
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> verifyAndProcessReturn(Map<String, String> vnpayParams) {
        log.info("Verifying VNPay return parameters: {}", vnpayParams);
        Map<String, String> fields = new HashMap<>(vnpayParams);
        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String signValue = VnPayUtil.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        boolean isValidSignature = signValue.equals(vnp_SecureHash);

        Map<String, Object> result = new HashMap<>();
        String responseCode = fields.get("vnp_ResponseCode");
        String txnRef = fields.get("vnp_TxnRef");
        String amountStr = fields.get("vnp_Amount");
        long amount = (amountStr != null && !amountStr.isEmpty()) ? Long.parseLong(amountStr) / 100 : 0;

        result.put("isValidSignature", isValidSignature);
        result.put("responseCode", responseCode);
        result.put("txnRef", txnRef);
        result.put("amount", amount);
        result.put("orderInfo", fields.get("vnp_OrderInfo"));
        result.put("bankCode", fields.get("vnp_BankCode"));
        result.put("payDate", fields.get("vnp_PayDate"));

        if (!isValidSignature) {
            log.error("Invalid VNPay signature for txnRef: {}", txnRef);
            result.put("status", "FAILED");
            result.put("message", "Chữ ký xác thực VNPay không hợp lệ");
            return result;
        }

        if ("00".equals(responseCode)) {
            result.put("status", "SUCCESS");
            result.put("message", "Thanh toán thành công qua VNPay");
            
            // Cập nhật trạng thái trong Database theo target
            if (txnRef != null && txnRef.contains("_")) {
                try {
                    String[] parts = txnRef.split("_");
                    if (parts.length >= 3) {
                        String targetPrefix = parts[0] + (parts[1].equals("PASS") || parts[1].equals("SESSION") ? "_" + parts[1] : "");
                        String targetIdStr = parts[0].equals("MONTHLY") || parts[0].equals("PARKING") ? parts[2] : parts[1];

                        if (targetPrefix.equals("MONTHLY_PASS") || txnRef.startsWith("MONTHLY_PASS_")) {
                            UUID passId = UUID.fromString(targetIdStr);
                            MonthlyPass pass = monthlyPassRepository.findById(passId).orElse(null);
                            if (pass != null) {
                                Vehicle vehicle = pass.getVehicle();
                                if (vehicle != null) {
                                    List<MonthlyPass> allPassesOfVehicle = monthlyPassRepository.findByVehicleId(vehicle.getId());
                                    for (MonthlyPass other : allPassesOfVehicle) {
                                        if (!other.getId().equals(pass.getId()) && Boolean.TRUE.equals(other.getIsActive())) {
                                            other.setIsActive(false);
                                            monthlyPassRepository.save(other);
                                        }
                                    }
                                }
                                pass.setPaymentStatus(PaymentStatus.PAID);
                                pass.setIsActive(true);
                                monthlyPassRepository.save(pass);
                                
                                if (vehicle != null) {
                                    vehicle.setHasMonthlyPass(true);
                                    vehicle.setMonthlyPassExpiry(pass.getEndDate());
                                    vehicleRepository.save(vehicle);
                                }
                                log.info("Updated MonthlyPass {} status to PAID & ACTIVE via VNPay callback", passId);
                            }
                        } else if (targetPrefix.equals("RENEWPASS") || txnRef.startsWith("RENEWPASS_")) {
                            UUID passId = UUID.fromString(parts[1]);
                            int durationInMonths = Integer.parseInt(parts[2]);
                            MonthlyPass pass = monthlyPassRepository.findById(passId).orElse(null);
                            if (pass != null) {
                                LocalDate baseDate = pass.getEndDate() != null && pass.getEndDate().isAfter(LocalDate.now())
                                        ? pass.getEndDate()
                                        : LocalDate.now();
                                LocalDate newEndDate = baseDate.plusMonths(durationInMonths);
                                pass.setEndDate(newEndDate);
                                pass.setIsActive(true);
                                pass.setPaymentStatus(PaymentStatus.PAID);
                                if (amount > 0) {
                                    BigDecimal currentFee = pass.getFee() != null ? pass.getFee() : BigDecimal.ZERO;
                                    pass.setFee(currentFee.add(BigDecimal.valueOf(amount)));
                                }
                                monthlyPassRepository.save(pass);
                                
                                Vehicle vehicle = pass.getVehicle();
                                if (vehicle != null) {
                                    vehicle.setHasMonthlyPass(true);
                                    vehicle.setMonthlyPassExpiry(newEndDate);
                                    vehicleRepository.save(vehicle);
                                }
                                log.info("Successfully renewed MonthlyPass {} for {} months via VNPay callback", passId, durationInMonths);
                            }
                        } else if (targetPrefix.equals("PARKING_SESSION") || txnRef.startsWith("PARKING_SESSION_")) {
                            UUID sessionId = UUID.fromString(targetIdStr);
                            ParkingSession session = parkingSessionRepository.findById(sessionId).orElse(null);
                            if (session != null) {
                                session.setPaymentStatus(PaymentStatus.PAID);
                                parkingSessionRepository.save(session);
                                log.info("Updated ParkingSession {} status to PAID via VNPay callback", sessionId);
                            }
                        } else if (targetPrefix.equals("BOOKING") || txnRef.startsWith("BOOKING_")) {
                            UUID bookingId = UUID.fromString(targetIdStr);
                            Booking booking = bookingRepository.findById(bookingId).orElse(null);
                            if (booking != null) {
                                booking.setStatus(BookingStatus.CONFIRMED);
                                bookingRepository.save(booking);
                                log.info("Updated Booking {} status to CONFIRMED via VNPay callback", bookingId);
                            }
                        } else if (targetPrefix.equals("VEHICLE") || txnRef.startsWith("VEHICLE_")) {
                            UUID vehicleId = UUID.fromString(targetIdStr);
                            Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
                            if (vehicle != null) {
                                vehicle.setIsActive(true);
                                vehicleRepository.save(vehicle);
                                log.info("Updated Vehicle {} status to ACTIVE via VNPay callback", vehicleId);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error updating target entity from VNPay callback txnRef {}: {}", txnRef, e.getMessage(), e);
                }
            }
        } else {
            result.put("status", "FAILED");
            result.put("message", "Giao dịch bị hủy hoặc lỗi từ VNPay (mã: " + responseCode + ")");
        }

        return result;
    }
}
