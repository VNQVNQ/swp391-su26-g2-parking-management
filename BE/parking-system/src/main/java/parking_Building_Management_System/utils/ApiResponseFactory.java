package parking_Building_Management_System.utils;

import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;

public class ApiResponseFactory {

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(
                HttpStatus.OK.value(),
                message,
                data,
                ErrorCodes.SUCCESS
        );
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(
                HttpStatus.OK.value(),
                "Operation successful",
                data,
                ErrorCodes.SUCCESS
        );
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return new ApiResponse<>(
                HttpStatus.CREATED.value(),
                message,
                data,
                ErrorCodes.CREATED
        );
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "Resource created successfully",
                data,
                ErrorCodes.CREATED
        );
    }

    public static ApiResponse<?> error(HttpStatus status, String message, String errorCode) {
        ApiResponse<?> response = new ApiResponse<>(
                status.value(),
                message,
                null,
                errorCode
        );
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    public static ApiResponse<?> error(int statusCode, String message, String errorCode) {
        ApiResponse<?> response = new ApiResponse<>(
                statusCode,
                message,
                null,
                errorCode
        );
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    public static ApiResponse<?> notFound(String message) {
        return error(HttpStatus.NOT_FOUND, message, ErrorCodes.NOT_FOUND);
    }

    public static ApiResponse<?> badRequest(String message) {
        return error(HttpStatus.BAD_REQUEST, message, ErrorCodes.BAD_REQUEST);
    }

    public static ApiResponse<?> validationError(String message) {
        return error(HttpStatus.BAD_REQUEST, message, ErrorCodes.VALIDATION_ERROR);
    }

    public static ApiResponse<?> internalServerError(String message) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, message, ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    public static ApiResponse<?> duplicateResource(String message) {
        return error(HttpStatus.CONFLICT, message, ErrorCodes.DUPLICATE_LICENSE_PLATE);
    }
}
