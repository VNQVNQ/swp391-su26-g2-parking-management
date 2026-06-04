package parking_Building_Management_System.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    Integer statusCode;
    String message;
    String error;
    LocalDateTime timestamp;
    String path;
    Map<String, String> details;

    public ErrorResponse(Integer statusCode, String message, String error, LocalDateTime timestamp, String path) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.timestamp = timestamp;
        this.path = path;
        this.details = new HashMap<>();
    }

    public void addDetail(String key, String value) {
        if (this.details == null) {
            this.details = new HashMap<>();
        }
        this.details.put(key, value);
    }
}

