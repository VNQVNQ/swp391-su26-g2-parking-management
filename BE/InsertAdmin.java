import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class InsertAdmin {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/parking_db", "postgres", "123456");
            
            // Get ADMIN role_id
            PreparedStatement getRole = conn.prepareStatement("SELECT role_id FROM roles WHERE role_code = 'ADMIN'");
            ResultSet rs = getRole.executeQuery();
            if (!rs.next()) {
                System.out.println("ADMIN role not found!");
                return;
            }
            int roleId = rs.getInt("role_id");
            
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
            String hash = encoder.encode("123456");
            
            PreparedStatement insert = conn.prepareStatement(
                "INSERT INTO users (role_id, full_name, email, phone_number, identify_number, password, address, gender, user_is_active, created_at, updated_at) " +
                "VALUES (?, 'Admin System', 'admin@parking.com', '0999999999', '000000000000', ?, 'Admin Address', 'MALE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                "ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password"
            );
            insert.setInt(1, roleId);
            insert.setString(2, hash);
            
            int rows = insert.executeUpdate();
            System.out.println("Inserted/Updated admin rows: " + rows);
            
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
