package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.ParkingSlot.ParkingSlot;
import parking_Building_Management_System.entity.enums.SlotStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {
    Optional<ParkingSlot> findBySlotCode(String slotCode);

    List<ParkingSlot> findByFloorId(UUID floorId);

    List<ParkingSlot> findByZoneId(UUID zoneId);

    List<ParkingSlot> findByStatus(SlotStatus status);

    List<ParkingSlot> findByFloorIdAndStatus(UUID floorId, SlotStatus status);

    List<ParkingSlot> findByZoneIdAndStatus(UUID zoneId, SlotStatus status);

    List<ParkingSlot> findByVehicleTypeAndStatus(VehicleType vehicleType, SlotStatus status);

    @Query("SELECT ps FROM ParkingSlot ps WHERE ps.floor.id = :floorId AND ps.vehicleType = :vehicleType AND ps.status = 'FREE'")
    List<ParkingSlot> findAvailableSlotsByFloorAndVehicleType(@Param("floorId") UUID floorId, @Param("vehicleType") VehicleType vehicleType);

    @Query("SELECT ps FROM ParkingSlot ps WHERE ps.zone.id = :zoneId AND ps.status = 'FREE'")
    List<ParkingSlot> findAvailableSlotsByZone(@Param("zoneId") UUID zoneId);

    long countByZoneIdAndStatus(UUID zoneId, SlotStatus status);

    long countByFloorIdAndStatus(UUID floorId, SlotStatus status);
}

