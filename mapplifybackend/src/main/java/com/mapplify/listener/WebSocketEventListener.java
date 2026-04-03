package com.mapplify.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal listener: keeps session -> roomId|userId mapping and emits leave presence on disconnect.
 * Uses Map payloads for broadcasting.
 */
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessagingTemplate messagingTemplate;

    // sessionId -> "roomId|userId"
    private final Map<String, String> sessionToRoomUser = new ConcurrentHashMap<>();

    // A local mirror of members by room stored as room -> (userId -> userMap)
    // Note: This is optional; keep in sync with controller if used. For safety we'll maintain it here when registerSession is called.
    private final Map<String, Map<String, Map<String, Object>>> membersByRoom = new ConcurrentHashMap<>();

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Call this from your controller when you want to register session->user mapping:
     * headerAccessor.getSessionId()
     */
    public void registerSessionForUser(String sessionId, String roomId, String userId, Map<String, Object> userMap) {
        if (sessionId == null || roomId == null || userId == null) return;
        sessionToRoomUser.put(sessionId, roomId + "|" + userId);

        membersByRoom.putIfAbsent(roomId, new ConcurrentHashMap<>());
        membersByRoom.get(roomId).put(userId, userMap);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        logger.info("STOMP: Session disconnected: {}", sessionId);
        String entry = sessionToRoomUser.remove(sessionId);
        if (entry == null) return;
        String[] parts = entry.split("\\|", 2);
        if (parts.length < 2) return;
        String roomId = parts[0];
        String userId = parts[1];

        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
        Map<String, Object> removed = null;
        if (roomMembers != null) removed = roomMembers.remove(userId);

        Map<String, Object> presence = Map.of(
                "type", "presence",
                "action", "leave",
                "user", removed,
                "roomId", roomId
        );

        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, presence);

        Map<String, Object> membersPayload = Map.of(
                "type", "members",
                "members", roomMembers != null ? roomMembers.values() : java.util.List.of()
        );

        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/members", membersPayload);
    }
}
