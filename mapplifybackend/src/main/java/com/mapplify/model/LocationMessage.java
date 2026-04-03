package com.mapplify.model;

public class LocationMessage {
    private String type;    // "position"
    private String userId;
    private String name;
    private String roomId;
    private double lat;
    private double lng;
    private long ts;

    // getters / setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public long getTs() { return ts; }
    public void setTs(long ts) { this.ts = ts; }
}
