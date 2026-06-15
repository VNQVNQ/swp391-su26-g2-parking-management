package parking_Building_Management_System.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import parking_Building_Management_System.dto.floor.request.FloorRequest;
import parking_Building_Management_System.dto.floor.response.FloorResponse;
import parking_Building_Management_System.entity.Floor;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.service.FloorService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FloorServiceImpl implements FloorService {

    private final FloorRepository floorRepository;

    @Override
    public FloorResponse createFloor(FloorRequest request) {
        Floor floor = new Floor();
        floor.setName(request.getName());
        floor.setLevelNumber(request.getLevelNumber());
        floor.setDescription(request.getDescription());
        floor.setIsActive(true);

        floor = floorRepository.save(floor);
        return mapToResponse(floor);
    }

    @Override
    public FloorResponse getFloorById(UUID id) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Floor not found"));
        return mapToResponse(floor);
    }

    @Override
    public List<FloorResponse> getAllFloors() {
        return floorRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FloorResponse updateFloor(UUID id, FloorRequest request) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        floor.setName(request.getName());
        floor.setLevelNumber(request.getLevelNumber());
        floor.setDescription(request.getDescription());

        floor = floorRepository.save(floor);
        return mapToResponse(floor);
    }

    @Override
    public void deleteFloor(UUID id) {
        if (!floorRepository.existsById(id)) {
            throw new RuntimeException("Floor not found");
        }
        floorRepository.deleteById(id);
    }

    @Override
    public FloorResponse getFloorByLevel(Integer level) {
        Floor floor = floorRepository.findByLevelNumber(level)
                .orElseThrow(() -> new RuntimeException("Floor not found with level: " + level));
        return mapToResponse(floor);
    }

    private FloorResponse mapToResponse(Floor floor) {
        return new FloorResponse(
                floor.getId(),
                floor.getName(),
                floor.getLevelNumber(),
                floor.getDescription(),
                floor.getIsActive(),
                floor.getCreatedAt(),
                floor.getUpdatedAt()
        );
    }
}

