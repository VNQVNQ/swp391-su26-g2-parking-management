package parking_Building_Management_System.config;

// 1. Core Spring Framework imports for Configuration and Bean
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

// 2. Springdoc OpenAPI import
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

// Add these missing security imports:
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenAPIConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .name("Bearer Authentication")
                        )
                )
                .info(new Info()
                        .title("Parking BMS API")
                        .version("1.0")
                        .description("SWP391 - Summer 2026")
                );
    }
}