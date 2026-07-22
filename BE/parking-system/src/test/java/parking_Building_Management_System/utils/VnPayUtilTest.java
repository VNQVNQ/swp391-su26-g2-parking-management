package parking_Building_Management_System.utils;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class VnPayUtilTest {

    @Test
    public void testHmacSHA512() {
        String key = "SECRET_KEY";
        String data = "vnp_Amount=10000000&vnp_Command=pay&vnp_CurrCode=VND&vnp_Locale=vn&vnp_OrderInfo=Test&vnp_OrderType=other&vnp_ReturnUrl=http://localhost:5173/return&vnp_TmnCode=2QXUI4J4&vnp_TxnRef=123456&vnp_Version=2.1.0";
        
        String hash = VnPayUtil.hmacSHA512(key, data);
        assertNotNull(hash);
        assertFalse(hash.isEmpty());
        assertEquals(128, hash.length()); // SHA512 hex string length is 128 characters
    }

    @Test
    public void testGetRandomNumber() {
        String random = VnPayUtil.getRandomNumber(6);
        assertNotNull(random);
        assertEquals(6, random.length());
        for (char c : random.toCharArray()) {
            assertTrue(Character.isDigit(c));
        }
    }
}
