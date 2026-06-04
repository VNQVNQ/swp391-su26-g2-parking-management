package parking_Building_Management_System.service.privileges;

import parking_Building_Management_System.entity.privileges.Privileges;
import parking_Building_Management_System.repository.PrivilegesRepository;
import parking_Building_Management_System.dto.role.request.Privilege.PrivilegeRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional; // Đã thêm import này

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class PrivilegesService {

    final PrivilegesRepository privilegesRepository;

    public List<Privileges> getAllPrivileges(){
        return this.privilegesRepository.findAll();
    }

    public Privileges getPrivilegeById(Long id){
        return (Privileges)this.privilegesRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Privilege not found"));
    }

    public Privileges CreatePrivilege(PrivilegeRequest privilegeRequest){
        Privileges privilege = new Privileges();
        privilege.setPrivilegeName(privilegeRequest.getPrivilegeName());
        privilege.setPrivilegeCode(privilegeRequest.getPrivilegeCode());
        return (Privileges) this.privilegesRepository.save(privilege);
    }

    public void DeletePrivilege(Long id){
        Privileges existingPrivilege = privilegesRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Privilege not found"));
        existingPrivilege.setIsActive(false);
        privilegesRepository.save(existingPrivilege);
    }

    public void UpdatePrivilege(Long id, PrivilegeRequest privilegeRequest){
        Privileges existingPrivilege = privilegesRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Privilege not found"));
        existingPrivilege.setPrivilegeName(privilegeRequest.getPrivilegeName());
        existingPrivilege.setPrivilegeCode(privilegeRequest.getPrivilegeCode());
        privilegesRepository.save(existingPrivilege);
    }

    // BỔ SUNG: Hàm tìm kiếm theo tên trả về Optional để Utils dùng mapping
    public Optional<Privileges> findByPrivilegeName(String name) {
        return privilegesRepository.findByPrivilegeName(name);
    }
}