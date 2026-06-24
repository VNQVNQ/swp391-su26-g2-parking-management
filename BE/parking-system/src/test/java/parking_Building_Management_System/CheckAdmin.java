package parking_Building_Management_System;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckAdmin {

    @Test
    public void testCheckAdmin() throws Exception {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/parking_db", "postgres", "123456");
             Statement stmt = conn.createStatement()) {
            
            System.out.println("=== START DB CHECK ===");
            try {
                ResultSet rs = stmt.executeQuery("SELECT u.id, u.email, r.name as role_name " +
                        "FROM users u " +
                        "JOIN roles r ON u.role_id = r.id " +
                        "WHERE r.name = 'ADMIN' OR u.email = 'admin@parking.com'");
                
                boolean found = false;
                while (rs.next()) {
                    found = true;
                    System.out.println("Found Admin Account:");
                    System.out.println("ID: " + rs.getLong("id"));
                    System.out.println("Email: " + rs.getString("email"));
                    System.out.println("Role: " + rs.getString("role_name"));
                    System.out.println("-------------------------");
                }
                if (!found) {
                    System.out.println("No admin accounts found with the given query.");
                }
            } catch (Exception e) {
                System.out.println("Query 1 failed: " + e.getMessage());
                try {
                    ResultSet rs2 = stmt.executeQuery("SELECT * FROM users");
                    while (rs2.next()) {
                        System.out.println("User ID: " + rs2.getLong("id") + ", Email: " + rs2.getString("email"));
                    }
                } catch (Exception ex) {
                    System.out.println("Query 2 failed: " + ex.getMessage());
                }
            }
            System.out.println("=== END DB CHECK ===");
        }
    }
}
