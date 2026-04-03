package com.mapplify.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "history_events")
public class HistoryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String eventType;

    @Column(length = 80)
    private String actorUserId;

    @Column(length = 120)
    private String actorName;

    @Column(length = 180)
    private String actorEmail;

    @Column(length = 30)
    private String actorPhone;

    @Column(length = 80)
    private String roomId;

    @Column(length = 280)
    private String reason;

    @Column(length = 200)
    private String destinationLabel;

    private Double distanceMeters;

    private Integer durationMinutes;

    private Long startedAt;

    private Long endedAt;

    private Long eventTs;

    // Location data for SOS alerts
    private Double sosLat;
    private Double sosLng;

    // Location data for trips (start and end)
    private Double tripStartLat;
    private Double tripStartLng;
    private Double tripEndLat;
    private Double tripEndLng;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActorPhone() {
        return actorPhone;
    }

    public void setActorPhone(String actorPhone) {
        this.actorPhone = actorPhone;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDestinationLabel() {
        return destinationLabel;
    }

    public void setDestinationLabel(String destinationLabel) {
        this.destinationLabel = destinationLabel;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Long getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Long startedAt) {
        this.startedAt = startedAt;
    }

    public Long getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Long endedAt) {
        this.endedAt = endedAt;
    }

    public Long getEventTs() {
        return eventTs;
    }

    public void setEventTs(Long eventTs) {
        this.eventTs = eventTs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Double getSosLat() {
        return sosLat;
    }

    public void setSosLat(Double sosLat) {
        this.sosLat = sosLat;
    }

    public Double getSosLng() {
        return sosLng;
    }

    public void setSosLng(Double sosLng) {
        this.sosLng = sosLng;
    }

    public Double getTripStartLat() {
        return tripStartLat;
    }

    public void setTripStartLat(Double tripStartLat) {
        this.tripStartLat = tripStartLat;
    }

    public Double getTripStartLng() {
        return tripStartLng;
    }

    public void setTripStartLng(Double tripStartLng) {
        this.tripStartLng = tripStartLng;
    }

    public Double getTripEndLat() {
        return tripEndLat;
    }

    public void setTripEndLat(Double tripEndLat) {
        this.tripEndLat = tripEndLat;
    }

    public Double getTripEndLng() {
        return tripEndLng;
    }

    public void setTripEndLng(Double tripEndLng) {
        this.tripEndLng = tripEndLng;
    }
}
