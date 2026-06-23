package parking_Building_Management_System.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import parking_Building_Management_System.dto.pricingRule.request.PricingRuleRequest;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleDetailResponse;
import parking_Building_Management_System.dto.pricingRule.response.PricingRuleResponse;
import parking_Building_Management_System.entity.PricingRule;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.TicketType;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.PricingRuleRepository;
import parking_Building_Management_System.repository.UserRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.impl.PricingRuleServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PricingRuleService Unit Tests")
class PricingRuleServiceTest {

    @Mock
    private PricingRuleRepository pricingRuleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @InjectMocks
    private PricingRuleServiceImpl pricingRuleService;

    private PricingRule testPricingRule;
    private PricingRuleRequest testRequest;
    private User testUser;
    private Zone testZone;
    private UUID testRuleId;
    private Long testUserId;
    private UUID testZoneId;

    @BeforeEach
    void setUp() {
        testRuleId = UUID.randomUUID();
        testUserId = 1L;
        testZoneId = UUID.randomUUID();

        // Setup test user
        testUser = new User();
        testUser.setUserId(testUserId);
        testUser.setFullName("Test User");

        // Setup test zone
        testZone = new Zone();
        testZone.setId(testZoneId);
        testZone.setName("Test Zone");

        // Setup test pricing rule
        testPricingRule = new PricingRule();
        testPricingRule.setId(testRuleId);
        testPricingRule.setName("Test Pricing Rule");
        testPricingRule.setVehicleType(VehicleType.CAR);
        testPricingRule.setTicketType(TicketType.HOURLY);
        testPricingRule.setRatePerHour(BigDecimal.valueOf(50000));
        testPricingRule.setMinimumFee(BigDecimal.valueOf(10000));
        testPricingRule.setMaximumDailyFee(BigDecimal.valueOf(500000));
        testPricingRule.setOverstayRateMultiplier(BigDecimal.valueOf(2.0));
        testPricingRule.setPeakHourStart(LocalTime.of(10, 0));
        testPricingRule.setPeakHourEnd(LocalTime.of(18, 0));
        testPricingRule.setPeakHourMultiplier(BigDecimal.valueOf(1.5));
        testPricingRule.setEffectiveFrom(LocalDate.now());
        testPricingRule.setEffectiveTo(LocalDate.now().plusMonths(6));
        testPricingRule.setIsActive(true);
        testPricingRule.setCreatedBy(testUser);
        testPricingRule.setCreatedAt(LocalDateTime.now());
        testPricingRule.setZone(testZone);

        // Setup test request
        testRequest = new PricingRuleRequest();
        testRequest.setName("Test Pricing Rule");
        testRequest.setVehicleType(VehicleType.CAR);
        testRequest.setTicketType(TicketType.HOURLY);
        testRequest.setRatePerHour(BigDecimal.valueOf(50000));
        testRequest.setMinimumFee(BigDecimal.valueOf(10000));
        testRequest.setMaximumDailyFee(BigDecimal.valueOf(500000));
        testRequest.setOverstayRateMultiplier(BigDecimal.valueOf(2.0));
        testRequest.setPeakHourStart(LocalTime.of(10, 0));
        testRequest.setPeakHourEnd(LocalTime.of(18, 0));
        testRequest.setPeakHourMultiplier(BigDecimal.valueOf(1.5));
        testRequest.setEffectiveFrom(LocalDate.now());
        testRequest.setEffectiveTo(LocalDate.now().plusMonths(6));
        testRequest.setZoneId(testZoneId);
    }

    @Test
    @DisplayName("Should create pricing rule successfully with zone")
    void testCreatePricingRuleSuccess() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(zoneRepository.findById(testZoneId)).thenReturn(Optional.of(testZone));
        when(pricingRuleRepository.save(any(PricingRule.class))).thenReturn(testPricingRule);

        // Act
        PricingRuleResponse response = pricingRuleService.createPricingRule(testRequest, testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(testPricingRule.getName(), response.getName());
        assertEquals(testPricingRule.getVehicleType(), response.getVehicleType());
        assertEquals(testPricingRule.getTicketType(), response.getTicketType());
        verify(userRepository).findById(testUserId);
        verify(zoneRepository).findById(testZoneId);
        verify(pricingRuleRepository).save(any(PricingRule.class));
    }

    @Test
    @DisplayName("Should create pricing rule successfully without zone")
    void testCreatePricingRuleSuccessNoZone() {
        // Arrange
        testRequest.setZoneId(null);
        PricingRule ruleWithoutZone = testPricingRule;
        ruleWithoutZone.setZone(null);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(pricingRuleRepository.save(any(PricingRule.class))).thenReturn(ruleWithoutZone);

        // Act
        PricingRuleResponse response = pricingRuleService.createPricingRule(testRequest, testUserId);

        // Assert
        assertNotNull(response);
        verify(userRepository).findById(testUserId);
        verify(pricingRuleRepository).save(any(PricingRule.class));
    }

    @Test
    @DisplayName("Should throw exception when user not found during creation")
    void testCreatePricingRuleUserNotFound() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.createPricingRule(testRequest, testUserId));
        verify(userRepository).findById(testUserId);
        verify(pricingRuleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when zone not found during creation")
    void testCreatePricingRuleZoneNotFound() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(zoneRepository.findById(testZoneId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.createPricingRule(testRequest, testUserId));
        verify(userRepository).findById(testUserId);
        verify(zoneRepository).findById(testZoneId);
        verify(pricingRuleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get pricing rule by ID successfully")
    void testGetPricingRuleByIdSuccess() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.of(testPricingRule));

        // Act
        PricingRuleDetailResponse response = pricingRuleService.getPricingRuleById(testRuleId);

        // Assert
        assertNotNull(response);
        assertEquals(testPricingRule.getId(), response.getId());
        assertEquals(testPricingRule.getName(), response.getName());
        verify(pricingRuleRepository).findById(testRuleId);
    }

    @Test
    @DisplayName("Should throw exception when pricing rule not found by ID")
    void testGetPricingRuleByIdNotFound() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.getPricingRuleById(testRuleId));
        verify(pricingRuleRepository).findById(testRuleId);
    }

    @Test
    @DisplayName("Should get all pricing rules successfully")
    void testGetAllPricingRules() {
        // Arrange
        PricingRule rule2 = new PricingRule();
        rule2.setId(UUID.randomUUID());
        rule2.setName("Rule 2");
        rule2.setVehicleType(VehicleType.MOTORBIKE);
        rule2.setIsActive(true);

        List<PricingRule> rules = List.of(testPricingRule, rule2);
        when(pricingRuleRepository.findAll()).thenReturn(rules);

        // Act
        List<PricingRuleResponse> responses = pricingRuleService.getAllPricingRules();

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        verify(pricingRuleRepository).findAll();
    }

    @Test
    @DisplayName("Should get pricing rules by vehicle type")
    void testGetPricingRulesByVehicleType() {
        // Arrange
        List<PricingRule> rules = List.of(testPricingRule);
        when(pricingRuleRepository.findByVehicleType(VehicleType.CAR)).thenReturn(rules);

        // Act
        List<PricingRuleResponse> responses = pricingRuleService.getPricingRulesByVehicleType(VehicleType.CAR);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(VehicleType.CAR, responses.get(0).getVehicleType());
        verify(pricingRuleRepository).findByVehicleType(VehicleType.CAR);
    }

    @Test
    @DisplayName("Should get empty list when no pricing rules found for vehicle type")
    void testGetPricingRulesByVehicleTypeEmpty() {
        // Arrange
        when(pricingRuleRepository.findByVehicleType(VehicleType.TRUCK)).thenReturn(List.of());

        // Act
        List<PricingRuleResponse> responses = pricingRuleService.getPricingRulesByVehicleType(VehicleType.TRUCK);

        // Assert
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
        verify(pricingRuleRepository).findByVehicleType(VehicleType.TRUCK);
    }

    @Test
    @DisplayName("Should get pricing rules by zone")
    void testGetPricingRulesByZone() {
        // Arrange
        List<PricingRule> rules = List.of(testPricingRule);
        when(pricingRuleRepository.findByZoneIdAndIsActiveTrue(testZoneId)).thenReturn(rules);

        // Act
        List<PricingRuleResponse> responses = pricingRuleService.getPricingRulesByZone(testZoneId);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(pricingRuleRepository).findByZoneIdAndIsActiveTrue(testZoneId);
    }

    @Test
    @DisplayName("Should find applicable pricing rule for zone")
    void testFindApplicablePricingRuleForZone() {
        // Arrange
        LocalDate testDate = LocalDate.now();
        List<PricingRule> zoneRules = List.of(testPricingRule);
        when(pricingRuleRepository.findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate))
                .thenReturn(zoneRules);

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.findApplicablePricingRule(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(pricingRuleRepository).findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate);
    }

    @Test
    @DisplayName("Should find applicable pricing rule globally when zone-specific not found")
    void testFindApplicablePricingRuleGlobal() {
        // Arrange
        LocalDate testDate = LocalDate.now();
        List<PricingRule> globalRules = List.of(testPricingRule);
        when(pricingRuleRepository.findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate))
                .thenReturn(List.of());
        when(pricingRuleRepository.findApplicableGlobalPricingRules(
                VehicleType.CAR, TicketType.HOURLY, testDate))
                .thenReturn(globalRules);

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.findApplicablePricingRule(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(pricingRuleRepository).findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate);
        verify(pricingRuleRepository).findApplicableGlobalPricingRules(
                VehicleType.CAR, TicketType.HOURLY, testDate);
    }

    @Test
    @DisplayName("Should return empty list when no applicable pricing rule found")
    void testFindApplicablePricingRuleNone() {
        // Arrange
        LocalDate testDate = LocalDate.now();
        when(pricingRuleRepository.findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate))
                .thenReturn(List.of());
        when(pricingRuleRepository.findApplicableGlobalPricingRules(
                VehicleType.CAR, TicketType.HOURLY, testDate))
                .thenReturn(List.of());

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.findApplicablePricingRule(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, testDate);

        // Assert
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    @DisplayName("Should find applicable pricing rule with null date defaults to today")
    void testFindApplicablePricingRuleNullDateDefaultsToToday() {
        // Arrange
        LocalDate today = LocalDate.now();
        List<PricingRule> globalRules = List.of(testPricingRule);
        when(pricingRuleRepository.findApplicablePricingRulesForZone(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, today))
                .thenReturn(List.of());
        when(pricingRuleRepository.findApplicableGlobalPricingRules(
                VehicleType.CAR, TicketType.HOURLY, today))
                .thenReturn(globalRules);

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.findApplicablePricingRule(
                VehicleType.CAR, TicketType.HOURLY, testZoneId, null);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    @DisplayName("Should update pricing rule successfully")
    void testUpdatePricingRuleSuccess() {
        // Arrange
        PricingRuleRequest updateRequest = new PricingRuleRequest();
        updateRequest.setName("Updated Rule Name");
        updateRequest.setVehicleType(VehicleType.MOTORBIKE);
        updateRequest.setTicketType(TicketType.HOURLY);
        updateRequest.setRatePerHour(BigDecimal.valueOf(40000));
        updateRequest.setMinimumFee(BigDecimal.valueOf(8000));
        updateRequest.setMaximumDailyFee(BigDecimal.valueOf(400000));
        updateRequest.setOverstayRateMultiplier(BigDecimal.valueOf(1.8));
        updateRequest.setPeakHourStart(LocalTime.of(9, 0));
        updateRequest.setPeakHourEnd(LocalTime.of(17, 0));
        updateRequest.setPeakHourMultiplier(BigDecimal.valueOf(1.3));
        updateRequest.setEffectiveFrom(LocalDate.now());
        updateRequest.setEffectiveTo(LocalDate.now().plusMonths(6));
        updateRequest.setZoneId(testZoneId);

        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.of(testPricingRule));
        when(zoneRepository.findById(testZoneId)).thenReturn(Optional.of(testZone));
        when(pricingRuleRepository.save(any(PricingRule.class))).thenReturn(testPricingRule);

        // Act
        PricingRuleDetailResponse response = pricingRuleService.updatePricingRule(testRuleId, updateRequest);

        // Assert
        assertNotNull(response);
        verify(pricingRuleRepository).findById(testRuleId);
        verify(pricingRuleRepository).save(any(PricingRule.class));
    }

    @Test
    @DisplayName("Should throw exception when pricing rule not found during update")
    void testUpdatePricingRuleNotFound() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.updatePricingRule(testRuleId, testRequest));
        verify(pricingRuleRepository).findById(testRuleId);
        verify(pricingRuleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should deactivate pricing rule successfully")
    void testDeactivatePricingRuleSuccess() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.of(testPricingRule));
        when(pricingRuleRepository.save(any(PricingRule.class))).thenReturn(testPricingRule);

        // Act
        pricingRuleService.deactivatePricingRule(testRuleId);

        // Assert
        verify(pricingRuleRepository).findById(testRuleId);
        verify(pricingRuleRepository).save(any(PricingRule.class));
    }

    @Test
    @DisplayName("Should throw exception when pricing rule not found during deactivation")
    void testDeactivatePricingRuleNotFound() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.deactivatePricingRule(testRuleId));
        verify(pricingRuleRepository).findById(testRuleId);
    }

    @Test
    @DisplayName("Should activate pricing rule successfully")
    void testActivatePricingRuleSuccess() {
        // Arrange
        testPricingRule.setIsActive(false);
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.of(testPricingRule));
        when(pricingRuleRepository.save(any(PricingRule.class))).thenReturn(testPricingRule);

        // Act
        pricingRuleService.activatePricingRule(testRuleId);

        // Assert
        verify(pricingRuleRepository).findById(testRuleId);
        verify(pricingRuleRepository).save(any(PricingRule.class));
    }

    @Test
    @DisplayName("Should throw exception when pricing rule not found during activation")
    void testActivatePricingRuleNotFound() {
        // Arrange
        when(pricingRuleRepository.findById(testRuleId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> pricingRuleService.activatePricingRule(testRuleId));
        verify(pricingRuleRepository).findById(testRuleId);
    }

    @Test
    @DisplayName("Should get pricing history successfully")
    void testGetPricingHistorySuccess() {
        // Arrange
        List<PricingRule> history = List.of(testPricingRule);
        when(pricingRuleRepository.findByVehicleTypeAndTicketTypeOrderByCreatedAtDesc(
                VehicleType.CAR, TicketType.HOURLY))
                .thenReturn(history);

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.getPricingHistory(
                VehicleType.CAR, TicketType.HOURLY, testZoneId);

        // Assert
        assertNotNull(responses);
        assertTrue(responses.size() > 0);
        verify(pricingRuleRepository).findByVehicleTypeAndTicketTypeOrderByCreatedAtDesc(
                VehicleType.CAR, TicketType.HOURLY);
    }

    @Test
    @DisplayName("Should get pricing history filtered by zone")
    void testGetPricingHistoryFilteredByZone() {
        // Arrange
        PricingRule ruleWithoutZone = new PricingRule();
        ruleWithoutZone.setId(UUID.randomUUID());
        ruleWithoutZone.setName("Global Rule");
        ruleWithoutZone.setVehicleType(VehicleType.CAR);
        ruleWithoutZone.setTicketType(TicketType.HOURLY);
        ruleWithoutZone.setZone(null);

        List<PricingRule> history = List.of(testPricingRule, ruleWithoutZone);
        when(pricingRuleRepository.findByVehicleTypeAndTicketTypeOrderByCreatedAtDesc(
                VehicleType.CAR, TicketType.HOURLY))
                .thenReturn(history);

        // Act
        List<PricingRuleDetailResponse> responses = pricingRuleService.getPricingHistory(
                VehicleType.CAR, TicketType.HOURLY, testZoneId);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    @DisplayName("Should get active pricing rule count")
    void testGetActivePricingRuleCount() {
        // Arrange
        when(pricingRuleRepository.countByIsActiveTrue()).thenReturn(5L);

        // Act
        Long count = pricingRuleService.getActivePricingRuleCount();

        // Assert
        assertEquals(5L, count);
        verify(pricingRuleRepository).countByIsActiveTrue();
    }

    @Test
    @DisplayName("Should return zero when no active pricing rules exist")
    void testGetActivePricingRuleCountZero() {
        // Arrange
        when(pricingRuleRepository.countByIsActiveTrue()).thenReturn(0L);

        // Act
        Long count = pricingRuleService.getActivePricingRuleCount();

        // Assert
        assertEquals(0L, count);
        verify(pricingRuleRepository).countByIsActiveTrue();
    }
}
