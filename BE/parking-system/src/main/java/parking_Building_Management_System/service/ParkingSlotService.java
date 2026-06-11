package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.parkingSlot.request.BulkParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.request.ParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.response.AvailableSlotResponse;
import parking_Building_Management_System.dto.parkingSlot.response.ParkingSlotResponse;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.UUID;

public interface ParkingSlotService {
    ParkingSlotResponse createSlot(ParkingSlotRequest request);
    List<ParkingSlotResponse> bulkCreateSlots(BulkParkingSlotRequest request);
    ParkingSlotResponse getSlotById(UUID id);
    ParkingSlotResponse getSlotByCode(String slotCode);
    List<ParkingSlotResponse> getAllSlots();
    List<ParkingSlotResponse> getSlotsByFloor(UUID floorId);
    List<ParkingSlotResponse> getSlotsByZone(UUID zoneId);
    List<ParkingSlotResponse> getSlotsByMaintenanceStatus(SlotMaintenanceStatus maintenanceStatus);
    List<AvailableSlotResponse> getAvailableSlotsByFloorAndVehicleType(UUID floorId, VehicleType vehicleType);
    List<AvailableSlotResponse> getAvailableSlotsByZone(UUID zoneId);
    ParkingSlotResponse updateSlot(UUID id, ParkingSlotRequest request);
    ParkingSlotResponse updateSlotMaintenanceStatus(UUID id, SlotMaintenanceStatus maintenanceStatus);
    void deleteSlot(UUID id);
    long countAvailableSlotsByZone(UUID zoneId);
    long countOccupiedSlotsByZone(UUID zoneId);
}

