package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.vehicle.request.VehicleRequest;
import parking_Building_Management_System.dto.vehicle.response.MonthlyPassCheckResponse;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.UUID;

public interface VehicleService {
    VehicleResponse createVehicle(VehicleRequest request);

    VehicleResponse getVehicleById(UUID id);

    List<VehicleResponse> getAllVehicles();

    // ── Lấy xe theo userId (cho DRIVER xem xe của mình) ──
    List<VehicleResponse> getVehiclesByUserId(Long userId);

    VehicleResponse updateVehicle(UUID id, VehicleRequest request);

    void deleteVehicle(UUID id);

    VehicleResponse getVehicleByLicensePlate(String licensePlate);

    List<VehicleResponse> searchByLicensePlate(String licensePlate);

    List<VehicleResponse> fuzzySearchByLicensePlate(String licensePlate, double threshold);

    List<VehicleResponse> getVehiclesByType(VehicleType vehicleType);

    MonthlyPassCheckResponse checkMonthlyPassValidity(String licensePlate);

    MonthlyPassCheckResponse checkMonthlyPassValidityById(UUID vehicleId);

    long countActiveVehiclesWithValidPass();
}