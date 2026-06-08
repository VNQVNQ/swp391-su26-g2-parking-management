package parking_Building_Management_System.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        // Trả về một đối tượng MailSender trống để thỏa mãn Dependency Injection
        return new JavaMailSenderImpl();
    }
}