package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import parking_Building_Management_System.dto.monthlyPass.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.request.RenewMonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassDetailResponse;
import parking_Building_Management_System.dto.vehicle.response.VehicleResponse;
import parking_Building_Management_System.dto.parkingSlot.response.ParkingSlotResponse;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.repository.MonthlyPassRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.service.MonthlyPassService;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MonthlyPassServiceImpl implements MonthlyPassService {

    private final MonthlyPassRepository monthlyPassRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @Override
    @Transactional
    public MonthlyPassResponse createMonthlyPass(MonthlyPassRequest request) {
        log.info("Creating monthly pass for vehicle ID: {}", request.getVehicleId());

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + request.getVehicleId()));

        ParkingSlot slot = null;
        if (request.getSlotId() != null) {
            slot = parkingSlotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new RuntimeException("Parking slot not found with ID: " + request.getSlotId()));
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate endDate = request.getEndDate();

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        if (endDate.equals(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        MonthlyPass pass = new MonthlyPass();
        pass.setVehicle(vehicle);
        pass.setSlot(slot);
        pass.setStartDate(startDate);
        pass.setEndDate(endDate);
        pass.setFee(request.getFee());
        pass.setPaymentStatus(PaymentStatus.UNPAID);
        pass.setIsActive(true);

        pass = monthlyPassRepository.save(pass);
        log.info("Monthly pass created successfully with ID: {}", pass.getId());

        return mapToResponse(pass);
    }

    @Override
    public MonthlyPassDetailResponse getMonthlyPassById(UUID id) {
        log.info("Getting monthly pass by ID: {}", id);
        MonthlyPass pass = monthlyPassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly pass not found with ID: " + id));
        return mapToDetailResponse(pass);
    }


    @Override
    public MonthlyPassDetailResponse getActiveMonthlyPassByVehicle(UUID vehicleId) {
        log.info("Getting active monthly pass for vehicle ID: {}", vehicleId);
        Optional<MonthlyPassDetailResponse> pass = findActiveMonthlyPassByVehicle(vehicleId);
        return pass.orElseThrow(() -> new RuntimeException("No active monthly pass found for vehicle ID: " + vehicleId));
    }

    @Override
    public Optional<MonthlyPassDetailResponse> findActiveMonthlyPassByVehicle(UUID vehicleId) {
        log.info("Finding active monthly pass for vehicle ID: {}", vehicleId);
        Optional<MonthlyPass> pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(vehicleId, LocalDate.now());
        return pass.map(this::mapToDetailResponse);
    }

    @Override
    public Optional<MonthlyPassDetailResponse> findActiveMonthlyPassByLicensePlate(String licensePlate) {
        log.info("Finding active monthly pass for license plate: {}", licensePlate);
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));
        return findActiveMonthlyPassByVehicle(vehicle.getId());
    }

    @Override
    public List<MonthlyPassResponse> getMonthlyPassesByVehicle(UUID vehicleId) {
        log.info("Getting all monthly passes for vehicle ID: {}", vehicleId);
        return monthlyPassRepository.findByVehicleId(vehicleId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyPassResponse> getMyMonthlyPasses() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        log.info("Getting monthly passes for current user email: {}", email);

        return monthlyPassRepository.findByVehicle_User_Email(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyPassResponse> getAllMonthlyPasses() {
        log.info("Getting all monthly passes");
        return monthlyPassRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyPassResponse> getExpiringMonthlyPasses(int daysFromNow) {
        log.info("Getting monthly passes expiring within {} days", daysFromNow);
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysFromNow);
        
        return monthlyPassRepository
                .findByEndDateBetweenAndIsActiveTrueAndPaymentStatus(today, futureDate, PaymentStatus.PAID)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyPassResponse> getExpiredMonthlyPasses() {
        log.info("Getting expired monthly passes");
        return monthlyPassRepository.findByEndDateLessThanAndIsActiveTrue(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MonthlyPassDetailResponse renewMonthlyPass(UUID passId, RenewMonthlyPassRequest request) {
        log.info("Renewing monthly pass ID: {}", passId);
        MonthlyPass existingPass = monthlyPassRepository.findById(passId)
                .orElseThrow(() -> new RuntimeException("Monthly pass not found with ID: " + passId));

        LocalDate newEndDate = request.getEndDate();
        if (newEndDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("End date cannot be in the past");
        }

        existingPass.setIsActive(false);
        monthlyPassRepository.save(existingPass);

        MonthlyPass newPass = new MonthlyPass();
        newPass.setVehicle(existingPass.getVehicle());
        newPass.setSlot(existingPass.getSlot());
        newPass.setStartDate(LocalDate.now());
        newPass.setEndDate(newEndDate);
        newPass.setFee(request.getFee() != null ? request.getFee() : existingPass.getFee());
        newPass.setPaymentStatus(PaymentStatus.UNPAID);
        newPass.setIsActive(true);

        newPass = monthlyPassRepository.save(newPass);
        log.info("Monthly pass renewed successfully with new ID: {}", newPass.getId());

        return mapToDetailResponse(newPass);
    }

    @Override
    @Transactional
    public MonthlyPassDetailResponse updateMonthlyPass(UUID id, MonthlyPassRequest request) {
        log.info("Updating monthly pass ID: {}", id);
        MonthlyPass pass = monthlyPassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly pass not found with ID: " + id));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + request.getVehicleId()));

        if (request.getSlotId() != null) {
            ParkingSlot slot = parkingSlotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new RuntimeException("Parking slot not found with ID: " + request.getSlotId()));
            pass.setSlot(slot);
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : pass.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        pass.setVehicle(vehicle);
        pass.setStartDate(startDate);
        pass.setEndDate(endDate);
        pass.setFee(request.getFee());

        pass = monthlyPassRepository.save(pass);
        log.info("Monthly pass updated successfully with ID: {}", pass.getId());

        return mapToDetailResponse(pass);
    }

    @Override
    @Transactional
    public void cancelMonthlyPass(UUID id) {
        log.info("Cancelling monthly pass ID: {}", id);
        MonthlyPass pass = monthlyPassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly pass not found with ID: " + id));

        if (!pass.getIsActive()) {
            throw new IllegalArgumentException("Cannot cancel an inactive monthly pass");
        }

        pass.setIsActive(false);
        pass.setEndDate(LocalDate.now());
        monthlyPassRepository.save(pass);
        log.info("Monthly pass cancelled successfully with ID: {}", id);
    }

    @Override
    public boolean validateMonthlyPassValidity(UUID vehicleId) {
        log.info("Validating monthly pass validity for vehicle ID: {}", vehicleId);
        return findActiveMonthlyPassByVehicle(vehicleId).isPresent();
    }

    @Override
    public boolean validateMonthlyPassValidityByLicensePlate(String licensePlate) {
        log.info("Validating monthly pass validity for license plate: {}", licensePlate);
        return findActiveMonthlyPassByLicensePlate(licensePlate).isPresent();
    }

    @Override
    public long getActiveMonthlyPassCount() {
        log.info("Getting active monthly pass count");
        return monthlyPassRepository.countByIsActiveTrueAndPaymentStatus(PaymentStatus.PAID);
    }

    @Override
    @Transactional
    public void markAsExpired(UUID id) {
        log.info("Marking monthly pass as expired ID: {}", id);
        MonthlyPass pass = monthlyPassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly pass not found with ID: " + id));

        pass.setIsActive(false);
        if (pass.getEndDate().isAfter(LocalDate.now())) {
            pass.setEndDate(LocalDate.now());
        }
        monthlyPassRepository.save(pass);
        log.info("Monthly pass marked as expired with ID: {}", id);
    }

    private MonthlyPassResponse mapToResponse(MonthlyPass pass) {
        MonthlyPassResponse response = new MonthlyPassResponse();
        response.setId(pass.getId());
        response.setVehicleId(pass.getVehicle().getId());
        response.setLicensePlate(pass.getVehicle().getLicensePlate());
        response.setFee(pass.getFee());
        response.setStartDate(pass.getStartDate());
        response.setEndDate(pass.getEndDate());
        response.setPaymentStatus(pass.getPaymentStatus());
        response.setIsActive(pass.getIsActive());
        response.setRemainingDays(calculateRemainingDays(pass.getEndDate()));
        response.setCreatedAt(pass.getCreatedAt());
        response.setUpdatedAt(pass.getUpdatedAt());
        return response;
    }

    private MonthlyPassDetailResponse mapToDetailResponse(MonthlyPass pass) {
        long remainingDays = calculateRemainingDays(pass.getEndDate());
        
        VehicleResponse vehicleResponse = new VehicleResponse();
        vehicleResponse.setId(pass.getVehicle().getId());
        vehicleResponse.setLicensePlate(pass.getVehicle().getLicensePlate());
        vehicleResponse.setVehicleType(pass.getVehicle().getVehicleType());
        vehicleResponse.setHasMonthlyPass(pass.getVehicle().getHasMonthlyPass());
        vehicleResponse.setMonthlyPassExpiry(pass.getVehicle().getMonthlyPassExpiry());
        vehicleResponse.setIsActive(pass.getVehicle().getIsActive());
        vehicleResponse.setCreatedAt(pass.getVehicle().getCreatedAt());
        vehicleResponse.setUpdatedAt(pass.getVehicle().getUpdatedAt());

        ParkingSlotResponse slotResponse = null;
        if (pass.getSlot() != null) {
            slotResponse = new ParkingSlotResponse();
            slotResponse.setId(pass.getSlot().getId());
            slotResponse.setSlotCode(pass.getSlot().getSlotCode());
            slotResponse.setFloorId(pass.getSlot().getFloor().getId());
            slotResponse.setFloorName(pass.getSlot().getFloor().getName());
            slotResponse.setZoneId(pass.getSlot().getZone().getId());
            slotResponse.setZoneName(pass.getSlot().getZone().getName());
            slotResponse.setVehicleType(pass.getSlot().getVehicleType());
            slotResponse.setMaintenanceStatus(pass.getSlot().getMaintenanceStatus());
            slotResponse.setCreatedAt(pass.getSlot().getCreatedAt());
            slotResponse.setUpdatedAt(pass.getSlot().getUpdatedAt());
        }

        boolean isExpiring = remainingDays >= 0 && remainingDays < 7;

        MonthlyPassDetailResponse response = MonthlyPassDetailResponse.builder()
                .id(pass.getId())
                .vehicleId(pass.getVehicle().getId())
                .licensePlate(pass.getVehicle().getLicensePlate())
                .fee(pass.getFee())
                .startDate(pass.getStartDate())
                .endDate(pass.getEndDate())
                .paymentStatus(pass.getPaymentStatus())
                .isActive(pass.getIsActive())
                .remainingDays(remainingDays)
                .isExpiring(isExpiring)
                .isDaysFromNow(remainingDays >= 0)
                .createdAt(pass.getCreatedAt())
                .updatedAt(pass.getUpdatedAt())
                .vehicleDetails(vehicleResponse)
                .slotDetails(slotResponse)
                .build();

        return response;
    }

    private long calculateRemainingDays(LocalDate endDate) {
        return ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }
}
