package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.dto.zone.request.ZoneRequest;
import parking_Building_Management_System.dto.zone.response.ZoneResponse;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.ZoneService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepository;
    private final FloorRepository floorRepository;

    @Override
    public ZoneResponse createZone(ZoneRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        Zone zone = new Zone();
        zone.setFloor(floor);
        zone.setName(request.getName());
        zone.setVehicleType(request.getVehicleType());
        zone.setTotalSlots(request.getTotalSlots());
        zone.setAvailableSlots(request.getTotalSlots());

        zone = zoneRepository.save(zone);
        return mapToResponse(zone);
    }

    @Override
    public ZoneResponse getZoneById(UUID id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        return mapToResponse(zone);
    }

    @Override
    public List<ZoneResponse> getAllZones() {
        return zoneRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneResponse> getZonesByFloor(UUID floorId) {
        return zoneRepository.findByFloorId(floorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneResponse> getZonesByVehicleType(VehicleType vehicleType) {
        return zoneRepository.findByVehicleType(vehicleType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ZoneResponse getZoneByFloorAndVehicleType(UUID floorId, VehicleType vehicleType) {
        Zone zone = zoneRepository.findByFloorIdAndVehicleType(floorId, vehicleType);
        if (zone == null) {
            throw new RuntimeException("Zone not found for floor and vehicle type");
        }
        return mapToResponse(zone);
    }

    @Override
    public ZoneResponse updateZone(UUID id, ZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));

        zone.setName(request.getName());
        zone.setVehicleType(request.getVehicleType());
        zone.setTotalSlots(request.getTotalSlots());

        zone = zoneRepository.save(zone);
        return mapToResponse(zone);
    }

    @Override
    public void deleteZone(UUID id) {
        if (!zoneRepository.existsById(id)) {
            throw new RuntimeException("Zone not found");
        }
        zoneRepository.deleteById(id);
    }

    @Override
    public void updateAvailableSlots(UUID zoneId, int count) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setAvailableSlots(zone.getAvailableSlots() + count);
        zoneRepository.save(zone);
    }

    private ZoneResponse mapToResponse(Zone zone) {
        return new ZoneResponse(
                zone.getId(),
                zone.getFloor().getId(),
                zone.getFloor().getName(),
                zone.getName(),
                zone.getVehicleType(),
                zone.getTotalSlots(),
                zone.getAvailableSlots(),
                zone.getCreatedAt(),
                zone.getUpdatedAt()
        );
    }
}

