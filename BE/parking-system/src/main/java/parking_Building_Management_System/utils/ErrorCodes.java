package parking_Building_Management_System.utils;

public class ErrorCodes {
    // Vehicle Errors
    public static final String VEHICLE_NOT_FOUND = "VEHICLE_NOT_FOUND";
    public static final String VEHICLE_ALREADY_EXISTS = "VEHICLE_ALREADY_EXISTS";
    public static final String INVALID_LICENSE_PLATE = "INVALID_LICENSE_PLATE";
    public static final String INVALID_VEHICLE_TYPE = "INVALID_VEHICLE_TYPE";
    public static final String INVALID_PHONE_FORMAT = "INVALID_PHONE_FORMAT";

    // Monthly Pass Errors
    public static final String MONTHLY_PASS_NOT_FOUND = "MONTHLY_PASS_NOT_FOUND";
    public static final String MONTHLY_PASS_EXPIRED = "MONTHLY_PASS_EXPIRED";
    public static final String MONTHLY_PASS_UNPAID = "MONTHLY_PASS_UNPAID";

    // Validation Errors
    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD";

    // Database Errors
    public static final String DATABASE_ERROR = "DATABASE_ERROR";
    public static final String DUPLICATE_LICENSE_PLATE = "DUPLICATE_LICENSE_PLATE";

    // Generic Errors
    public static final String INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String BAD_REQUEST = "BAD_REQUEST";
    public static final String NOT_FOUND = "NOT_FOUND";

    // Success Codes
    public static final String SUCCESS = "SUCCESS";
    public static final String CREATED = "CREATED";
    public static final String UPDATED = "UPDATED";
    public static final String DELETED = "DELETED";
}
