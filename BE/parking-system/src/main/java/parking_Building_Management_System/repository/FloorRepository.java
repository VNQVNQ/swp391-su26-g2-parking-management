package parking_Building_Management_System.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import parking_Building_Management_System.entity.Floor;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FloorRepository extends JpaRepository<Floor, UUID> {
    Optional<Floor> findByLevelNumber(Integer levelNumber);
    
    @Query("SELECT COUNT(z) FROM Zone z WHERE z.floor.id = :floorId")
    long countZonesByFloorId(@Param("floorId") UUID floorId);
}


