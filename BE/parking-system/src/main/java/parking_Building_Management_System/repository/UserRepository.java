package parking_Building_Management_System.repository;

import parking_Building_Management_System.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;

import java.util.Date;

public interface UserRepository extends JpaRepository<User, Long> {
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.lastActive = :newDate WHERE u.user_id = :userId")
    int updateLastActive(@Param("userId") Long userId, @Param("newDate") Date newDate);

    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.lastActive < :cutoffDate AND u.userIsActive = true")
    int deleteByLastActiveBefore(@Param("cutoffDate") Date cutoffDate);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.email = :email")
    User findByEmail(@Param("email") String email);

    User findByRefreshToken(String refreshToken);
}
