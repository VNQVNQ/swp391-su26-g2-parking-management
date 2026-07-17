package parking_Building_Management_System.service.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.service.BookingService;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final BookingService bookingService;

    @Scheduled(fixedDelay = 300000)
    public void autoExpireBookings() {
        log.info("Starting auto-expire bookings scheduler (runs every 5 minutes)");
        try {
            int expiredCount = bookingService.autoExpireBookings();
            
            if (expiredCount > 0) {
                log.info("Successfully expired {} bookings", expiredCount);
            } else {
                log.debug("No bookings expired in this cycle");
            }
        } catch (Exception e) {
            log.error("Error in auto-expire bookings scheduler: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedDelay = 300000) // runs every 5 minutes
    public void autoDeleteCancelledBookings() {
        log.info("Starting auto-delete cancelled bookings scheduler (runs every 5 minutes)");
        try {
            int deletedCount = bookingService.autoDeleteCancelledBookings();
            
            if (deletedCount > 0) {
                log.info("Successfully deleted {} cancelled bookings older than 15 minutes", deletedCount);
            } else {
                log.debug("No cancelled bookings deleted in this cycle");
            }
        } catch (Exception e) {
            log.error("Error in auto-delete cancelled bookings scheduler: {}", e.getMessage(), e);
        }
    }
}
