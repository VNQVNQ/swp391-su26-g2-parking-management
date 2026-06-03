package parking_Building_Management_System.entity.Role;


import com.fasterxml.jackson.annotation.JsonIgnore;
import parking_Building_Management_System.entity.Privileges.Privileges;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(
        name = "roles",
        schema = "public"
)
public class Role {
    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @Column(name = "role_id")
    Long roleId;
    @Column(
            name = "role_name",
            nullable = false,
            unique = true
    )
    String roleName;
    @Column(
            name = "role_code",
            nullable = false,
            unique = true
    )
    String roleCode;
    @Column(
            name = "role_description",
            nullable = false
    )
    String roleDescription;

    @ToString.Exclude
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_privileges",
            schema = "public",
            joinColumns = @JoinColumn(name = "role_id", referencedColumnName = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "privilege_id", referencedColumnName = "id")
    )
    Set<Privileges> privileges = new HashSet<>();


    @Column(name = "is_active")
    boolean isActive;
}
