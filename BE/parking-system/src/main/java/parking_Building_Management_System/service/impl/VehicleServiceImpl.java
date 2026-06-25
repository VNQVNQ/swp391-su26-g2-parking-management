package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.dto.vehicle.request.VehicleRequest;
import parking_Building_Management_System.dto.vehicle.response.MonthlyPassCheckResponse;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.service.VehicleService;
import parking_Building_Management_System.utils.VietnameseLicensePlateValidator;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    public VehicleResponse createVehicle(VehicleRequest request) {
        log.info("Creating vehicle with license plate: {}", request.getLicensePlate());

        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Vehicle with license plate already exists: " + request.getLicensePlate());
        }

        if (!VietnameseLicensePlateValidator.isValid(request.getLicensePlate())) {
            throw new RuntimeException("Invalid Vietnamese license plate format: " + request.getLicensePlate());
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setHasMonthlyPass(request.getHasMonthlyPass() != null ? request.getHasMonthlyPass() : false);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));
            vehicle.setUser(user);
        }

        vehicle = vehicleRepository.save(vehicle);
        log.info("Vehicle created successfully with ID: {}", vehicle.getId());

        return mapToResponse(vehicle);
    }

    @Override
    public VehicleResponse getVehicleById(UUID id) {
        log.info("Getting vehicle by ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + id));
        return mapToResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> getAllVehicles() {
        log.info("Getting all vehicles");
        return vehicleRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> getMyVehicles() {
        log.info("Getting vehicles for current user");
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof parking_Building_Management_System.entity.user.ParkingUserDetails userDetails) {
            Long userId = userDetails.getUserId();
            return vehicleRepository.findByUserId(userId)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    @Override
    public VehicleResponse updateVehicle(UUID id, VehicleRequest request) {
        log.info("Updating vehicle with ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + id));

        // Check if new license plate is unique (if different from current)
        if (!vehicle.getLicensePlate().equals(request.getLicensePlate()) &&
            vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Vehicle with license plate already exists: " + request.getLicensePlate());
        }

        if (!VietnameseLicensePlateValidator.isValid(request.getLicensePlate())) {
            throw new RuntimeException("Invalid Vietnamese license plate format: " + request.getLicensePlate());
        }

        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(request.getVehicleType());
        if (request.getHasMonthlyPass() != null) {
            vehicle.setHasMonthlyPass(request.getHasMonthlyPass());
        }

        vehicle = vehicleRepository.save(vehicle);
        log.info("Vehicle updated successfully with ID: {}", id);

        return mapToResponse(vehicle);
    }

    @Override
    public void deleteVehicle(UUID id) {
        log.info("Deleting vehicle with ID: {}", id);
        if (!vehicleRepository.existsById(id)) {
            throw new RuntimeException("Vehicle not found with ID: " + id);
        }
        vehicleRepository.deleteById(id);
        log.info("Vehicle deleted successfully with ID: {}", id);
    }

    @Override
    public VehicleResponse getVehicleByLicensePlate(String licensePlate) {
        log.info("Getting vehicle by license plate: {}", licensePlate);
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));
        return mapToResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> searchByLicensePlate(String licensePlate) {
        log.info("Searching vehicles by license plate containing: {}", licensePlate);
        return vehicleRepository.findByLicensePlateContainingIgnoreCase(licensePlate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> fuzzySearchByLicensePlate(String licensePlate, double threshold) {
        log.info("Fuzzy searching vehicles by license plate: {} with threshold: {}", licensePlate, threshold);

        // Get all vehicles with similar plates
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        
        return allVehicles.stream()
                .filter(v -> VietnameseLicensePlateValidator.isSimilar(
                        v.getLicensePlate(), licensePlate, threshold))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> getVehiclesByType(VehicleType vehicleType) {
        log.info("Getting vehicles by type: {}", vehicleType);
        return vehicleRepository.findByVehicleType(vehicleType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MonthlyPassCheckResponse checkMonthlyPassValidity(String licensePlate) {
        log.info("Checking monthly pass validity for license plate: {}", licensePlate);
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));

        return new MonthlyPassCheckResponse(
                vehicle.getHasMonthlyPass(),
                vehicle.getMonthlyPassExpiry()
        );
    }

    @Override
    public MonthlyPassCheckResponse checkMonthlyPassValidityById(UUID vehicleId) {
        log.info("Checking monthly pass validity for vehicle ID: {}", vehicleId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));

        return new MonthlyPassCheckResponse(
                vehicle.getHasMonthlyPass(),
                vehicle.getMonthlyPassExpiry()
        );
    }

    @Override
    public long countActiveVehiclesWithValidPass() {
        log.info("Counting active vehicles with valid monthly pass");
        return vehicleRepository.countActiveVehiclesWithValidPass(LocalDate.now());
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setUserId(vehicle.getUser() != null ? vehicle.getUser().getUserId() : null);
        response.setLicensePlate(vehicle.getLicensePlate());
        response.setVehicleType(vehicle.getVehicleType());
        response.setHasMonthlyPass(vehicle.getHasMonthlyPass());
        response.setMonthlyPassExpiry(vehicle.getMonthlyPassExpiry());
        response.setIsActive(vehicle.getIsActive());
        response.setCreatedAt(vehicle.getCreatedAt());
        response.setUpdatedAt(vehicle.getUpdatedAt());
        return response;
    }
}
