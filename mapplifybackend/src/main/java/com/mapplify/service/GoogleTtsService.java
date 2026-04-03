package com.mapplify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GoogleTtsService {

    private static final String GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

    @Value("${google.tts.api.key:${google.maps.api.key:${GOOGLE_MAPS_SERVER_API_KEY:}}}")
    private String googleTtsApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public Map<String, String> synthesize(String text) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.isBlank()) {
            return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
        }

        if (googleTtsApiKey == null || googleTtsApiKey.isBlank()) {
            return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("input", Map.of("text", normalized));
            payload.put("voice", Map.of(
                    "languageCode", "hi-IN",
                    "name", "hi-IN-Neural2-D"
            ));
            payload.put("audioConfig", Map.of(
                    "audioEncoding", "MP3",
                    "speakingRate", 1.0,
                    "pitch", 0.0
            ));

            String body = objectMapper.writeValueAsString(payload);
            String url = GOOGLE_TTS_URL + "?key=" + googleTtsApiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(18))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String audioContent = root.path("audioContent").asText("").trim();
            if (audioContent.isBlank()) {
                return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
            }

            // Validate base64 shape before returning.
            Base64.getDecoder().decode(audioContent);
            return Map.of("audioBase64", audioContent, "audioMimeType", "audio/mpeg");
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
        } catch (IllegalArgumentException ex) {
            return Map.of("audioBase64", "", "audioMimeType", "audio/mpeg");
        }
    }
}
