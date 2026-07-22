package parking_Building_Management_System.dto.vnpay;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnPayPaymentRequest {
    long amount; // Amount in VND (e.g., 500000)
    String orderInfo; // Description of transaction
    String orderType; // e.g., "other", "billpayment"
    String targetId; // ID of MonthlyPass, Booking, or ParkingSession
    String targetType; // "MONTHLY_PASS", "BOOKING", "PARKING_SESSION"
    String returnUrl; // Optional override return url
}
