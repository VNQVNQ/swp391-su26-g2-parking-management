package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.parkingSession.request.PaymentRequest;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.request.VehicleExitRequest;
import parking_Building_Management_System.dto.parkingSession.response.*;
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
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.service.PricingRuleService;
import parking_Building_Management_System.service.MonthlyPassService;
import parking_Building_Management_System.service.BookingService;
import parking_Building_Management_System.utils.mapper.ParkingSessionMapper;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleDetailResponse;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassDetailResponse;
import parking_Building_Management_System.dto.booking.response.BookingDetailResponse;
import parking_Building_Management_System.entity.enums.TicketType;
import java.time.LocalDate;
import java.time.LocalTime;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
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
    private final UserRepository userRepository;
    private final ParkingSessionMapper parkingSessionMapper;
    private final PricingRuleService pricingRuleService;
    private final MonthlyPassService monthlyPassService;
    private final BookingService bookingService;

    @Override
    public EntryValidationResponse validateVehicleForEntry(String licensePlate) {
        log.info("Validating vehicle for entry: {}", licensePlate);

        var vehicleOpt = vehicleRepository.findByLicensePlate(licensePlate);

        if (vehicleOpt.isEmpty()) {
            log.info("Vehicle not registered: {} — will be created as guest vehicle on entry", licensePlate);
            return EntryValidationResponse.builder()
                    .valid(true)
                    .foundVehicle(false)
                    .licensePlate(licensePlate)
                    .message("Vehicle not registered — guest vehicle will be created")
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

        Optional<ParkingSession> activeSession = parkingSessionRepository.findActiveSessionByVehicleId(vehicle.getId());
        if (activeSession.isPresent()) {
            log.warn("Vehicle already has an active session: {}", licensePlate);
            return EntryValidationResponse.builder()
                    .valid(false)
                    .foundVehicle(true)
                    .vehicleId(vehicle.getId())
                    .licensePlate(vehicle.getLicensePlate())
                    .message("Xe đã ở trong bãi (đã có Parking Session hoạt động)")
                    .errorCode("VEHICLE_ALREADY_IN_PARKING")
                    .build();
        }

        // Phase 4: Check if vehicle has active monthly pass
        boolean hasActiveMonthlyPass = monthlyPassService.validateMonthlyPassValidityByLicensePlate(licensePlate);
        
        log.info("Vehicle validation successful: {}, hasActiveMonthlyPass: {}", licensePlate, hasActiveMonthlyPass);
        return EntryValidationResponse.builder()
                .valid(true)
                .foundVehicle(true)
                .vehicleId(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .message("Vehicle is valid for entry")
                .build();
    }

    @Override
    public List<AvailableSlotsForEntryResponse> findAvailableSlots(UUID zoneId, String licensePlate, String bookingCode) {
        log.info("Finding available slots in zone: {}, bookingCode: {}", zoneId, bookingCode);

        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found: " + zoneId));

        var vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + licensePlate));

        if (!vehicle.getVehicleType().equals(zone.getVehicleType())) {
            log.warn("Vehicle type {} does not match zone vehicle type {}",
                    vehicle.getVehicleType(), zone.getVehicleType());
            return List.of();
        }

        // Phase 4: If booking code provided, validate and prioritize booking slot
        ParkingSlot bookedSlot = null;
        if (bookingCode != null && !bookingCode.isEmpty()) {
            try {
                BookingDetailResponse booking = bookingService.getBookingByCode(bookingCode);
                if (booking != null && Boolean.FALSE.equals(booking.getIsExpired())) {
                    bookedSlot = parkingSlotRepository.findById(booking.getSlotId())
                            .orElse(null);
                    log.info("Booking code {} matched, prioritizing slot: {}", bookingCode, 
                            bookedSlot != null ? bookedSlot.getSlotCode() : "N/A");
                } else {
                    log.warn("Booking code {} is expired or invalid", bookingCode);
                }
            } catch (Exception e) {
                log.warn("Booking lookup failed for code {}: {}", bookingCode, e.getMessage());
            }
        }

        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByZone(zoneId);

        long availableCount = availableSlots.size();
        long occupiedCount = zone.getTotalSlots() - availableCount;

        log.info("Found {} available slots in zone {}", availableCount, zoneId);

        // Phase 4: If we have a booked slot, put it first
        List<AvailableSlotsForEntryResponse> result;
        final ParkingSlot finalBookedSlot = bookedSlot;
        if (finalBookedSlot != null && availableSlots.contains(finalBookedSlot)) {
            result = new java.util.ArrayList<>();
            result.add(parkingSessionMapper.toAvailableSlotResponse(
                    finalBookedSlot,
                    availableCount,
                    occupiedCount,
                    (long) zone.getTotalSlots()));
            
            availableSlots.stream()
                    .filter(slot -> !slot.getId().equals(finalBookedSlot.getId()))
                    .forEach(slot -> result.add(parkingSessionMapper.toAvailableSlotResponse(
                            slot,
                            availableCount,
                            occupiedCount,
                            (long) zone.getTotalSlots())));
        } else {
            result = availableSlots.stream()
                    .map(slot -> parkingSessionMapper.toAvailableSlotResponse(
                            slot,
                            availableCount,
                            occupiedCount,
                            (long) zone.getTotalSlots()))
                    .collect(Collectors.toList());
        }

        return result;
    }

    @Override
    @Transactional
    public VehicleEntryResponse createParkingSession(VehicleEntryRequest request, Long staffId, String bookingCode) {
        log.info("Creating parking session for vehicle: {}, bookingCode: {}", request.getLicensePlate(), bookingCode);

        var validation = validateVehicleForEntry(request.getLicensePlate());
        if (!validation.isValid()) {
            throw new RuntimeException("Vehicle validation failed: " + validation.getMessage());
        }

        Vehicle vehicle;
        if (!validation.isFoundVehicle()) {
            log.info("Creating guest vehicle for license plate: {}", request.getLicensePlate());
            if (request.getVehicleType() == null || request.getVehicleType().isEmpty()) {
                throw new RuntimeException("vehicleType is required for guest vehicle entry");
            }
            vehicle = new Vehicle();
            vehicle.setLicensePlate(request.getLicensePlate());
            vehicle.setVehicleType(VehicleType.valueOf(request.getVehicleType().toUpperCase()));
            vehicle.setHasMonthlyPass(false);
            vehicle.setIsActive(true);
            vehicle = vehicleRepository.save(vehicle);
        } else {
            vehicle = vehicleRepository.findById(validation.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        }

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

        // Phase 4: Handle booking if provided
        Booking linkedBooking = null;
        if (bookingCode != null && !bookingCode.isEmpty()) {
            try {
                BookingDetailResponse bookingDetail = bookingService.getBookingByCode(bookingCode);
                linkedBooking = new Booking();
                linkedBooking.setId(bookingDetail.getId());
                
                // Confirm the booking with Long staffId (fixed type)
                bookingService.confirmBooking(bookingDetail.getId(), staffId);
                
                // Use booking slot if available
                ParkingSlot bookedSlot = parkingSlotRepository.findById(bookingDetail.getSlotId()).orElse(null);
                if (bookedSlot != null && availableSlots.contains(bookedSlot)) {
                    availableSlots = List.of(bookedSlot);
                    log.info("Using booked slot: {}", bookedSlot.getSlotCode());
                }
            } catch (Exception e) {
                log.error("Booking confirmation failed: {}", e.getMessage());
                // Continue without booking - it's not mandatory
            }
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
        session.setTicketType(TicketType.HOURLY);

        // Phase 4: Link to booking if found
        if (linkedBooking != null) {
            session.setBooking(linkedBooking);
        }

        // Phase 4: Check for active monthly pass
        Optional<MonthlyPassDetailResponse> monthlyPassOpt = monthlyPassService.findActiveMonthlyPassByLicensePlate(request.getLicensePlate());
        if (monthlyPassOpt.isPresent()) {
            MonthlyPassDetailResponse passDetail = monthlyPassOpt.get();
            MonthlyPass monthlyPass = new MonthlyPass();
            monthlyPass.setId(passDetail.getId());
            session.setMonthlyPass(monthlyPass);
            session.setAppliedMonthlyPassFee(BigDecimal.ZERO);
            session.setTicketType(TicketType.MONTHLY);
            log.info("Linked monthly pass to session: {}", passDetail.getId());
        }

        // Phase 4: Look up pricing rule
        try {
            List<PricingRuleDetailResponse> rules = pricingRuleService.findApplicablePricingRule(
                    vehicle.getVehicleType(), 
                    session.getTicketType(), 
                    zone.getId(), 
                    LocalDate.now()
            );
            if (!rules.isEmpty()) {
                PricingRuleDetailResponse rule = rules.get(0);
                PricingRule pricingRule = new PricingRule();
                pricingRule.setId(rule.getId());
                session.setAppliedRule(pricingRule);
                log.info("Applied pricing rule: {} for session", rule.getName());
            }
        } catch (Exception e) {
            log.warn("Pricing rule lookup failed: {}", e.getMessage());
        }

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
    @Transactional(readOnly = true)
    public List<ActiveSessionResponse> getAllActiveSessions() {
        log.info("Getting all active sessions");
        List<ParkingSession> sessions = parkingSessionRepository.findActiveSessions();
        return sessions.stream().map(session -> {
            String licensePlate = session.getVehicle() != null ? session.getVehicle().getLicensePlate() : null;
            parking_Building_Management_System.entity.enums.VehicleType type = session.getVehicle() != null ? session.getVehicle().getVehicleType() : null;
            UUID slotId = session.getSlot() != null ? session.getSlot().getId() : null;
            String slotCode = session.getSlot() != null ? session.getSlot().getSlotCode() : null;
            String zoneName = (session.getSlot() != null && session.getSlot().getZone() != null) ? session.getSlot().getZone().getName() : null;
            String floorName = (session.getSlot() != null && session.getSlot().getFloor() != null) ? session.getSlot().getFloor().getName() : null;
            
            return ActiveSessionResponse.builder()
                    .id(session.getId())
                    .licensePlate(licensePlate)
                    .vehicleType(type)
                    .slotCode(slotCode)
                    .slotId(slotId)
                    .zoneName(zoneName)
                    .floorName(floorName)
                    .entryTime(session.getEntryTime())
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse> getAllCompletedSessions() {
        log.info("Getting all completed sessions");
        List<ParkingSession> sessions = parkingSessionRepository.findByStatus(ParkingSessionStatus.COMPLETED);
        return sessions.stream().map(session -> parking_Building_Management_System.dto.parkingSession.response.CompletedSessionResponse.builder()
                .id(session.getId())
                .licensePlate(session.getVehicle() != null ? session.getVehicle().getLicensePlate() : null)
                .vehicleType(session.getVehicle() != null ? session.getVehicle().getVehicleType() : null)
                .entryTime(session.getEntryTime())
                .exitTime(session.getExitTime())
                .totalFee(session.getFinalFee())
                .build()
        ).collect(java.util.stream.Collectors.toList());
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
        long durationMinutes = ChronoUnit.MINUTES.between(session.getEntryTime(), exitTime);
        long durationHours = calculateDurationInHours(session.getEntryTime(), exitTime);

        // Phase 4: If monthly pass is active, return 0 or apply overstay logic
        try {
            Optional<MonthlyPassDetailResponse> passOpt = monthlyPassService.findActiveMonthlyPassByVehicle(session.getVehicle().getId());
            if (passOpt.isPresent()) {
                if (durationHours <= 24) {
                    // Monthly pass holder with normal stay
                    session.setFee(BigDecimal.ZERO);
                    session.setFinalFee(BigDecimal.ZERO);
                    session.setAppliedMonthlyPassFee(BigDecimal.ZERO);
                    parkingSessionRepository.save(session);
                    
                    log.info("Monthly pass holder: No fee charged for {} minutes", durationMinutes);
                    return FeeCalculationResponse.builder()
                            .sessionId(sessionId)
                            .durationMinutes(durationMinutes)
                            .totalFee(BigDecimal.ZERO)
                            .message("No charge - Monthly pass active")
                            .build();
                } else if (durationHours > 24) {
                    // Overstay for monthly pass holder
                    long overstayHours = durationHours - 24;
                    PricingRuleDetailResponse rule = getApplicablePricingRule(session);
                    BigDecimal overstayMultiplier = rule != null ? rule.getOverstayRateMultiplier() : BigDecimal.valueOf(2.0);
                    BigDecimal ratePerHour = rule != null ? rule.getRatePerHour() : BigDecimal.valueOf(50000);
                    
                    BigDecimal overstayFee = ratePerHour
                            .multiply(BigDecimal.valueOf(overstayHours))
                            .multiply(overstayMultiplier);
                    
                    session.setFee(overstayFee);
                    session.setFinalFee(overstayFee);
                    parkingSessionRepository.save(session);
                    
                    log.info("Monthly pass holder overstay: {} hours, fee: {}", overstayHours, overstayFee);
                    return FeeCalculationResponse.builder()
                            .sessionId(sessionId)
                            .durationMinutes(durationMinutes)
                            .totalFee(overstayFee)
                            .message("Overstay fee applied for monthly pass holder")
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Monthly pass check failed: {}", e.getMessage());
        }

        // Phase 4: Get pricing rule (from session or look up)
        PricingRuleDetailResponse rule = getApplicablePricingRule(session);
        
        if (rule == null) {
            // Fallback: use default pricing
            log.warn("No pricing rule found, using default rate");
            BigDecimal defaultRate = BigDecimal.valueOf(50000);
            BigDecimal baseFee = defaultRate.multiply(BigDecimal.valueOf(Math.max(1, durationHours)));
            
            session.setFee(baseFee);
            session.setFinalFee(baseFee.subtract(session.getDiscountAmount()));
            parkingSessionRepository.save(session);
            
            return FeeCalculationResponse.builder()
                    .sessionId(sessionId)
                    .durationMinutes(durationMinutes)
                    .totalFee(session.getFinalFee())
                    .message("Fee calculated with default rate")
                    .build();
        }

        // Calculate base fee
        BigDecimal baseHours = BigDecimal.valueOf(Math.max(1, durationHours));
        BigDecimal baseFee = baseHours.multiply(rule.getRatePerHour());
        
        // Apply minimum fee
        if (baseFee.compareTo(rule.getMinimumFee()) < 0) {
            baseFee = rule.getMinimumFee();
            log.info("Minimum fee applied: {}", baseFee);
        }

        // Apply peak hour multiplier
        if (isPeakHour(session.getEntryTime(), exitTime, rule.getPeakHourStart(), rule.getPeakHourEnd())) {
            baseFee = baseFee.multiply(rule.getPeakHourMultiplier());
            log.info("Peak hour multiplier applied: {}", baseFee);
        }

        // Apply daily maximum fee
        if (rule.getMaximumDailyFee() != null && baseFee.compareTo(rule.getMaximumDailyFee()) > 0) {
            baseFee = rule.getMaximumDailyFee();
            log.info("Daily maximum fee applied: {}", baseFee);
        }

        // Apply overstay multiplier if > 24h
        if (durationHours > 24) {
            long overstayHours = durationHours - 24;
            BigDecimal overstayFee = rule.getRatePerHour()
                    .multiply(BigDecimal.valueOf(overstayHours))
                    .multiply(rule.getOverstayRateMultiplier());
            baseFee = baseFee.add(overstayFee);
            log.info("Overstay multiplier applied: {} hours, fee: {}", overstayHours, overstayFee);
        }

        BigDecimal finalFee = baseFee.subtract(session.getDiscountAmount());
        if (finalFee.compareTo(BigDecimal.ZERO) < 0) {
            finalFee = BigDecimal.ZERO;
        }

        session.setFee(baseFee);
        session.setFinalFee(finalFee);
        parkingSessionRepository.save(session);

        log.info("Fee calculation complete: base={}, final={} for {} minutes ({} hours)", 
                baseFee, finalFee, durationMinutes, durationHours);

        return FeeCalculationResponse.builder()
                .sessionId(sessionId)
                .durationMinutes(durationMinutes)
                .totalFee(finalFee)
                .message("Fee calculated successfully for " + durationHours + " hour(s).")
                .build();
    }

    private parking_Building_Management_System.entity.user.User createStaffUser(Long staffId) {
        return userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found with ID: " + staffId));
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

    /**
     * Phase 4: Get applicable pricing rule from session or look up
     */
    private PricingRuleDetailResponse getApplicablePricingRule(ParkingSession session) {
        if (session.getAppliedRule() != null) {
            // Rule already linked, but we need to fetch details
            // In production, could cache this
            try {
                UUID ruleId = session.getAppliedRule().getId();
                // Note: Would need to enhance service to return detail response by ID
                // For now, we'll do fresh lookup
            } catch (Exception e) {
                log.warn("Failed to load pricing rule details");
            }
        }

        try {
            List<PricingRuleDetailResponse> rules = pricingRuleService.findApplicablePricingRule(
                    session.getVehicle().getVehicleType(),
                    session.getTicketType(),
                    session.getSlot().getZone().getId(),
                    LocalDate.now()
            );
            return rules.isEmpty() ? null : rules.get(0);
        } catch (Exception e) {
            log.warn("Pricing rule lookup failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Phase 4: Check if time range overlaps with peak hours
     */
    private boolean isPeakHour(LocalDateTime entryTime, LocalDateTime exitTime, LocalTime peakStart, LocalTime peakEnd) {
        if (peakStart == null || peakEnd == null) {
            return false;
        }

        LocalTime entry = entryTime.toLocalTime();
        LocalTime exit = exitTime.toLocalTime();

        // Check if any portion of [entry, exit] overlaps with [peakStart, peakEnd]
        // Overlap exists if NOT (exit <= peakStart OR entry >= peakEnd)
        return !(exit.isBefore(peakStart) || exit.equals(peakStart) || 
                 entry.isAfter(peakEnd) || entry.equals(peakEnd));
    }

    /**
     * Phase 4: Calculate duration in hours with ceiling
     */
    private long calculateDurationInHours(LocalDateTime entryTime, LocalDateTime exitTime) {
        long durationSeconds = ChronoUnit.SECONDS.between(entryTime, exitTime);
        // Ceiling division: ceil(seconds / 3600)
        return (durationSeconds + 3599) / 3600;
    }
}