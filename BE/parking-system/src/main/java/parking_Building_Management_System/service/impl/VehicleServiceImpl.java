package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.dto.vehicle.request.VehicleRequest;
import parking_Building_Management_System.dto.vehicle.response.MonthlyPassCheckResponse;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.user.ParkingUserDetails;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.repository.VehicleRepository;
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

        if (!VietnameseLicensePlateValidator.isValid(request.getLicensePlate())) {
            throw new RuntimeException("Invalid Vietnamese license plate format: " + request.getLicensePlate()
                    + ". Expected format: 51G-12345 or 30AB-1234");
        }

        // Lấy user hiện tại (DRIVER)
        User currentUser = null;
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof ParkingUserDetails userDetails) {
                Long userId = userDetails.getUserId();
                currentUser = userRepository.findById(userId).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not determine current user when creating vehicle: {}", e.getMessage());
        }

        // Kiểm tra biển số đã tồn tại chưa
        var existingVehicle = vehicleRepository.findByLicensePlate(request.getLicensePlate());
        if (existingVehicle.isPresent()) {
            Vehicle existing = existingVehicle.get();

            // Nếu xe đã có chủ (user_id != NULL), kiểm tra xem chủ có phải là user hiện tại không
            if (existing.getUser() != null) {
                if (currentUser != null && existing.getUser().getUserId().equals(currentUser.getUserId())) {
                    // Xe đã thuộc về user này rồi
                    throw new RuntimeException("Bạn đã đăng ký biển số này rồi: " + request.getLicensePlate());
                }
                throw new RuntimeException("Biển số " + request.getLicensePlate() + " đã được đăng ký bởi tài khoản khác");
            }

            // Nếu xe chưa có chủ (user_id == NULL, từ sample data), cho phép driver "claim" xe này
            existing.setUser(currentUser);
            existing.setVehicleType(request.getVehicleType());
            existing = vehicleRepository.save(existing);
            log.info("Existing unowned vehicle claimed by userId: {}", currentUser != null ? currentUser.getUserId() : "null");
            return mapToResponse(existing);
        }

        // Tạo xe mới
        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setHasMonthlyPass(request.getHasMonthlyPass() != null ? request.getHasMonthlyPass() : false);
        vehicle.setUser(currentUser);
        if (currentUser != null) {
            log.info("Associating vehicle with userId: {}", currentUser.getUserId());
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

    // ── Lấy xe của user hiện tại (cho DRIVER) ───────────────────────────────
    @Override
    public List<VehicleResponse> getVehiclesByUserId(Long userId) {
        log.info("Getting vehicles for userId: {}", userId);
        return vehicleRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleResponse updateVehicle(UUID id, VehicleRequest request) {
        log.info("Updating vehicle with ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + id));

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
        return vehicleRepository.findAll()
                .stream()
                .filter(v -> VietnameseLicensePlateValidator.isSimilar(v.getLicensePlate(), licensePlate, threshold))
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
        return new MonthlyPassCheckResponse(vehicle.getHasMonthlyPass(), vehicle.getMonthlyPassExpiry());
    }

    @Override
    public MonthlyPassCheckResponse checkMonthlyPassValidityById(UUID vehicleId) {
        log.info("Checking monthly pass validity for vehicle ID: {}", vehicleId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));
        return new MonthlyPassCheckResponse(vehicle.getHasMonthlyPass(), vehicle.getMonthlyPassExpiry());
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