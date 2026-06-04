package parking_Building_Management_System;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "parking_Building_Management_System")
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}
