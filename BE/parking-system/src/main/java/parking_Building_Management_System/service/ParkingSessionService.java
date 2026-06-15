package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.parkingSession.request.VehicleEntryRequest;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.EntryValidationResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.dto.parkingSession.request.PaymentRequest;
import parking_Building_Management_System.dto.parkingSession.response.FeeCalculationResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service cho Vehicle Entry Flow (Phase 3)
 * Xử lý các BR: BR-03, BR-23~BR-32
 */
public interface ParkingSessionService {

    /**
     * BR-03: Validate xe - kiểm tra nợ phí
     * BR-23: License plate bắt buộc
     */
    EntryValidationResponse validateVehicleForEntry(String licensePlate);

    /**
     * BR-26: Tìm slot Free và Available
     * Trả về danh sách slot có sẵn trong zone cho vehicle type tương ứng
     */
    List<AvailableSlotsForEntryResponse> findAvailableSlots(UUID zoneId, String licensePlate);

    /**
     * BR-27: Tạo ParkingSession + Update Slot (transactional)
     * BR-28: entry_time do server generate
     * BR-29: Chỉ Staff mới tạo được
     * BR-30: vehicleType xe phải khớp slot
     * BR-31: sessionID phải unique (UUID)
     */
    VehicleEntryResponse createParkingSession(VehicleEntryRequest request, Long staffId);

    /**
     * Lấy thông tin session hiện tại của xe
     */
    ParkingSession getActiveParkingSessionByVehicle(UUID vehicleId);

    /**
     * Lấy thông tin session theo ID
     */
    ParkingSession getParkingSessionById(UUID sessionId);

    /**
     * Tìm tất cả session active
     */
    List<ParkingSession> getAllActiveSessions();

    /**
     * BR-04: Auto-flag overstay (scheduler)
     * Tìm tất cả session quá 24h
     */
    List<ParkingSession> findSessionsOverstay24Hours();

    /**
     * Cập nhật session khi exit (dành cho exit flow)
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
     */
    FeeCalculationResponse calculateParkingFee(UUID sessionId);

}
