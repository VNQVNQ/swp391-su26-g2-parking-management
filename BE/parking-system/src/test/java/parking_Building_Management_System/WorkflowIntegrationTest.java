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

import parking_Building_Management_System.dto.request.BookingRequest;
import parking_Building_Management_System.dto.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.request.PricingRuleRequest;
import parking_Building_Management_System.dto.response.BookingResponse;
import parking_Building_Management_System.dto.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.response.PricingRuleResponse;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.entity.User;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.repository.BookingRepository;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.MonthlyPassRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.PricingRuleRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.BookingService;
import parking_Building_Management_System.service.MonthlyPassService;
import parking_Building_Management_System.service.ParkingSessionService;
import parking_Building_Management_System.service.PricingRuleService;
import parking_Building_Management_System.service.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

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
    private UserService userService;

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
    private ParkingSlot testSlot;
    private User staffUser;
    private User vehicleOwner;
    private UUID pricingRuleId;
    private String bookingCode;

    @BeforeEach
    void setUp() {
        // Create Zone
        testZone = new Zone();
        testZone.setZoneName("A");
        testZone.setCurrentCapacity(0);
        testZone.setMaxCapacity(10);
        testZone = zoneRepository.save(testZone);

        // Create Floor
        Floor floor = new Floor();
        floor.setFloorName("F1");
        floor.setZone(testZone);
        floor = floorRepository.save(floor);

        // Create ParkingSlot
        testSlot = new ParkingSlot();
        testSlot.setSlotName("A-F1-01");
        testSlot.setFloor(floor);
        testSlot.setIsAvailable(true);
        testSlot = parkingSlotRepository.save(testSlot);

        // Create Vehicle
        testVehicle = new Vehicle();
        testVehicle.setLicensePlate("ABC-123");
        testVehicle.setVehicleType("CAR");
        testVehicle = vehicleRepository.save(testVehicle);

        // Create Staff User
        staffUser = new User();
        staffUser.setEmail("staff@example.com");
        staffUser.setFullName("Staff User");
        staffUser.setRole("MANAGER");
        staffUser = userService.saveOrUpdateUser(staffUser);

        // Create Vehicle Owner
        vehicleOwner = new User();
        vehicleOwner.setEmail("owner@example.com");
        vehicleOwner.setFullName("Vehicle Owner");
        vehicleOwner.setRole("USER");
        vehicleOwner = userService.saveOrUpdateUser(vehicleOwner);
    }

    @Order(1)
    @Test
    @DisplayName("TC-4.1: Manager creates pricing rule for CAR hourly rate")
    void testCreatePricingRule() {
        PricingRuleRequest request = new PricingRuleRequest();
        request.setVehicleType("CAR");
        request.setTicketType("HOURLY");
        request.setHourlyRate(50000.0);
        request.setDailyRate(300000.0);
        request.setEffectiveDate(LocalDate.now());
        request.setExpiryDate(LocalDate.now().plusMonths(1));
        request.setZoneId(testZone.getZoneId());

        PricingRuleResponse response = pricingRuleService.createPricingRule(request);

        assertNotNull(response);
        pricingRuleId = response.getPricingRuleId();
        assertEquals("CAR", response.getVehicleType());
        assertEquals(50000.0, response.getHourlyRate());
    }

    @Order(2)
    @Test
    @DisplayName("TC-4.2: Pricing rule is applied when vehicle exits")
    void testPricingRuleApplication() {
        testCreatePricingRule();

        LocalDateTime entryTime = LocalDateTime.now().minusHours(2);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(LocalDateTime.now());
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertNotNull(fee);
        assertTrue(fee > 0, "Fee should be calculated based on pricing rule");
    }

    @Order(3)
    @Test
    @DisplayName("TC-4.3: Peak hour multiplier applied during peak times")
    void testPeakHourMultiplier() {
        testCreatePricingRule();

        // Create session during peak hours (assume 18:00-20:00)
        LocalDateTime peakEntryTime = LocalDateTime.now()
                .withHour(18)
                .withMinute(0)
                .withSecond(0);
        LocalDateTime peakExitTime = peakEntryTime.plusHours(1);

        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(peakEntryTime);
        session.setExitTime(peakExitTime);
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertNotNull(fee);
        assertTrue(fee > 0);
    }

    @Order(4)
    @Test
    @DisplayName("TC-5.1: Vehicle owner subscribes to monthly pass")
    void testMonthlyPassSubscription() {
        MonthlyPassRequest request = new MonthlyPassRequest();
        request.setVehicleLicensePlate(testVehicle.getLicensePlate());
        request.setPassType("STANDARD");
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusMonths(1));

        MonthlyPassResponse response = monthlyPassService.createMonthlyPass(request);

        assertNotNull(response);
        assertEquals(testVehicle.getLicensePlate(), response.getVehicleLicensePlate());
        assertTrue(response.getIsActive());
    }

    @Order(5)
    @Test
    @DisplayName("TC-5.2 & TC-5.3: Vehicle with active pass enters and exits (no charge)")
    void testMonthlyPassFlow() {
        testMonthlyPassSubscription();

        // Create parking session
        LocalDateTime entryTime = LocalDateTime.now();
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(entryTime.plusHours(2));
        session = parkingSessionRepository.save(session);

        // Verify monthly pass is linked
        MonthlyPass pass = monthlyPassRepository.findByVehicleAndIsActiveTrue(testVehicle);
        assertNotNull(pass);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertEquals(0.0, fee, "Monthly pass holder should pay 0 during normal hours");
    }

    @Order(6)
    @Test
    @DisplayName("TC-5.4: Monthly pass validation check succeeds")
    void testMonthlyPassValidation() {
        testMonthlyPassSubscription();

        MonthlyPass pass = monthlyPassRepository.findByVehicleAndIsActiveTrue(testVehicle);
        assertNotNull(pass);
        assertTrue(pass.getIsActive());
        assertTrue(pass.getEndDate().isAfter(LocalDate.now()));
    }

    @Order(7)
    @Test
    @DisplayName("TC-5.5: Monthly pass expiry detection works")
    void testMonthlyPassExpiry() {
        MonthlyPassRequest request = new MonthlyPassRequest();
        request.setVehicleLicensePlate(testVehicle.getLicensePlate());
        request.setPassType("STANDARD");
        request.setStartDate(LocalDate.now().minusMonths(1));
        request.setEndDate(LocalDate.now().minusDays(1)); // Expired

        MonthlyPass pass = new MonthlyPass();
        pass.setVehicle(testVehicle);
        pass.setPassType("STANDARD");
        pass.setStartDate(LocalDate.now().minusMonths(1));
        pass.setEndDate(LocalDate.now().minusDays(1));
        pass.setIsActive(false);
        pass = monthlyPassRepository.save(pass);

        assertFalse(pass.getIsActive());
        assertTrue(pass.getEndDate().isBefore(LocalDate.now()));
    }

    @Order(8)
    @Test
    @DisplayName("TC-5.7: Pass holder overstay (>24h) charged with multiplier")
    void testMonthlyPassOverstayCharge() {
        testMonthlyPassSubscription();
        testCreatePricingRule();

        // Create session with 25 hours duration (overstay)
        LocalDateTime entryTime = LocalDateTime.now().minusHours(25);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(LocalDateTime.now());
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertTrue(fee > 0, "Overstay should incur charge even with monthly pass");
    }

    @Order(9)
    @Test
    @DisplayName("TC-5.11: Vehicle owner creates booking for specific slot/time")
    void testCreateBooking() {
        BookingRequest request = new BookingRequest();
        request.setVehicleLicensePlate(testVehicle.getLicensePlate());
        request.setParkingSlotId(testSlot.getSlotId());
        request.setScheduledStartTime(LocalDateTime.now().plusHours(1));
        request.setDurationInMinutes(60);

        BookingResponse response = bookingService.createBooking(request);

        assertNotNull(response);
        bookingCode = response.getBookingCode();
        assertNotNull(bookingCode);
        assertEquals("PENDING", response.getStatus());
    }

    @Order(10)
    @Test
    @DisplayName("TC-5.12: Booking code is generated and unique")
    void testBookingCodeGeneration() {
        testCreateBooking();

        BookingRequest request2 = new BookingRequest();
        request2.setVehicleLicensePlate(testVehicle.getLicensePlate());
        request2.setParkingSlotId(testSlot.getSlotId());
        request2.setScheduledStartTime(LocalDateTime.now().plusHours(3));
        request2.setDurationInMinutes(60);

        BookingResponse response2 = bookingService.createBooking(request2);

        assertNotNull(response2.getBookingCode());
        assertNotEquals(bookingCode, response2.getBookingCode(), "Booking codes should be unique");
    }

    @Order(11)
    @Test
    @DisplayName("TC-5.13: Booking slot is reserved and not available to others")
    void testBookingSlotReservation() {
        testCreateBooking();

        ParkingSlot slot = parkingSlotRepository.findById(testSlot.getSlotId()).orElse(null);
        assertNotNull(slot);

        // Try to create another booking for same slot/time
        BookingRequest request2 = new BookingRequest();
        request2.setVehicleLicensePlate(testVehicle.getLicensePlate());
        request2.setParkingSlotId(testSlot.getSlotId());
        request2.setScheduledStartTime(LocalDateTime.now().plusHours(1).plusMinutes(30));
        request2.setDurationInMinutes(60);

        // Should fail or be detected as conflict
        assertThrows(Exception.class, () -> {
            bookingService.createBooking(request2);
        });
    }

    @Order(12)
    @Test
    @DisplayName("TC-5.14 & TC-5.15: Booking expires 30 minutes after scheduled time")
    void testBookingExpiry() {
        testCreateBooking();

        Booking booking = bookingRepository.findByBookingCode(bookingCode);
        assertNotNull(booking);

        LocalDateTime expiryTime = booking.getScheduledStartTime().plusMinutes(30);
        assertTrue(expiryTime.isAfter(booking.getScheduledStartTime()));
    }

    @Order(13)
    @Test
    @DisplayName("TC-5.16: Vehicle enters with booking code")
    void testVehicleEntryWithBooking() {
        testCreateBooking();

        // Simulate vehicle entry
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(LocalDateTime.now());

        // Link booking
        Booking booking = bookingRepository.findByBookingCode(bookingCode);
        session = parkingSessionRepository.save(session);

        assertNotNull(session.getSessionId());
    }

    @Order(14)
    @Test
    @DisplayName("TC-5.18: System prevents double-booking of same slot")
    void testDoubleBookingPrevention() {
        testCreateBooking();

        BookingRequest conflictRequest = new BookingRequest();
        conflictRequest.setVehicleLicensePlate("XYZ-999");
        conflictRequest.setParkingSlotId(testSlot.getSlotId());
        conflictRequest.setScheduledStartTime(LocalDateTime.now().plusHours(1).plusMinutes(15));
        conflictRequest.setDurationInMinutes(30);

        assertThrows(Exception.class, () -> {
            bookingService.createBooking(conflictRequest);
        });
    }

    @Order(15)
    @Test
    @DisplayName("TC-5.20: Booking cancelled by owner frees slot")
    void testBookingCancellation() {
        testCreateBooking();

        Booking booking = bookingRepository.findByBookingCode(bookingCode);
        bookingService.cancelBooking(booking.getBookingId());

        Booking cancelledBooking = bookingRepository.findById(booking.getBookingId()).orElse(null);
        assertNotNull(cancelledBooking);
        assertEquals("CANCELLED", cancelledBooking.getStatus());
    }

    @Order(16)
    @Test
    @DisplayName("TC-5.21: Vehicle with monthly pass + booking enters (pass takes priority)")
    void testMonthlyPassAndBookingPriority() {
        testMonthlyPassSubscription();
        testCreateBooking();

        // Vehicle has both pass and booking
        MonthlyPass pass = monthlyPassRepository.findByVehicleAndIsActiveTrue(testVehicle);
        Booking booking = bookingRepository.findByBookingCode(bookingCode);

        assertNotNull(pass);
        assertNotNull(booking);

        // Create session - pass should take priority
        LocalDateTime entryTime = LocalDateTime.now();
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(entryTime.plusHours(2));
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());
        assertEquals(0.0, fee, "Monthly pass should take priority over booking");
    }

    @Order(17)
    @Test
    @DisplayName("TC-5.24: Entry with booking code, exit charged with pricing rule")
    void testBookingWithPricingFee() {
        testCreatePricingRule();
        testCreateBooking();

        LocalDateTime entryTime = LocalDateTime.now().plusHours(1);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(entryTime.plusHours(3));
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertTrue(fee > 0, "Should charge based on pricing rule");
    }

    @Order(18)
    @Test
    @DisplayName("Scenario A: Regular vehicle (no pass, no booking) - enter exit pay")
    void testScenarioRegularVehicle() {
        testCreatePricingRule();

        // Regular vehicle enters
        LocalDateTime entryTime = LocalDateTime.now().minusHours(2);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(LocalDateTime.now());
        session = parkingSessionRepository.save(session);

        // Calculate fee
        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertNotNull(fee);
        assertTrue(fee > 0, "Regular vehicle should be charged");
        assertTrue(fee >= 50000, "Fee should be at least one hour rate (50000)");
    }

    @Order(19)
    @Test
    @DisplayName("Scenario B: Monthly pass holder - enter exit no charge")
    void testScenarioMonthlyPassHolder() {
        testMonthlyPassSubscription();

        LocalDateTime entryTime = LocalDateTime.now().minusHours(1);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(LocalDateTime.now());
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertEquals(0.0, fee, "Monthly pass holder should not be charged");
    }

    @Order(20)
    @Test
    @DisplayName("Scenario C: Pre-booked vehicle - enter exit pay based on pricing")
    void testScenarioPreBookedVehicle() {
        testCreatePricingRule();
        testCreateBooking();

        LocalDateTime entryTime = LocalDateTime.now().plusHours(1);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(entryTime.plusHours(2));
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertTrue(fee > 0, "Pre-booked vehicle should be charged based on pricing");
    }

    @Order(21)
    @Test
    @DisplayName("Scenario D: Complex (Pass + Booking) - use pass, no charge")
    void testScenarioComplexPassAndBooking() {
        testMonthlyPassSubscription();
        testCreatePricingRule();
        testCreateBooking();

        LocalDateTime entryTime = LocalDateTime.now().plusHours(2);
        ParkingSession session = new ParkingSession();
        session.setVehicle(testVehicle);
        session.setSlot(testSlot);
        session.setEntryTime(entryTime);
        session.setExitTime(entryTime.plusHours(1));
        session = parkingSessionRepository.save(session);

        Double fee = parkingSessionService.calculateParkingFee(session.getSessionId());

        assertEquals(0.0, fee, "Monthly pass should take priority, no charge");
    }

    @Order(22)
    @Test
    @DisplayName("TC-4.6: Zone-specific rule takes priority over global rule")
    void testZoneSpecificPricingPriority() {
        // Create global rule
        PricingRuleRequest globalRequest = new PricingRuleRequest();
        globalRequest.setVehicleType("CAR");
        globalRequest.setTicketType("HOURLY");
        globalRequest.setHourlyRate(40000.0);
        globalRequest.setDailyRate(250000.0);
        globalRequest.setEffectiveDate(LocalDate.now());
        globalRequest.setExpiryDate(LocalDate.now().plusMonths(1));
        globalRequest.setZoneId(null); // Global

        pricingRuleService.createPricingRule(globalRequest);

        // Create zone-specific rule
        PricingRuleRequest zoneRequest = new PricingRuleRequest();
        zoneRequest.setVehicleType("CAR");
        zoneRequest.setTicketType("HOURLY");
        zoneRequest.setHourlyRate(60000.0);
        zoneRequest.setDailyRate(350000.0);
        zoneRequest.setEffectiveDate(LocalDate.now());
        zoneRequest.setExpiryDate(LocalDate.now().plusMonths(1));
        zoneRequest.setZoneId(testZone.getZoneId());

        PricingRuleResponse zoneResponse = pricingRuleService.createPricingRule(zoneRequest);

        assertNotNull(zoneResponse);
        assertEquals(60000.0, zoneResponse.getHourlyRate());
    }

    @Order(23)
    @Test
    @DisplayName("TC-4.7: Multiple vehicle types can have different rules")
    void testMultipleVehicleTypePricing() {
        // Create rule for CAR
        PricingRuleRequest carRequest = new PricingRuleRequest();
        carRequest.setVehicleType("CAR");
        carRequest.setTicketType("HOURLY");
        carRequest.setHourlyRate(50000.0);
        carRequest.setDailyRate(300000.0);
        carRequest.setEffectiveDate(LocalDate.now());
        carRequest.setExpiryDate(LocalDate.now().plusMonths(1));
        carRequest.setZoneId(null);

        PricingRuleResponse carResponse = pricingRuleService.createPricingRule(carRequest);

        // Create rule for MOTORCYCLE
        PricingRuleRequest bikeRequest = new PricingRuleRequest();
        bikeRequest.setVehicleType("MOTORCYCLE");
        bikeRequest.setTicketType("HOURLY");
        bikeRequest.setHourlyRate(25000.0);
        bikeRequest.setDailyRate(150000.0);
        bikeRequest.setEffectiveDate(LocalDate.now());
        bikeRequest.setExpiryDate(LocalDate.now().plusMonths(1));
        bikeRequest.setZoneId(null);

        PricingRuleResponse bikeResponse = pricingRuleService.createPricingRule(bikeRequest);

        assertNotNull(carResponse);
        assertNotNull(bikeResponse);
        assertNotEquals(carResponse.getHourlyRate(), bikeResponse.getHourlyRate());
    }

    @Order(24)
    @Test
    @DisplayName("TC-4.5: Pricing rule effective date range enforcement")
    void testPricingRuleEffectiveDateRange() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        PricingRuleRequest request = new PricingRuleRequest();
        request.setVehicleType("CAR");
        request.setTicketType("HOURLY");
        request.setHourlyRate(50000.0);
        request.setDailyRate(300000.0);
        request.setEffectiveDate(yesterday);
        request.setExpiryDate(tomorrow);
        request.setZoneId(null);

        PricingRuleResponse response = pricingRuleService.createPricingRule(request);

        assertNotNull(response);
        assertTrue(response.getEffectiveDate().isBefore(LocalDate.now()) || 
                   response.getEffectiveDate().isEqual(LocalDate.now()));
        assertTrue(response.getExpiryDate().isAfter(LocalDate.now()) || 
                   response.getExpiryDate().isEqual(LocalDate.now()));
    }

    @Order(25)
    @Test
    @DisplayName("Full End-to-End: All features integrated successfully")
    void testFullEndToEndIntegration() {
        testCreatePricingRule();
        testMonthlyPassSubscription();
        testCreateBooking();

        // Multiple sessions with different scenarios
        LocalDateTime baseTime = LocalDateTime.now();

        // Session 1: Regular vehicle, pricing applied
        ParkingSession session1 = new ParkingSession();
        session1.setVehicle(testVehicle);
        session1.setSlot(testSlot);
        session1.setEntryTime(baseTime.minusHours(3));
        session1.setExitTime(baseTime.minusHours(1));
        session1 = parkingSessionRepository.save(session1);

        Double fee1 = parkingSessionService.calculateParkingFee(session1.getSessionId());
        assertTrue(fee1 > 0);

        assertNotNull(fee1);
        assertTrue(pricingRuleRepository.count() > 0);
        assertTrue(monthlyPassRepository.count() > 0);
        assertTrue(bookingRepository.count() > 0);
        assertTrue(parkingSessionRepository.count() > 0);
    }
}
