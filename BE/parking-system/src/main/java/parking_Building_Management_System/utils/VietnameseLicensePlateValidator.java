package parking_Building_Management_System.utils;

import java.util.regex.Pattern;

public class VietnameseLicensePlateValidator {

    // Format chuẩn Việt Nam:
    // 51G-12345 (2 số + 1 chữ + 4-5 số)
    // 30AB-1234 (2 số + 2 chữ + 4 số)
    // 79B1-1234 → dạng này không hỗ trợ vì ít phổ biến
    private static final Pattern VIETNAM_PLATE_PATTERN = Pattern.compile(
            "^\\d{2}[A-Z]{1,2}-\\d{4,5}$|^\\d{2}[A-Z]{1,2}\\.\\d{4,5}$"
    );

    // Mã tỉnh/thành phố theo quy định Việt Nam (phần 2 chữ số đầu)
    private static final String[] PROVINCE_CODES = {
            "11", "12", "14", "15", "16", "17", "18", "19", "20", "21",
            "22", "23", "24", "25", "26", "27", "28",
            "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
            "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
            "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
            "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
            "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
            "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
            "90", "92", "93", "94", "95", "97", "98", "99"
    };

    /**
     * Kiểm tra định dạng biển số (chỉ kiểm tra cấu trúc)
     */
    public static boolean isValidFormat(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            return false;
        }
        String plate = licensePlate.trim().toUpperCase();
        return VIETNAM_PLATE_PATTERN.matcher(plate).matches();
    }

    /**
     * Kiểm tra mã tỉnh/thành hợp lệ (2 chữ số đầu)
     */
    public static boolean isValidProvinceCode(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            return false;
        }
        String plate = licensePlate.trim().toUpperCase();
        // Lấy 2 ký tự đầu là mã tỉnh (luôn là 2 chữ số)
        if (plate.length() < 2) return false;
        String code = plate.substring(0, 2);
        for (String provinceCode : PROVINCE_CODES) {
            if (code.equals(provinceCode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Kiểm tra đầy đủ: định dạng + mã tỉnh
     */
    public static boolean isValid(String licensePlate) {
        return isValidFormat(licensePlate) && isValidProvinceCode(licensePlate);
    }

    /**
     * Tính khoảng cách Levenshtein để tìm kiếm mờ
     */
    public static int levenshteinDistance(String str1, String str2) {
        if (str1 == null || str2 == null) return Integer.MAX_VALUE;
        int len1 = str1.length(), len2 = str2.length();
        int[][] dp = new int[len1 + 1][len2 + 1];
        for (int i = 0; i <= len1; i++) dp[i][0] = i;
        for (int j = 0; j <= len2; j++) dp[0][j] = j;
        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(Math.min(dp[i - 1][j], dp[i][j - 1]), dp[i - 1][j - 1]);
                }
            }
        }
        return dp[len1][len2];
    }

    /**
     * Chuẩn hoá biển số để so sánh
     */
    public static String normalize(String licensePlate) {
        if (licensePlate == null) return "";
        return licensePlate.trim().toUpperCase().replace(".", "-");
    }

    /**
     * So sánh tương đồng hai biển số
     */
    public static boolean isSimilar(String plate1, String plate2, double threshold) {
        String n1 = normalize(plate1), n2 = normalize(plate2);
        int distance = levenshteinDistance(n1, n2);
        int maxLen = Math.max(n1.length(), n2.length());
        if (maxLen == 0) return true;
        return (1.0 - (double) distance / maxLen) >= threshold;
    }

    /**
     * Lấy mã tỉnh từ biển số
     */
    public static String getProvinceCode(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) return "";
        String plate = licensePlate.trim().toUpperCase();
        return plate.length() >= 2 ? plate.substring(0, 2) : "";
    }
}