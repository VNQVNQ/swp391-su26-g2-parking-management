package parking_Building_Management_System.controller;

import parking_Building_Management_System.dto.role.request.Privilege.PrivilegeRequest;
import parking_Building_Management_System.entity.privileges.Privileges;
import parking_Building_Management_System.service.privileges.PrivilegesService;
import parking_Building_Management_System.utils.ApiResponse;
import parking_Building_Management_System.utils.roleUtils.UtilsPrivileges;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/privileges")
@RequiredArgsConstructor
//@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class PrivilegesController {

    private final UtilsPrivileges utilsPrivileges;
    private final PrivilegesService privilegesService;

    @GetMapping("/getAllPrivileges")
    public ResponseEntity<ApiResponse<List<Privileges>>> getPrivileges() {
        List<Privileges> listPrivileges = utilsPrivileges.getAllPrivileges();
        ApiResponse<List<Privileges>> response;
        if (listPrivileges.isEmpty()) {
            response = new ApiResponse<>(204, "No Content", listPrivileges);
        } else {
            response = new ApiResponse<>(200, "Success", listPrivileges);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getPrivilege/{id}")
    public ApiResponse<Privileges> getPrivilegeById(@PathVariable Long id) {
        Privileges privilege = utilsPrivileges.getPrivilegeById(id);
        if (privilege != null) {
            return new ApiResponse<>(200, "Success", privilege);
        } else {
            return new ApiResponse<>(404, "Privilege not found", null);
        }
    };

    @PostMapping("/createPrivilege")
    public ResponseEntity<String> createPrivilege(@RequestBody PrivilegeRequest body) {
        Privileges newPrivilege = privilegesService.CreatePrivilege(body);
        return ResponseEntity.status(201).body("Privilege created successfully");
    };

    @DeleteMapping("/deletePrivilege/{id}")
    public ResponseEntity<String> deletePrivilege(@PathVariable Long id) {
        privilegesService.DeletePrivilege(id);
        return ResponseEntity.status(200).body("Privilege deleted successfully");
    };

    @PatchMapping("/updatePrivilege/{id}")
    public ResponseEntity<String> updatePrivilege(@PathVariable Long id, @RequestBody PrivilegeRequest body) {
        privilegesService.UpdatePrivilege(id, body);
        return ResponseEntity.status(200).body("Privilege updated successfully");
    };
}
