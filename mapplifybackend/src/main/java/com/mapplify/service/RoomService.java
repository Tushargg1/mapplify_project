//package com.mapplify.service;
//
//import com.mapplify.model.Destination;
//import com.mapplify.model.Participant;
//import com.mapplify.model.Room;
//import org.springframework.stereotype.Service;
//
//import java.util.*;
//import java.util.concurrent.ConcurrentHashMap;
//
///**
// * Unified RoomService — manages rooms, participants, locations, and destinations.
// */
//@Service
//public class RoomService {
//
//    // roomId -> Room
//    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
//
//    // sessionId -> userId for cleanup
//    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();
//
//    // -------------------------
//    // ROOM LIFECYCLE
//    // -------------------------
//    public Room createRoom(String ownerId, double lat, double lng) {
//        String roomId = UUID.randomUUID().toString().substring(0, 8);
//        Room r = new Room(roomId, ownerId, lat, lng);
//        rooms.put(roomId, r);
//        return r;
//    }
//
//    public Room getRoom(String roomId) {
//        return rooms.get(roomId);
//    }
//
//    public void removeRoom(String roomId) {
//        rooms.remove(roomId);
//    }
//
//    public boolean roomExists(String roomId) {
//        return rooms.containsKey(roomId);
//    }
//
//    // -------------------------
//    // PARTICIPANTS
//    // -------------------------
//    public void joinRoom(String roomId, String sessionId, Participant p) {
//        Room r = rooms.get(roomId);
//        if (r == null) {
//            // optionally create a room without destination
//            r = new Room(roomId, null, null, null);
//            rooms.put(roomId, r);
//        }
//        r.getParticipants().put(p.getUserId(), p);
//        sessionUserMap.put(sessionId, p.getUserId());
//    }
//
//    public void joinRoom(String roomId, Participant p) {
//        // convenience overload (no session)
//        joinRoom(roomId, UUID.randomUUID().toString(), p);
//    }
//
//    public List<Participant> getParticipants(String roomId) {
//        Room r = rooms.get(roomId);
//        if (r == null) return Collections.emptyList();
//        return new ArrayList<>(r.getParticipants().values());
//    }
//
//    public void removeSessionFromAllRooms(String sessionId) {
//        String userId = sessionUserMap.get(sessionId);
//        if (userId == null) return;
//        for (Room r : rooms.values()) {
//            r.getParticipants().remove(userId);
//        }
//        sessionUserMap.remove(sessionId);
//    }
//
//    // -------------------------
//    // LOCATION UPDATES
//    // -------------------------
//    public void updateLocation(String roomId, String userId, double lat, double lng) {
//        Room r = rooms.get(roomId);
//        if (r == null) return;
//        Participant p = r.getParticipants().get(userId);
//        if (p == null) return;
//        p.setLat(lat);
//        p.setLng(lng);
//        p.setLastUpdated(System.currentTimeMillis());
//    }
//
//    // -------------------------
//    // DESTINATION MANAGEMENT
//    // -------------------------
//    public void updateDestination(String roomId, double lat, double lng) {
//        Room r = rooms.get(roomId);
//        if (r == null) return;
//        r.setDestination(lat, lng);
//    }
//
//    public Destination getDestination(String roomId) {
//        Room r = rooms.get(roomId);
//        return r == null ? null : new Destination(r.getDestLat(), r.getDestLng(), null);
//    }
//}













package com.mapplify.service;

import com.mapplify.model.Participant;
import com.mapplify.model.Room;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    public Room createRoom(String ownerId, double lat, double lng) {
        String roomId = UUID.randomUUID().toString().substring(0, 8);

        Room r = new Room(roomId, ownerId, lat, lng);
        rooms.put(roomId, r);
        return r;
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public void removeRoom(String roomId) {
        rooms.remove(roomId);
    }

    public boolean exists(String roomId) {
        return rooms.containsKey(roomId);
    }

    public void updateDestination(String roomId, Double lat, Double lng) {
        Room room = rooms.get(roomId);
        if (room == null) return;
        room.setDestination(lat, lng);
    }
}
