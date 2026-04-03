package com.mapplify.controller;

import com.mapplify.service.GroqService;
import com.mapplify.service.GoogleTtsService;
import com.mapplify.service.MapboxProxyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api")
public class VoiceAssistantController {

    private static final int MAX_NEARBY_RESULTS = 10;

    private final GroqService groqService;
    private final GoogleTtsService googleTtsService;
    private final MapboxProxyService mapboxProxyService;

    public VoiceAssistantController(
            GroqService groqService,
            GoogleTtsService googleTtsService,
            MapboxProxyService mapboxProxyService
    ) {
        this.groqService = groqService;
        this.googleTtsService = googleTtsService;
        this.mapboxProxyService = mapboxProxyService;
    }

    @PostMapping("/transcribe-audio")
    public ResponseEntity<?> transcribeAudio(@RequestBody Map<String, String> body) {
        String audioBase64 = body.getOrDefault("audioBase64", "");
        String mimeType = body.getOrDefault("mimeType", "audio/webm");
        String fileName = body.getOrDefault("fileName", "voice.webm");

        if (audioBase64.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "audioBase64 is required", "transcript", ""));
        }

        String transcript = groqService.transcribeAudioBase64(audioBase64, mimeType, fileName);
        if (transcript.isBlank()) {
            return ResponseEntity.status(502).body(Map.of(
                    "message", "Transcription failed. Check GROQ_API_KEY and microphone audio quality.",
                    "transcript", ""
            ));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("transcript", transcript);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reconstruct-message")
    public ResponseEntity<?> reconstructMessage(@RequestBody Map<String, String> body) {
        String brokenText = body.getOrDefault("text", "");
        String reconstructed = groqService.reconstructMessage(brokenText);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reconstructed", reconstructed);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/find-nearby")
    public ResponseEntity<?> findNearby(@RequestBody Map<String, Object> body) {
        String command = String.valueOf(body.getOrDefault("command", "")).trim();
        double lat = toDouble(body.get("lat"));
        double lng = toDouble(body.get("lng"));

        if (command.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "command is required", "places", List.of()));
        }
        if (!Double.isFinite(lat) || !Double.isFinite(lng)) {
            return ResponseEntity.badRequest().body(Map.of("message", "lat/lng are required", "places", List.of()));
        }

        String placeType = groqService.extractPlaceType(command);
        boolean preferTextSearch = shouldPreferTextSearch(command, placeType);
        List<Map<String, Object>> places = List.of();
        if (preferTextSearch) {
            String proximity = lng + "," + lat;
            String textQuery = buildNearbyTextQuery(command, placeType);
            places = mapboxProxyService.search(textQuery, proximity, 5000)
                .stream()
                .limit(MAX_NEARBY_RESULTS)
                .toList();

            // Fallback to strict type-based nearby search if text search returns nothing.
            if (places.isEmpty() && placeType != null && !placeType.isBlank()) {
                places = mapboxProxyService
                    .searchNearbyByType(placeType, lat, lng, 5000)
                    .stream()
                    .limit(MAX_NEARBY_RESULTS)
                    .toList();
            }
        } else {
            places = mapboxProxyService
                .searchNearbyByType(placeType, lat, lng, 5000)
                .stream()
                .limit(MAX_NEARBY_RESULTS)
                .toList();

            // If type search is too strict for this phrase, try text search with location bias.
            if (places.isEmpty()) {
                String proximity = lng + "," + lat;
                String textQuery = buildNearbyTextQuery(command, placeType);
                places = mapboxProxyService.search(textQuery, proximity, 5000)
                    .stream()
                    .limit(MAX_NEARBY_RESULTS)
                    .toList();
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("placeType", placeType);
        response.put("places", places);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/brief-message")
    public ResponseEntity<?> briefMessage(@RequestBody Map<String, Object> body) {
        String text = String.valueOf(body.getOrDefault("text", "")).trim();
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "text is required"));
        }

        String mode = String.valueOf(body.getOrDefault("mode", "broadcast")).trim();
        String message = groqService.createBriefAssistantLine(text, mode, body);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/text-to-speech")
    public ResponseEntity<?> textToSpeech(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "text is required", "audioBase64", ""));
        }

        Map<String, String> tts = googleTtsService.synthesize(text);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("audioBase64", tts.getOrDefault("audioBase64", ""));
        response.put("audioMimeType", tts.getOrDefault("audioMimeType", "audio/mpeg"));
        return ResponseEntity.ok(response);
    }

    private double toDouble(Object value) {
        if (value == null) return Double.NaN;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ex) {
            return Double.NaN;
        }
    }

    private String buildNearbyTextQuery(String command, String placeType) {
            String normalized = normalizeFoodCommand(command);
        if (normalized.isBlank()) {
            return placeType;
        }

            String specificFoodOrBrandQuery = deriveSpecificFoodOrBrandQuery(normalized);
            if (!specificFoodOrBrandQuery.isBlank()) {
                return specificFoodOrBrandQuery;
            }

        if ("restroom".equals(placeType)) {
            return normalized + " public restroom washroom toilet";
        }

        if ("meal_takeaway".equals(placeType) || "restaurant".equals(placeType)) {
            return normalized + " food";
        }

        return normalized;
    }

    private boolean shouldPreferTextSearch(String command, String placeType) {
        if ("restroom".equals(placeType)) {
            return true;
        }

            String normalized = normalizeFoodCommand(command).toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return false;
        }

            if (!deriveSpecificFoodOrBrandQuery(normalized).isBlank()) {
                return true;
            }

        // For specific dish/food-shop requests, text search is more accurate than generic place type.
        boolean isFoodType = "meal_takeaway".equals(placeType)
                || "restaurant".equals(placeType)
                || "cafe".equals(placeType)
                || "bakery".equals(placeType);

        if (!isFoodType) {
            return false;
        }

        return normalized.contains("pizza")
                || normalized.contains("burger")
                || normalized.contains("butger")
                || normalized.contains("momo")
                || normalized.contains("biryani")
                || normalized.contains("roll")
                || normalized.contains("sandwich")
                || normalized.contains("shop")
                || normalized.contains("outlet")
                || normalized.contains("dhaba")
                || normalized.contains("cafe")
                || normalized.contains("restaurant");
    }

    private String normalizeFoodCommand(String command) {
        String normalized = command == null ? "" : command.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) return "";

        return normalized
                .replace("restraunts", "restaurants")
                .replace("restraunt", "restaurant")
                .replace("resturant", "restaurant")
                .replace("restuarant", "restaurant")
                .replace("butger", "burger")
                .replace("buger", "burger")
                .replace("puzza", "pizza")
                .replace("piza", "pizza")
                .replace("pizaa", "pizza");
    }

    private String deriveSpecificFoodOrBrandQuery(String normalizedCommand) {
        if (normalizedCommand == null || normalizedCommand.isBlank()) {
            return "";
        }

        if (normalizedCommand.contains("pizza hut")) return "pizza hut";
        if (normalizedCommand.contains("domino")) return "dominos pizza";
        if (normalizedCommand.contains("burger king")) return "burger king";
        if (normalizedCommand.contains("mcdonald")) return "mcdonalds";
        if (normalizedCommand.contains("kfc")) return "kfc";
        if (normalizedCommand.contains("subway")) return "subway sandwiches";

        if (normalizedCommand.contains("pizza")) return "pizza restaurant";
        if (normalizedCommand.contains("burger")) return "burger restaurant";
        if (normalizedCommand.contains("momo")) return "momo shop";
        if (normalizedCommand.contains("biryani")) return "biryani restaurant";
        if (normalizedCommand.contains("restaurant") || normalizedCommand.contains("restaurants")) {
            return "restaurant";
        }

        return "";
    }
}
