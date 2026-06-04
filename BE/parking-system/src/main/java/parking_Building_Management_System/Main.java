package parking_Building_Management_System;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "parking_Building_Management_System")
public class Main {
    public static void main(String[] args) {
        System.out.println("=".repeat(50));
        System.out.println("Starting Parking Management System");
        System.out.println("Java version: " + System.getProperty("java.version"));
        System.out.println("=".repeat(50));

        SpringApplication.run(Main.class, args);

        System.out.println("=".repeat(50));
        System.out.println("Parking Management System Started Successfully!");
        System.out.println("API Documentation: http://localhost:8080/swagger-ui.html");
        System.out.println("=".repeat(50));
    }
}
