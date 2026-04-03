package com.mapplify.model;

/**
 * STOMP DTO: used when user SETS or UPDATES destination inside a room.
 */
public class DestinationMessage {

    private String roomId;
    private Double lat;
    private Double lng;
    private String ownerId;

    public DestinationMessage() {}

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }
}
