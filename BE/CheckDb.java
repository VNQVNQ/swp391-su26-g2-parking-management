import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDb {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/parking_db", "postgres", "123456");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT u.email, r.role_code FROM users u JOIN roles r ON u.role_id = r.role_id");
            while (rs.next()) {
                System.out.println("USER: " + rs.getString("email") + " | ROLE: " + rs.getString("role_code"));
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
