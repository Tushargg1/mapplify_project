//package com.mapplify.controller;
//
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//import java.util.UUID;
//import java.util.concurrent.ConcurrentHashMap;
//
///**
// * Dev-friendly Room controller with in-memory store.
// *
// * POST   /rooms/create   -> { roomId, ownerId, lat, lng }
// * DELETE /rooms/{roomId} -> 200 OK if removed, 404 if not found
// */
//@RestController
//@RequestMapping("/rooms")
//public class RoomRestController {
//
//    // Simple in-memory store: roomId -> ownerInfo map
//    private final Map<String, Map<String, Object>> rooms = new ConcurrentHashMap<>();
//
//    @PostMapping("/create")
//    public ResponseEntity<Map<String, Object>> createRoom(@RequestBody Map<String, Object> body) {
//        String ownerId = body.getOrDefault("ownerId", "unknown").toString();
//        Object latObj = body.get("lat");
//        Object lngObj = body.get("lng");
//
//        String roomId = UUID.randomUUID().toString().split("-")[0];
//
//        Map<String, Object> roomData = new ConcurrentHashMap<>();
//        roomData.put("roomId", roomId);
//        roomData.put("ownerId", ownerId);
//        roomData.put("lat", latObj);
//        roomData.put("lng", lngObj);
//
//        rooms.put(roomId, roomData);
//
//        return ResponseEntity.ok(roomData);
//    }
//
//    @DeleteMapping("/{roomId}")
//    public ResponseEntity<?> deleteRoom(@PathVariable String roomId) {
//        Map<String, Object> removed = rooms.remove(roomId);
//        if (removed == null) {
//            return ResponseEntity.status(404).body(Map.of("error", "Room not found"));
//        }
//        return ResponseEntity.ok(Map.of("deleted", roomId));
//    }
//
//    // Optional: helper to check room exists
//    @GetMapping("/{roomId}")
//    public ResponseEntity<?> getRoom(@PathVariable String roomId) {
//        Map<String, Object> r = rooms.get(roomId);
//        if (r == null) return ResponseEntity.status(404).body(Map.of("error", "Room not found"));
//        return ResponseEntity.ok(r);
//    }
//}
//











package com.mapplify.controller;

import com.mapplify.model.Room;
import com.mapplify.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/rooms")
public class RoomRestController {

    private final RoomService roomService;

    public RoomRestController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> body) {

        String ownerId = body.get("ownerId").toString();
        double lat = Double.parseDouble(body.get("lat").toString());
        double lng = Double.parseDouble(body.get("lng").toString());

        Room room = roomService.createRoom(ownerId, lat, lng);

        return ResponseEntity.ok(Map.of(
                "roomId", room.getRoomId(),
                "ownerId", ownerId,
                "lat", room.getDestLat(),
                "lng", room.getDestLng()
        ));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable String roomId) {
        Room r = roomService.getRoom(roomId);
        if (r == null)
            return ResponseEntity.status(404).body(Map.of("error", "Room not found"));
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId) {
        roomService.removeRoom(roomId);
        return ResponseEntity.ok(Map.of("deleted", roomId));
    }
}
