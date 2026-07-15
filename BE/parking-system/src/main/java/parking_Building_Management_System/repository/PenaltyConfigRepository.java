package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.PenaltyConfig;
import parking_Building_Management_System.entity.enums.ExceptionType;
import parking_Building_Management_System.entity.enums.VehicleType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PenaltyConfigRepository extends JpaRepository<PenaltyConfig, UUID> {

    List<PenaltyConfig> findByIsActiveTrue();

    List<PenaltyConfig> findByVehicleType(VehicleType vehicleType);

    Optional<PenaltyConfig> findByVehicleTypeAndExceptionTypeAndIsActiveTrue(
            VehicleType vehicleType, ExceptionType exceptionType);

    Optional<PenaltyConfig> findByVehicleTypeAndExceptionType(
            VehicleType vehicleType, ExceptionType exceptionType);
}
