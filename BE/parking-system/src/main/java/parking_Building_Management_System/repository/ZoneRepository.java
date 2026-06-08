package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.UUID;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, UUID> {
    List<Zone> findByFloorId(UUID floorId);
    Zone findByFloorIdAndVehicleType(UUID floorId, VehicleType vehicleType);
    List<Zone> findByVehicleType(VehicleType vehicleType);
}

