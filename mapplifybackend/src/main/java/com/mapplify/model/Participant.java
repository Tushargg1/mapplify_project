//package com.mapplify.model;
//
//public class Participant {
//
//    private String userId;
//    private String name;
//
//    private double lat;
//    private double lng;
//
//    private long lastUpdated;  // <-- REQUIRED
//
//    public Participant() {}
//
//    public Participant(String userId, String name, double lat, double lng) {
//        this.userId = userId;
//        this.name = name;
//        this.lat = lat;
//        this.lng = lng;
//        this.lastUpdated = System.currentTimeMillis();
//    }
//
//    // -------------------------
//    // getters & setters
//    // -------------------------
//
//    public String getUserId() {
//        return userId;
//    }
//    public void setUserId(String userId) {
//        this.userId = userId;
//    }
//
//    public String getName() {
//        return name;
//    }
//    public void setName(String name) {
//        this.name = name;
//    }
//
//    public double getLat() {
//        return lat;
//    }
//    public void setLat(double lat) {
//        this.lat = lat;
//    }
//
//    public double getLng() {
//        return lng;
//    }
//    public void setLng(double lng) {
//        this.lng = lng;
//    }
//
//    public long getLastUpdated() {
//        return lastUpdated;
//    }
//    public void setLastUpdated(long lastUpdated) { 
//        this.lastUpdated = lastUpdated;
//    }
//}









package com.mapplify.model;

public class Participant {
    private String userId;
    private String name;
    private Double lat;
    private Double lng;
    private Long ts;

    public Participant(String userId, String name) {
        this.userId = userId;
        this.name = name;
    }

    public String getUserId() { return userId; }
    public String getName() { return name; }
    public Double getLat() { return lat; }
    public Double getLng() { return lng; }
    public Long getTs() { return ts; }

    public void setLat(Double lat) { this.lat = lat; }
    public void setLng(Double lng) { this.lng = lng; }
    public void setTs(Long ts) { this.ts = ts; }
}
