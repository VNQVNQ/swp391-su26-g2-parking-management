package parking_Building_Management_System.repository;

import parking_Building_Management_System.entity.Privileges.Privileges;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PrivilegesRepository extends JpaRepository<Privileges, Long> {
    Set<Privileges> findByPrivilegeCodeIn(List<String> privilegeCode);

    Optional<Privileges> findByPrivilegeName(String privilegeName);
}