package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.monthlyPass.request.MonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.request.RenewMonthlyPassRequest;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassDetailResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyPassService {
    
    MonthlyPassResponse createMonthlyPass(MonthlyPassRequest request);
    
    MonthlyPassDetailResponse getMonthlyPassById(UUID id);
    
    MonthlyPassDetailResponse getActiveMonthlyPassByVehicle(UUID vehicleId);
    
    Optional<MonthlyPassDetailResponse> findActiveMonthlyPassByVehicle(UUID vehicleId);
    
    Optional<MonthlyPassDetailResponse> findActiveMonthlyPassByLicensePlate(String licensePlate);
    
    List<MonthlyPassResponse> getMonthlyPassesByVehicle(UUID vehicleId);
    
    List<MonthlyPassResponse> getAllMonthlyPasses();
    
    List<MonthlyPassResponse> getExpiringMonthlyPasses(int daysFromNow);
    
    List<MonthlyPassResponse> getExpiredMonthlyPasses();

    MonthlyPassDetailResponse renewMonthlyPass(UUID passId, RenewMonthlyPassRequest request);
    
    MonthlyPassDetailResponse updateMonthlyPass(UUID id, MonthlyPassRequest request);
    
    void cancelMonthlyPass(UUID id);
    
    boolean validateMonthlyPassValidity(UUID vehicleId);
    
    boolean validateMonthlyPassValidityByLicensePlate(String licensePlate);
    
    long getActiveMonthlyPassCount();
    
    void markAsExpired(UUID id);
}
