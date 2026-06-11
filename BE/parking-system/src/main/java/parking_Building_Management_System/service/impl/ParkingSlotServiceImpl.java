package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import parking_Building_Management_System.dto.parkingSlot.request.BulkParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.request.ParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.response.AvailableSlotResponse;
import parking_Building_Management_System.dto.parkingSlot.response.ParkingSlotResponse;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.entity.ParkingSlot;
import parking_Building_Management_System.entity.Zone;
import parking_Building_Management_System.entity.enums.SlotMaintenanceStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.service.ParkingSlotService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ParkingSlotServiceImpl implements ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final FloorRepository floorRepository;
    private final ZoneRepository zoneRepository;

    @Override
    public ParkingSlotResponse createSlot(ParkingSlotRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found"));

        // Verify slot code is unique
        if (parkingSlotRepository.findBySlotCode(request.getSlotCode()).isPresent()) {
            throw new RuntimeException("Slot code already exists: " + request.getSlotCode());
        }

        ParkingSlot slot = new ParkingSlot();
        slot.setSlotCode(request.getSlotCode());
        slot.setFloor(floor);
        slot.setZone(zone);
        slot.setVehicleType(request.getVehicleType());
        slot.setMaintenanceStatus(SlotMaintenanceStatus.AVAILABLE);

        slot = parkingSlotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    public List<ParkingSlotResponse> bulkCreateSlots(BulkParkingSlotRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found"));

        List<ParkingSlot> slots = request.getSlotCodes().stream()
                .map(slotCode -> {
                    // Verify slot code is unique
                    if (parkingSlotRepository.findBySlotCode(slotCode).isPresent()) {
                        throw new RuntimeException("Slot code already exists: " + slotCode);
                    }

                    ParkingSlot slot = new ParkingSlot();
                    slot.setSlotCode(slotCode);
                    slot.setFloor(floor);
                    slot.setZone(zone);
                    slot.setVehicleType(request.getVehicleType());
                    slot.setMaintenanceStatus(SlotMaintenanceStatus.AVAILABLE);
                    return slot;
                })
                .collect(Collectors.toList());

        slots = parkingSlotRepository.saveAll(slots);
        return slots.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public ParkingSlotResponse getSlotById(UUID id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));
        return mapToResponse(slot);
    }

    @Override
    public ParkingSlotResponse getSlotByCode(String slotCode) {
        ParkingSlot slot = parkingSlotRepository.findBySlotCode(slotCode)
                .orElseThrow(() -> new RuntimeException("Parking slot not found: " + slotCode));
        return mapToResponse(slot);
    }

    @Override
    public List<ParkingSlotResponse> getAllSlots() {
        return parkingSlotRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingSlotResponse> getSlotsByFloor(UUID floorId) {
        return parkingSlotRepository.findByFloorId(floorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingSlotResponse> getSlotsByZone(UUID zoneId) {
        return parkingSlotRepository.findByZoneId(zoneId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingSlotResponse> getSlotsByMaintenanceStatus(SlotMaintenanceStatus maintenanceStatus) {
        return parkingSlotRepository.findByMaintenanceStatus(maintenanceStatus)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AvailableSlotResponse> getAvailableSlotsByFloorAndVehicleType(UUID floorId, VehicleType vehicleType) {
        return parkingSlotRepository.findAvailableSlotsByFloorAndVehicleType(floorId, vehicleType)
                .stream()
                .map(this::mapToAvailableResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AvailableSlotResponse> getAvailableSlotsByZone(UUID zoneId) {
        return parkingSlotRepository.findAvailableSlotsByZone(zoneId)
                .stream()
                .map(this::mapToAvailableResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ParkingSlotResponse updateSlot(UUID id, ParkingSlotRequest request) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));

        if (!slot.getSlotCode().equals(request.getSlotCode()) &&
            parkingSlotRepository.findBySlotCode(request.getSlotCode()).isPresent()) {
            throw new RuntimeException("Slot code already exists: " + request.getSlotCode());
        }

        slot.setSlotCode(request.getSlotCode());
        slot.setVehicleType(request.getVehicleType());

        slot = parkingSlotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    public ParkingSlotResponse updateSlotMaintenanceStatus(UUID id, SlotMaintenanceStatus maintenanceStatus) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));

        slot.setMaintenanceStatus(maintenanceStatus);
        slot = parkingSlotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    public void deleteSlot(UUID id) {
        if (!parkingSlotRepository.existsById(id)) {
            throw new RuntimeException("Parking slot not found");
        }
        parkingSlotRepository.deleteById(id);
    }

    @Override
    public long countAvailableSlotsByZone(UUID zoneId) {
        return parkingSlotRepository.countByZoneIdAndMaintenanceStatus(zoneId, SlotMaintenanceStatus.AVAILABLE);
    }

    @Override
    public long countOccupiedSlotsByZone(UUID zoneId) {
        // OCCUPIED = currentSession IS NOT NULL AND maintenanceStatus == AVAILABLE
        return parkingSlotRepository.findByZoneIdAndMaintenanceStatus(zoneId, SlotMaintenanceStatus.AVAILABLE)
                .stream()
                .filter(slot -> slot.getCurrentSession() != null)
                .count();
    }

    private ParkingSlotResponse mapToResponse(ParkingSlot slot) {
        return new ParkingSlotResponse(
                slot.getId(),
                slot.getSlotCode(),
                slot.getFloor().getId(),
                slot.getFloor().getName(),
                slot.getZone().getId(),
                slot.getZone().getName(),
                slot.getVehicleType(),
                slot.getMaintenanceStatus(),
                slot.getCurrentSession() != null ? slot.getCurrentSession().getId() : null,
                slot.getCreatedAt(),
                slot.getUpdatedAt()
        );
    }

    private AvailableSlotResponse mapToAvailableResponse(ParkingSlot slot) {
        return new AvailableSlotResponse(
                slot.getId(),
                slot.getSlotCode(),
                slot.getFloor().getId(),
                slot.getFloor().getName(),
                slot.getZone().getId(),
                slot.getZone().getName(),
                slot.getVehicleType()
        );
    }
}

