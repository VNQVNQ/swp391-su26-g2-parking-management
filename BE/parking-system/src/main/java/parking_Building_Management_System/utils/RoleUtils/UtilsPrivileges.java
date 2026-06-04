package parking_Building_Management_System.utils.RoleUtils;

import parking_Building_Management_System.entity.Privileges.Privileges;
import parking_Building_Management_System.service.Privileges.PrivilegesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UtilsPrivileges {
    private final PrivilegesService privilegesService;

    @Autowired
    public UtilsPrivileges(PrivilegesService privilegesService) {
        this.privilegesService = privilegesService;
    }

    public List<Privileges> getAllPrivileges(){
        return privilegesService.getAllPrivileges();
    }

    public Privileges getPrivilegeById(Long id){
        return privilegesService.getPrivilegeById(id);
    }

    public long findIdPrivilegeByName(String name) {
        return privilegesService.findByPrivilegeName(name)
                .map(Privileges::getId)
                .orElse(-1L); // Trả về -1 nếu không tìm thấy tên quyền này
    }

}
