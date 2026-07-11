package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.ActiveSessionResponse;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.dto.parkingSession.request.PaymentRequest;
import parking_Building_Management_System.dto.parkingSession.response.FeeCalculationResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service cho Vehicle Entry Flow (Phase 3)
 * Xử lý các BR: BR-03, BR-23~BR-32
 * Phase 4 Enhancement: Monthly Passes, Bookings, Pricing Rules
 */
public interface ParkingSessionService {

    /**
     * BR-03: Validate xe - kiểm tra nợ phí, monthly pass
     * BR-23: License plate bắt buộc
     * Phase 4: Check if vehicle has active monthly pass
     */
    EntryValidationResponse validateVehicleForEntry(String licensePlate);

    /**
     * BR-26: Tìm slot Free và Available
     * Trả về danh sách slot có sẵn trong zone cho vehicle type tương ứng
     * Phase 4: Support booking code to prioritize reserved slot
     */
    List<AvailableSlotsForEntryResponse> findAvailableSlots(UUID zoneId, String licensePlate, String bookingCode);

    /**
     * BR-27: Tạo ParkingSession + Update Slot (transactional)
     * BR-28: entry_time do server generate
     * BR-29: Chỉ PARKING_STAFF mới tạo được
     * BR-30: vehicleType xe phải khớp slot
     * BR-31: sessionID phải unique (UUID)
     * Phase 4: Support booking confirmation and monthly pass linking
     */
    VehicleEntryResponse createParkingSession(VehicleEntryRequest request, Long staffId, String bookingCode);

    /**
     * Lấy thông tin session hiện tại của xe
     * Phase 4: Include monthly pass and pricing info
     */
    ParkingSession getActiveParkingSessionByVehicle(UUID vehicleId);

    /**
     * Lấy thông tin session theo ID
     */
    ParkingSession getParkingSessionById(UUID sessionId);

    /**
     * Tìm tất cả session active
     */
    List<ActiveSessionResponse> getAllActiveSessions();

    /**
     * BR-04: Auto-flag overstay (scheduler)
     * Tìm tất cả session quá 24h
     */
    List<ParkingSession> findSessionsOverstay24Hours();

    /**
     * Cập nhật session khi exit (dành cho exit flow)
     * Phase 4: Calculate fee with monthly pass and pricing rule logic
     */
    ParkingSession updateSessionOnExit(UUID sessionId, Long staffId);

    /**
     * Kiểm tra xe có nợ phí hay không
     */
    boolean hasOutstandingFee(UUID vehicleId);

    /**
     * BR-33: Xử lý thanh toán
     * Cập nhật payment status, tạo payment record
     */
    Long processPayment(PaymentRequest request, Long staffId);

    /**
     * Cập nhật payment status của session
     */
    ParkingSession updatePaymentStatus(UUID sessionId, String paymentStatus);

    /**
     * BR-24: Tính phí khi xe exit
     * Lấy rule giá từ DB dựa trên vehicle type, ticket type, ngày
     * Áp dụng peak hour, overstay multiplier, daily max fee
     * Phase 4: Handle monthly pass (free if active), pricing rules, and overstay
     */
    FeeCalculationResponse calculateParkingFee(UUID sessionId);
}
