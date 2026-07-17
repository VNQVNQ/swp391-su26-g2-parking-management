package parking_Building_Management_System.service.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.entity.ParkingException;
import parking_Building_Management_System.entity.enums.ExceptionStatus;
import parking_Building_Management_System.repository.ParkingExceptionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExceptionScheduler {

    private final ParkingExceptionRepository parkingExceptionRepository;

    @Scheduled(fixedDelay = 3600000) // runs every hour
    @Transactional
    public void autoDeleteResolvedExceptions() {
        log.info("Starting auto-delete resolved exceptions scheduler (runs every hour)");
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
            List<ParkingException> oldExceptions = parkingExceptionRepository.findByStatusAndResolvedAtBefore(
                    ExceptionStatus.RESOLVED, cutoffTime);

            int deletedCount = oldExceptions.size();
            if (deletedCount > 0) {
                parkingExceptionRepository.deleteAll(oldExceptions);
                log.info("Successfully deleted {} resolved exceptions older than 24 hours", deletedCount);
            } else {
                log.debug("No resolved exceptions older than 24 hours found to delete");
            }
        } catch (Exception e) {
            log.error("Error in auto-delete resolved exceptions scheduler: {}", e.getMessage(), e);
        }
    }
}
