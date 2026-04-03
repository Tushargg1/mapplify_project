package com.mapplify.controller;

import com.mapplify.model.HistoryEvent;
import com.mapplify.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getEvents() {
        List<Map<String, Object>> rows = historyService.fetchRecentEvents()
                .stream()
                .map(HistoryController::toResponse)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> payload) {
        try {
            HistoryEvent created = historyService.createEvent(payload);
            return ResponseEntity.ok(toResponse(created));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    private static Map<String, Object> toResponse(HistoryEvent event) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", event.getId());
        response.put("eventType", event.getEventType());
        response.put("actorUserId", event.getActorUserId());
        response.put("actorName", event.getActorName());
        response.put("actorEmail", event.getActorEmail());
        response.put("actorPhone", event.getActorPhone());
        response.put("roomId", event.getRoomId());
        response.put("reason", event.getReason());
        response.put("destinationLabel", event.getDestinationLabel());
        response.put("distanceMeters", event.getDistanceMeters());
        response.put("durationMinutes", event.getDurationMinutes());
        response.put("startedAt", event.getStartedAt());
        response.put("endedAt", event.getEndedAt());
        response.put("eventTs", event.getEventTs());
        response.put("createdAt", event.getCreatedAt());
        return response;
    }
}
