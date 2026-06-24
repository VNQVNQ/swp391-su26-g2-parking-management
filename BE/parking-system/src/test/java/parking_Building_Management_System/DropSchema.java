package parking_Building_Management_System;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
public class DropSchema {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/parking_db", "postgres", "123456");
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
            System.out.println("Schema dropped and recreated.");
        }
    }
}
