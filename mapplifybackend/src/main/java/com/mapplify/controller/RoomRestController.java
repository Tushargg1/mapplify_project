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

        Room room = roomService.createRoom(ownerId, null, null);

        return ResponseEntity.ok(Map.of(
                "roomId", room.getRoomId(),
                "ownerId", ownerId
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
