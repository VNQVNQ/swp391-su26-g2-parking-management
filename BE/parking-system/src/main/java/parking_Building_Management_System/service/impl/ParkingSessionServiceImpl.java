package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.parkingSession.request.PaymentRequest;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.FeeCalculationResponse;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Override
    public List<AvailableSlotsForEntryResponse> findAvailableSlots(UUID zoneId, String licensePlate) {
        log.info("Finding available slots in zone: {}", zoneId);

        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found: " + zoneId));

        var vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + licensePlate));

        if (!vehicle.getVehicleType().equals(zone.getVehicleType())) {
            log.warn("Vehicle type {} does not match zone vehicle type {}",
                    vehicle.getVehicleType(), zone.getVehicleType());
            return List.of();
        }

        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByZone(zoneId);

        long availableCount = availableSlots.size();
        long occupiedCount = zone.getTotalSlots() - availableCount;

        log.info("Found {} available slots in zone {}", availableCount, zoneId);

        return availableSlots.stream()
                .map(slot -> parkingSessionMapper.toAvailableSlotResponse(
                        slot,
                        availableCount,
                        occupiedCount,
                        (long) zone.getTotalSlots()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VehicleEntryResponse createParkingSession(VehicleEntryRequest request, Long staffId) {
        log.info("Creating parking session for vehicle: {}", request.getLicensePlate());

        var validation = validateVehicleForEntry(request.getLicensePlate());
        if (!validation.isValid()) {
            throw new RuntimeException("Vehicle validation failed: " + validation.getMessage());
        }

        Vehicle vehicle = vehicleRepository.findById(validation.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found: " + request.getZoneId()));

        if (!vehicle.getVehicleType().equals(zone.getVehicleType())) {
            log.error("Vehicle type {} does not match zone type {}",
                    vehicle.getVehicleType(), zone.getVehicleType());
            throw new RuntimeException("Vehicle type does not match zone. Zone is for: " + zone.getVehicleType());
        }

        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByZone(request.getZoneId());

        if (availableSlots.isEmpty()) {
            log.warn("No available slots in zone: {}", request.getZoneId());
            throw new RuntimeException("No available slots in this zone");
        }

        ParkingSlot slot = availableSlots.get(0);
        log.info("Assigned slot: {}", slot.getSlotCode());

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setStaffEntry(createStaffUser(staffId));
        session.setEntryTime(LocalDateTime.now());
        session.setStatus(ParkingSessionStatus.ACTIVE);
        session.setPaymentStatus(PaymentStatus.UNPAID);
        session.setDiscountAmount(BigDecimal.ZERO);

        session = parkingSessionRepository.save(session);
        log.info("Session created: {}", session.getId());

        slot.setCurrentSession(session);
        parkingSlotRepository.save(slot);
        log.info("Slot {} marked as occupied", slot.getSlotCode());

        createAuditLog(staffId, "SESSION_CREATE", "parking_sessions", session.getId().toString());

        return parkingSessionMapper.toVehicleEntryResponse(session, staffId, "Staff-" + staffId);
    }

    @Override
    public ParkingSession getActiveParkingSessionByVehicle(UUID vehicleId) {
        log.info("Getting active session for vehicle: {}", vehicleId);
        return parkingSessionRepository.findActiveSessionByVehicleId(vehicleId)
                .orElseThrow(() -> new RuntimeException("No active session found for vehicle: " + vehicleId));
    }

    @Override
    public ParkingSession getParkingSessionById(UUID sessionId) {
        log.info("Getting session by ID: {}", sessionId);
        return parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
    }

    @Override
    public List<ParkingSession> getAllActiveSessions() {
        log.info("Getting all active sessions");
        return parkingSessionRepository.findActiveSessions();
    }

    @Override
    public List<ParkingSession> findSessionsOverstay24Hours() {
        log.info("Finding sessions overestaying 24+ hours");
        return parkingSessionRepository.findByStatus(ParkingSessionStatus.ACTIVE)
                .stream()
                .filter(session -> session.getOverstayFlaggedAt() == null &&
                        session.getEntryTime().isBefore(LocalDateTime.now().minusHours(24)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ParkingSession updateSessionOnExit(UUID sessionId, Long staffId) {
        log.info("Updating session on exit: {}", sessionId);
        ParkingSession session = getParkingSessionById(sessionId);

        // 1. Cập nhật thông tin và trạng thái của phiên đỗ xe thành COMPLETED
        session.setStaffExit(createStaffUser(staffId));
        session.setExitTime(LocalDateTime.now());
        session.setStatus(ParkingSessionStatus.COMPLETED); // Đổi trạng thái kết thúc phiên

        // 2. Cập nhật và giải phóng Slot gửi xe
        ParkingSlot slot = session.getSlot();
        if (slot != null) {
            // Gỡ liên kết session hiện tại ra khỏi slot
            slot.setCurrentSession(null);

            // LƯU Ý: Nếu trong Entity ParkingSlot của nhóm bạn có trường enum trạng thái
            // (ví dụ: SlotStatus status hoặc tương tự), hãy bỏ comment dòng dưới và set lại:
            // slot.setStatus(SlotStatus.AVAILABLE);

            parkingSlotRepository.save(slot); // Lưu trạng thái mới của Slot vào database
            log.info("Slot {} has been released and is now AVAILABLE", slot.getSlotCode());
        }

        // 3. Lưu phiên đỗ xe
        return parkingSessionRepository.save(session);
    }

    @Override
    public boolean hasOutstandingFee(UUID vehicleId) {
        // Lưu ý: Nếu JpaRepository của bạn viết theo tên cũ, hãy cập nhật lại tên hàm trong repo
        // thành existsByVehicleIdAndFinalFeeIsNotNullAndPaymentStatusNot(vehicleId, PaymentStatus.PAID) nếu cần.
        return parkingSessionRepository.existsByVehicleIdAndTotalFeeIsNotNullAndIsPaidFalse(vehicleId);
    }

    @Override
    @Transactional
    public Long processPayment(PaymentRequest request, Long staffId) {
        log.info("Processing payment for session: {}", request.getSessionId());

        ParkingSession session = getParkingSessionById(request.getSessionId());


        if (session.getFinalFee() == null) {
            FeeCalculationResponse feeResponse = calculateParkingFee(request.getSessionId());
            session.setFinalFee(feeResponse.getTotalFee());
            session.setFee(feeResponse.getTotalFee());
        }


        session.setPaymentStatus(PaymentStatus.PAID);
        session.setExitTime(LocalDateTime.now());
        session.setStaffExit(createStaffUser(staffId));

        parkingSessionRepository.save(session);
        log.info("Payment processed: {} - Amount: {}", request.getSessionId(), session.getFinalFee());

        createAuditLog(staffId, "PAYMENT_PROCESS", "parking_sessions", session.getId().toString());

        // Hàm này trả về kiểu Long cho Controller, lấy giá trị long từ BigDecimal
        return session.getFinalFee() != null ? session.getFinalFee().longValue() : 0L;
    }

    @Override
    @Transactional
    public ParkingSession updatePaymentStatus(UUID sessionId, String paymentStatus) {
        log.info("Updating payment status for session {}: {}", sessionId, paymentStatus);

        ParkingSession session = getParkingSessionById(sessionId);
        session.setPaymentStatus(PaymentStatus.valueOf(paymentStatus));

        return parkingSessionRepository.save(session);
    }

    @Override
    @Transactional
    public FeeCalculationResponse calculateParkingFee(UUID sessionId) {
        log.info("Calculating parking fee for session: {}", sessionId);

        ParkingSession session = getParkingSessionById(sessionId);

        LocalDateTime exitTime = session.getExitTime() != null ? session.getExitTime() : LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(session.getEntryTime(), exitTime);
        long hours = (minutes + 59) / 60; // Làm tròn lên theo giờ

        Long hourlyRate = 50000L;
        Long calculatedAmount = hours * hourlyRate;

        // 1. Lưu tổng tiền vào đúng trường dữ liệu BigDecimal của Entity
        BigDecimal totalFeeBigDecimal = BigDecimal.valueOf(calculatedAmount);
        session.setFee(totalFeeBigDecimal);
        session.setFinalFee(totalFeeBigDecimal.subtract(session.getDiscountAmount()));
        parkingSessionRepository.save(session);

        log.info("Calculated fee: {} for {} minutes ({} hours)", calculatedAmount, minutes, hours);

        // 2. ĐÃ SỬA: Map đúng các thuộc tính có trong file FeeCalculationResponse DTO
        return FeeCalculationResponse.builder()
                .sessionId(sessionId)
                .durationMinutes(minutes) // Thay vì .hours(hours) không tồn tại
                .totalFee(session.getFinalFee()) // Truyền trực tiếp kiểu BigDecimal sang BigDecimal
                .message("Fee calculated successfully for " + hours + " hour(s).")
                .build();
    }

    private parking_Building_Management_System.entity.user.User createStaffUser(Long staffId) {
        var staff = new parking_Building_Management_System.entity.user.User();
        staff.setUserId(staffId);
        return staff;
    }

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