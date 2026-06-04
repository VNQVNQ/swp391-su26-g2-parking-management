package parking_Building_Management_System.controller;

import parking_Building_Management_System.dto.role.request.Role.RoleRequest;
import parking_Building_Management_System.dto.role.response.Role.RoleResponse;
import parking_Building_Management_System.entity.Role.Role;
import parking_Building_Management_System.service.Role.RoleService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.RoleUtils.UtilsGetRole;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/role")
//@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;
    private final UtilsGetRole utilGetRole = new UtilsGetRole();

    @PostMapping({"/createRole"})
    public ResponseEntity<String> createRole(@RequestBody RoleRequest roleRequest) {
        if (roleRequest.getPrivileges().isEmpty()){
            roleRequest.setPrivileges(Collections.singletonList("READ_ONLY_ACCESS"));
        }
        System.out.println("Role bắt đc nè: " + roleRequest);
        roleService.createRole(roleRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body("Role created successfully");
    }

    @GetMapping({"/getAllRoles"})
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<Role> role = this.roleService.getAllRoles();
        List<RoleResponse> roleResponses = this.utilGetRole.getListRoleNoId(role);
        ApiResponse<List<RoleResponse>> response;
        if (roleResponses.isEmpty()) {
            response = new ApiResponse<>(HttpStatus.NO_CONTENT.value(), "No Data", roleResponses);
        } else {
            response = new ApiResponse<>(HttpStatus.OK.value(), "Success", roleResponses);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/getRole/{id}"})
    public RoleResponse getRoleById(@PathVariable Long id) {
        return this.utilGetRole.getRoleNoId(this.roleService.getRoleById(id));
    }

    @PutMapping("/updateRole/{Role_Code}")
    public ResponseEntity<String> updateRole(@PathVariable String Role_Code, @RequestBody RoleRequest role){
        System.out.println("role bắt đc nè: " + role);
        roleService.updateRole(Role_Code, role);
        return ResponseEntity.status(HttpStatus.OK).body("Update role successful");
    }

    @DeleteMapping("/deleteRole/{Role_Code}")
    public ResponseEntity<String> deleteRole(@PathVariable String Role_Code) {
        System.out.println("Role code nè: " + Role_Code);
        roleService.deleteRole(Role_Code);
        return ResponseEntity.status(HttpStatus.OK).body("Role deleted successful");
    }
}

