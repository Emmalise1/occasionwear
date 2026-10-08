package com.occasionwear.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger/OpenAPI metadata for the OccasionWear REST API. */
@Configuration
public class OpenApiConfig {

    public static final String SCHEME = "bearerAuth";

    @Bean
    public OpenAPI occasionWearOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("OccasionWear API")
                .description("""
                    REST API for OccasionWear — an outfit booking and rental platform for Rwanda.

                    * `/api/auth/**` — public registration and login (JWT issued here)
                    * `/api/outfits/**` — public browsing and availability filtering
                    * `/api/bookings/**` — customer bookings (require a customer JWT)
                    * `/api/admin/**` — admin operations (require an ADMIN JWT)
                    """)
                .version("1.0.0")
                .contact(new Contact().name("OccasionWear").email("hello@occasionwear.rw")))
            .components(new Components().addSecuritySchemes(SCHEME, new SecurityScheme()
                .name(SCHEME)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList(SCHEME));
    }
}
