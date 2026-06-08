package parking_Building_Management_System.entity.Redis;

import org.springframework.data.annotation.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.RedisHash;

@RedisHash("users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RedisUser  {
    @Id
    Long id;
    String email;
    String accessToken;
}
