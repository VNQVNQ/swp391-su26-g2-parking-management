package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.entity.AuditLog;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.AuditLogRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.utils.mapper.ParkingSessionMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation for ParkingSessionService
 * Xử lý Vehicle Entry Flow (Phase 3) - BR-23 ~ BR-32
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingSessionServiceImpl implements ParkingSessionService {

    private final ParkingSessionRepository parkingSessionRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final VehicleRepository vehicleRepository;
    private final ZoneRepository zoneRepository;
    private final AuditLogRepository auditLogRepository;
    private final ParkingSessionMapper parkingSessionMapper;

    /**
     * BR-23: Validate xe - kiểm tra license plate
     */
    @Override
    public EntryValidationResponse validateVehicleForEntry(String licensePlate) {
        log.info("Validating vehicle for entry: {}", licensePlate);

        var vehicleOpt = vehicleRepository.findByLicensePlate(licensePlate);

        if (vehicleOpt.isEmpty()) {
            log.warn("Vehicle not found with license plate: {}", licensePlate);
            return EntryValidationResponse.builder()
                    .valid(false)
                    .foundVehicle(false)
                    .message("Vehicle not found in system")
                    .errorCode("VEHICLE_NOT_FOUND")
                    .build();
        }

        Vehicle vehicle = vehicleOpt.get();

        // BR-26: Check if vehicle is active
        if (!vehicle.getIsActive()) {
            log.warn("Vehicle is inactive: {}", licensePlate);
            return EntryValidationResponse.builder()
                    .valid(false)
                    .foundVehicle(true)
                    .vehicleId(vehicle.getId())
                    .licensePlate(vehicle.getLicensePlate())
                    .message("Vehicle is inactive")
                    .errorCode("VEHICLE_INACTIVE")
                    .build();
        }

        log.info("Vehicle validation successful: {}", licensePlate);
        return EntryValidationResponse.builder()
                .valid(true)
                .foundVehicle(true)
                .vehicleId(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .message("Vehicle is valid for entry")
                .build();
    }

    /**
     * BR-26: Tìm slot Free và Available
     * Trả về danh sách slot có sẵn trong zone
     */
    @Override
    public List<AvailableSlotsForEntryResponse> findAvailableSlots(UUID zoneId, String licensePlate) {
        log.info("Finding available slots in zone: {}", zoneId);

        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found: " + zoneId));

        // Get vehicle type from license plate
        var vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + licensePlate));

        // BR-26: BR-15: vehicleType phải match
        if (!vehicle.getVehicleType().equals(zone.getVehicleType())) {
            log.warn("Vehicle type {} does not match zone vehicle type {}",
                    vehicle.getVehicleType(), zone.getVehicleType());
            return List.of();
        }

        // Tìm tất cả available slots trong zone
        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByZone(zoneId);

        // Count stats
        long availableCount = availableSlots.size();
        long occupiedCount = zone.getTotalSlots() - availableCount;

        log.info("Found {} available slots in zone {}", availableCount, zoneId);

        // Map to response
        return availableSlots.stream()
                .map(slot -> parkingSessionMapper.toAvailableSlotResponse(
                        slot, 
                        availableCount, 
                        occupiedCount, 
                        (long) zone.getTotalSlots()))
                .collect(Collectors.toList());
    }

    /**
     * BR-27: Tạo ParkingSession + Update Slot (transactional)
     * BR-28: entry_time do server generate
     * BR-29: Chỉ Staff mới tạo được
     * BR-30: vehicleType xe phải khớp slot
     * BR-31: sessionID phải unique (UUID)
     */
    @Override
    @Transactional
    public VehicleEntryResponse createParkingSession(VehicleEntryRequest request, Long staffId) {
        log.info("Creating parking session for vehicle: {}", request.getLicensePlate());

        // Step 1: Validate vehicle
        var validation = validateVehicleForEntry(request.getLicensePlate());
        if (!validation.isValid()) {
            throw new RuntimeException("Vehicle validation failed: " + validation.getMessage());
        }

        Vehicle vehicle = vehicleRepository.findById(validation.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Step 2: Get zone and verify
        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found: " + request.getZoneId()));

        // BR-15: BR-30: Check vehicle type matches zone
        if (!vehicle.getVehicleType().equals(zone.getVehicleType())) {
            log.error("Vehicle type {} does not match zone type {}",
                    vehicle.getVehicleType(), zone.getVehicleType());
            throw new RuntimeException("Vehicle type does not match zone. Zone is for: " + zone.getVehicleType());
        }

        // Step 3: Find available slot (BR-26)
        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByZone(request.getZoneId());

        if (availableSlots.isEmpty()) {
            log.warn("No available slots in zone: {}", request.getZoneId());
            throw new RuntimeException("No available slots in this zone");
        }

        // Get first available slot
        ParkingSlot slot = availableSlots.get(0);
        log.info("Assigned slot: {}", slot.getSlotCode());

        // Step 4: Create ParkingSession (BR-28: entry_time auto-generated)
        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setStaffEntry(createStaffUser(staffId)); // Will fetch from User table
        session.setEntryTime(LocalDateTime.now()); // BR-28: Server generates
        session.setStatus(ParkingSessionStatus.ACTIVE); // Default status
        session.setPaymentStatus(PaymentStatus.UNPAID); // BR-35: Default
        session.setDiscountAmount(java.math.BigDecimal.ZERO);

        // Save session
        session = parkingSessionRepository.save(session);
        log.info("Session created: {}", session.getId());

        // Step 5: Update slot to Occupied (BR-27: same transaction)
        slot.setCurrentSession(session);
        parkingSlotRepository.save(slot);
        log.info("Slot {} marked as occupied", slot.getSlotCode());

        // Step 6: Audit log (BR-53)
        createAuditLog(staffId, "SESSION_CREATE", "parking_sessions", session.getId().toString());

        // Step 7: Return response
        return parkingSessionMapper.toVehicleEntryResponse(session, staffId, "Staff-" + staffId);
    }

    /**
     * Lấy session active của xe
     */
    @Override
    public ParkingSession getActiveParkingSessionByVehicle(UUID vehicleId) {
        log.info("Getting active session for vehicle: {}", vehicleId);
        return parkingSessionRepository.findActiveSessionByVehicleId(vehicleId)
                .orElseThrow(() -> new RuntimeException("No active session found for vehicle: " + vehicleId));
    }

    /**
     * Lấy session theo ID
     */
    @Override
    public ParkingSession getParkingSessionById(UUID sessionId) {
        log.info("Getting session by ID: {}", sessionId);
        return parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
    }

    /**
     * Lấy tất cả session active
     */
    @Override
    public List<ParkingSession> getAllActiveSessions() {
        log.info("Getting all active sessions");
        return parkingSessionRepository.findActiveSessions();
    }

    /**
     * BR-04: Tìm session quá 24 giờ (overstay)
     */
    @Override
    public List<ParkingSession> findSessionsOverstay24Hours() {
        log.info("Finding sessions overestaying 24+ hours");
        return parkingSessionRepository.findByStatus(ParkingSessionStatus.ACTIVE)
                .stream()
                .filter(session -> session.getOverstayFlaggedAt() == null &&
                        session.getEntryTime().isBefore(LocalDateTime.now().minusHours(24)))
                .collect(Collectors.toList());
    }

    /**
     * Update session when exit (for exit flow)
     */
    @Override
    public ParkingSession updateSessionOnExit(UUID sessionId, Long staffId) {
        log.info("Updating session on exit: {}", sessionId);
        ParkingSession session = getParkingSessionById(sessionId);

        session.setStaffExit(createStaffUser(staffId));
        session.setExitTime(LocalDateTime.now());

        return parkingSessionRepository.save(session);
    }

    // ============ Helper Methods ============

    /**
     * Create Staff User entity (fetches from DB)
     */
    private parking_Building_Management_System.entity.user.User createStaffUser(Long staffId) {
        var staff = new parking_Building_Management_System.entity.user.User();
        staff.setUserId(staffId);
        return staff;
    }

    /**
     * BR-53: Create audit log
     */
    private void createAuditLog(Long userId, String action, String entityName, String entityId) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUser(createStaffUser(userId));
            auditLog.setAction(action);
            auditLog.setEntityName(entityName);
            auditLog.setEntityId(entityId);
            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} - {}", action, entityId);
        } catch (Exception e) {
            log.error("Failed to create audit log: {}", e.getMessage());
        }
    }
}





