package parking_Building_Management_System.utils;

import java.util.regex.Pattern;

public class VietnameseLicensePlateValidator {
    
    // Vietnamese license plate pattern: XX-XXXXX or XX-XXXX (2 letters + 4-5 digits)
    // Format: AB-12345 or AB-1234
    private static final Pattern VIETNAM_PLATE_PATTERN = Pattern.compile(
            "^[A-Z]{2}-\\d{4,5}$|^[A-Z]{2}\\.\\d{4,5}$"
    );

    // Province codes for Vietnam (first 2 characters)
    private static final String[] PROVINCE_CODES = {
            "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
            "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
            "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
            "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
            "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
            "80", "81", "82", "83", "84", "85", "86", "87",
            "AA", "AB", "AC", "AD", "AE", "AF", "AG",
            "BA", "BB", "BC", "BD", "BE", "BF", "BG",
            "CA", "CB", "CC", "CD", "CE", "CF", "CG",
            "DA", "DB", "DC", "DD", "DE", "DF", "DG"
    };

    /**
     * Validates if a license plate follows the correct Vietnamese format
     * @param licensePlate the license plate to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidFormat(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            return false;
        }

        String plate = licensePlate.trim().toUpperCase();
        return VIETNAM_PLATE_PATTERN.matcher(plate).matches();
    }

    /**
     * Validates if a license plate has a valid Vietnamese province code
     * @param licensePlate the license plate to validate
     * @return true if valid province code, false otherwise
     */
    public static boolean isValidProvinceCode(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            return false;
        }

        String plate = licensePlate.trim().toUpperCase();
        String[] parts = plate.replace(".", "-").split("-");
        
        if (parts.length < 1) {
            return false;
        }

        String code = parts[0];
        for (String provinceCode : PROVINCE_CODES) {
            if (code.equals(provinceCode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Complete validation: checks both format and province code
     * @param licensePlate the license plate to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValid(String licensePlate) {
        return isValidFormat(licensePlate) && isValidProvinceCode(licensePlate);
    }

    /**
     * Calculates Levenshtein distance for fuzzy matching
     * @param str1 first string
     * @param str2 second string
     * @return Levenshtein distance
     */
    public static int levenshteinDistance(String str1, String str2) {
        if (str1 == null || str2 == null) {
            return Integer.MAX_VALUE;
        }

        int len1 = str1.length();
        int len2 = str2.length();

        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                            Math.min(dp[i - 1][j], dp[i][j - 1]),
                            dp[i - 1][j - 1]
                    );
                }
            }
        }

        return dp[len1][len2];
    }

    /**
     * Normalizes license plate format for comparison
     * @param licensePlate the license plate to normalize
     * @return normalized license plate
     */
    public static String normalize(String licensePlate) {
        if (licensePlate == null) {
            return "";
        }
        return licensePlate.trim().toUpperCase().replace(".", "-");
    }

    /**
     * Checks similarity between two license plates
     * @param plate1 first license plate
     * @param plate2 second license plate
     * @param threshold maximum allowed distance (0-1, where 0 is identical)
     * @return true if plates are similar within threshold
     */
    public static boolean isSimilar(String plate1, String plate2, double threshold) {
        String normalized1 = normalize(plate1);
        String normalized2 = normalize(plate2);

        int distance = levenshteinDistance(normalized1, normalized2);
        int maxLen = Math.max(normalized1.length(), normalized2.length());
        
        if (maxLen == 0) return true;
        
        double similarity = 1.0 - ((double) distance / maxLen);
        return similarity >= threshold;
    }

    /**
     * Gets the province name from license plate code
     * @param licensePlate the license plate
     * @return province code or empty string if invalid
     */
    public static String getProvinceCode(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            return "";
        }

        String plate = licensePlate.trim().toUpperCase();
        String[] parts = plate.replace(".", "-").split("-");
        
        return parts.length > 0 ? parts[0] : "";
    }
}
