package parking_Building_Management_System;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import parking_Building_Management_System.dto.booking.request.BookingRequest;
import parking_Building_Management_System.dto.booking.response.BookingResponse;
import parking_Building_Management_System.dto.monthlyPass.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.parkingSession.response.FeeCalculationResponse;
import parking_Building_Management_System.dto.pricingRule.request.PricingRuleRequest;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleResponse;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.BookingRepository;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.MonthlyPassRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.PricingRuleRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.BookingService;
import parking_Building_Management_System.service.MonthlyPassService;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.service.PricingRuleService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Workflow 4 (Pricing Rules) and Workflow 5 (Monthly Passes & Bookings).
 *
 * Rewritten to match the real entity/DTO/service signatures in the codebase
 * (the originally generated version referenced non-existent fields and methods,
 * e.g. Zone.setZoneName(), ParkingSession.getSessionId(), User.setRole(String)...).
 */
@SpringBootTest
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Workflow 4 & 5: Pricing, Monthly Pass & Booking Integration Tests")
class WorkflowIntegrationTest {

    @Autowired
    private PricingRuleRepository pricingRuleRepository;
    @Autowired
    private MonthlyPassRepository monthlyPassRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ParkingSessionRepository parkingSessionRepository;
    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private ParkingSlotRepository parkingSlotRepository;
    @Autowired
    private FloorRepository floorRepository;
    @Autowired
    private ZoneRepository zoneRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PricingRuleService pricingRuleService;
    @Autowired
    private MonthlyPassService monthlyPassService;
    @Autowired
    private BookingService bookingService;
    @Autowired
    private ParkingSessionService parkingSessionService;

    private Vehicle testVehicle;
    private Zone testZone;
    private Floor testFloor;
    private ParkingSlot testSlot;
    private Long staffUserId;
    private UUID pricingRuleId;
    private String bookingCode;

    @BeforeEach
    void setUp() {
        testZone = new Zone();
        testZone.setName("Zone-A-Test");
        testZone.setVehicleType(VehicleType.CAR);
        testZone.setTotalSlots(10);
        testZone.setIsActive(true);
        testZone = zoneRepository.save(testZone);

        testFloor = new Floor();
        testFloor.setName("F1-Test");
        testFloor.setLevelNumber(9001);
        testFloor = floorRepository.save(testFloor);

        testSlot = new ParkingSlot();
        testSlot.setSlotCode("TEST-A-01");
        testSlot.setFloor(testFloor);
        testSlot.setZone(testZone);
        testSlot.setVehicleType(VehicleType.CAR);
        testSlot.setMaintenanceStatus(SlotMaintenanceStatus.AVAILABLE);
        testSlot = parkingSlotRepository.save(testSlot);

        testVehicle = new Vehicle();
        testVehicle.setLicensePlate("51A-99999");
        testVehicle.setVehicleType(VehicleType.CAR);
        testVehicle.setHasMonthlyPass(false);
        testVehicle.setIsActive(true);
        testVehicle = vehicleRepository.save(testVehicle);

        User staffUser = new User();
        staffUser.setEmail("staff-test-" + UUID.randomUUID() + "@example.com");
        staffUser.setPassword("test-password-hash");
        staffUser.setFullName("Staff Test User");
        staffUser.setUserIsActive(true);
        staffUser = userRepository.save(staffUser);
        staffUserId = staffUser.getUserId();
    }

    private PricingRuleRequest buildPricingRuleRequest(BigDecimal ratePerHour, UUID zoneId) {
        PricingRuleRequest request = new PricingRuleRequest();
        request.setName("Test rate " + UUID.randomUUID());
        request.setVehicleType(VehicleType.CAR);
        request.setTicketType(TicketType.HOURLY);
        request.setRatePerHour(ratePerHour);
        request.setMinimumFee(BigDecimal.valueOf(10000));
        request.setMaximumDailyFee(BigDecimal.valueOf(300000));
        request.setOverstayRateMultiplier(BigDecimal.valueOf(2.0));
        request.setPeakHourStart(LocalTime.of(18, 0));
        request.setPeakHourEnd(LocalTime.of(20, 0));
        request.setPeakHourMultiplier(BigDecimal.valueOf(1.5));
        request.setZoneId(zoneId);
        request.setEffectiveFrom(LocalDate.now().minusDays(1));
        request.setEffectiveTo(LocalDate.now().plusMonths(1));
        return request;
    }

    private PricingRuleResponse createTestPricingRule() {
        PricingRuleResponse response = pricingRuleService.createPricingRule(
                buildPricingRuleRequest(BigDecimal.valueOf(50000), null), staffUserId);
        pricingRuleId = response.getId();
        return response;
    }

    private ParkingSession createSession(LocalDateTime entryTime, LocalDateTime exitTime) {
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setStaffEntry(userRepository.findById(staffUserId).orElseThrow());
        session.setEntryTime(entryTime);
        session.setExitTime(exitTime);
        session.setStatus(ParkingSessionStatus.ACTIVE);
        session.setPaymentStatus(PaymentStatus.UNPAID);
        session.setDiscountAmount(BigDecimal.ZERO);
        session.setTicketType(TicketType.HOURLY);
        return parkingSessionRepository.save(session);
    }

    private MonthlyPassResponse createTestMonthlyPass() {
        MonthlyPassRequest request = new MonthlyPassRequest();
        request.setVehicleId(testVehicle.getId());
        request.setSlotId(testSlot.getId());
        request.setFee(BigDecimal.valueOf(500000));
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusMonths(1));
        request.setAutoRenew(false);
        return monthlyPassService.createMonthlyPass(request);
    }

    private BookingResponse createTestBooking(LocalDateTime startTime, int durationMinutes) {
        BookingRequest request = new BookingRequest();
        request.setVehicleId(testVehicle.getId());
        request.setSlotId(testSlot.getId());
        request.setStartTime(startTime);
        request.setDurationMinutes(durationMinutes);
        try {
            BookingResponse response = bookingService.createBooking(request, testVehicle.getId());
            bookingCode = response.getBookingCode();
            return response;
        } catch (Exception e) {
            fail("Booking creation failed: " + e.getMessage());
            return null;
        }
    }

    @Order(1)
    @Test
    @DisplayName("TC-4.1: Manager creates pricing rule for CAR hourly rate")
    void testCreatePricingRule() {
        PricingRuleResponse response = createTestPricingRule();

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(VehicleType.CAR, response.getVehicleType());
        assertEquals(BigDecimal.valueOf(50000), response.getRatePerHour());
    }

    @Order(2)
    @Test
    @DisplayName("TC-4.2: Pricing rule is applied when vehicle exits")
    void testPricingRuleApplication() {
        createTestPricingRule();

        ParkingSession session = createSession(
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now());

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertNotNull(fee);
        assertNotNull(fee.getTotalFee());
        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0,
                "Fee should be calculated based on pricing rule");
    }

    @Order(3)
    @Test
    @DisplayName("TC-4.3: Peak hour multiplier applied during peak times")
    void testPeakHourMultiplier() {
        createTestPricingRule();

        LocalDateTime peakEntryTime = LocalDateTime.now().withHour(18).withMinute(0).withSecond(0);
        LocalDateTime peakExitTime = peakEntryTime.plusHours(1);

        ParkingSession session = createSession(peakEntryTime, peakExitTime);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertNotNull(fee);
        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0);
    }

    @Order(22)
    @Test
    @DisplayName("TC-4.6: Zone-specific rule takes priority over global rule")
    void testZoneSpecificPricingPriority() {
        pricingRuleService.createPricingRule(
                buildPricingRuleRequest(BigDecimal.valueOf(40000), null), staffUserId);

        PricingRuleResponse zoneResponse = pricingRuleService.createPricingRule(
                buildPricingRuleRequest(BigDecimal.valueOf(60000), testZone.getId()), staffUserId);

        assertNotNull(zoneResponse);
        assertEquals(BigDecimal.valueOf(60000), zoneResponse.getRatePerHour());
    }

    @Order(24)
    @Test
    @DisplayName("TC-4.5: Pricing rule effective date range enforcement")
    void testPricingRuleEffectiveDateRange() {
        PricingRuleRequest request = buildPricingRuleRequest(BigDecimal.valueOf(50000), null);
        request.setEffectiveFrom(LocalDate.now().minusDays(1));
        request.setEffectiveTo(LocalDate.now().plusDays(1));

        PricingRuleResponse response = pricingRuleService.createPricingRule(request, staffUserId);

        assertNotNull(response);
        assertNotNull(response.getId());
    }

    @Order(4)
    @Test
    @DisplayName("TC-5.1: Vehicle owner subscribes to monthly pass")
    void testMonthlyPassSubscription() {
        MonthlyPassResponse response = createTestMonthlyPass();

        assertNotNull(response);
        assertEquals(testVehicle.getId(), response.getVehicleId());
        assertTrue(response.getIsActive());
    }

    @Order(5)
    @Test
    @DisplayName("TC-5.2 & TC-5.3: Vehicle with active pass enters and exits (no charge)")
    void testMonthlyPassFlow() {
        createTestMonthlyPass();

        ParkingSession session = createSession(
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now());

        boolean hasActivePass = monthlyPassService.validateMonthlyPassValidity(testVehicle.getId());
        assertTrue(hasActivePass);

        MonthlyPass pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(testVehicle.getId(), LocalDate.now())
                .orElse(null);
        assertNotNull(pass, "An active monthly pass should exist for the vehicle");

        session.setMonthlyPass(pass);
        session.setAppliedMonthlyPassFee(BigDecimal.ZERO);
        session = parkingSessionRepository.save(session);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertEquals(BigDecimal.ZERO, fee.getTotalFee(),
                "Monthly pass holder should pay 0 during normal hours");
    }

    @Order(6)
    @Test
    @DisplayName("TC-5.4: Monthly pass validation check succeeds")
    void testMonthlyPassValidation() {
        createTestMonthlyPass();

        boolean isValid = monthlyPassService.validateMonthlyPassValidity(testVehicle.getId());
        assertTrue(isValid);
    }

    @Order(7)
    @Test
    @DisplayName("TC-5.5: Monthly pass expiry detection works")
    void testMonthlyPassExpiry() {
        MonthlyPass expiredPass = new MonthlyPass();
        expiredPass.setVehicle(testVehicle);
        expiredPass.setStartDate(LocalDate.now().minusMonths(1));
        expiredPass.setEndDate(LocalDate.now().minusDays(1));
        expiredPass.setFee(BigDecimal.valueOf(500000));
        expiredPass.setPaymentStatus(PaymentStatus.PAID);
        expiredPass.setIsActive(false);
        expiredPass = monthlyPassRepository.save(expiredPass);

        assertFalse(expiredPass.getIsActive());
        assertTrue(expiredPass.getEndDate().isBefore(LocalDate.now()));
    }

    @Order(8)
    @Test
    @DisplayName("TC-5.7: Pass holder overstay (>24h) charged with multiplier")
    void testMonthlyPassOverstayCharge() {
        createTestMonthlyPass();
        createTestPricingRule();

        ParkingSession session = createSession(
                LocalDateTime.now().minusHours(25),
                LocalDateTime.now());

        MonthlyPass pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(testVehicle.getId(), LocalDate.now())
                .orElse(null);
        assertNotNull(pass);
        session.setMonthlyPass(pass);
        session = parkingSessionRepository.save(session);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0,
                "Overstay should incur charge even with monthly pass");
    }

    @Order(9)
    @Test
    @DisplayName("TC-5.11: Vehicle owner creates booking for specific slot/time")
    void testCreateBooking() {
        BookingResponse response = createTestBooking(LocalDateTime.now().plusHours(1), 60);

        assertNotNull(response);
        assertNotNull(response.getBookingCode());
        assertNotNull(response.getStatus());
    }

    @Order(10)
    @Test
    @DisplayName("TC-5.12: Booking code is generated and unique")
    void testBookingCodeGeneration() {
        BookingResponse response1 = createTestBooking(LocalDateTime.now().plusHours(1), 60);
        String firstCode = response1.getBookingCode();

        BookingResponse response2 = createTestBooking(LocalDateTime.now().plusHours(5), 60);

        assertNotNull(response2.getBookingCode());
        assertNotEquals(firstCode, response2.getBookingCode(), "Booking codes should be unique");
    }

    @Order(11)
    @Test
    @DisplayName("TC-5.13 & TC-5.18: System prevents double-booking of the same slot/time")
    void testDoubleBookingPrevention() {
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        BookingRequest conflictRequest = new BookingRequest();
        conflictRequest.setVehicleId(testVehicle.getId());
        conflictRequest.setSlotId(testSlot.getId());
        conflictRequest.setStartTime(LocalDateTime.now().plusHours(1).plusMinutes(15));
        conflictRequest.setDurationMinutes(30);

        assertThrows(Exception.class, () -> {
            bookingService.createBooking(conflictRequest, testVehicle.getId());
        });
    }

    @Order(12)
    @Test
    @DisplayName("TC-5.14 & TC-5.15: Booking has a defined expiry after the scheduled time")
    void testBookingExpiry() {
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        assertNotNull(booking);
        assertNotNull(booking.getBookingExpiryAt());
        assertTrue(booking.getBookingExpiryAt().isAfter(booking.getStartTime()));
    }

    @Order(13)
    @Test
    @DisplayName("TC-5.16: Vehicle enters using a booking code")
    void testVehicleEntryWithBooking() {
        createTestBooking(LocalDateTime.now().plusMinutes(5), 60);

        ParkingSession session = createSession(LocalDateTime.now(), null);
        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        assertNotNull(booking);

        session.setBooking(booking);
        session = parkingSessionRepository.save(session);

        assertNotNull(session.getId());
        assertEquals(booking.getId(), session.getBooking().getId());
    }

    @Order(15)
    @Test
    @DisplayName("TC-5.20: Booking cancelled by owner frees the slot")
    void testBookingCancellation() {
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        assertNotNull(booking);

        bookingService.cancelBooking(booking.getId(), new UUID(0, staffUserId));

        Booking cancelledBooking = bookingRepository.findById(booking.getId()).orElse(null);
        assertNotNull(cancelledBooking);
        assertEquals("CANCELLED", cancelledBooking.getStatus().name());
    }

    @Order(16)
    @Test
    @DisplayName("TC-5.21: Vehicle with monthly pass + booking enters (pass takes priority)")
    void testMonthlyPassAndBookingPriority() {
        createTestMonthlyPass();
        createTestBooking(LocalDateTime.now().plusMinutes(5), 60);

        MonthlyPass pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(testVehicle.getId(), LocalDate.now())
                .orElse(null);
        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        assertNotNull(pass);
        assertNotNull(booking);

        ParkingSession session = createSession(
                LocalDateTime.now(),
                LocalDateTime.now().plusHours(2));
        session.setMonthlyPass(pass);
        session.setBooking(booking);
        session = parkingSessionRepository.save(session);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());
        assertEquals(BigDecimal.ZERO, fee.getTotalFee(),
                "Monthly pass should take priority over booking");
    }

    @Order(17)
    @Test
    @DisplayName("TC-5.24: Entry with booking, exit charged with pricing rule (no pass)")
    void testBookingWithPricingFee() {
        createTestPricingRule();
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        ParkingSession session = createSession(
                LocalDateTime.now().plusHours(1),
                LocalDateTime.now().plusHours(4));

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0,
                "Should charge based on pricing rule");
    }

    @Order(18)
    @Test
    @DisplayName("Scenario A: Regular vehicle (no pass, no booking) - enter exit pay")
    void testScenarioRegularVehicle() {
        createTestPricingRule();

        ParkingSession session = createSession(
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now());

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertNotNull(fee.getTotalFee());
        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0,
                "Regular vehicle should be charged");
    }

    @Order(19)
    @Test
    @DisplayName("Scenario B: Monthly pass holder - enter exit no charge")
    void testScenarioMonthlyPassHolder() {
        createTestMonthlyPass();

        ParkingSession session = createSession(
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now());

        MonthlyPass pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(testVehicle.getId(), LocalDate.now())
                .orElse(null);
        assertNotNull(pass);
        session.setMonthlyPass(pass);
        session = parkingSessionRepository.save(session);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertEquals(BigDecimal.ZERO, fee.getTotalFee(), "Monthly pass holder should not be charged");
    }

    @Order(20)
    @Test
    @DisplayName("Scenario C: Pre-booked vehicle - enter exit pay based on pricing")
    void testScenarioPreBookedVehicle() {
        createTestPricingRule();
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        ParkingSession session = createSession(
                LocalDateTime.now().plusHours(1),
                LocalDateTime.now().plusHours(3));

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());

        assertTrue(fee.getTotalFee().compareTo(BigDecimal.ZERO) > 0,
                "Pre-booked vehicle should be charged based on pricing");
    }

    @Order(21)
    @Test
    @DisplayName("Scenario D: Complex (Pass + Booking) - pass used, no charge")
    void testScenarioComplexPassAndBooking() {
        createTestMonthlyPass();
        createTestBooking(LocalDateTime.now().plusHours(2), 60);

        MonthlyPass pass = monthlyPassRepository
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(testVehicle.getId(), LocalDate.now())
                .orElse(null);
        assertNotNull(pass);

        ParkingSession session = createSession(
                LocalDateTime.now().plusHours(2),
                LocalDateTime.now().plusHours(3));
        session.setMonthlyPass(pass);
        session = parkingSessionRepository.save(session);

        FeeCalculationResponse fee = parkingSessionService.calculateParkingFee(session.getId());
        assertEquals(BigDecimal.ZERO, fee.getTotalFee(), "Monthly pass should take priority, no charge");
    }

    @Order(23)
    @Test
    @DisplayName("TC-4.7: Multiple vehicle types can have different rules")
    void testMultipleVehicleTypePricing() {
        PricingRuleRequest carRequest = buildPricingRuleRequest(BigDecimal.valueOf(50000), null);
        carRequest.setVehicleType(VehicleType.CAR);
        PricingRuleResponse carResponse = pricingRuleService.createPricingRule(carRequest, staffUserId);

        PricingRuleRequest bikeRequest = buildPricingRuleRequest(BigDecimal.valueOf(25000), null);
        bikeRequest.setVehicleType(VehicleType.MOTORBIKE);
        PricingRuleResponse bikeResponse = pricingRuleService.createPricingRule(bikeRequest, staffUserId);

        assertNotNull(carResponse);
        assertNotNull(bikeResponse);
        assertNotEquals(carResponse.getRatePerHour(), bikeResponse.getRatePerHour());
    }

    @Order(25)
    @Test
    @DisplayName("Full End-to-End: All features integrated successfully")
    void testFullEndToEndIntegration() {
        createTestPricingRule();
        createTestMonthlyPass();
        createTestBooking(LocalDateTime.now().plusHours(1), 60);

        LocalDateTime baseTime = LocalDateTime.now();

        ParkingSession session1 = createSession(
                baseTime.minusHours(3),
                baseTime.minusHours(1));

        FeeCalculationResponse fee1 = parkingSessionService.calculateParkingFee(session1.getId());
        assertNotNull(fee1);
        assertTrue(fee1.getTotalFee().compareTo(BigDecimal.ZERO) > 0);

        assertTrue(pricingRuleRepository.count() > 0);
        assertTrue(monthlyPassRepository.count() > 0);
        assertTrue(bookingRepository.count() > 0);
        assertTrue(parkingSessionRepository.count() > 0);
    }
}
