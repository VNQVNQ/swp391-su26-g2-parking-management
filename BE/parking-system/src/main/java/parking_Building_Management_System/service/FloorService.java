package parking_Building_Management_System.service;

import parking_Building_Management_System.dto.floor.request.FloorRequest;
import parking_Building_Management_System.dto.floor.response.FloorResponse;
import java.util.List;
import java.util.UUID;

public interface FloorService {
    FloorResponse createFloor(FloorRequest request);
    FloorResponse getFloorById(UUID id);
    List<FloorResponse> getAllFloors();
    FloorResponse updateFloor(UUID id, FloorRequest request);
    void deleteFloor(UUID id);
    FloorResponse getFloorByLevel(Integer level);
}

