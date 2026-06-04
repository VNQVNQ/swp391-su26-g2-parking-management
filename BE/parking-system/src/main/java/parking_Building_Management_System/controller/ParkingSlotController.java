package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.parkingSlot.request.BulkParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.request.ParkingSlotRequest;
import parking_Building_Management_System.dto.parkingSlot.response.AvailableSlotResponse;
import parking_Building_Management_System.dto.parkingSlot.response.ParkingSlotResponse;
import parking_Building_Management_System.entity.enums.SlotStatus;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.service.ParkingSlotService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/parking-slots")
@RequiredArgsConstructor
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    @PostMapping
    public ResponseEntity<ParkingSlotResponse> createSlot(@RequestBody ParkingSlotRequest request) {
        ParkingSlotResponse response = parkingSlotService.createSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ParkingSlotResponse>> bulkCreateSlots(@RequestBody BulkParkingSlotRequest request) {
        List<ParkingSlotResponse> responses = parkingSlotService.bulkCreateSlots(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingSlotResponse> getSlotById(@PathVariable UUID id) {
        ParkingSlotResponse response = parkingSlotService.getSlotById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/code/{slotCode}")
    public ResponseEntity<ParkingSlotResponse> getSlotByCode(@PathVariable String slotCode) {
        ParkingSlotResponse response = parkingSlotService.getSlotByCode(slotCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ParkingSlotResponse>> getAllSlots() {
        List<ParkingSlotResponse> responses = parkingSlotService.getAllSlots();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<ParkingSlotResponse>> getSlotsByFloor(@PathVariable UUID floorId) {
        List<ParkingSlotResponse> responses = parkingSlotService.getSlotsByFloor(floorId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<List<ParkingSlotResponse>> getSlotsByZone(@PathVariable UUID zoneId) {
        List<ParkingSlotResponse> responses = parkingSlotService.getSlotsByZone(zoneId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ParkingSlotResponse>> getSlotsByStatus(@PathVariable SlotStatus status) {
        List<ParkingSlotResponse> responses = parkingSlotService.getSlotsByStatus(status);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/available/floor/{floorId}/vehicle-type/{vehicleType}")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlotsByFloorAndVehicleType(
            @PathVariable UUID floorId,
            @PathVariable VehicleType vehicleType) {
        List<AvailableSlotResponse> responses = parkingSlotService.getAvailableSlotsByFloorAndVehicleType(floorId, vehicleType);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/available/zone/{zoneId}")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlotsByZone(@PathVariable UUID zoneId) {
        List<AvailableSlotResponse> responses = parkingSlotService.getAvailableSlotsByZone(zoneId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParkingSlotResponse> updateSlot(@PathVariable UUID id, @RequestBody ParkingSlotRequest request) {
        ParkingSlotResponse response = parkingSlotService.updateSlot(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ParkingSlotResponse> updateSlotStatus(
            @PathVariable UUID id,
            @RequestParam SlotStatus status) {
        ParkingSlotResponse response = parkingSlotService.updateSlotStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable UUID id) {
        parkingSlotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/zone/{zoneId}/available-count")
    public ResponseEntity<Long> countAvailableSlotsByZone(@PathVariable UUID zoneId) {
        long count = parkingSlotService.countAvailableSlotsByZone(zoneId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/zone/{zoneId}/occupied-count")
    public ResponseEntity<Long> countOccupiedSlotsByZone(@PathVariable UUID zoneId) {
        long count = parkingSlotService.countOccupiedSlotsByZone(zoneId);
        return ResponseEntity.ok(count);
    }
}

