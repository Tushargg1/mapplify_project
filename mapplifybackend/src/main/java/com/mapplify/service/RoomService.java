package com.mapplify.service;

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
