package parking_Building_Management_System.dto.user.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@AllArgsConstructor
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = false)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class userRequestForUpdate {
    String email;
    String password;
    String phoneNumber;
    int age;
    String address;
}
