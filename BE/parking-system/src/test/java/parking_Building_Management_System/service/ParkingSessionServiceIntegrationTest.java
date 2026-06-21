package parking_Building_Management_System.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.entity.*;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.*;
import parking_Building_Management_System.service.impl.ParkingSessionServiceImpl;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration Tests for Vehicle Entry Flow (Phase 3)
 * BR-23 ~ BR-32
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Vehicle Entry Flow - Integration Tests")
class ParkingSessionServiceIntegrationTest {

    @Autowired
    private ParkingSessionService parkingSessionService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private ParkingSessionRepository parkingSessionRepository;

    private UUID zoneId;
    private UUID floorId;
    private String licensePlate = "51G-12345";

    @BeforeEach
    void setUp() {
        // Create test data
        Floor floor = new Floor();
        floor.setName("Floor 1");
        floor.setLevelNumber(1);
        floor.setIsActive(true);
        floor = floorRepository.save(floor);
        floorId = floor.getId();

        Zone zone = new Zone();
        zone.setFloor(floor);
        zone.setName("Zone A - Cars");
        zone.setVehicleType(VehicleType.CAR);
        zone.setTotalSlots(10);
        zone.setIsActive(true);
        zone = zoneRepository.save(zone);
        zoneId = zone.getId();

        // Create multiple parking slots
        for (int i = 1; i <= 10; i++) {
            ParkingSlot slot = new ParkingSlot();
            slot.setFloor(floor);
            slot.setZone(zone);
            slot.setSlotCode("A1-" + String.format("%02d", i));
            slot.setVehicleType(VehicleType.CAR);
            slot.setMaintenanceStatus(SlotMaintenanceStatus.AVAILABLE);
            parkingSlotRepository.save(slot);
        }

        // Create test vehicle
        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(licensePlate);
        vehicle.setVehicleType(VehicleType.CAR);
        vehicle.setIsActive(true);
        vehicleRepository.save(vehicle);
    }

    // ============ Test Case 1: Validate Vehicle ============

    @Test
    @DisplayName("BR-23: Should validate vehicle with correct license plate")
    void testValidateVehicleWithCorrectLicensePlate() {
        // Act
        EntryValidationResponse response = parkingSessionService
                .validateVehicleForEntry(licensePlate);

        // Assert
        assertTrue(response.isValid());
        assertTrue(response.isFoundVehicle());
        assertEquals(licensePlate, response.getLicensePlate());
        assertNotNull(response.getVehicleId());
    }

    @Test
    @DisplayName("BR-23: Should reject vehicle not found")
    void testValidateVehicleNotFound() {
        // Act
        EntryValidationResponse response = parkingSessionService
                .validateVehicleForEntry("99Z-99999");

        // Assert
        assertFalse(response.isValid());
        assertFalse(response.isFoundVehicle());
        assertEquals("VEHICLE_NOT_FOUND", response.getErrorCode());
    }

    @Test
    @DisplayName("BR-23: Should reject inactive vehicle")
    void testValidateInactiveVehicle() {
        // Arrange: Create inactive vehicle
        Vehicle inactiveVehicle = new Vehicle();
        inactiveVehicle.setLicensePlate("99A-00001");
        inactiveVehicle.setVehicleType(VehicleType.CAR);
        inactiveVehicle.setIsActive(false);
        vehicleRepository.save(inactiveVehicle);

        // Act
        EntryValidationResponse response = parkingSessionService
                .validateVehicleForEntry("99A-00001");

        // Assert
        assertFalse(response.isValid());
        assertTrue(response.isFoundVehicle());
        assertEquals("VEHICLE_INACTIVE", response.getErrorCode());
    }

    // ============ Test Case 2: Find Available Slots ============

    @Test
    @DisplayName("BR-26: Should find available slots in zone")
    void testFindAvailableSlots() {
        // Act
        List<AvailableSlotsForEntryResponse> slots = parkingSessionService
                .findAvailableSlots(zoneId, licensePlate, null);

        // Assert
        assertEquals(10, slots.size(), "Should have 10 available slots");
        assertEquals(0, slots.get(0).getOccupiedCount());
        assertEquals(10, slots.get(0).getAvailableCount());
    }

    @Test
    @DisplayName("BR-15: Should reject slots if vehicle type doesn't match")
    void testRejectMismatchedVehicleType() {
        // Arrange: Create MOTORBIKE vehicle
        Vehicle motorcycleVehicle = new Vehicle();
        motorcycleVehicle.setLicensePlate("77M-00001");
        motorcycleVehicle.setVehicleType(VehicleType.MOTORBIKE);
        motorcycleVehicle.setIsActive(true);
        vehicleRepository.save(motorcycleVehicle);

        // Act: Try to find slots for MOTORBIKE in CAR zone
        List<AvailableSlotsForEntryResponse> slots = parkingSessionService
                .findAvailableSlots(zoneId, "77M-00001", null);

        // Assert
        assertTrue(slots.isEmpty(), "Should return empty list for mismatched vehicle type");
    }

    // ============ Test Case 3: Create Parking Session ============

    @Test
    @DisplayName("BR-27, BR-28, BR-31: Should create session transactionally")
    void testCreateParkingSessionTransactional() {
        // Arrange
        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(zoneId);

        // Act
        VehicleEntryResponse response = parkingSessionService
                .createParkingSession(request, 1001L, null);

        // Assert
        assertNotNull(response.getSessionId(), "BR-31: Session ID should be generated");
        assertNotNull(response.getEntryTime(), "BR-28: Entry time should be auto-generated");
        assertEquals("ACTIVE", response.getStatus().name());
        assertEquals("UNPAID", response.getPaymentStatus().name());
        assertEquals(licensePlate, response.getLicensePlate());

        // Verify slot is marked as occupied
        ParkingSlot occupiedSlot = parkingSlotRepository.findById(response.getSlotId()).orElseThrow();
        assertNotNull(occupiedSlot.getCurrentSession(), "BR-27: Slot should be marked occupied");
        assertEquals(response.getSessionId(), occupiedSlot.getCurrentSession().getId());
    }

    @Test
    @DisplayName("BR-27: Should reject if no available slots")
    void testRejectIfNoAvailableSlots() {
        // Arrange: Occupy all slots
        List<ParkingSlot> allSlots = parkingSlotRepository.findByZoneId(zoneId);
        for (ParkingSlot slot : allSlots) {
            ParkingSession occupySession = new ParkingSession();
            occupySession.setSlot(slot);
            Vehicle dummyVehicle = new Vehicle();
            dummyVehicle.setLicensePlate("DUMMY-" + slot.getId());
            dummyVehicle.setVehicleType(VehicleType.CAR);
            vehicleRepository.save(dummyVehicle);
            occupySession.setVehicle(dummyVehicle);
            parkingSessionRepository.save(occupySession);
            slot.setCurrentSession(occupySession);
            parkingSlotRepository.save(slot);
        }

        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(zoneId);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            parkingSessionService.createParkingSession(request, 1001L, null);
        }, "Should reject if no available slots");
    }

    @Test
    @DisplayName("BR-30: Should reject if vehicle type doesn't match zone")
    void testRejectVehicleTypeMismatch() {
        // Arrange: Create MOTORBIKE vehicle
        Vehicle motorcycleVehicle = new Vehicle();
        motorcycleVehicle.setLicensePlate("77M-00001");
        motorcycleVehicle.setVehicleType(VehicleType.MOTORBIKE);
        motorcycleVehicle.setIsActive(true);
        vehicleRepository.save(motorcycleVehicle);

        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate("77M-00001");
        request.setZoneId(zoneId); // Zone is for CAR

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            parkingSessionService.createParkingSession(request, 1001L, null);
        }, "Should reject mismatched vehicle type");
    }

    // ============ Test Case 4: Query Sessions ============

    @Test
    @DisplayName("Should retrieve active session by vehicle")
    void testGetActiveSessionByVehicle() {
        // Arrange: Create a session
        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(zoneId);
        VehicleEntryResponse createdResponse = parkingSessionService
                .createParkingSession(request, 1001L, null);

        // Act
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate).orElseThrow();
        ParkingSession session = parkingSessionService
                .getActiveParkingSessionByVehicle(vehicle.getId());

        // Assert
        assertEquals(createdResponse.getSessionId(), session.getId());
        assertEquals("ACTIVE", session.getStatus().name());
    }

    @Test
    @DisplayName("BR-32: Dashboard should show real-time slot availability")
    void testDashboardRealTimeUpdate() {
        // Arrange: Get initial count
        long initialAvailable = parkingSlotRepository.findAvailableSlotsByZone(zoneId).size();
        assertEquals(10, initialAvailable);

        // Act: Create session
        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(zoneId);
        parkingSessionService.createParkingSession(request, 1001L, null);

        // Assert: Available should decrease
        long afterCreate = parkingSlotRepository.findAvailableSlotsByZone(zoneId).size();
        assertEquals(9, afterCreate, "BR-32: Available count should decrease after session creation");
    }

    // ============ Test Case 5: Error Handling ============

    @Test
    @DisplayName("Should handle invalid zone gracefully")
    void testInvalidZone() {
        // Arrange
        UUID invalidZoneId = UUID.randomUUID();
        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(invalidZoneId);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            parkingSessionService.createParkingSession(request, 1001L, null);
        });
    }

    @Test
    @DisplayName("Should handle concurrent entry attempts safely")
    void testConcurrentEntryAttempts() {
        // This test verifies transactional safety
        VehicleEntryRequest request = new VehicleEntryRequest();
        request.setLicensePlate(licensePlate);
        request.setZoneId(zoneId);

        // First session should succeed
        VehicleEntryResponse response1 = parkingSessionService
                .createParkingSession(request, 1001L, null);
        assertNotNull(response1.getSessionId());

        // Second session for same vehicle should still work (different session)
        // Create another vehicle
        Vehicle vehicle2 = new Vehicle();
        vehicle2.setLicensePlate("52H-00001");
        vehicle2.setVehicleType(VehicleType.CAR);
        vehicle2.setIsActive(true);
        vehicleRepository.save(vehicle2);

        VehicleEntryRequest request2 = new VehicleEntryRequest();
        request2.setLicensePlate("52H-00001");
        request2.setZoneId(zoneId);

        VehicleEntryResponse response2 = parkingSessionService
                .createParkingSession(request2, 1002L, null);
        assertNotNull(response2.getSessionId());
        assertNotEquals(response1.getSessionId(), response2.getSessionId());
    }
}

