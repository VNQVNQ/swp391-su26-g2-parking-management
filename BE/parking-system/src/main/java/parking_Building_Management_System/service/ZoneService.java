package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.zone.request.ZoneRequest;
import parking_Building_Management_System.dto.zone.response.ZoneResponse;
import parking_Building_Management_System.entity.enums.VehicleType;
import java.util.List;
import java.util.UUID;

public interface ZoneService {
    ZoneResponse createZone(ZoneRequest request);
    ZoneResponse getZoneById(UUID id);
    List<ZoneResponse> getAllZones();
    List<ZoneResponse> getZonesByFloor(UUID floorId);
    List<ZoneResponse> getZonesByVehicleType(VehicleType vehicleType);
    ZoneResponse getZoneByFloorAndVehicleType(UUID floorId, VehicleType vehicleType);
    ZoneResponse updateZone(UUID id, ZoneRequest request);
    void deleteZone(UUID id);
}

