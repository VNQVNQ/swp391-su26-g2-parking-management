package parking_Building_Management_System.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FloorResponse {
    UUID id;
    String name;
    Integer level;
    Integer totalSlots;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

