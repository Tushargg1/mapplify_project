package com.mapplify.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${mapplify.allowed.origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // clients subscribe to /topic/** to receive broadcasts
        config.enableSimpleBroker("/topic");
        // client sends to /app/** and server maps it with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] originPatterns = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .toArray(String[]::new);

        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(originPatterns.length == 0 ? new String[]{"http://localhost:5173"} : originPatterns)
                .withSockJS();
    }
}
