package parking_Building_Management_System.utils.mapper;

import org.springframework.stereotype.Component;
import parking_Building_Management_System.dto.parkingSession.response.AvailableSlotsForEntryResponse;
import parking_Building_Management_System.dto.parkingSession.response.VehicleEntryResponse;
import parking_Building_Management_System.entity.ParkingSession;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Zone;

/**
 * DTO Mapper for Vehicle Entry Flow
 */
@Component
public class ParkingSessionMapper {

    /**
     * Map ParkingSlot to AvailableSlotsForEntryResponse
     */
    public AvailableSlotsForEntryResponse toAvailableSlotResponse(
            ParkingSlot slot, 
            Long availableCount, 
            Long occupiedCount, 
            Long totalSlots) {
        
        return AvailableSlotsForEntryResponse.builder()
                .slotId(slot.getId())
                .slotCode(slot.getSlotCode())
                .floorId(slot.getFloor().getId())
                .floorName(slot.getFloor().getName())
                .zoneId(slot.getZone().getId())
                .zoneCode(slot.getZone().getId().toString().substring(0, 8))
                .zoneName(slot.getZone().getName())
                .vehicleType(slot.getVehicleType())
                .availableCount(availableCount)
                .occupiedCount(occupiedCount)
                .totalSlots(totalSlots)
                .build();
    }

    /**
     * Map ParkingSession to VehicleEntryResponse
     */
    public VehicleEntryResponse toVehicleEntryResponse(
            ParkingSession session,
            Long staffId,
            String staffName) {
        
        return VehicleEntryResponse.builder()
                .sessionId(session.getId())
                .vehicleId(session.getVehicle().getId())
                .licensePlate(session.getVehicle().getLicensePlate())
                .vehicleType(session.getVehicle().getVehicleType())
                .slotId(session.getSlot().getId())
                .slotCode(session.getSlot().getSlotCode())
                .zoneCode(session.getSlot().getZone().getId().toString().substring(0, 8))
                .zoneName(session.getSlot().getZone().getName())
                .floorName(session.getSlot().getFloor().getName())
                .entryTime(session.getEntryTime())
                .status(session.getStatus())
                .paymentStatus(session.getPaymentStatus())
                .staffId(staffId)
                .staffName(staffName)
                .hasActiveMonthlyPass(session.getMonthlyPass() != null)
                .monthlyPassId(session.getMonthlyPass() != null ? session.getMonthlyPass().getId() : null)
                .appliedMonthlyPassFee(session.getAppliedMonthlyPassFee())
                .appliedPricingRuleName(session.getAppliedRule() != null ? session.getAppliedRule().getName() : null)
                .appliedPricingRuleId(session.getAppliedRule() != null ? session.getAppliedRule().getId() : null)
                .bookingCode(session.getBooking() != null ? session.getBooking().getBookingCode() : null)
                .bookingId(session.getBooking() != null ? session.getBooking().getId() : null)
                .createdAt(session.getCreatedAt())
                .build();
    }
}

