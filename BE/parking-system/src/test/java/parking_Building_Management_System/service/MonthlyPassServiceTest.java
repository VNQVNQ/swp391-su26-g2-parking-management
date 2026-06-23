package parking_Building_Management_System.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import parking_Building_Management_System.dto.monthlyPass.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.request.RenewMonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassDetailResponse;
import parking_Building_Management_System.entity.MonthlyPass;
import parking_Building_Management_System.entity.Vehicle;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.enums.PaymentStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.MonthlyPassRepository;
import parking_Building_Management_System.repository.VehicleRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.service.impl.MonthlyPassServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MonthlyPassService Unit Tests")
class MonthlyPassServiceTest {

    @Mock
    private MonthlyPassRepository monthlyPassRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ParkingSlotRepository parkingSlotRepository;

    @InjectMocks
    private MonthlyPassServiceImpl monthlyPassService;

    private MonthlyPass testMonthlyPass;
    private MonthlyPassRequest testRequest;
    private Vehicle testVehicle;
    private ParkingSlot testSlot;
    private UUID testPassId;
    private UUID testVehicleId;
    private UUID testSlotId;

    @BeforeEach
    void setUp() {
        testPassId = UUID.randomUUID();
        testVehicleId = UUID.randomUUID();
        testSlotId = UUID.randomUUID();

        // Setup test vehicle
        testVehicle = new Vehicle();
        testVehicle.setId(testVehicleId);
        testVehicle.setLicensePlate("ABC123");
        testVehicle.setVehicleType(VehicleType.CAR);
        testVehicle.setHasMonthlyPass(true);
        testVehicle.setIsActive(true);

        // Setup test zone
        Zone testZone = new Zone();
        testZone.setId(UUID.randomUUID());
        testZone.setName("Test Zone");

        // Setup test floor
        Floor testFloor = new Floor();
        testFloor.setId(UUID.randomUUID());
        testFloor.setName("Floor 1");

        // Setup test parking slot
        testSlot = new ParkingSlot();
        testSlot.setId(testSlotId);
        testSlot.setSlotCode("A101");
        testSlot.setZone(testZone);
        testSlot.setFloor(testFloor);

        // Setup test monthly pass
        testMonthlyPass = new MonthlyPass();
        testMonthlyPass.setId(testPassId);
        testMonthlyPass.setVehicle(testVehicle);
        testMonthlyPass.setSlot(testSlot);
        testMonthlyPass.setStartDate(LocalDate.now());
        testMonthlyPass.setEndDate(LocalDate.now().plusMonths(1));
        testMonthlyPass.setFee(BigDecimal.valueOf(500000));
        testMonthlyPass.setPaymentStatus(PaymentStatus.UNPAID);
        testMonthlyPass.setIsActive(true);
        testMonthlyPass.setCreatedAt(LocalDateTime.now());

        // Setup test request
        testRequest = new MonthlyPassRequest();
        testRequest.setVehicleId(testVehicleId);
        testRequest.setSlotId(testSlotId);
        testRequest.setStartDate(LocalDate.now());
        testRequest.setEndDate(LocalDate.now().plusMonths(1));
        testRequest.setFee(BigDecimal.valueOf(500000));
    }

    @Test
    @DisplayName("Should create monthly pass successfully with slot")
    void testCreateMonthlyPassSuccess() {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(monthlyPassRepository.save(any(MonthlyPass.class))).thenReturn(testMonthlyPass);

        // Act
        MonthlyPassResponse response = monthlyPassService.createMonthlyPass(testRequest);

        // Assert
        assertNotNull(response);
        assertEquals(testVehicleId, response.getVehicleId());
        assertEquals("ABC123", response.getLicensePlate());
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus());
        verify(vehicleRepository).findById(testVehicleId);
        verify(parkingSlotRepository).findById(testSlotId);
        verify(monthlyPassRepository).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should create monthly pass successfully without slot")
    void testCreateMonthlyPassSuccessNoSlot() {
        // Arrange
        testRequest.setSlotId(null);
        testMonthlyPass.setSlot(null);
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(monthlyPassRepository.save(any(MonthlyPass.class))).thenReturn(testMonthlyPass);

        // Act
        MonthlyPassResponse response = monthlyPassService.createMonthlyPass(testRequest);

        // Assert
        assertNotNull(response);
        verify(vehicleRepository).findById(testVehicleId);
        verify(monthlyPassRepository).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should throw exception when vehicle not found")
    void testCreateMonthlyPassVehicleNotFound() {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.createMonthlyPass(testRequest));
        verify(vehicleRepository).findById(testVehicleId);
        verify(monthlyPassRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when slot not found")
    void testCreateMonthlyPassSlotNotFound() {
        // Arrange
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.createMonthlyPass(testRequest));
        verify(vehicleRepository).findById(testVehicleId);
        verify(parkingSlotRepository).findById(testSlotId);
        verify(monthlyPassRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when end date before start date")
    void testCreateMonthlyPassEndDateBeforeStartDate() {
        // Arrange
        testRequest.setStartDate(LocalDate.now());
        testRequest.setEndDate(LocalDate.now().minusDays(1));
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> monthlyPassService.createMonthlyPass(testRequest));
    }

    @Test
    @DisplayName("Should throw exception when end date equals start date")
    void testCreateMonthlyPassEndDateEqualsStartDate() {
        // Arrange
        LocalDate testDate = LocalDate.now();
        testRequest.setStartDate(testDate);
        testRequest.setEndDate(testDate);
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> monthlyPassService.createMonthlyPass(testRequest));
    }

    @Test
    @DisplayName("Should get monthly pass by ID successfully")
    void testGetMonthlyPassByIdSuccess() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));

        // Act
        MonthlyPassDetailResponse response = monthlyPassService.getMonthlyPassById(testPassId);

        // Assert
        assertNotNull(response);
        assertEquals(testPassId, response.getId());
        assertEquals(testVehicleId, response.getVehicleId());
        verify(monthlyPassRepository).findById(testPassId);
    }

    @Test
    @DisplayName("Should throw exception when monthly pass not found by ID")
    void testGetMonthlyPassByIdNotFound() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.getMonthlyPassById(testPassId));
        verify(monthlyPassRepository).findById(testPassId);
    }

    @Test
    @DisplayName("Should get active monthly pass by vehicle successfully")
    void testGetActiveMonthlyPassByVehicleSuccess() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.of(testMonthlyPass));

        // Act
        MonthlyPassDetailResponse response = monthlyPassService.getActiveMonthlyPassByVehicle(testVehicleId);

        // Assert
        assertNotNull(response);
        assertEquals(testVehicleId, response.getVehicleId());
        verify(monthlyPassRepository)
                .findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                        testVehicleId, LocalDate.now());
    }

    @Test
    @DisplayName("Should throw exception when no active monthly pass found for vehicle")
    void testGetActiveMonthlyPassByVehicleNotFound() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.getActiveMonthlyPassByVehicle(testVehicleId));
    }

    @Test
    @DisplayName("Should find active monthly pass by vehicle successfully")
    void testFindActiveMonthlyPassByVehicleSuccess() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.of(testMonthlyPass));

        // Act
        Optional<MonthlyPassDetailResponse> response = monthlyPassService.findActiveMonthlyPassByVehicle(testVehicleId);

        // Assert
        assertTrue(response.isPresent());
        assertEquals(testVehicleId, response.get().getVehicleId());
    }

    @Test
    @DisplayName("Should return empty optional when no active monthly pass by vehicle")
    void testFindActiveMonthlyPassByVehicleEmpty() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.empty());

        // Act
        Optional<MonthlyPassDetailResponse> response = monthlyPassService.findActiveMonthlyPassByVehicle(testVehicleId);

        // Assert
        assertTrue(response.isEmpty());
    }

    @Test
    @DisplayName("Should find active monthly pass by license plate successfully")
    void testFindActiveMonthlyPassByLicensePlateSuccess() {
        // Arrange
        String licensePlate = "ABC123";
        when(vehicleRepository.findByLicensePlate(licensePlate)).thenReturn(Optional.of(testVehicle));
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.of(testMonthlyPass));

        // Act
        Optional<MonthlyPassDetailResponse> response = monthlyPassService.findActiveMonthlyPassByLicensePlate(licensePlate);

        // Assert
        assertTrue(response.isPresent());
        verify(vehicleRepository).findByLicensePlate(licensePlate);
    }

    @Test
    @DisplayName("Should throw exception when vehicle not found by license plate")
    void testFindActiveMonthlyPassByLicensePlateVehicleNotFound() {
        // Arrange
        String licensePlate = "XYZ999";
        when(vehicleRepository.findByLicensePlate(licensePlate)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.findActiveMonthlyPassByLicensePlate(licensePlate));
        verify(vehicleRepository).findByLicensePlate(licensePlate);
    }

    @Test
    @DisplayName("Should get monthly passes by vehicle")
    void testGetMonthlyPassesByVehicle() {
        // Arrange
        List<MonthlyPass> passes = List.of(testMonthlyPass);
        when(monthlyPassRepository.findByVehicleId(testVehicleId)).thenReturn(passes);

        // Act
        List<MonthlyPassResponse> responses = monthlyPassService.getMonthlyPassesByVehicle(testVehicleId);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(monthlyPassRepository).findByVehicleId(testVehicleId);
    }

    @Test
    @DisplayName("Should get all monthly passes")
    void testGetAllMonthlyPasses() {
        // Arrange
        MonthlyPass pass2 = new MonthlyPass();
        pass2.setId(UUID.randomUUID());
        pass2.setVehicle(testVehicle);
        pass2.setSlot(testSlot);
        pass2.setStartDate(LocalDate.now());
        pass2.setEndDate(LocalDate.now().plusMonths(1));
        pass2.setFee(BigDecimal.valueOf(500000));
        pass2.setPaymentStatus(PaymentStatus.UNPAID);
        pass2.setIsActive(true);
        List<MonthlyPass> passes = List.of(testMonthlyPass, pass2);
        when(monthlyPassRepository.findAll()).thenReturn(passes);

        // Act
        List<MonthlyPassResponse> responses = monthlyPassService.getAllMonthlyPasses();

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        verify(monthlyPassRepository).findAll();
    }

    @Test
    @DisplayName("Should get expiring monthly passes")
    void testGetExpiringMonthlyPasses() {
        // Arrange
        int daysFromNow = 7;
        List<MonthlyPass> expiringPasses = List.of(testMonthlyPass);
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysFromNow);
        
        when(monthlyPassRepository.findByEndDateBetweenAndIsActiveTrueAndPaymentStatus(
                today, futureDate, PaymentStatus.PAID))
                .thenReturn(expiringPasses);

        // Act
        List<MonthlyPassResponse> responses = monthlyPassService.getExpiringMonthlyPasses(daysFromNow);

        // Assert
        assertNotNull(responses);
        verify(monthlyPassRepository).findByEndDateBetweenAndIsActiveTrueAndPaymentStatus(
                today, futureDate, PaymentStatus.PAID);
    }

    @Test
    @DisplayName("Should get expired monthly passes")
    void testGetExpiredMonthlyPasses() {
        // Arrange
        MonthlyPass expiredPass = new MonthlyPass();
        expiredPass.setId(UUID.randomUUID());
        expiredPass.setVehicle(testVehicle);
        expiredPass.setEndDate(LocalDate.now().minusDays(1));
        expiredPass.setIsActive(true);

        List<MonthlyPass> expiredPasses = List.of(expiredPass);
        when(monthlyPassRepository.findByEndDateLessThanAndIsActiveTrue(LocalDate.now()))
                .thenReturn(expiredPasses);

        // Act
        List<MonthlyPassResponse> responses = monthlyPassService.getExpiredMonthlyPasses();

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    @DisplayName("Should renew monthly pass successfully")
    void testRenewMonthlyPassSuccess() {
        // Arrange
        RenewMonthlyPassRequest renewRequest = new RenewMonthlyPassRequest();
        renewRequest.setEndDate(LocalDate.now().plusMonths(2));
        renewRequest.setFee(BigDecimal.valueOf(600000));

        MonthlyPass renewedPass = new MonthlyPass();
        renewedPass.setId(UUID.randomUUID());
        renewedPass.setVehicle(testVehicle);
        renewedPass.setStartDate(LocalDate.now());
        renewedPass.setEndDate(renewRequest.getEndDate());
        renewedPass.setFee(renewRequest.getFee());
        renewedPass.setIsActive(true);
        renewedPass.setPaymentStatus(PaymentStatus.UNPAID);

        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));
        when(monthlyPassRepository.save(any(MonthlyPass.class)))
                .thenReturn(testMonthlyPass)
                .thenReturn(renewedPass);

        // Act
        MonthlyPassDetailResponse response = monthlyPassService.renewMonthlyPass(testPassId, renewRequest);

        // Assert
        assertNotNull(response);
        verify(monthlyPassRepository, times(2)).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should throw exception when renewing with past end date")
    void testRenewMonthlyPassPastDate() {
        // Arrange
        RenewMonthlyPassRequest renewRequest = new RenewMonthlyPassRequest();
        renewRequest.setEndDate(LocalDate.now().minusDays(1));
        renewRequest.setFee(BigDecimal.valueOf(600000));

        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> monthlyPassService.renewMonthlyPass(testPassId, renewRequest));
    }

    @Test
    @DisplayName("Should throw exception when renewing non-existent pass")
    void testRenewMonthlyPassNotFound() {
        // Arrange
        RenewMonthlyPassRequest renewRequest = new RenewMonthlyPassRequest();
        renewRequest.setEndDate(LocalDate.now().plusMonths(1));
        renewRequest.setFee(BigDecimal.valueOf(600000));

        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.renewMonthlyPass(testPassId, renewRequest));
    }

    @Test
    @DisplayName("Should update monthly pass successfully")
    void testUpdateMonthlyPassSuccess() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));
        when(monthlyPassRepository.save(any(MonthlyPass.class))).thenReturn(testMonthlyPass);

        // Act
        MonthlyPassDetailResponse response = monthlyPassService.updateMonthlyPass(testPassId, testRequest);

        // Assert
        assertNotNull(response);
        verify(monthlyPassRepository).findById(testPassId);
        verify(vehicleRepository).findById(testVehicleId);
        verify(monthlyPassRepository).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should throw exception when updating with end date before start date")
    void testUpdateMonthlyPassInvalidDateRange() {
        // Arrange
        testRequest.setEndDate(testRequest.getStartDate().minusDays(1));
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));
        when(vehicleRepository.findById(testVehicleId)).thenReturn(Optional.of(testVehicle));
        when(parkingSlotRepository.findById(testSlotId)).thenReturn(Optional.of(testSlot));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> monthlyPassService.updateMonthlyPass(testPassId, testRequest));
    }

    @Test
    @DisplayName("Should cancel active monthly pass successfully")
    void testCancelMonthlyPassSuccess() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));
        when(monthlyPassRepository.save(any(MonthlyPass.class))).thenReturn(testMonthlyPass);

        // Act
        monthlyPassService.cancelMonthlyPass(testPassId);

        // Assert
        verify(monthlyPassRepository).findById(testPassId);
        verify(monthlyPassRepository).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should throw exception when canceling inactive pass")
    void testCancelMonthlyPassAlreadyInactive() {
        // Arrange
        testMonthlyPass.setIsActive(false);
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> monthlyPassService.cancelMonthlyPass(testPassId));
        verify(monthlyPassRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should validate monthly pass validity - valid pass exists")
    void testValidateMonthlyPassValidityTrue() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.of(testMonthlyPass));

        // Act
        boolean result = monthlyPassService.validateMonthlyPassValidity(testVehicleId);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should validate monthly pass validity - no valid pass")
    void testValidateMonthlyPassValidityFalse() {
        // Arrange
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.empty());

        // Act
        boolean result = monthlyPassService.validateMonthlyPassValidity(testVehicleId);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should validate monthly pass validity by license plate - valid")
    void testValidateMonthlyPassValidityByLicensePlateTrue() {
        // Arrange
        String licensePlate = "ABC123";
        when(vehicleRepository.findByLicensePlate(licensePlate)).thenReturn(Optional.of(testVehicle));
        when(monthlyPassRepository.findByVehicleIdAndIsActiveTrueAndEndDateGreaterThanEqualOrderByEndDateDesc(
                testVehicleId, LocalDate.now()))
                .thenReturn(Optional.of(testMonthlyPass));

        // Act
        boolean result = monthlyPassService.validateMonthlyPassValidityByLicensePlate(licensePlate);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should mark monthly pass as expired successfully")
    void testMarkAsExpiredSuccess() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.of(testMonthlyPass));
        when(monthlyPassRepository.save(any(MonthlyPass.class))).thenReturn(testMonthlyPass);

        // Act
        monthlyPassService.markAsExpired(testPassId);

        // Assert
        verify(monthlyPassRepository).findById(testPassId);
        verify(monthlyPassRepository).save(any(MonthlyPass.class));
    }

    @Test
    @DisplayName("Should throw exception when marking non-existent pass as expired")
    void testMarkAsExpiredNotFound() {
        // Arrange
        when(monthlyPassRepository.findById(testPassId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> monthlyPassService.markAsExpired(testPassId));
        verify(monthlyPassRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get active monthly pass count")
    void testGetActiveMonthlyPassCount() {
        // Arrange
        when(monthlyPassRepository.countByIsActiveTrueAndPaymentStatus(PaymentStatus.PAID))
                .thenReturn(10L);

        // Act
        long count = monthlyPassService.getActiveMonthlyPassCount();

        // Assert
        assertEquals(10L, count);
        verify(monthlyPassRepository).countByIsActiveTrueAndPaymentStatus(PaymentStatus.PAID);
    }

    @Test
    @DisplayName("Should return zero when no active paid monthly passes")
    void testGetActiveMonthlyPassCountZero() {
        // Arrange
        when(monthlyPassRepository.countByIsActiveTrueAndPaymentStatus(PaymentStatus.PAID))
                .thenReturn(0L);

        // Act
        long count = monthlyPassService.getActiveMonthlyPassCount();

        // Assert
        assertEquals(0L, count);
    }
}
