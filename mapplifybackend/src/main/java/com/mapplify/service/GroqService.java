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
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class GroqService {

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_AUDIO_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String DEFAULT_MODEL = "llama-3.1-8b-instant";
    private static final List<String> WHISPER_MODELS = List.of("whisper-large-v3");
    private static final Set<String> ALLOWED_PLACE_TYPES = new LinkedHashSet<>(Set.of(
            "restaurant",
            "meal_takeaway",
            "meal_delivery",
            "cafe",
            "bakery",
            "supermarket",
            "convenience_store",
            "shopping_mall",
            "store",
            "gas_station",
            "parking",
            "car_repair",
            "car_wash",
            "lodging",
            "travel_agency",
            "hospital",
            "pharmacy",
            "doctor",
            "police",
            "fire_station",
            "atm",
            "bank",
            "airport",
            "bus_station",
            "train_station",
            "subway_station",
            "taxi_stand",
            "park",
            "stadium",
            "amusement_park",
            "movie_theater",
            "gym",
            "spa",
            "hair_care",
            "beauty_salon",
            "school",
            "university",
            "library",
            "post_office",
            "tourist_attraction",
            "museum",
            "zoo",
            "hindu_temple",
            "mosque",
            "church",
            "restroom"
    ));

    @Value("${groq.api.key:${GROQ_API_KEY:}}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public String reconstructMessage(String brokenText) {
        String normalized = brokenText == null ? "" : brokenText.trim();
        if (normalized.isBlank()) {
            return "";
        }

        String prompt = """
            A user spoke this voice message, words may be missing:
                \"%s\"
            Reconstruct the same intended message in simple natural words.
            Do not add extra warnings, safety advice, or new meaning.
                Reply with ONLY the reconstructed sentence, nothing else.
                """.formatted(normalized);

        String response = callGroq(prompt);
        return response.isBlank() ? normalized : response;
    }

    public String createBriefAssistantLine(String text, String mode, Map<String, Object> extras) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.isBlank()) {
            return "";
        }

        String selectedMode = mode == null ? "broadcast" : mode.trim().toLowerCase(Locale.ROOT);
        String prompt;

        if ("nearby".equals(selectedMode)) {
            String placeType = extras == null ? "nearby" : String.valueOf(extras.getOrDefault("placeType", "nearby"));
            String count = extras == null ? "0" : String.valueOf(extras.getOrDefault("count", "0"));
            prompt = """
                    You are a navigation voice assistant.
                    Create one short spoken line (max 12 words) for nearby search results.
                    Context:
                    - Base message: "%s"
                    - Place type: %s
                    - Result count: %s
                    Reply with only the final sentence.
                    """.formatted(normalized, placeType, count);
        } else {
            String senderName = extras == null ? "" : String.valueOf(extras.getOrDefault("senderName", "")).trim();
            prompt = """
                Rewrite this into one short, clear spoken sentence (max 12 words):
                    "%s"
                Speaker name: "%s"
                Rules:
                - Keep original meaning only.
                - Do not add warnings or motivational/safety text.
                - If speaker name is present, include it naturally once.
                Reply with only the sentence.
                """.formatted(normalized, senderName);
        }

        String response = callGroq(prompt);
        return response.isBlank() ? normalized : response;
    }

    public String extractPlaceType(String command) {
        String normalized = command == null ? "" : command.trim();
        if (normalized.isBlank()) {
            return "restaurant";
        }

        String normalizedIntent = normalizeIntentToEnglishHints(normalized);

        String semanticAliasMatch = mapSemanticIntentToPlaceType(normalized + " " + normalizedIntent);
        if (!semanticAliasMatch.isBlank()) {
            return semanticAliasMatch;
        }

        String stationHeuristic = mapStationIntent(normalized + " " + normalizedIntent);
        if (!stationHeuristic.isBlank()) {
            return stationHeuristic;
        }

        String keywordMatch = mapPlaceTypeByKeywords(normalized);
        if (!keywordMatch.isBlank()) {
            return keywordMatch;
        }

        String normalizedKeywordMatch = mapPlaceTypeByKeywords(normalizedIntent);
        if (!normalizedKeywordMatch.isBlank()) {
            return normalizedKeywordMatch;
        }

        String prompt = """
                Extract the Google Places API type from this command:
                \"%s\"
            Command can be in English, Hindi, or Hinglish.
                Reply with ONLY one exact value from this set:
                %s
                Use 'restroom' for washroom/toilet/public bathroom intent.
                Nothing else.
            """.formatted(normalized, String.join(", ", ALLOWED_PLACE_TYPES));

        String raw = callGroq(prompt).toLowerCase(Locale.ROOT).trim();
        if (ALLOWED_PLACE_TYPES.contains(raw)) {
            return raw;
        }

        if (raw.contains("restroom") || raw.contains("washroom") || raw.contains("toilet") || raw.contains("bathroom")) {
            return "restroom";
        }
        if (raw.contains("fuel") || raw.contains("petrol") || raw.contains("diesel") || raw.contains("gas station")) {
            return "gas_station";
        }
        if (raw.contains("airport") || raw.contains("air port")) {
            return "airport";
        }
        if (raw.contains("metro") || raw.contains("subway")) {
            return "subway_station";
        }
        if (raw.contains("railway") || raw.contains("train station") || raw.contains("train")) {
            return "train_station";
        }
        if (raw.contains("bus stand") || raw.contains("bus station") || raw.contains("bus")) {
            return "bus_station";
        }
        if (raw.contains("playground")) {
            return "park";
        }
        if (raw.contains("hospital") || raw.contains("doctor") || raw.contains("emergency")) {
            return "hospital";
        }
        if (raw.contains("hotel") || raw.contains("stay") || raw.contains("motel")) {
            return "lodging";
        }
        if (raw.contains("coffee") || raw.contains("tea") || raw.contains("cafe")) {
            return "cafe";
        }
        if (raw.contains("mall") || raw.contains("shopping")) {
            return "shopping_mall";
        }
        if (raw.contains("gym") || raw.contains("fitness") || raw.contains("workout")) {
            return "gym";
        }

        String fallbackFromRaw = mapPlaceTypeByKeywords(raw);
        if (!fallbackFromRaw.isBlank()) {
            return fallbackFromRaw;
        }

        String rawAliasMatch = mapSemanticIntentToPlaceType(raw);
        return rawAliasMatch.isBlank() ? "restaurant" : rawAliasMatch;
    }

    private String mapSemanticIntentToPlaceType(String text) {
        String value = text == null ? "" : text.toLowerCase(Locale.ROOT);
        if (value.isBlank()) return "";

        // Food intent aliases: user can say natural terms like pizza shop without strict keywords.
        if (value.contains("pizza") || value.contains("pizzeria") || value.contains("puzza") || value.contains("piza")
            || value.contains("burger") || value.contains("butger") || value.contains("sandwich")
                || value.contains("fries") || value.contains("fast food")
                || value.contains("momo") || value.contains("chaat")
                || value.contains("biryani") || value.contains("dhaba")) {
            return "meal_takeaway";
        }

        if (value.contains("coffee shop") || value.contains("chai") || value.contains("tea shop")) {
            return "cafe";
        }

        if (value.contains("chemist") || value.contains("medicine shop") || value.contains("medical store")) {
            return "pharmacy";
        }

        if (value.contains("workshop") || value.contains("mechanic")) {
            return "car_repair";
        }

        if (value.contains("salon") || value.contains("barber")) {
            return "beauty_salon";
        }

        if (value.contains("mandir")) return "hindu_temple";
        if (value.contains("masjid")) return "mosque";
        if (value.contains("church")) return "church";

        return "";
    }

    private String normalizeIntentToEnglishHints(String text) {
        String value = text == null ? "" : text.trim();
        if (value.isBlank()) {
            return "";
        }

        String prompt = """
                Convert this spoken nearby-search query into a short English intent phrase.
                Keep location words like nearest/nearby and place words like metro station, airport, washroom, gym.
                Return plain English only.
                Query: "%s"
                """.formatted(value);

        String normalized = callGroq(prompt).toLowerCase(Locale.ROOT).trim();
        return normalized.isBlank() ? value.toLowerCase(Locale.ROOT) : normalized;
    }

    private String mapStationIntent(String text) {
        String value = text == null ? "" : text.toLowerCase(Locale.ROOT);
        if (value.isBlank()) return "";

        boolean hasStation = value.contains("station")
                || value.contains("स्टेशन")
                || value.contains("سٹیشن")
                || value.contains("स्टेसन");

        if (!hasStation && !value.contains("metro") && !value.contains("मेट्रो") && !value.contains("ٹرین") && !value.contains("bus")) {
            return "";
        }

        if (value.contains("metro") || value.contains("subway") || value.contains("मेट्रो") || value.contains("میٹرو")) {
            return "subway_station";
        }
        if (value.contains("railway") || value.contains("train") || value.contains("रेल") || value.contains("ट्रेन") || value.contains("ٹرین")) {
            return "train_station";
        }
        if (value.contains("bus") || value.contains("बस") || value.contains("بس")) {
            return "bus_station";
        }

        return "";
    }

    private String mapPlaceTypeByKeywords(String text) {
        String value = text == null ? "" : text.toLowerCase(Locale.ROOT);
        if (value.isBlank()) return "";

        if (value.contains("petrol") || value.contains("fuel") || value.contains("diesel") || value.contains("gas station") || value.contains("pump")) {
            return "gas_station";
        }
        if (value.contains("restroom") || value.contains("washroom") || value.contains("toilet") || value.contains("bathroom")
                || value.contains("शौचालय") || value.contains("बाथरूम") || value.contains("वॉशरूम") || value.contains("टॉयलेट")) {
            return "restroom";
        }
        if (value.contains("airport") || value.contains("air port") || value.contains("हवाई अड्डा") || value.contains("एयरपोर्ट")) {
            return "airport";
        }
        if (value.contains("metro") || value.contains("subway") || value.contains("मेट्रो")) {
            return "subway_station";
        }
        if (value.contains("railway") || value.contains("train station") || value.contains("train") || value.contains("रेलवे") || value.contains("ट्रेन")) {
            return "train_station";
        }
        if (value.contains("bus stand") || value.contains("bus station") || value.contains("bus") || value.contains("बस स्टैंड") || value.contains("बस अड्डा")) {
            return "bus_station";
        }
        if (value.contains("playground") || value.contains("ground") || value.contains("खेल का मैदान") || value.contains("मैदान")) {
            return "park";
        }
        if (value.contains("जिम") || value.contains("gym") || value.contains("fitness") || value.contains("workout") || value.contains("व्यायाम")) {
            return "gym";
        }
        if (value.contains("hospital") || value.contains("doctor") || value.contains("medical") || value.contains("clinic")) {
            return "hospital";
        }
        if (value.contains("hotel") || value.contains("stay") || value.contains("lodge") || value.contains("motel")) {
            return "lodging";
        }
        if (value.contains("mall") || value.contains("shopping") || value.contains("market")) {
            return "shopping_mall";
        }
        if (value.contains("cafe") || value.contains("coffee") || value.contains("tea")) {
            return "cafe";
        }
        if (value.contains("tourist") || value.contains("attraction") || value.contains("visit") || value.contains("monument") || value.contains("temple")) {
            return "tourist_attraction";
        }
        if (value.contains("food") || value.contains("eat") || value.contains("restaurant") || value.contains("restraunt") || value.contains("restraunts") || value.contains("dinner") || value.contains("lunch") || value.contains("breakfast")) {
            return "restaurant";
        }

        return "";
    }

    public String transcribeAudioBase64(String audioBase64, String mimeType, String fileName) {
        if (audioBase64 == null || audioBase64.isBlank()) {
            return "";
        }

        try {
            byte[] audioBytes = Base64.getDecoder().decode(audioBase64);
            return transcribeAudio(audioBytes, mimeType, fileName);
        } catch (IllegalArgumentException ex) {
            return "";
        }
    }

    public String transcribeAudio(byte[] audioBytes, String mimeType, String fileName) {
        if (audioBytes == null || audioBytes.length == 0) {
            return "";
        }

        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "";
        }

        String safeMime = (mimeType == null || mimeType.isBlank()) ? "audio/webm" : mimeType.trim();
        if (safeMime.contains(";")) {
            safeMime = safeMime.substring(0, safeMime.indexOf(';')).trim();
        }
        String safeFileName = (fileName == null || fileName.isBlank()) ? "voice.webm" : fileName.trim();

        for (String model : WHISPER_MODELS) {
            String boundary = "----GroqBoundary" + UUID.randomUUID();
            try {
                byte[] requestBody = buildMultipartRequest(boundary, safeFileName, safeMime, audioBytes, model);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_AUDIO_API_URL))
                        .timeout(Duration.ofSeconds(22))
                        .header("Authorization", "Bearer " + groqApiKey)
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    continue;
                }

                JsonNode root = objectMapper.readTree(response.body());
                String text = root.path("text").asText("").trim();
                if (!text.isBlank()) {
                    return text;
                }
            } catch (IOException | InterruptedException ex) {
                if (ex instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        return "";
    }

    private byte[] buildMultipartRequest(
            String boundary,
            String fileName,
            String mimeType,
            byte[] audioBytes,
            String model
    )
            throws IOException {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        byte[] lineBreak = "\r\n".getBytes(StandardCharsets.UTF_8);

        String modelPart = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"model\"\r\n\r\n"
                + model + "\r\n";
        baos.write(modelPart.getBytes(StandardCharsets.UTF_8));

            String promptPart = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"prompt\"\r\n\r\n"
                + "Driver voice note from India. Convert Hindi/Hinglish/Indian English speech to clear text. Output plain Roman-script English words only, never Urdu/Arabic script. Keep place names and road words accurate.\r\n";
            baos.write(promptPart.getBytes(StandardCharsets.UTF_8));

        String languagePart = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"language\"\r\n\r\n"
                + "hi\r\n";
        baos.write(languagePart.getBytes(StandardCharsets.UTF_8));

        String tempPart = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"temperature\"\r\n\r\n"
                + "0\r\n";
        baos.write(tempPart.getBytes(StandardCharsets.UTF_8));

        String fileHeader = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"\r\n"
                + "Content-Type: " + mimeType + "\r\n\r\n";
        baos.write(fileHeader.getBytes(StandardCharsets.UTF_8));
        baos.write(audioBytes);
        baos.write(lineBreak);

        String closing = "--" + boundary + "--\r\n";
        baos.write(closing.getBytes(StandardCharsets.UTF_8));

        return baos.toByteArray();
    }

    private String callGroq(String prompt) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "";
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", DEFAULT_MODEL,
                    "messages", List.of(Map.of("role", "user", "content", prompt)),
                    "temperature", 0.2
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_API_URL))
                    .timeout(Duration.ofSeconds(18))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "";
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                return "";
            }

            String content = choices.get(0).path("message").path("content").asText("").trim();
            return content.replaceAll("^\"|\"$", "").trim();
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return "";
        }
    }
}
