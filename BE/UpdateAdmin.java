import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class UpdateAdmin {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/parking_db", "postgres", "123456");
            
            PreparedStatement update = conn.prepareStatement("UPDATE users SET age = 30, date_of_birth = '1990-01-01' WHERE email = 'admin@parking.com'");
            int rows = update.executeUpdate();
            System.out.println("Updated admin rows: " + rows);
            
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
