package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {
    Optional<ParkingSlot> findBySlotCode(String slotCode);

    List<ParkingSlot> findByFloorId(UUID floorId);

    List<ParkingSlot> findByZoneId(UUID zoneId);

    boolean existsByFloorIdAndCurrentSessionIsNotNull(UUID floorId);

    boolean existsByZoneIdAndCurrentSessionIsNotNull(UUID zoneId);

    List<ParkingSlot> findByMaintenanceStatus(SlotMaintenanceStatus maintenanceStatus);

    List<ParkingSlot> findByFloorIdAndMaintenanceStatus(UUID floorId, SlotMaintenanceStatus maintenanceStatus);

    List<ParkingSlot> findByZoneIdAndMaintenanceStatus(UUID zoneId, SlotMaintenanceStatus maintenanceStatus);

    List<ParkingSlot> findByVehicleTypeAndMaintenanceStatus(VehicleType vehicleType, SlotMaintenanceStatus maintenanceStatus);

    @Query("SELECT ps FROM ParkingSlot ps WHERE ps.floor.id = :floorId AND ps.vehicleType = :vehicleType AND ps.currentSession IS NULL AND ps.maintenanceStatus = 'AVAILABLE' AND ps NOT IN (SELECT b.slot FROM Booking b WHERE b.status IN ('CONFIRMED', 'PENDING') AND b.endTime >= CURRENT_TIMESTAMP)")
    List<ParkingSlot> findAvailableSlotsByFloorAndVehicleType(@Param("floorId") UUID floorId, @Param("vehicleType") VehicleType vehicleType);

    @Query("SELECT ps FROM ParkingSlot ps WHERE ps.zone.id = :zoneId AND ps.currentSession IS NULL AND ps.maintenanceStatus = 'AVAILABLE' AND ps NOT IN (SELECT b.slot FROM Booking b WHERE b.status IN ('CONFIRMED', 'PENDING') AND b.endTime >= CURRENT_TIMESTAMP)")
    List<ParkingSlot> findAvailableSlotsByZone(@Param("zoneId") UUID zoneId);

    long countByZoneIdAndMaintenanceStatus(UUID zoneId, SlotMaintenanceStatus maintenanceStatus);

    long countByFloorIdAndMaintenanceStatus(UUID floorId, SlotMaintenanceStatus maintenanceStatus);
}



