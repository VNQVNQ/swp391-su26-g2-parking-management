package parking_Building_Management_System.service.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.dto.monthlyPass.response.MonthlyPassResponse;
import parking_Building_Management_System.service.MonthlyPassService;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyPassScheduler {

    private final MonthlyPassService monthlyPassService;

    @Scheduled(fixedDelay = 3600000)
    public void autoExpireMonthlyPasses() {
        log.info("Starting auto-expire monthly passes scheduler");
        try {
            List<MonthlyPassResponse> expiredPasses = monthlyPassService.getExpiredMonthlyPasses();
            
            if (expiredPasses.isEmpty()) {
                log.info("No expired monthly passes to process");
                return;
            }

            expiredPasses.forEach(pass -> {
                try {
                    monthlyPassService.markAsExpired(pass.getId());
                    log.info("Marked monthly pass ID {} as expired", pass.getId());
                } catch (Exception e) {
                    log.error("Error marking monthly pass ID {} as expired: {}", pass.getId(), e.getMessage());
                }
            });

            log.info("Auto-expire monthly passes scheduler completed. Processed {} passes", expiredPasses.size());
        } catch (Exception e) {
            log.error("Error in auto-expire monthly passes scheduler: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedDelay = 86400000, initialDelay = 60000)
    public void notifyExpiringMonthlyPasses() {
        log.info("Starting notify expiring monthly passes scheduler");
        try {
            List<MonthlyPassResponse> expiringPasses = monthlyPassService.getExpiringMonthlyPasses(7);
            
            if (expiringPasses.isEmpty()) {
                log.info("No expiring monthly passes to notify");
                return;
            }

            expiringPasses.forEach(pass -> {
                log.info("Monthly pass ID {} for vehicle {} is expiring in {} days. End date: {}",
                        pass.getId(),
                        pass.getVehicleId(),
                        pass.getRemainingDays(),
                        pass.getEndDate());
            });

            log.info("Notify expiring monthly passes scheduler completed. Found {} expiring passes", expiringPasses.size());
        } catch (Exception e) {
            log.error("Error in notify expiring monthly passes scheduler: {}", e.getMessage(), e);
        }
    }
}
