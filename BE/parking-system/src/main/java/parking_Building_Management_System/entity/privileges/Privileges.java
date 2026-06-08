package parking_Building_Management_System.entity.privileges;

import com.fasterxml.jackson.annotation.JsonIgnore;
import parking_Building_Management_System.entity.role.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "privileges", schema = "public")
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Privileges {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "privilege_name", nullable = false, unique = true)
    String privilegeName;

    @Column(name = "privilege_code", nullable = false, unique = true)
    String privilegeCode;

    @Column(name = "is_active")
    Boolean isActive = true;

    @ToString.Exclude
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @ManyToMany(mappedBy = "privileges", fetch = FetchType.LAZY)
    Set<Role> roles = new HashSet<>();
}
