package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.booking.request.BookingRequest;
import parking_Building_Management_System.dto.booking.request.UpdateBookingRequest;
import parking_Building_Management_System.dto.booking.response.BookingResponse;
import parking_Building_Management_System.dto.booking.response.BookingDetailResponse;
import parking_Building_Management_System.exception.SlotNotAvailableException;
import parking_Building_Management_System.exception.BookingExpiredException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingService {
    
    BookingResponse createBooking(BookingRequest request, UUID vehicleId) throws SlotNotAvailableException;
    
    BookingDetailResponse getBookingById(UUID id);
    
    BookingDetailResponse getBookingByCode(String bookingCode);
    
    List<BookingResponse> getAllBookings();
    
    List<BookingResponse> getBookingsByVehicle(UUID vehicleId);
    
    List<BookingResponse> getActiveBookingsByVehicle(UUID vehicleId);
    
    List<BookingResponse> getBookingsBySlot(UUID slotId);
    
    List<BookingResponse> getAvailableBookingsByDateRange(LocalDateTime startTime, LocalDateTime endTime);
    
    BookingDetailResponse confirmBooking(UUID bookingId, Long staffId) throws BookingExpiredException;
    
    BookingDetailResponse cancelBooking(UUID bookingId, Long cancelledByUserId);
    
    void expireBooking(UUID bookingId);
    
    int autoExpireBookings();
    
    boolean isSlotAvailableForBooking(UUID slotId, LocalDateTime startTime, LocalDateTime endTime);
    
    String generateBookingCode();
    
    long getActiveBookingsCount();
    
    long getExpiringBookingsCount();

    List<BookingResponse> getMyBookings(Long userId);

    long countBookedSlotsByZone(UUID zoneId);

    List<UUID> getBookedSlotIdsByZone(UUID zoneId, LocalDateTime startTime, LocalDateTime endTime);
}
