//package com.mapplify.model;
//
//import java.util.Map;
//import java.util.concurrent.ConcurrentHashMap;
//
//public class Room {
//    private String roomId;
//    private String ownerId;
//    private Double destLat;
//    private Double destLng;
//
//    private Map<String, Participant> participants = new ConcurrentHashMap<>();
//
//    public Room(String roomId, String ownerId, Double destLat, Double destLng) {
//        this.roomId = roomId;
//        this.ownerId = ownerId;
//        this.destLat = destLat;
//        this.destLng = destLng;
//    }
//
//    public String getRoomId() { return roomId; }
//    public String getOwnerId() { return ownerId; }
//    public Double getDestLat() { return destLat; }
//    public Double getDestLng() { return destLng; }
//
//    public void setDestination(Double lat, Double lng) {
//        this.destLat = lat;
//        this.destLng = lng;
//    }
//
//    public Map<String, Participant> getParticipants() {
//        return participants;
//    }
//}











package com.mapplify.model;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class Room {
    private String roomId;
    private String ownerId;
    private Double destLat;
    private Double destLng;

    private Map<String, Participant> participants = new ConcurrentHashMap<>();

    public Room(String roomId, String ownerId, Double destLat, Double destLng) {
        this.roomId = roomId;
        this.ownerId = ownerId;
        this.destLat = destLat;
        this.destLng = destLng;
    }

    public String getRoomId() { return roomId; }
    public String getOwnerId() { return ownerId; }
    public Double getDestLat() { return destLat; }
    public Double getDestLng() { return destLng; }

    public void setDestination(Double lat, Double lng) {
        this.destLat = lat;
        this.destLng = lng;
    }

    public Map<String, Participant> getParticipants() {
        return participants;
    }
}

