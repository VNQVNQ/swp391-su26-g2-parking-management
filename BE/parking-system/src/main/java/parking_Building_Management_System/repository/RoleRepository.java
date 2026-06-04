package parking_Building_Management_System.repository;

import parking_Building_Management_System.entity.role.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    @Query(value = "SELECT r FROM Role r LEFT JOIN FETCH r.privileges WHERE r.roleId = :roleId")
    Optional<Role> findRoleById(@Param("roleId") Long id);

    @Query("SELECT DISTINCT r FROM Role r LEFT JOIN FETCH r.privileges")
    List<Role> findAllRole();

    @Query("SELECT r FROM Role r WHERE r.roleCode = :roleCode")
    Role findRoleByRoleCode(@Param("roleCode") String roleCode);
}
