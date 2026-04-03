////package com.mapplify.controller;
////
////import org.slf4j.Logger;
////import org.slf4j.LoggerFactory;
////import org.springframework.messaging.handler.annotation.MessageMapping;
////import org.springframework.messaging.handler.annotation.Payload;
////import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
////import org.springframework.messaging.simp.SimpMessagingTemplate;
////import org.springframework.stereotype.Controller;
////
////import com.mapplify.model.Room;
////import com.mapplify.service.RoomService;
////
////import java.util.Map;
////import java.util.concurrent.ConcurrentHashMap;
////
////@Controller
////public class WebSocketController {
////
////    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);
////
////    private final SimpMessagingTemplate messagingTemplate;
////    private final RoomService roomService;
////
////    // roomId -> (userId -> userDataMap)
////    private final Map<String, Map<String, Map<String, Object>>> membersByRoom = new ConcurrentHashMap<>();
////
////    public WebSocketController(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
////        this.messagingTemplate = messagingTemplate;
////        this.roomService = roomService;
////    }
////
////    // ----------------------------------------------------------------------
////    // JOIN ROOM
////    // ----------------------------------------------------------------------
////    @MessageMapping("/join")
////    public void joinRoom(@Payload Map<String, Object> msg, SimpMessageHeaderAccessor headerAccessor) {
////
////        String roomId = (String) msg.get("roomId");
////        String userId = (String) msg.get("userId");
////        String name = (String) msg.get("name");
////
////        if (roomId == null || userId == null) {
////            logger.warn("JOIN missing fields: {}", msg);
////            return;
////        }
////
////        // If room does NOT exist → reject join
////        Room room = roomService.getRoom(roomId);
////        if (room == null) {
////            logger.warn("JOIN rejected: room {} does not exist", roomId);
////
////            messagingTemplate.convertAndSend("/topic/rooms/" + roomId,
////                    Map.of("type", "error", "message", "Room does not exist"));
////            return;
////        }
////
////        membersByRoom.putIfAbsent(roomId, new ConcurrentHashMap<>());
////        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
////
////        // Create participant data
////        Map<String, Object> participant = new ConcurrentHashMap<>();
////        participant.put("userId", userId);
////        participant.put("name", name);
////
////        // Save participant
////        roomMembers.put(userId, participant);
////
////        // Broadcast JOIN event
////        messagingTemplate.convertAndSend("/topic/rooms/" + roomId,
////                Map.of(
////                        "type", "presence",
////                        "action", "join",
////                        "user", participant
////                )
////        );
////
////        pushMembers(roomId);
////    }
////
////    // ----------------------------------------------------------------------
////    // LEAVE ROOM
////    // ----------------------------------------------------------------------
////    @MessageMapping("/leave")
////    public void leaveRoom(@Payload Map<String, Object> msg) {
////
////        String roomId = (String) msg.get("roomId");
////        String userId = (String) msg.get("userId");
////
////        if (roomId == null || userId == null) return;
////
////        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
////        if (roomMembers == null) return;
////
////        Map<String, Object> removed = roomMembers.remove(userId);
////
////        messagingTemplate.convertAndSend("/topic/rooms/" + roomId,
////                Map.of(
////                        "type", "presence",
////                        "action", "leave",
////                        "user", removed
////                )
////        );
////
////        pushMembers(roomId);
////    }
////
////    // ----------------------------------------------------------------------
////    // POSITION UPDATE
////    // ----------------------------------------------------------------------
////    @MessageMapping("/position")
////    public void handlePosition(@Payload Map<String, Object> pos) {
////
////        String roomId = (String) pos.get("roomId");
////        String userId = (String) pos.get("userId");
////
////        if (roomId == null || userId == null) return;
////
////        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, pos);
////
////        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
////        if (roomMembers != null) {
////
////            Map<String, Object> member = roomMembers.get(userId);
////            if (member != null) {
////                if (pos.get("lat") != null) member.put("lat", pos.get("lat"));
////                if (pos.get("lng") != null) member.put("lng", pos.get("lng"));
////                if (pos.get("ts") != null) member.put("ts", pos.get("ts"));
////            }
////        }
////
////        pushMembers(roomId);
////    }
////
////    // ----------------------------------------------------------------------
////    // DESTINATION UPDATE
////    // ----------------------------------------------------------------------
////    @MessageMapping("/destination")
////    public void handleDestination(@Payload Map<String, Object> destination) {
////
////        String roomId = (String) destination.get("roomId");
////        if (roomId == null) return;
////
////        messagingTemplate.convertAndSend("/topic/rooms/" + roomId,
////                Map.of(
////                        "type", "destination",
////                        "lat", destination.get("lat"),
////                        "lng", destination.get("lng")
////                ));
////    }
////
////    // ----------------------------------------------------------------------
////    // SEND MEMBERS + OWNERID
////    // ----------------------------------------------------------------------
////    private void pushMembers(String roomId) {
////
////        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
////        if (roomMembers == null) return;
////
////        Room room = roomService.getRoom(roomId);
////
////        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/members",
////                Map.of(
////                        "type", "members",
////                        "ownerId", room != null ? room.getOwnerId() : null,
////                        "members", roomMembers.values()
////                )
////        );
////    }
////}
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//package com.mapplify.controller;
//
//import com.mapplify.model.Participant;
//import com.mapplify.model.Room;
//import com.mapplify.service.RoomService;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.messaging.handler.annotation.MessageMapping;
//import org.springframework.messaging.handler.annotation.Payload;
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.stereotype.Controller;
//
//import java.util.Map;
//import java.util.concurrent.ConcurrentHashMap;
//
//@Controller
//public class WebSocketController {
//
//    private static final Logger log = LoggerFactory.getLogger(WebSocketController.class);
//
//    private final SimpMessagingTemplate messaging;
//    private final RoomService roomService;
//
//    // roomId → (userId → userData)
//    private final Map<String, Map<String, Map<String, Object>>> membersByRoom = new ConcurrentHashMap<>();
//
//    public WebSocketController(SimpMessagingTemplate messaging, RoomService roomService) {
//        this.messaging = messaging;
//        this.roomService = roomService;
//    }
//
//    @MessageMapping("/join")
//    public void join(@Payload Map<String, Object> msg) {
//
//        String roomId = (String) msg.get("roomId");
//        String userId = (String) msg.get("userId");
//        String name = (String) msg.get("name");
//
//        Room room = roomService.getRoom(roomId);
//
//        if (room == null) {
//            messaging.convertAndSend("/topic/rooms/" + roomId,
//                    Map.of("type", "error", "message", "Room does not exist"));
//            return;
//        }
//
//        membersByRoom.putIfAbsent(roomId, new ConcurrentHashMap<>());
//
//        Map<String, Object> user = new ConcurrentHashMap<>();
//        user.put("userId", userId);
//        user.put("name", name);
//
//        membersByRoom.get(roomId).put(userId, user);
//
//        messaging.convertAndSend("/topic/rooms/" + roomId,
//                Map.of("type", "presence", "action", "join", "user", user));
//
//        pushMembers(roomId);
//    }
//
//    @MessageMapping("/leave")
//    public void leave(@Payload Map<String, Object> msg) {
//
//        String roomId = (String) msg.get("roomId");
//        String userId = (String) msg.get("userId");
//
//        Map<String, Map<String, Object>> roomMembers = membersByRoom.get(roomId);
//        if (roomMembers == null) return;
//
//        Map<String, Object> removed = roomMembers.remove(userId);
//
//        messaging.convertAndSend("/topic/rooms/" + roomId,
//                Map.of("type", "presence", "action", "leave", "user", removed));
//
//        pushMembers(roomId);
//    }
//
//    @MessageMapping("/position")
//    public void position(@Payload Map<String, Object> msg) {
//
//        String roomId = (String) msg.get("roomId");
//        String userId = (String) msg.get("userId");
//
//        messaging.convertAndSend("/topic/rooms/" + roomId, msg);
//
//        Map<String, Map<String, Object>> members = membersByRoom.get(roomId);
//        if (members != null && members.containsKey(userId)) {
//
//            if (msg.get("lat") != null) members.get(userId).put("lat", msg.get("lat"));
//            if (msg.get("lng") != null) members.get(userId).put("lng", msg.get("lng"));
//            if (msg.get("ts") != null) members.get(userId).put("ts", msg.get("ts"));
//        }
//
//        pushMembers(roomId);
//    }
//
//    @MessageMapping("/destination")
//    public void destination(@Payload Map<String, Object> msg) {
//
//        String roomId = (String) msg.get("roomId");
//
//        messaging.convertAndSend("/topic/rooms/" + roomId,
//                Map.of("type", "destination",
//                        "lat", msg.get("lat"),
//                        "lng", msg.get("lng")));
//    }
//
//    private void pushMembers(String roomId) {
//
//        Room room = roomService.getRoom(roomId);
//
//        messaging.convertAndSend("/topic/rooms/" + roomId + "/members",
//                Map.of(
//                        "type", "members",
//                        "ownerId", room != null ? room.getOwnerId() : null,
//                        "members", membersByRoom.get(roomId).values()
//                ));
//    }
//}
//























package com.mapplify.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.mapplify.service.RoomService;
import com.mapplify.service.HistoryService;
import com.mapplify.model.Room;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messaging;
    private final RoomService roomService;
    private final HistoryService historyService;

    private final Map<String, Map<String, Map<String, Object>>> members = new ConcurrentHashMap<>();

    public WebSocketController(SimpMessagingTemplate messaging, RoomService roomService, HistoryService historyService) {
        this.messaging = messaging;
        this.roomService = roomService;
        this.historyService = historyService;
    }

    @MessageMapping("/join")
    public void join(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = (String) msg.get("userId");
        String name = (String) msg.get("name");

        if (roomId == null || roomId.isBlank() || userId == null || userId.isBlank()) {
            return;
        }

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        members.putIfAbsent(roomId, new ConcurrentHashMap<>());
        var roomMembers = members.get(roomId);

        var user = new ConcurrentHashMap<String, Object>();
        user.put("userId", userId);
        user.put("name", (name == null || name.isBlank()) ? userId : name);

        roomMembers.put(userId, user);

        messaging.convertAndSend("/topic/rooms/" + roomId,
                Map.of("type", "presence", "action", "join", "user", user));

        pushMembers(roomId);

        if (room.getDestLat() != null && room.getDestLng() != null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                Map.of(
                    "type", "destination",
                    "lat", room.getDestLat(),
                    "lng", room.getDestLng()
                ));
        }
    }

    @MessageMapping("/leave")
    public void leave(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = (String) msg.get("userId");

        if (roomId == null || roomId.isBlank() || userId == null || userId.isBlank()) {
            return;
        }

        var roomMembers = members.get(roomId);
        if (roomMembers == null) return;

        var removed = roomMembers.remove(userId);

        Map<String, Object> removedPayload = new LinkedHashMap<>();
        removedPayload.put("userId", userId);
        if (removed != null) {
            removedPayload.putAll(removed);
        }

        messaging.convertAndSend("/topic/rooms/" + roomId,
                Map.of("type", "presence", "action", "leave", "user", removedPayload));

        pushMembers(roomId);
    }

    @MessageMapping("/position")
    public void position(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = (String) msg.get("userId");
        if (roomId == null || userId == null) return;

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        messaging.convertAndSend("/topic/rooms/" + roomId, msg);

        members.putIfAbsent(roomId, new ConcurrentHashMap<>());
        var roomMembers = members.get(roomId);

        boolean createdMember = false;
        var member = roomMembers.get(userId);
        if (member == null) {
            member = new ConcurrentHashMap<>();
            member.put("userId", userId);
            if (msg.get("name") != null) {
                member.put("name", String.valueOf(msg.get("name")));
            }
            roomMembers.put(userId, member);
            createdMember = true;
        }

        if (member.get("name") == null && msg.get("name") != null) {
            member.put("name", String.valueOf(msg.get("name")));
        }
        if (msg.get("lat") != null) member.put("lat", msg.get("lat"));
        if (msg.get("lng") != null) member.put("lng", msg.get("lng"));
        if (msg.get("ts") != null) member.put("ts", msg.get("ts"));

        // Always push the latest members snapshot so every client stays in sync
        // even if a position event was missed on a flaky connection.
        pushMembers(roomId);
    }

    @MessageMapping("/destination")
    public void destination(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = (String) msg.get("userId");

        if (roomId == null || roomId.isBlank()) {
            return;
        }

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        if (userId == null || !room.getOwnerId().equals(userId)) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "FORBIDDEN", "message", "Only room owner can change destination"));
            return;
        }

        if (msg.get("lat") == null || msg.get("lng") == null) return;

        Double lat = Double.parseDouble(msg.get("lat").toString());
        Double lng = Double.parseDouble(msg.get("lng").toString());
        roomService.updateDestination(roomId, lat, lng);

        messaging.convertAndSend("/topic/rooms/" + roomId,
                Map.of(
                    "type", "destination",
                    "lat", lat,
                    "lng", lng
                ));
    }

    @MessageMapping("/safety-alert")
    public void safetyAlert(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = msg.get("userId") == null ? null : String.valueOf(msg.get("userId"));

        if (roomId == null || roomId.isBlank() || userId == null || userId.isBlank()) {
            return;
        }

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        String name = msg.get("name") == null ? userId : String.valueOf(msg.get("name"));
        String reason = msg.get("reason") == null
                ? "No response to safety check"
                : String.valueOf(msg.get("reason"));

        Double lat = null;
        Double lng = null;
        if (msg.get("lat") != null) {
            try {
                lat = Double.parseDouble(msg.get("lat").toString());
            } catch (Exception e) {
                // Ignore invalid lat
            }
        }
        if (msg.get("lng") != null) {
            try {
                lng = Double.parseDouble(msg.get("lng").toString());
            } catch (Exception e) {
                // Ignore invalid lng
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "safety-alert");
        payload.put("roomId", roomId);
        payload.put("userId", userId);
        payload.put("name", name);
        payload.put("reason", reason);
        payload.put("lat", lat);
        payload.put("lng", lng);
        payload.put("ts", msg.get("ts") != null ? msg.get("ts") : System.currentTimeMillis());

        historyService.createSafetyAlertEvent(
            roomId,
            userId,
            name,
            reason,
            payload.get("ts"),
            lat,
            lng
        );

        messaging.convertAndSend("/topic/rooms/" + roomId, payload);
    }

    @MessageMapping("/broadcast")
    public void broadcast(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String userId = msg.get("userId") == null ? null : String.valueOf(msg.get("userId"));
        if (roomId == null || roomId.isBlank() || userId == null || userId.isBlank()) {
            return;
        }

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        String name = msg.get("name") == null ? userId : String.valueOf(msg.get("name"));
        String message = msg.get("message") == null ? "" : String.valueOf(msg.get("message")).trim();
        String messageId = msg.get("messageId") == null
            ? userId + "-" + System.currentTimeMillis()
            : String.valueOf(msg.get("messageId")).trim();
        if (message.isBlank()) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "broadcast");
        payload.put("roomId", roomId);
        payload.put("userId", userId);
        payload.put("name", name);
        payload.put("message", message);
        payload.put("messageId", messageId);
        payload.put("ts", msg.get("ts") != null ? msg.get("ts") : System.currentTimeMillis());

        messaging.convertAndSend("/topic/rooms/" + roomId, payload);
    }

    @MessageMapping("/add-stop")
    public void addStop(@Payload Map<String, Object> msg) {
        String roomId = (String) msg.get("roomId");
        String memberId = msg.get("memberId") == null ? null : String.valueOf(msg.get("memberId"));
        if (roomId == null || roomId.isBlank() || memberId == null || memberId.isBlank()) {
            return;
        }

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            messaging.convertAndSend("/topic/rooms/" + roomId,
                    Map.of("type", "error", "code", "ROOM_NOT_FOUND", "message", "Room not found"));
            return;
        }

        Double lat = parseDoubleValue(msg.get("lat"));
        Double lng = parseDoubleValue(msg.get("lng"));
        if (lat == null || lng == null) {
            return;
        }

        String memberName = msg.get("memberName") == null ? memberId : String.valueOf(msg.get("memberName"));
        String reason = msg.get("reason") == null ? "stop" : String.valueOf(msg.get("reason"));
        String placeName = msg.get("placeName") == null ? "Stop" : String.valueOf(msg.get("placeName"));
        Object ts = msg.get("ts") != null ? msg.get("ts") : System.currentTimeMillis();
        String ownerId = room.getOwnerId() == null ? "" : String.valueOf(room.getOwnerId());
        String visibility = ownerId.equals(memberId) ? "shared" : "private";

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "stop-added");
        payload.put("roomId", roomId);
        payload.put("memberId", memberId);
        payload.put("memberName", memberName);
        payload.put("reason", reason);
        payload.put("placeName", placeName);
        payload.put("lat", lat);
        payload.put("lng", lng);
        payload.put("visibility", visibility);
        payload.put("ts", ts);

        Map<String, Object> historyPayload = new LinkedHashMap<>();
        historyPayload.put("eventType", "stop");
        historyPayload.put("actorUserId", memberId);
        historyPayload.put("actorName", memberName);
        historyPayload.put("roomId", roomId);
        historyPayload.put("reason", reason + ": " + placeName);
        historyPayload.put("eventTs", ts);
        historyPayload.put("tripEndLat", lat);
        historyPayload.put("tripEndLng", lng);
        historyService.createEvent(historyPayload);

        messaging.convertAndSend("/topic/rooms/" + roomId, payload);
    }

    private Double parseDoubleValue(Object value) {
        if (value == null) return null;
        try {
            double parsed = Double.parseDouble(String.valueOf(value));
            return Double.isFinite(parsed) ? parsed : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private void pushMembers(String roomId) {
        Room room = roomService.getRoom(roomId);
        var roomMembers = members.computeIfAbsent(roomId, id -> new ConcurrentHashMap<>());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "members");
        payload.put("ownerId", room != null && room.getOwnerId() != null ? room.getOwnerId() : "");
        payload.put("members", new ArrayList<>(roomMembers.values()));

        messaging.convertAndSend("/topic/rooms/" + roomId + "/members", payload);
    }
}

