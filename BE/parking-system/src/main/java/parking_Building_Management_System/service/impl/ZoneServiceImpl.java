package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.zone.request.ZoneRequest;
import parking_Building_Management_System.dto.zone.response.ZoneResponse;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.ZoneService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepository;
    private final FloorRepository floorRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @Override
    public ZoneResponse createZone(ZoneRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        if (request.getVehicleType() == null) {
            throw new RuntimeException("Vehicle type is required");
        }

        // Prevent duplicate zone names in the same floor
        boolean nameExists = zoneRepository.findByFloorId(request.getFloorId()).stream()
                .anyMatch(z -> z.getName().equalsIgnoreCase(request.getName()));
        if (nameExists) {
            throw new RuntimeException("Khu vực với tên này đã tồn tại trong tầng");
        }

        Zone zone = new Zone();
        zone.setFloor(floor);
        zone.setName(request.getName());
        zone.setVehicleType(request.getVehicleType());
        zone.setTotalSlots(request.getTotalSlots());
        zone.setIsActive(true);

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

        if (request.getName() != null) {
            // Prevent duplicate zone names in the same floor
            if (!request.getName().equalsIgnoreCase(zone.getName())) {
                boolean nameExists = zoneRepository.findByFloorId(zone.getFloor().getId()).stream()
                        .anyMatch(z -> z.getName().equalsIgnoreCase(request.getName()));
                if (nameExists) {
                    throw new RuntimeException("Khu vực với tên này đã tồn tại trong tầng");
                }
            }
            zone.setName(request.getName());
        }

        if (request.getVehicleType() != null) {
            zone.setVehicleType(request.getVehicleType());
        }

        if (request.getTotalSlots() != null) {
            zone.setTotalSlots(request.getTotalSlots());
        }

        zone = zoneRepository.save(zone);
        return mapToResponse(zone);
    }

    @Override
    public void deleteZone(UUID id) {
        if (!zoneRepository.existsById(id)) {
            throw new RuntimeException("Zone not found");
        }
        if (parkingSlotRepository.existsByZoneIdAndCurrentSessionIsNotNull(id)) {
            throw new RuntimeException("Không thể xóa vì đang có xe");
        }
        if (!parkingSlotRepository.findByZoneId(id).isEmpty()) {
            throw new RuntimeException("Không thể xóa khu vực này vì đang chứa các chỗ đỗ (Slot)");
        }
        zoneRepository.deleteById(id);
    }

    private ZoneResponse mapToResponse(Zone zone) {
        int availableSlots = parkingSlotRepository.findAvailableSlotsByZone(zone.getId(), java.time.LocalDateTime.now().plusMinutes(30)).size();
        int createdSlots = parkingSlotRepository.findByZoneId(zone.getId()).size();
        return new ZoneResponse(
                zone.getId(),
                zone.getFloor().getId(),
                zone.getFloor().getName(),
                zone.getName(),
                zone.getVehicleType(),
                zone.getTotalSlots(),
                availableSlots,
                createdSlots,
                zone.getIsActive(),
                zone.getCreatedAt(),
                zone.getUpdatedAt()
        );
    }
}

