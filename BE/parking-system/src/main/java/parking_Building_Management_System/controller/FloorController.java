package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.request.FloorRequest;
import parking_Building_Management_System.dto.response.FloorResponse;
import parking_Building_Management_System.service.FloorService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorService floorService;

    @PostMapping
    public ResponseEntity<FloorResponse> createFloor(@RequestBody FloorRequest request) {
        FloorResponse response = floorService.createFloor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FloorResponse> getFloorById(@PathVariable UUID id) {
        FloorResponse response = floorService.getFloorById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FloorResponse>> getAllFloors() {
        List<FloorResponse> responses = floorService.getAllFloors();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<FloorResponse> getFloorByLevel(@PathVariable Integer level) {
        FloorResponse response = floorService.getFloorByLevel(level);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FloorResponse> updateFloor(@PathVariable UUID id, @RequestBody FloorRequest request) {
        FloorResponse response = floorService.updateFloor(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFloor(@PathVariable UUID id) {
        floorService.deleteFloor(id);
        return ResponseEntity.noContent().build();
    }
}

