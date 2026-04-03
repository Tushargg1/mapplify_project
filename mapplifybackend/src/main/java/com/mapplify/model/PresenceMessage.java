package com.mapplify.model;

public class PresenceMessage {
    private String action; // "join" or "leave"
    private String userId;
    private String name;
    private String roomId;

    // getters / setters
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
}
