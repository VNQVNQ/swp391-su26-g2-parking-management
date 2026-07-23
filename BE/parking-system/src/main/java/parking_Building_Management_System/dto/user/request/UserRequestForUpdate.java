package parking_Building_Management_System.dto.user.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@AllArgsConstructor
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRequestForUpdate {
    String email;
    String password;
    String fullName;
    String phoneNumber;
    String identifyNumber;
    String gender;
    Date dateOfBirth;
    Integer age;
    String address;
}
