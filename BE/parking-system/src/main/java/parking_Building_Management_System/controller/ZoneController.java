package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import parking_Building_Management_System.dto.zone.request.ZoneRequest;
import parking_Building_Management_System.dto.zone.response.ZoneResponse;
import parking_Building_Management_System.entity.enums.VehicleType;
import parking_Building_Management_System.service.ZoneService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @PostMapping
    public ResponseEntity<ZoneResponse> createZone(@RequestBody ZoneRequest request) {
        ZoneResponse response = zoneService.createZone(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneResponse> getZoneById(@PathVariable UUID id) {
        ZoneResponse response = zoneService.getZoneById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ZoneResponse>> getAllZones() {
        List<ZoneResponse> responses = zoneService.getAllZones();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<ZoneResponse>> getZonesByFloor(@PathVariable UUID floorId) {
        List<ZoneResponse> responses = zoneService.getZonesByFloor(floorId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/vehicle-type/{vehicleType}")
    public ResponseEntity<List<ZoneResponse>> getZonesByVehicleType(@PathVariable VehicleType vehicleType) {
        List<ZoneResponse> responses = zoneService.getZonesByVehicleType(vehicleType);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/floor/{floorId}/vehicle-type/{vehicleType}")
    public ResponseEntity<ZoneResponse> getZoneByFloorAndVehicleType(
            @PathVariable UUID floorId,
            @PathVariable VehicleType vehicleType) {
        ZoneResponse response = zoneService.getZoneByFloorAndVehicleType(floorId, vehicleType);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZoneResponse> updateZone(@PathVariable UUID id, @RequestBody ZoneRequest request) {
        ZoneResponse response = zoneService.updateZone(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(@PathVariable UUID id) {
        zoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }
}

