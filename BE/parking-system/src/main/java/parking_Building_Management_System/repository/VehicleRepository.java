package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    Optional<Vehicle> findByLicensePlate(String licensePlate);

    boolean existsByLicensePlate(String licensePlate);

    @Query("SELECT v FROM Vehicle v WHERE UPPER(v.licensePlate) LIKE UPPER(CONCAT('%', :licensePlate, '%'))")
    List<Vehicle> findByLicensePlateContainingIgnoreCase(@Param("licensePlate") String licensePlate);

    List<Vehicle> findByVehicleType(VehicleType vehicleType);

    @Query("SELECT v FROM Vehicle v WHERE v.hasMonthlyPass = true AND v.monthlyPassExpiry > :today AND v.isActive = true")
    List<Vehicle> findActiveVehiclesWithValidPass(@Param("today") LocalDate today);

    @Query("SELECT v FROM Vehicle v WHERE v.hasMonthlyPass = true AND v.monthlyPassExpiry <= :today")
    List<Vehicle> findVehiclesWithExpiredPass(@Param("today") LocalDate today);

    @Query("SELECT v FROM Vehicle v WHERE v.hasMonthlyPass = true AND v.monthlyPassExpiry = :date")
    List<Vehicle> findVehiclesExpiringOnDate(@Param("date") LocalDate date);

    List<Vehicle> findByIsActive(Boolean isActive);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.hasMonthlyPass = true AND v.monthlyPassExpiry > :today AND v.isActive = true")
    long countActiveVehiclesWithValidPass(@Param("today") LocalDate today);

    @Query("SELECT v FROM Vehicle v WHERE v.ownerName LIKE CONCAT('%', :ownerName, '%')")
    List<Vehicle> findByOwnerNameContaining(@Param("ownerName") String ownerName);
}


