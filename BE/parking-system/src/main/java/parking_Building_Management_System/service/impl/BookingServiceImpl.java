package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.booking.request.BookingRequest;
import parking_Building_Management_System.dto.booking.request.UpdateBookingRequest;
import parking_Building_Management_System.dto.booking.response.BookingResponse;
import parking_Building_Management_System.dto.booking.response.BookingDetailResponse;
import parking_Building_Management_System.entity.*;
import parking_Building_Management_System.entity.enums.BookingStatus;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.ParkingSessionStatus;
import parking_Building_Management_System.exception.*;
import parking_Building_Management_System.repository.*;
import parking_Building_Management_System.service.BookingService;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ZoneRepository zoneRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, UUID vehicleId) throws SlotNotAvailableException {
        log.info("Creating booking for vehicle ID: {}", vehicleId);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> {
                    log.error("Vehicle not found with ID: {}", vehicleId);
                    return new RuntimeException("Vehicle not found with ID: " + vehicleId);
                });

        List<Booking> pendingBookings = bookingRepository.findByVehicleIdAndStatus(vehicleId, BookingStatus.PENDING);
        if (!pendingBookings.isEmpty()) {
            throw new IllegalStateException("Xe này đã có lượt đặt chỗ đang chờ (PENDING). Không thể tạo thêm lượt đặt chỗ mới.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime minStartTime = now.plusMinutes(5);
        
        if (request.getStartTime().isBefore(minStartTime)) {
            throw new IllegalArgumentException("Booking start time must be at least 5 minutes from now");
        }

        if (request.getDurationMinutes() < 15 || request.getDurationMinutes() > 720) {
            throw new IllegalArgumentException("Booking duration must be between 15 minutes and 12 hours");
        }

        LocalDateTime endTime = request.getStartTime().plusMinutes(request.getDurationMinutes());

        ParkingSlot slot = null;
        if (request.getSlotId() != null) {
            slot = parkingSlotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> {
                        log.error("Parking slot not found with ID: {}", request.getSlotId());
                        return new RuntimeException("Parking slot not found with ID: " + request.getSlotId());
                    });

            if (slot.getMaintenanceStatus() == SlotMaintenanceStatus.MAINTENANCE) {
                throw new SlotMaintenanceException("Slot is under maintenance and cannot be booked");
            }

            if (!isSlotAvailableForBooking(slot.getId(), request.getStartTime(), endTime)) {
                throw new SlotNotAvailableException("Slot is not available for the requested time range");
            }
        } else {
            slot = findAvailableSlot(vehicle, request.getStartTime(), endTime);
            if (slot == null) {
                throw new SlotNotAvailableException("No available slots found for the requested time and vehicle type");
            }
        }

        LocalDateTime bookingExpiryAt = request.getStartTime().plusMinutes(30);
        String bookingCode = generateBookingCode();

        Booking booking = new Booking();
        booking.setVehicle(vehicle);
        booking.setSlot(slot);
        booking.setBookingCode(bookingCode);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(endTime);
        booking.setBookingExpiryAt(bookingExpiryAt);
        booking.setStatus(BookingStatus.PENDING);

        booking = bookingRepository.save(booking);
        log.info("Booking created successfully with code: {} and ID: {}", bookingCode, booking.getId());

        return mapToResponse(booking);
    }

    @Override
    public BookingDetailResponse getBookingById(UUID id) {
        log.info("Getting booking by ID: {}", id);
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Booking not found with ID: {}", id);
                    return new RuntimeException("Booking not found with ID: " + id);
                });
        return mapToDetailResponse(booking);
    }

    @Override
    public BookingDetailResponse getBookingByCode(String bookingCode) {
        log.info("Getting booking by code: {}", bookingCode);
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> {
                    log.error("Booking not found with code: {}", bookingCode);
                    return new RuntimeException("Booking not found with code: " + bookingCode);
                });
        return mapToDetailResponse(booking);
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        log.info("Getting all bookings");
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getBookingsByVehicle(UUID vehicleId) {
        log.info("Getting bookings for vehicle ID: {}", vehicleId);
        return bookingRepository.findByVehicleId(vehicleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getActiveBookingsByVehicle(UUID vehicleId) {
        log.info("Getting active bookings for vehicle ID: {}", vehicleId);
        LocalDateTime now = LocalDateTime.now();
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED);
        
        return bookingRepository.findByStatusAndStartTimeAfter(activeStatuses.get(0), now).stream()
                .filter(b -> b.getVehicle().getId().equals(vehicleId) && activeStatuses.contains(b.getStatus()))
                .sorted(Comparator.comparing(Booking::getStartTime))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getBookingsBySlot(UUID slotId) {
        log.info("Getting bookings for slot ID: {}", slotId);
        return bookingRepository.findBySlotIdAndStatus(slotId, BookingStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getAvailableBookingsByDateRange(LocalDateTime startTime, LocalDateTime endTime) {
        log.info("Getting available bookings between {} and {}", startTime, endTime);
        return bookingRepository.findByStartTimeBetween(startTime, endTime).stream()
                .filter(b -> !b.getStatus().equals(BookingStatus.EXPIRED) && !b.getStatus().equals(BookingStatus.CANCELLED))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingDetailResponse confirmBooking(UUID bookingId, Long staffId) throws BookingExpiredException {
        log.info("Confirming booking ID: {} by PARKING_STAFF ID: {}", bookingId, staffId);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> {
                     log.error("Booking not found with ID: {}", bookingId);
                     return new RuntimeException("Booking not found with ID: " + bookingId);
                 });

         if (booking.getBookingExpiryAt().isBefore(LocalDateTime.now())) {
             throw new BookingExpiredException("Booking has expired and cannot be confirmed");
         }

         if (!booking.getStatus().equals(BookingStatus.PENDING)) {
             throw new InvalidBookingStatusException("Booking status must be PENDING to confirm. Current status: " + booking.getStatus());
         }

         booking.setStatus(BookingStatus.CONFIRMED);
         booking = bookingRepository.save(booking);
         log.info("Booking confirmed successfully with ID: {}", bookingId);

         return mapToDetailResponse(booking);
     }

     @Override
     @Transactional
     public BookingDetailResponse cancelBooking(UUID bookingId, Long cancelledByUserId) {
         log.info("Cancelling booking ID: {} by user ID: {}", bookingId, cancelledByUserId);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> {
                    log.error("Booking not found with ID: {}", bookingId);
                    return new RuntimeException("Booking not found with ID: " + bookingId);
                });

        if (booking.getStatus().equals(BookingStatus.CANCELLED) || booking.getStatus().equals(BookingStatus.EXPIRED)) {
            throw new InvalidBookingStatusException("Cannot cancel a booking that is already " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);
        log.info("Booking cancelled successfully with ID: {}", bookingId);

        return mapToDetailResponse(booking);
    }

    @Override
    @Transactional
    public void expireBooking(UUID bookingId) {
        log.info("Expiring booking ID: {}", bookingId);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> {
                    log.error("Booking not found with ID: {}", bookingId);
                    return new RuntimeException("Booking not found with ID: " + bookingId);
                });

        if (booking.getStatus().equals(BookingStatus.PENDING)) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            log.info("Booking expired successfully with ID: {}", bookingId);
        }
    }

    @Override
    @Transactional
    public int autoExpireBookings() {
        log.info("Starting auto-expire bookings process");
        LocalDateTime now = LocalDateTime.now();
        
        List<Booking> expiredBookings = bookingRepository.findByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now);
        
        int count = 0;
        for (Booking booking : expiredBookings) {
            try {
                expireBooking(booking.getId());
                count++;
            } catch (Exception e) {
                log.error("Error expiring booking ID {}: {}", booking.getId(), e.getMessage());
            }
        }
        
        log.info("Auto-expire bookings process completed. Expired {} bookings", count);
        return count;
    }

    @Override
    public boolean isSlotAvailableForBooking(UUID slotId, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Checking availability for slot ID: {} between {} and {}", slotId, startTime, endTime);
        
        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getMaintenanceStatus() == SlotMaintenanceStatus.MAINTENANCE) {
            log.debug("Slot {} is under maintenance", slotId);
            return false;
        }

        Optional<ParkingSession> activeSession = parkingSessionRepository.findBySlotIdAndStatus(slotId, 
                ParkingSessionStatus.ACTIVE);
        if (activeSession.isPresent()) {
            log.debug("Slot {} has active session", slotId);
            return false;
        }

        List<Booking> conflictingBookings = bookingRepository.findBySlotIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                slotId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED),
                endTime,
                startTime
        );

        if (!conflictingBookings.isEmpty()) {
            log.debug("Slot {} has conflicting bookings", slotId);
            return false;
        }

        log.debug("Slot {} is available", slotId);
        return true;
    }

    @Override
    public String generateBookingCode() {
        String bookingCode;
        int attempts = 0;
        int maxAttempts = 5;

        do {
            bookingCode = "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            attempts++;
        } while (bookingRepository.findByBookingCode(bookingCode).isPresent() && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new RuntimeException("Unable to generate unique booking code after " + maxAttempts + " attempts");
        }

        return bookingCode;
    }

    @Override
    public long getActiveBookingsCount() {
        log.info("Getting active bookings count");
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.countByStatusInAndStartTimeAfter(
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED),
                now
        );
    }

    @Override
    public long getExpiringBookingsCount() {
        log.info("Getting expiring bookings count");
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.countByStatusAndBookingExpiryAtBefore(BookingStatus.PENDING, now);
    }

    @Override
    public List<BookingResponse> getMyBookings(Long userId) {
        log.info("Getting bookings for user ID: {}", userId);
        return bookingRepository.findByVehicleOwnerUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long countBookedSlotsByZone(UUID zoneId) {
        log.info("Counting booked slots for zone ID: {}", zoneId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lookahead = now.plusHours(24);
        return bookingRepository.countBookedSlotsByZone(
                zoneId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED),
                now,
                lookahead
        );
    }

    @Override
    public List<UUID> getBookedSlotIdsByZone(UUID zoneId, LocalDateTime startTime, LocalDateTime endTime) {
        log.info("Getting booked slot IDs for zone ID: {} between {} and {}", zoneId, startTime, endTime);
        LocalDateTime start = startTime;
        LocalDateTime end = endTime;
        if (start == null || end == null) {
            start = LocalDateTime.now();
            end = start.plusHours(24);
        }
        return bookingRepository.findBookedSlotIdsByZone(
                zoneId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED),
                start,
                end
        );
    }

    private ParkingSlot findAvailableSlot(Vehicle vehicle, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Finding available slot for vehicle type: {}", vehicle.getVehicleType());
        
        List<Zone> zones = zoneRepository.findByVehicleType(vehicle.getVehicleType());
        
        for (Zone zone : zones) {
            List<ParkingSlot> availableSlots = parkingSlotRepository.findAvailableSlotsByZone(zone.getId());
            
            for (ParkingSlot slot : availableSlots) {
                if (isSlotAvailableForBooking(slot.getId(), startTime, endTime)) {
                    log.debug("Found available slot: {} in zone: {}", slot.getSlotCode(), zone.getName());
                    return slot;
                }
            }
        }
        
        log.warn("No available slots found for vehicle type: {}", vehicle.getVehicleType());
        return null;
    }

    private BookingResponse mapToResponse(Booking booking) {
        LocalDateTime now = LocalDateTime.now();
        long minutesUntilExpiry = ChronoUnit.MINUTES.between(now, booking.getBookingExpiryAt());
        boolean isExpired = booking.getBookingExpiryAt().isBefore(now);

        int durationMinutes = (int) ChronoUnit.MINUTES.between(booking.getStartTime(), booking.getEndTime());

        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getVehicle().getId(),
                booking.getVehicle().getLicensePlate(),
                booking.getSlot().getSlotCode(),
                booking.getStartTime(),
                booking.getEndTime(),
                durationMinutes,
                booking.getStatus(),
                booking.getBookingExpiryAt(),
                isExpired,
                minutesUntilExpiry,
                booking.getCreatedAt()
        );
    }

    private BookingDetailResponse mapToDetailResponse(Booking booking) {
        LocalDateTime now = LocalDateTime.now();
        long minutesUntilExpiry = ChronoUnit.MINUTES.between(now, booking.getBookingExpiryAt());
        boolean isExpired = booking.getBookingExpiryAt().isBefore(now);

        int durationMinutes = (int) ChronoUnit.MINUTES.between(booking.getStartTime(), booking.getEndTime());

        return new BookingDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getVehicle().getId(),
                booking.getVehicle().getLicensePlate(),
                booking.getVehicle().getVehicleType(),
                booking.getSlot().getSlotCode(),
                booking.getSlot().getId(),
                booking.getSlot().getZone().getName(),
                booking.getSlot().getFloor().getName(),
                booking.getStartTime(),
                booking.getEndTime(),
                durationMinutes,
                booking.getStatus(),
                booking.getBookingExpiryAt(),
                isExpired,
                minutesUntilExpiry,
                null,
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
