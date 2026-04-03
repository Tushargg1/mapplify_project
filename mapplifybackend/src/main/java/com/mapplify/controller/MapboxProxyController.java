package com.mapplify.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.mapplify.service.MapboxProxyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/google", "/api/mapbox"})
public class MapboxProxyController {

    private final MapboxProxyService mapboxProxyService;

    public MapboxProxyController(MapboxProxyService mapboxProxyService) {
        this.mapboxProxyService = mapboxProxyService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam("query") String query,
            @RequestParam(value = "proximity", required = false) String proximity
    ) {
        try {
            List<Map<String, Object>> results = mapboxProxyService.search(query, proximity);
            return ResponseEntity.ok(Map.of("results", results));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("results", List.of(), "message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("results", List.of(), "message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("results", List.of(), "message", "Google Places search failed"));
        }
    }

    @GetMapping("/reverse")
    public ResponseEntity<?> reverse(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng
    ) {
        try {
            String placeName = mapboxProxyService.reverse(lat, lng);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("placeName", placeName);
            return ResponseEntity.ok(body);
        } catch (IllegalStateException ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("placeName", null);
            body.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body);
        } catch (Exception ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("placeName", null);
            body.put("message", "Google reverse geocoding failed");
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(body);
        }
    }

    @GetMapping("/route")
    public ResponseEntity<?> route(
            @RequestParam("fromLat") double fromLat,
            @RequestParam("fromLng") double fromLng,
            @RequestParam("toLat") double toLat,
            @RequestParam("toLng") double toLng
    ) {
        try {
            JsonNode route = mapboxProxyService.route(fromLat, fromLng, toLat, toLng);
            if (route == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Route not found"));
            }
            return ResponseEntity.ok(route);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Google Directions route failed"));
        }
    }
}
