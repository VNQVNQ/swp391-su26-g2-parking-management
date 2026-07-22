package parking_Building_Management_System.config;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnPayConfig {

    @Value("${vnpay.tmn-code:2QXUI4J4}")
    String vnpTmnCode;

    @Value("${vnpay.hash-secret:SECRET_KEY_VNPAY_SANDBOX}")
    String secretKey;

    @Value("${vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    String vnpPayUrl;

    @Value("${vnpay.return-url:http://localhost:5173/payment/vnpay-return}")
    String vnpReturnUrl;

    @Value("${vnpay.version:2.1.0}")
    String vnpVersion;

    @Value("${vnpay.command:pay}")
    String vnpCommand;
}
