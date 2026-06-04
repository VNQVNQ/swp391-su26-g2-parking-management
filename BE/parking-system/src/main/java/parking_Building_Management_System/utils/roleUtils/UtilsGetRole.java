package parking_Building_Management_System.utils.RoleUtils;

import parking_Building_Management_System.dto.role.response.Role.RoleResponse;
import parking_Building_Management_System.entity.privileges.Privileges;
import parking_Building_Management_System.entity.role.Role;

import java.util.List;
import java.util.stream.Collectors;

public class UtilsGetRole {
    public List<RoleResponse> getListRoleNoId(List<Role> roles) {
        return roles.stream()
                .map(role -> new RoleResponse(
                        role.getRoleName(),
                        role.getRoleCode(),
                        role.getRoleDescription(),
                        role.isActive(),
                        role.getPrivileges()
                                .stream()
                                .map(Privileges::getPrivilegeCode)
                                .collect(Collectors.toSet())
                ))
                .collect(Collectors.toList());
    }

    public RoleResponse getRoleNoId(Role role) {
        return new RoleResponse(
                role.getRoleName(),
                role.getRoleCode(),
                role.getRoleDescription(),
                role.isActive(),
                role.getPrivileges()
                        .stream()
                        .map(Privileges::getPrivilegeCode)
                        .collect(Collectors.toSet())
        );
    }

}
