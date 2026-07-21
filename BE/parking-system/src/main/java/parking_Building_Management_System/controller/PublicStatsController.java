package parking_Building_Management_System.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import parking_Building_Management_System.dto.PublicStatsResponse;
import parking_Building_Management_System.repository.FloorRepository;
import parking_Building_Management_System.repository.ZoneRepository;
import parking_Building_Management_System.repository.ParkingSlotRepository;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Slf4j
public class PublicStatsController {

    private final FloorRepository floorRepository;
    private final ZoneRepository zoneRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @GetMapping("/stats")
    public ResponseEntity<PublicStatsResponse> getPublicStats() {
        log.info("GET /api/v1/public/stats - Fetching public stats for landing page");
        long totalFloors = floorRepository.count();
        long totalZones = zoneRepository.count();
        long totalSlots = parkingSlotRepository.count();

        PublicStatsResponse stats = PublicStatsResponse.builder()
                .totalFloors(totalFloors)
                .totalZones(totalZones)
                .totalSlots(totalSlots)
                .build();
        
        return ResponseEntity.ok(stats);
    }
}
