package com.mapplify.model;

/**
 * Destination stored for each room.
 * Used in REST controllers and RoomService.
 */
public class Destination {

    private Double lat;
    private Double lng;
    private String label;  // optional

    public Destination() {}

    public Destination(Double lat, Double lng, String label) {
        this.lat = lat;
        this.lng = lng;
        this.label = label;
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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
