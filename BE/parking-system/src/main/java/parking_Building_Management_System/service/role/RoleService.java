package parking_Building_Management_System.service.role;

import parking_Building_Management_System.dto.role.request.Role.RoleRequest;
import parking_Building_Management_System.entity.privileges.Privileges;
import parking_Building_Management_System.entity.role.Role;
import parking_Building_Management_System.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

import parking_Building_Management_System.repository.PrivilegesRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleService {
    final RoleRepository roleRepository;
    final PrivilegesRepository privilegesRepository;

    Set<Privileges> getValidatedPrivileges(List<String> privilegeCode) {
        Set<Privileges> privileges = privilegesRepository.findByPrivilegeCodeIn(privilegeCode);
        if (privileges.size() != privilegeCode.size()) {
            throw new NoSuchElementException("One or more privileges not found");
        }
        return privileges;
    }

    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {
        List<Role> roles = roleRepository.findAllRole();

        System.out.println("\n===== DEBUG ROLE FETCH =====");
        for (Role r : roles) {
            System.out.println("Role: " + r.getRoleName() + " (ID = " + r.getRoleId() + ")");
            if (r.getPrivileges() == null) {
                System.out.println("Privileges = NULL");
            } else if (r.getPrivileges().isEmpty()) {
                System.out.println("Privileges = EMPTY");
            } else {
                r.getPrivileges().forEach(p ->
                        System.out.println("   - " + p.getPrivilegeName() + " (" + p.getId() + ")")
                );
            }
        }
        System.out.println("=============================\n");

        return roles;
    }


    public void createRole(RoleRequest role) {
        try {
            System.out.println("Role nè: " + role);
            Role newRole = new Role();
            newRole.setRoleName(role.getRoleName());
            newRole.setRoleCode(role.getRoleCode());
            newRole.setRoleDescription(role.getRoleDescription());
            newRole.setActive(true);
            List<String> privilegeNames = role.getPrivileges();
            Set<Privileges> newPrivilegeObjects = getValidatedPrivileges(privilegeNames);
            newRole.setPrivileges(newPrivilegeObjects);
            System.out.println("New Role nè: " + newRole);
            this.roleRepository.save(newRole);
        } catch (DataIntegrityViolationException e) {
            throw new DataIntegrityViolationException("Role already exists", e);
        }
    }

    @Transactional(readOnly = true)
    public Role getRoleById(Long id) {
        return (Role)this.roleRepository.findRoleById(id).orElseThrow(() -> new NoSuchElementException("Role not found"));
    }

    @Transactional
    public void updateRole(String Role_Code, RoleRequest roleRequest) {
        System.out.println("Update: " + roleRequest);
        Role existingRole = roleRepository.findRoleByRoleCode(Role_Code);
        if (!existingRole.isActive()) {
            throw new RuntimeException("Role is deactivated and cannot be updated.");
        }
        if (roleRequest.getRoleName() != null) {
            existingRole.setRoleName(roleRequest.getRoleName());
        }

        if (roleRequest.getRoleCode() != null) {
            existingRole.setRoleCode(roleRequest.getRoleCode());
        }

        if (roleRequest.getRoleDescription() != null) {
            existingRole.setRoleDescription(roleRequest.getRoleDescription());
        }
        if (roleRequest.getPrivileges() != null) {
            if (roleRequest.getPrivileges().isEmpty()) {
                existingRole.getPrivileges().clear();
            } else {
                List<String> privilegeNames = roleRequest.getPrivileges();
                Set<Privileges> newPrivilegeObjects = getValidatedPrivileges(privilegeNames);

                existingRole.setPrivileges(newPrivilegeObjects);
            }
            roleRepository.save(existingRole);
        }
    }

    @Transactional
    public void deleteRole(String Role_code){
        Role existingRole = roleRepository.findRoleByRoleCode(Role_code);
        existingRole.setActive(false);
        roleRepository.save(existingRole);
    }
}
