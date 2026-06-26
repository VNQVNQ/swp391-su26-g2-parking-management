package parking_Building_Management_System.config;

import org.springframework.context.annotation.Configuration;
// CORS được handle bởi SecurityConfig.corsConfigurationSource()
// WebMvcConfigurer CORS sẽ bị override bởi Spring Security CORS nên để trống
@Configuration
public class WebConfig {
    // Không cần addCorsMappings nữa vì SecurityConfig đã xử lý CORS đúng cách
    // Việc định nghĩa CORS ở 2 nơi gây conflict và OPTIONS bị block
}
