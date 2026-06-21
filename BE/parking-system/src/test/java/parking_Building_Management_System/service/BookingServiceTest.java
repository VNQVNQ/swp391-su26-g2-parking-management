package parking_Building_Management_System.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import parking_Building_Management_System.dto.booking.request.BookingRequest;
import parking_Building_Management_System.dto.booking.response.BookingResponse;
import parking_Building_Management_System.dto.booking.response.BookingDetailResponse;
import parking_Building_Management_System.entity.Booking;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.enums.BookingStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.exception.SlotNotAvailableException;
import parking_Building_Management_System.exception.BookingExpiredException;
import parking_Building_Management_System.exception.SlotMaintenanceException;
import parking_Building_Management_System.exception.InvalidBookingStatusException;
import parking_Building_Management_System.repository.BookingRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.ParkingSessionRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.impl.BookingServiceImpl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService Unit Tests")
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ParkingSlotRepository parkingSlotRepository;

    @Mock
    private ParkingSessionRepository parkingSessionRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Booking testBooking;
    private BookingRequest testRequest;
    private Vehicle testVehicle;
    private ParkingSlot testSlot;
    private Zone testZone;
    private Floor testFloor;
    private UUID testBookingId;
    private UUID testVehicleId;
    private UUID testSlotId;
    private UUID testZoneId;
    private UUID testFloorId;
    private UUID testStaffId;

    @BeforeEach
    void setUp() {
        testBookingId = UUID.randomUUID();
        testVehicleId = UUID.randomUUID();
        testSlotId = UUID.randomUUID();
        testZoneId = UUID.randomUUID();
        testFloorId = UUID.randomUUID();
        testStaffId = UUID.randomUUID();

        // Setup test floor
        testFloor = new Floor();
        testFloor.setId(testFloorId);
        testFloor.setName("Floor 1");

        // Setup test zone
        testZone = new Zone();
        testZone.setId(testZoneId);
        testZone.setName("Zone A");

        // Setup test parking slot
        testSlot = new ParkingSlot();
        testSlot.setId(testSlotId);
        testSlot.setSlotCode("A101");
        testSlot.setVehicleType(VehicleType.CAR);
        testSlot.setMaintenanceStatus(SlotMaintenanceStatus.AVAILABLE);
        testSlot.setZone(testZone);
        testSlot.setFloor(testFloor);

        // Setup test vehicle
        testVehicle = new Vehicle();
        testVehicle.setId(testVehicleId);
        testVehicle.setLicensePlate("ABC123");
        testVehicle.setVehicleType(VehicleType.CAR);
        testVehicle.setIsActive(true);

        // Setup test booking
        LocalDateTime startTime = LocalDateTime.now().plusMinutes(10);
        LocalDateTime endTime = startTime.plusMinutes(60);
        testBooking = new Booking();
        testBooking.setId(testBookingId);
        testBooking.setBookingCode("BK-12345678");
        testBooking.setVehicle(testVehicle);
        testBooking.setSlot(testSlot);
        testBooking.setStartTime(startTime);
        testBooking.setEndTime(endTime);
        testBooking.setBookingExpiryAt(startTime.plusMinutes(30));
        testBooking.setStatus(BookingStatus.PENDING);
        testBooking.setCreatedAt(LocalDateTime.now());

        // Setup test request
        testRequest = new BookingRequest();
        testRequest.setSlotId(testSlotId);
        testRequest.setStartTime(startTime);
        testRequest.setDurationMinutes(60);
    }

    @Test
    @DisplayName("Should create booking successfully")
    void testCreateBookingSuccess() throws SlotNotAvailableException {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(parkingSessionRepository.findBySlotIdAndStatus(testSlotId, ParkingSessionStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(bookingRepository.findBySlotIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                eq(testSlotId), anyList(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
        when(bookingRepository.findByBookingCode(anyString())).thenReturn(Optional.empty());

        // Act
        BookingResponse response = bookingService.createBooking(testRequest, testVehicleId);

        // Assert
        assertNotNull(response);
        assertEquals(testVehicleId, response.getVehicleId());
        assertEquals("ABC123", response.getLicensePlate());
        assertEquals(BookingStatus.PENDING, response.getStatus());
        verify(vehicleRepository).findById(testVehicleId);
        verify(parkingSlotRepository).findById(testSlotId);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw exception when vehicle not found")
    void testCreateBookingVehicleNotFound() {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
        verify(vehicleRepository).findById(testVehicleId);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when start time is in past")
    void testCreateBookingPastTime() {
        // Arrange
        testRequest.setStartTime(LocalDateTime.now().minusMinutes(10));
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
    }

    @Test
    @DisplayName("Should throw exception when booking duration too short")
    void testCreateBookingDurationTooShort() {
        // Arrange
        testRequest.setDurationMinutes(10);
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
    }

    @Test
    @DisplayName("Should throw exception when booking duration too long")
    void testCreateBookingDurationTooLong() {
        // Arrange
        testRequest.setDurationMinutes(730);
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
    }

    @Test
    @DisplayName("Should throw exception when slot is under maintenance")
    void testCreateBookingSlotMaintenance() {
        // Arrange
        testSlot.setMaintenanceStatus(SlotMaintenanceStatus.MAINTENANCE);
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));

        // Act & Assert
        assertThrows(SlotMaintenanceException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
    }

    @Test
    @DisplayName("Should throw exception when slot not available")
    void testCreateBookingSlotNotAvailable() {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(parkingSessionRepository.findBySlotIdAndStatus(testSlotId, ParkingSessionStatus.ACTIVE))
                .thenReturn(Optional.of(new ParkingSession()));

        // Act & Assert
        assertThrows(SlotNotAvailableException.class,
                () -> bookingService.createBooking(testRequest, testVehicleId));
    }

    @Test
    @DisplayName("Should get booking by ID successfully")
    void testGetBookingByIdSuccess() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));

        // Act
        BookingDetailResponse response = bookingService.getBookingById(testBookingId);

        // Assert
        assertNotNull(response);
        assertEquals(testBookingId, response.getId());
        assertEquals("BK-12345678", response.getBookingCode());
        verify(bookingRepository).findById(testBookingId);
    }

    @Test
    @DisplayName("Should throw exception when booking not found by ID")
    void testGetBookingByIdNotFound() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.getBookingById(testBookingId));
        verify(bookingRepository).findById(testBookingId);
    }

    @Test
    @DisplayName("Should get booking by code successfully")
    void testGetBookingByCodeSuccess() {
        // Arrange
        when(bookingRepository.findByBookingCode("BK-12345678")).thenReturn(Optional.of(testBooking));

        // Act
        BookingDetailResponse response = bookingService.getBookingByCode("BK-12345678");

        // Assert
        assertNotNull(response);
        assertEquals("BK-12345678", response.getBookingCode());
        verify(bookingRepository).findByBookingCode("BK-12345678");
    }

    @Test
    @DisplayName("Should throw exception when booking not found by code")
    void testGetBookingByCodeNotFound() {
        // Arrange
        when(bookingRepository.findByBookingCode("INVALID-CODE")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.getBookingByCode("INVALID-CODE"));
    }

    @Test
    @DisplayName("Should get all bookings")
    void testGetAllBookings() {
        // Arrange
        Booking booking2 = new Booking();
        booking2.setId(UUID.randomUUID());
        booking2.setVehicle(testVehicle);
        booking2.setSlot(testSlot);
        List<Booking> bookings = List.of(testBooking, booking2);
        when(bookingRepository.findAll()).thenReturn(bookings);

        // Act
        List<BookingResponse> responses = bookingService.getAllBookings();

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        verify(bookingRepository).findAll();
    }

    @Test
    @DisplayName("Should get bookings by vehicle")
    void testGetBookingsByVehicle() {
        // Arrange
        List<Booking> bookings = List.of(testBooking);
        when(bookingRepository.findByVehicleId(testVehicleId)).thenReturn(bookings);

        // Act
        List<BookingResponse> responses = bookingService.getBookingsByVehicle(testVehicleId);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testVehicleId, responses.get(0).getVehicleId());
        verify(bookingRepository).findByVehicleId(testVehicleId);
    }

    @Test
    @DisplayName("Should get active bookings by vehicle")
    void testGetActiveBookingsByVehicle() {
        // Arrange
        List<Booking> bookings = List.of(testBooking);
        LocalDateTime now = LocalDateTime.now();
        when(bookingRepository.findByStatusAndStartTimeAfter(BookingStatus.PENDING, now))
                .thenReturn(bookings);

        // Act
        List<BookingResponse> responses = bookingService.getActiveBookingsByVehicle(testVehicleId);

        // Assert
        assertNotNull(responses);
        verify(bookingRepository).findByStatusAndStartTimeAfter(BookingStatus.PENDING, now);
    }

    @Test
    @DisplayName("Should get bookings by slot")
    void testGetBookingsBySlot() {
        // Arrange
        List<Booking> bookings = List.of(testBooking);
        when(bookingRepository.findBySlotIdAndStatus(testSlotId, BookingStatus.PENDING))
                .thenReturn(bookings);

        // Act
        List<BookingResponse> responses = bookingService.getBookingsBySlot(testSlotId);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(bookingRepository).findBySlotIdAndStatus(testSlotId, BookingStatus.PENDING);
    }

    @Test
    @DisplayName("Should get available bookings by date range")
    void testGetAvailableBookingsByDateRange() {
        // Arrange
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = startTime.plusHours(2);
        List<Booking> bookings = List.of(testBooking);
        when(bookingRepository.findByStartTimeBetween(startTime, endTime)).thenReturn(bookings);

        // Act
        List<BookingResponse> responses = bookingService.getAvailableBookingsByDateRange(startTime, endTime);

        // Assert
        assertNotNull(responses);
        verify(bookingRepository).findByStartTimeBetween(startTime, endTime);
    }

    @Test
    @DisplayName("Should confirm booking successfully")
    void testConfirmBookingSuccess() throws BookingExpiredException {
        // Arrange
        testBooking.setBookingExpiryAt(LocalDateTime.now().plusMinutes(10));
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingDetailResponse response = bookingService.confirmBooking(testBookingId, testStaffId);

        // Assert
        assertNotNull(response);
        verify(bookingRepository).findById(testBookingId);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw exception when confirming expired booking")
    void testConfirmBookingExpired() {
        // Arrange
        testBooking.setBookingExpiryAt(LocalDateTime.now().minusMinutes(1));
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));

        // Act & Assert
        assertThrows(BookingExpiredException.class,
                () -> bookingService.confirmBooking(testBookingId, testStaffId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when confirming non-pending booking")
    void testConfirmBookingInvalidStatus() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testBooking.setBookingExpiryAt(LocalDateTime.now().plusMinutes(10));
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));

        // Act & Assert
        assertThrows(InvalidBookingStatusException.class,
                () -> bookingService.confirmBooking(testBookingId, testStaffId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should cancel booking successfully")
    void testCancelBookingSuccess() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingDetailResponse response = bookingService.cancelBooking(testBookingId, testStaffId);

        // Assert
        assertNotNull(response);
        verify(bookingRepository).findById(testBookingId);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw exception when canceling already cancelled booking")
    void testCancelBookingAlreadyCancelled() {
        // Arrange
        testBooking.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));

        // Act & Assert
        assertThrows(InvalidBookingStatusException.class,
                () -> bookingService.cancelBooking(testBookingId, testStaffId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should expire booking successfully")
    void testExpireBookingSuccess() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        bookingService.expireBooking(testBookingId);

        // Assert
        verify(bookingRepository).findById(testBookingId);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should auto-expire bookings")
    void testAutoExpireBookings() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = List.of(testBooking);
        when(bookingRepository.findByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now))
                .thenReturn(expiredBookings);
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        int expiredCount = bookingService.autoExpireBookings();

        // Assert
        assertEquals(1, expiredCount);
        verify(bookingRepository).findByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now);
    }

    @Test
    @DisplayName("Should check slot availability - available")
    void testIsSlotAvailableForBookingAvailable() {
        // Arrange
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = startTime.plusHours(1);
        
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(parkingSessionRepository.findBySlotIdAndStatus(testSlotId, ParkingSessionStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(bookingRepository.findBySlotIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                eq(testSlotId), anyList(), eq(endTime), eq(startTime)))
                .thenReturn(List.of());

        // Act
        boolean available = bookingService.isSlotAvailableForBooking(testSlotId, startTime, endTime);

        // Assert
        assertTrue(available);
    }

    @Test
    @DisplayName("Should check slot availability - under maintenance")
    void testIsSlotAvailableForBookingMaintenance() {
        // Arrange
        testSlot.setMaintenanceStatus(SlotMaintenanceStatus.MAINTENANCE);
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = startTime.plusHours(1);
        
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));

        // Act
        boolean available = bookingService.isSlotAvailableForBooking(testSlotId, startTime, endTime);

        // Assert
        assertFalse(available);
    }

    @Test
    @DisplayName("Should check slot availability - has active session")
    void testIsSlotAvailableForBookingActiveSession() {
        // Arrange
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = startTime.plusHours(1);
        
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(parkingSessionRepository.findBySlotIdAndStatus(testSlotId, ParkingSessionStatus.ACTIVE))
                .thenReturn(Optional.of(new ParkingSession()));

        // Act
        boolean available = bookingService.isSlotAvailableForBooking(testSlotId, startTime, endTime);

        // Assert
        assertFalse(available);
    }

    @Test
    @DisplayName("Should check slot availability - has conflicting bookings")
    void testIsSlotAvailableForBookingConflict() {
        // Arrange
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = startTime.plusHours(1);
        
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(parkingSessionRepository.findBySlotIdAndStatus(testSlotId, ParkingSessionStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(bookingRepository.findBySlotIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                eq(testSlotId), anyList(), eq(endTime), eq(startTime)))
                .thenReturn(List.of(testBooking));

        // Act
        boolean available = bookingService.isSlotAvailableForBooking(testSlotId, startTime, endTime);

        // Assert
        assertFalse(available);
    }

    @Test
    @DisplayName("Should generate unique booking code")
    void testGenerateBookingCodeUnique() {
        // Arrange
        when(bookingRepository.findByBookingCode(anyString())).thenReturn(Optional.empty());

        // Act
        String code1 = bookingService.generateBookingCode();
        String code2 = bookingService.generateBookingCode();

        // Assert
        assertNotNull(code1);
        assertNotNull(code2);
        assertNotEquals(code1, code2);
        assertTrue(code1.startsWith("BK-"));
        assertTrue(code2.startsWith("BK-"));
    }

    @Test
    @DisplayName("Should throw exception when unable to generate unique booking code")
    void testGenerateBookingCodeMaxAttemptsExceeded() {
        // Arrange
        when(bookingRepository.findByBookingCode(anyString())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.generateBookingCode());
    }

    @Test
    @DisplayName("Should get active bookings count")
    void testGetActiveBookingsCount() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        when(bookingRepository.countByStatusInAndStartTimeAfter(
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED), now))
                .thenReturn(5L);

        // Act
        long count = bookingService.getActiveBookingsCount();

        // Assert
        assertEquals(5L, count);
        verify(bookingRepository).countByStatusInAndStartTimeAfter(
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED), now);
    }

    @Test
    @DisplayName("Should return zero when no active bookings")
    void testGetActiveBookingsCountZero() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        when(bookingRepository.countByStatusInAndStartTimeAfter(
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED), now))
                .thenReturn(0L);

        // Act
        long count = bookingService.getActiveBookingsCount();

        // Assert
        assertEquals(0L, count);
    }

    @Test
    @DisplayName("Should get expiring bookings count")
    void testGetExpiringBookingsCount() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        when(bookingRepository.countByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now))
                .thenReturn(3L);

        // Act
        long count = bookingService.getExpiringBookingsCount();

        // Assert
        assertEquals(3L, count);
        verify(bookingRepository).countByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now);
    }

    @Test
    @DisplayName("Should return zero when no expiring bookings")
    void testGetExpiringBookingsCountZero() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        when(bookingRepository.countByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now))
                .thenReturn(0L);

        // Act
        long count = bookingService.getExpiringBookingsCount();

        // Assert
        assertEquals(0L, count);
    }

    @Test
    @DisplayName("Should throw exception when booking not found for cancellation")
    void testCancelBookingNotFound() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(testBookingId, testStaffId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when confirming non-existent booking")
    void testConfirmBookingNotFound() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.confirmBooking(testBookingId, testStaffId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when expiring non-existent booking")
    void testExpireBookingNotFound() {
        // Arrange
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> bookingService.expireBooking(testBookingId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should not expire confirmed booking")
    void testExpireConfirmedBookingDoesNotExpire() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(testBookingId)).thenReturn(Optional.of(testBooking));

        // Act
        bookingService.expireBooking(testBookingId);

        // Assert
        verify(bookingRepository, never()).save(any());
    }
}
