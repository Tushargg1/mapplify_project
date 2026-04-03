package com.mapplify.service;

import com.mapplify.model.HistoryEvent;
import com.mapplify.model.UserAccount;
import com.mapplify.repository.HistoryEventRepository;
import com.mapplify.repository.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class HistoryService {

    private final HistoryEventRepository historyRepo;
    private final UserAccountRepository userRepo;

    public HistoryService(HistoryEventRepository historyRepo, UserAccountRepository userRepo) {
        this.historyRepo = historyRepo;
        this.userRepo = userRepo;
    }

    public List<HistoryEvent> fetchRecentEvents() {
        return historyRepo.findTop300ByOrderByCreatedAtDesc();
    }

    public HistoryEvent createEvent(Map<String, Object> payload) {
        String eventType = asString(payload.get("eventType"), "").trim().toLowerCase();
        if (eventType.isBlank()) {
            throw new IllegalArgumentException("eventType is required");
        }

        HistoryEvent event = new HistoryEvent();
        event.setEventType(eventType);

        String actorUserId = asString(payload.get("actorUserId"), null);
        event.setActorUserId(actorUserId);
        event.setActorName(asString(payload.get("actorName"), null));
        event.setActorEmail(asString(payload.get("actorEmail"), null));
        event.setActorPhone(asString(payload.get("actorPhone"), null));
        event.setRoomId(asString(payload.get("roomId"), null));
        event.setReason(asString(payload.get("reason"), null));
        event.setDestinationLabel(asString(payload.get("destinationLabel"), null));
        event.setDistanceMeters(asDouble(payload.get("distanceMeters")));
        event.setDurationMinutes(asInteger(payload.get("durationMinutes")));
        event.setStartedAt(asLong(payload.get("startedAt")));
        event.setEndedAt(asLong(payload.get("endedAt")));
        event.setEventTs(asLong(payload.get("eventTs")));
        
        // Trip/SOS location data
        event.setTripStartLat(asDouble(payload.get("tripStartLat")));
        event.setTripStartLng(asDouble(payload.get("tripStartLng")));
        event.setTripEndLat(asDouble(payload.get("tripEndLat")));
        event.setTripEndLng(asDouble(payload.get("tripEndLng")));
        event.setSosLat(asDouble(payload.get("sosLat")));
        event.setSosLng(asDouble(payload.get("sosLng")));

        hydrateActorProfileFromUserId(event);
        return historyRepo.save(event);
    }

    public HistoryEvent createSafetyAlertEvent(String roomId, String userId, String name, String reason, Object ts, Double lat, Double lng) {
        HistoryEvent event = new HistoryEvent();
        event.setEventType("sos");
        event.setActorUserId(userId);
        event.setActorName(name);
        event.setRoomId(roomId);
        event.setReason(reason);
        event.setEventTs(asLong(ts));
        event.setSosLat(lat);
        event.setSosLng(lng);

        hydrateActorProfileFromUserId(event);
        return historyRepo.save(event);
    }

    private void hydrateActorProfileFromUserId(HistoryEvent event) {
        if (event.getActorEmail() != null && !event.getActorEmail().isBlank()) {
            return;
        }

        Long accountId = parseAccountId(event.getActorUserId());
        if (accountId == null) return;

        Optional<UserAccount> account = userRepo.findById(accountId);
        if (account.isEmpty()) return;

        UserAccount user = account.get();
        if (event.getActorName() == null || event.getActorName().isBlank()) {
            event.setActorName(user.getName());
        }
        event.setActorEmail(user.getEmail());
        if (event.getActorPhone() == null || event.getActorPhone().isBlank()) {
            event.setActorPhone(user.getPhoneNumber());
        }
    }

    private static Long parseAccountId(String actorUserId) {
        if (actorUserId == null || actorUserId.isBlank()) return null;
        String prefix = actorUserId;
        int dash = actorUserId.indexOf('-');
        if (dash > 0) {
            prefix = actorUserId.substring(0, dash);
        }

        try {
            return Long.parseLong(prefix);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String asString(Object value, String fallback) {
        if (value == null) return fallback;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? fallback : text;
    }

    private static Long asLong(Object value) {
        if (value == null) return null;
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Integer asInteger(Object value) {
        if (value == null) return null;
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Double asDouble(Object value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
