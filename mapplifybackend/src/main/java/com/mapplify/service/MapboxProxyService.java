package com.mapplify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MapboxProxyService {

    private static final String PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
    private static final String PLACES_NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    private static final String GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    private static final String DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";
    private static final int DEFAULT_SEARCH_RADIUS_METERS = 40000;

    @Value("${google.maps.api.key:${GOOGLE_MAPS_SERVER_API_KEY:}}")
    private String googleMapsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> search(String query, String proximity) {
        return search(query, proximity, DEFAULT_SEARCH_RADIUS_METERS);
    }

    public List<Map<String, Object>> search(String query, String proximity, int radiusMeters) {
        ensureConfigured();

        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            throw new IllegalArgumentException("query is required");
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(PLACES_TEXT_SEARCH_URL)
            .queryParam("query", normalizedQuery)
            .queryParam("language", "en")
            .queryParam("key", googleMapsApiKey);

        double[] locationBias = parseProximity(proximity);
        if (locationBias != null) {
            int safeRadius = radiusMeters > 0 ? Math.min(radiusMeters, 50000) : DEFAULT_SEARCH_RADIUS_METERS;
            builder.queryParam("location", locationBias[0] + "," + locationBias[1]);
            builder.queryParam("radius", safeRadius);
        }

        ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);
        return mapSearchResults(response.getBody());
    }

    public String reverse(double lat, double lng) {
        ensureConfigured();

        String url = UriComponentsBuilder.fromHttpUrl(GEOCODE_URL)
            .queryParam("latlng", lat + "," + lng)
            .queryParam("language", "en")
            .queryParam("key", googleMapsApiKey)
            .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            String status = root.path("status").asText("");
            if (!"OK".equals(status)) {
                return null;
            }

            JsonNode first = root.path("results").isArray() && root.path("results").size() > 0
                ? root.path("results").get(0)
                : null;
            if (first == null) return null;

            String placeName = first.path("formatted_address").asText("");
            return placeName.isBlank() ? null : placeName;
        } catch (Exception ex) {
            return null;
        }
    }

    public List<Map<String, Object>> searchNearbyByType(String type, double lat, double lng, int radiusMeters) {
        ensureConfigured();

        String normalizedType = type == null ? "" : type.trim();
        if (normalizedType.isEmpty()) {
            throw new IllegalArgumentException("type is required");
        }

        int safeRadius = radiusMeters > 0 ? Math.min(radiusMeters, 50000) : 5000;

        String url = UriComponentsBuilder.fromHttpUrl(PLACES_NEARBY_SEARCH_URL)
            .queryParam("location", lat + "," + lng)
            .queryParam("radius", safeRadius)
            .queryParam("type", normalizedType)
            .queryParam("language", "en")
            .queryParam("key", googleMapsApiKey)
            .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        return mapSearchResults(response.getBody());
    }

    public JsonNode route(double fromLat, double fromLng, double toLat, double toLng) {
        ensureConfigured();

        String url = UriComponentsBuilder.fromHttpUrl(DIRECTIONS_URL)
            .queryParam("origin", fromLat + "," + fromLng)
            .queryParam("destination", toLat + "," + toLng)
            .queryParam("mode", "driving")
            .queryParam("alternatives", false)
            .queryParam("language", "en")
            .queryParam("key", googleMapsApiKey)
            .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            String status = root.path("status").asText("");
            if (!"OK".equals(status)) {
                return null;
            }

            JsonNode routes = root.path("routes");
            if (!routes.isArray() || routes.size() == 0) return null;
            return mapGoogleRouteToInternalShape(routes.get(0));
        } catch (Exception ex) {
            return null;
        }
    }

    private List<Map<String, Object>> mapSearchResults(String body) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (body == null || body.isBlank()) return results;

        try {
            JsonNode root = objectMapper.readTree(body);
            String status = root.path("status").asText("");
            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                return List.of();
            }

            JsonNode places = root.path("results");
            if (!places.isArray()) return results;

            for (JsonNode place : places) {
                JsonNode location = place.path("geometry").path("location");
                double lat = location.path("lat").asDouble(Double.NaN);
                double lng = location.path("lng").asDouble(Double.NaN);
                if (!Double.isFinite(lat) || !Double.isFinite(lng)) continue;

                String title = place.path("name").asText(place.path("formatted_address").asText(""));
                String label = place.path("formatted_address").asText(title);
                String id = place.path("place_id").asText(title + "-" + lat + "-" + lng);

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", id);
                item.put("title", title);
                item.put("label", label);
                item.put("lng", lng);
                item.put("lat", lat);
                results.add(item);
            }
        } catch (Exception ignored) {
            return List.of();
        }

        return results;
    }

    private JsonNode mapGoogleRouteToInternalShape(JsonNode routeNode) {
        List<List<Double>> coordinates = decodePolyline(routeNode.path("overview_polyline").path("points").asText(""));

        List<Map<String, Object>> legs = new ArrayList<>();
        double totalDistance = 0;
        double totalDuration = 0;

        JsonNode legsNode = routeNode.path("legs");
        if (legsNode.isArray()) {
            for (JsonNode leg : legsNode) {
                double legDistance = leg.path("distance").path("value").asDouble(0);
                double legDuration = leg.path("duration").path("value").asDouble(0);
                totalDistance += legDistance;
                totalDuration += legDuration;

                List<Map<String, Object>> steps = new ArrayList<>();
                JsonNode stepsNode = leg.path("steps");
                if (stepsNode.isArray()) {
                    for (JsonNode step : stepsNode) {
                        double stepDistance = step.path("distance").path("value").asDouble(0);
                        double stepDuration = step.path("duration").path("value").asDouble(0);

                        String instruction = stripHtml(step.path("html_instructions").asText(""));
                        if (instruction.isBlank()) {
                            instruction = "Continue";
                        }

                        String maneuverRaw = step.path("maneuver").asText("");
                        Map<String, String> maneuverInfo = mapGoogleManeuver(maneuverRaw, instruction);

                        JsonNode startLocation = step.path("start_location");
                        double stepLat = startLocation.path("lat").asDouble(Double.NaN);
                        double stepLng = startLocation.path("lng").asDouble(Double.NaN);

                        if (!Double.isFinite(stepLat) || !Double.isFinite(stepLng)) {
                            JsonNode endLocation = step.path("end_location");
                            stepLat = endLocation.path("lat").asDouble(Double.NaN);
                            stepLng = endLocation.path("lng").asDouble(Double.NaN);
                        }

                        if (!Double.isFinite(stepLat) || !Double.isFinite(stepLng)) {
                            continue;
                        }

                        Map<String, Object> maneuver = new LinkedHashMap<>();
                        maneuver.put("location", List.of(stepLng, stepLat));
                        maneuver.put("instruction", instruction);
                        maneuver.put("type", maneuverInfo.get("type"));
                        maneuver.put("modifier", maneuverInfo.get("modifier"));

                        Map<String, Object> mappedStep = new LinkedHashMap<>();
                        mappedStep.put("distance", stepDistance);
                        mappedStep.put("duration", stepDuration);
                        mappedStep.put("name", instruction);
                        mappedStep.put("maneuver", maneuver);
                        steps.add(mappedStep);
                    }
                }

                Map<String, Object> mappedLeg = new LinkedHashMap<>();
                mappedLeg.put("distance", legDistance);
                mappedLeg.put("duration", legDuration);
                mappedLeg.put("steps", steps);
                legs.add(mappedLeg);
            }
        }

        Map<String, Object> geometry = new LinkedHashMap<>();
        geometry.put("type", "LineString");
        geometry.put("coordinates", coordinates);

        Map<String, Object> mappedRoute = new LinkedHashMap<>();
        mappedRoute.put("geometry", geometry);
        mappedRoute.put("distance", totalDistance);
        mappedRoute.put("duration", totalDuration);
        mappedRoute.put("legs", legs);

        return objectMapper.valueToTree(mappedRoute);
    }

    private List<List<Double>> decodePolyline(String encoded) {
        List<List<Double>> coordinates = new ArrayList<>();
        if (encoded == null || encoded.isBlank()) {
            return coordinates;
        }

        int index = 0;
        int lat = 0;
        int lng = 0;

        while (index < encoded.length()) {
            int[] latValue = decodeNextValue(encoded, index);
            if (latValue == null) break;
            lat += latValue[0];
            index = latValue[1];

            int[] lngValue = decodeNextValue(encoded, index);
            if (lngValue == null) break;
            lng += lngValue[0];
            index = lngValue[1];

            coordinates.add(List.of(lng / 1e5, lat / 1e5));
        }

        return coordinates;
    }

    private int[] decodeNextValue(String encoded, int startIndex) {
        int result = 0;
        int shift = 0;
        int index = startIndex;

        while (index < encoded.length()) {
            int b = encoded.charAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
            if (b < 0x20) {
                int delta = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
                return new int[]{delta, index};
            }
        }

        return null;
    }

    private String stripHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }

        return html
            .replaceAll("<[^>]*>", " ")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private Map<String, String> mapGoogleManeuver(String rawManeuver, String instruction) {
        String raw = rawManeuver == null ? "" : rawManeuver.toLowerCase();

        String type = "";
        if (raw.contains("arrive")) {
            type = "arrive";
        } else if (raw.contains("depart")) {
            type = "depart";
        } else if (raw.contains("roundabout") || raw.contains("rotary")) {
            type = "roundabout";
        } else if (raw.contains("merge")) {
            type = "merge";
        } else if (raw.contains("fork")) {
            type = "fork";
        } else if (!raw.isBlank()) {
            type = "turn";
        }

        String modifier = "";
        if (raw.contains("uturn")) {
            modifier = "uturn";
        } else if (raw.contains("sharp-left")) {
            modifier = "sharp left";
        } else if (raw.contains("slight-left")) {
            modifier = "slight left";
        } else if (raw.contains("left")) {
            modifier = "left";
        } else if (raw.contains("sharp-right")) {
            modifier = "sharp right";
        } else if (raw.contains("slight-right")) {
            modifier = "slight right";
        } else if (raw.contains("right")) {
            modifier = "right";
        } else if (raw.contains("straight")) {
            modifier = "straight";
        }

        if (modifier.isBlank()) {
            String text = instruction == null ? "" : instruction.toLowerCase();
            if (text.contains("u-turn")) {
                modifier = "uturn";
            } else if (text.contains("sharp left")) {
                modifier = "sharp left";
            } else if (text.contains("slight left")) {
                modifier = "slight left";
            } else if (text.contains(" left")) {
                modifier = "left";
            } else if (text.contains("sharp right")) {
                modifier = "sharp right";
            } else if (text.contains("slight right")) {
                modifier = "slight right";
            } else if (text.contains(" right")) {
                modifier = "right";
            } else if (text.contains("straight") || text.contains("continue")) {
                modifier = "straight";
            }
        }

        Map<String, String> maneuver = new LinkedHashMap<>();
        maneuver.put("type", type);
        maneuver.put("modifier", modifier);
        return maneuver;
    }

    private double[] parseProximity(String proximity) {
        if (proximity == null || proximity.isBlank()) {
            return null;
        }

        String[] parts = proximity.trim().split(",");
        if (parts.length < 2) {
            return null;
        }

        try {
            double lng = Double.parseDouble(parts[0].trim());
            double lat = Double.parseDouble(parts[1].trim());
            if (!Double.isFinite(lat) || !Double.isFinite(lng)) {
                return null;
            }
            return new double[]{lat, lng};
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private void ensureConfigured() {
        if (googleMapsApiKey == null || googleMapsApiKey.isBlank()) {
            throw new IllegalStateException("GOOGLE_MAPS_SERVER_API_KEY is not configured on backend");
        }
    }
}
