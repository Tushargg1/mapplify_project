import React, { useEffect, useRef, useState } from "react";
import { APIProvider, AdvancedMarker, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useNavigate } from "react-router-dom";
import { Route as RouteIcon } from "lucide-react";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import FriendsLayer from "../components/map/FriendsLayer";
import Sidebar from "../components/map/Sidebar";
import RightSidebar from "../components/map/RightSidebar";
import DestinationPill from "../components/map/DestinationPill";
import ToastStack from "../components/map/ToastStack";
import SettingsPanel from "../components/map/SettingsPanel";

import { watchGPS } from "../services/GPSService";
import { fetchRoute, reverseGeocode } from "../services/RouteService";
import { createHistoryEvent, fetchHistoryEvents } from "../services/HistoryService";
import {
  createBriefVoiceLine,
  findNearbyFromVoice,
  reconstructVoiceMessage,
  synthesizeSpeech,
  transcribeVoiceAudio,
} from "../services/VoiceService";
import { haversine } from "../utils/haversine";

const STORAGE_KEYS = {
  displayName: "mapplify_displayName",
  roomId: "mapplify_roomId",
  realtimeUserId: "mapplify_realtime_user_id",
  nearbySearch: "mapplify_nearby_search",
};

const AUTH_STORAGE_KEY = "mapplify_auth_user";

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

const ROUTE_REFRESH_MS = parsePositiveInt(import.meta.env.VITE_ROUTE_REFRESH_MS, 15000);
const POSITION_PUBLISH_INTERVAL_MS = 2500;
const MIN_POSITION_DELTA = 0.00008;
const SAME_POINT_EPSILON = 0.000001;
const NAV_CAMERA_CENTER_UPDATE_MIN_METERS = 4;
const NAV_CAMERA_BEARING_UPDATE_MIN_DEGREES = 10;
const NAV_CAMERA_PITCH = 58;
const DESTINATION_ARRIVAL_RADIUS_METERS = parsePositiveInt(
  import.meta.env.VITE_DESTINATION_ARRIVAL_RADIUS_METERS,
  45
);
const VOICE_PLAYBACK_RATE = 1.25;
const INACTIVITY_ALERT_THRESHOLD_MS = 15 * 60 * 1000;
const INACTIVITY_RESPONSE_TIMEOUT_MS = 60 * 1000;
const INACTIVITY_MOVE_RESET_METERS = 20;
const NEARBY_RESULTS_RESET_DISTANCE_METERS = 1000;
const STOP_ARRIVAL_RADIUS_METERS = 60;
const RIGHT_SIDEBAR_AUTO_CLOSE_MS = 5000;
const DEFAULT_CENTER = { lat: 28.6922, lng: 77.1506 };
const BROADCAST_SEND_DELAY_MS = 10000;

function getAuthUserIdFromStorage() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    if (parsed?.id === undefined || parsed?.id === null) return "";
    return String(parsed.id).trim();
  } catch {
    return "";
  }
}

function createRealtimeUserId() {
  const authUserId = getAuthUserIdFromStorage();

  const suffix = Math.random().toString(36).slice(2, 8);
  return authUserId || `guest-${suffix}`;
}

function getOrCreateRealtimeUserId() {
  if (typeof window === "undefined") {
    return createRealtimeUserId();
  }

  try {
    const authUserId = getAuthUserIdFromStorage();
    if (authUserId) {
      window.sessionStorage.setItem(STORAGE_KEYS.realtimeUserId, authUserId);
      return authUserId;
    }

    const existing = window.sessionStorage.getItem(STORAGE_KEYS.realtimeUserId);
    if (existing && existing.trim()) {
      return existing.trim();
    }

    const realtimeId = createRealtimeUserId();
    window.sessionStorage.setItem(STORAGE_KEYS.realtimeUserId, realtimeId);

    // Cleanup old shared-tab storage key to avoid ID collisions across tabs.
    window.localStorage.removeItem(STORAGE_KEYS.realtimeUserId);
    return realtimeId;
  } catch {
    return createRealtimeUserId();
  }
}

function resolveBackendBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8081`;
  }

  return "http://localhost:8081";
}

function getAuthProfile() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { id: "", name: "", email: "", phoneNumber: "" };
    const parsed = JSON.parse(raw);
    const parsedUser = parsed?.user && typeof parsed.user === "object" ? parsed.user : {};

    const idValue =
      parsed?.id !== undefined && parsed?.id !== null
        ? parsed.id
        : (parsedUser?.id !== undefined && parsedUser?.id !== null ? parsedUser.id : "");

    const nameValue =
      parsed?.name ||
      parsed?.fullName ||
      parsedUser?.name ||
      parsedUser?.fullName ||
      parsedUser?.username ||
      "";

    const emailValue = parsed?.email || parsed?.identifier || parsedUser?.email || "";
    const phoneValue = parsed?.phoneNumber || parsedUser?.phoneNumber || parsedUser?.phone || "";

    return {
      id: String(idValue || "").trim(),
      name: String(nameValue || "").trim(),
      email: String(emailValue || "").trim(),
      phoneNumber: String(phoneValue || "").trim(),
    };
  } catch {
    return { id: "", name: "", email: "", phoneNumber: "" };
  }
}

function getPreferredAuthDisplayName(profile = getAuthProfile()) {
  const name = String(profile?.name || "").trim();
  if (name) return name;

  const email = String(profile?.email || "").trim();
  if (email) {
    const [localPart] = email.split("@");
    if (localPart?.trim()) return localPart.trim();
  }

  return "";
}

function getDefaultDisplayName() {
  const authProfile = getAuthProfile();
  const preferred = getPreferredAuthDisplayName(authProfile);
  if (preferred) return preferred;

  const saved = String(localStorage.getItem(STORAGE_KEYS.displayName) || "").trim();
  if (saved) return saved;

  return "";
}

function extractAccountId(userIdValue) {
  const raw = String(userIdValue || "").trim();
  if (!raw) return "";
  const [accountId] = raw.split("-");
  return accountId || raw;
}

function isTripOwnedByCurrentUser(tripItem, accountId, realtimeUserId) {
  const actorUserId = String(tripItem?.actorUserId || "").trim();
  if (!actorUserId) return false;

  if (accountId) {
    return extractAccountId(actorUserId) === accountId;
  }

  return actorUserId === String(realtimeUserId);
}

function getHistoryEventTs(item) {
  const directTs = Number(item?.eventTs);
  if (Number.isFinite(directTs) && directTs > 0) return directTs;

  const createdAtTs = Number(item?.createdAt);
  if (Number.isFinite(createdAtTs) && createdAtTs > 0) return createdAtTs;

  return 0;
}

const BACKEND_BASE_URL = resolveBackendBaseUrl();

function calculateBearing(fromLat, fromLng, toLat, toLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const phi1 = toRad(fromLat);
  const phi2 = toRad(toLat);
  const deltaLambda = toRad(toLng - fromLng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function bearingDifferenceDegrees(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.abs((((b - a) % 360) + 540) % 360 - 180);
}

function toTurnCue(maneuverType, maneuverModifier, fallbackInstruction) {
  const type = String(maneuverType || "").toLowerCase();
  const modifier = String(maneuverModifier || "").toLowerCase();

  if (type === "arrive") return "Arrive at destination";
  if (type === "depart") return "Head straight";

  if (modifier.includes("uturn")) return "Make a U-turn";
  if (modifier.includes("sharp left")) return "Turn sharp left";
  if (modifier.includes("slight left")) return "Turn slight left";
  if (modifier.includes("left")) return "Turn left";
  if (modifier.includes("sharp right")) return "Turn sharp right";
  if (modifier.includes("slight right")) return "Turn slight right";
  if (modifier.includes("right")) return "Turn right";
  if (modifier.includes("straight")) return "Go straight";

  if (type === "roundabout" || type === "rotary") return "Take the roundabout";
  if (type === "merge") return "Merge";
  if (type === "fork") return "Take the fork";

  if (fallbackInstruction && fallbackInstruction.trim()) return fallbackInstruction.trim();
  return "Continue straight";
}

function getDrivingNavigationZoom(speedKmh) {
  const speed = Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  if (speed <= 8) return 18.2;
  if (speed <= 20) return 17.8;
  if (speed <= 40) return 17.2;
  if (speed <= 65) return 16.8;
  return 16.4;
}

function isSamePoint(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(Number(a.lat) - Number(b.lat)) < SAME_POINT_EPSILON &&
    Math.abs(Number(a.lng) - Number(b.lng)) < SAME_POINT_EPSILON
  );
}

function hasMeaningfulMove(previous, next) {
  if (!previous) return true;
  return (
    Math.abs(Number(previous.lat) - Number(next.lat)) > MIN_POSITION_DELTA ||
    Math.abs(Number(previous.lng) - Number(next.lng)) > MIN_POSITION_DELTA
  );
}

function extractLatLngFromMapClick(event) {
  const value = event?.detail?.latLng;
  if (!value) return null;

  const lat = typeof value.lat === "function" ? Number(value.lat()) : Number(value.lat);
  const lng = typeof value.lng === "function" ? Number(value.lng()) : Number(value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMember(member) {
  if (!member || member.userId === undefined || member.userId === null) return null;

  const userId = String(member.userId);
  const lat = toFiniteNumber(member.lat);
  const lng = toFiniteNumber(member.lng);
  const ts = member.ts;

  return {
    userId,
    name: member.name || userId,
    ...(lat !== null ? { lat } : {}),
    ...(lng !== null ? { lng } : {}),
    ...(ts !== undefined ? { ts } : {}),
  };
}

function mergeMembersWithSnapshot(previousMembers, snapshotMembers) {
  const previousById = new Map(
    previousMembers
      .map((member) => normalizeMember(member))
      .filter(Boolean)
      .map((member) => [member.userId, member])
  );

  const uniqueById = new Map();

  (Array.isArray(snapshotMembers) ? snapshotMembers : []).forEach((member) => {
    const normalized = normalizeMember(member);
    if (!normalized) return;

    const existing = previousById.get(normalized.userId);
    uniqueById.set(normalized.userId, {
      ...(existing || {}),
      ...normalized,
    });
  });

  return Array.from(uniqueById.values());
}

function prettyPlaceTypeLabel(type) {
  const raw = String(type || "").trim();
  if (!raw) return "nearby";

  const labels = {
    meal_takeaway: "food places",
    meal_delivery: "delivery places",
    subway_station: "metro stations",
    train_station: "train stations",
    bus_station: "bus stations",
    gas_station: "petrol pumps",
    shopping_mall: "shopping malls",
    tourist_attraction: "tourist places",
  };

  if (labels[raw]) return labels[raw];
  return raw.replace(/_/g, " ");
}

function formatApproxDistance(distanceMeters) {
  const distance = Number(distanceMeters);
  if (!Number.isFinite(distance) || distance < 0) return "";
  if (distance < 1000) return `~${Math.round(distance)} m away`;
  return `~${(distance / 1000).toFixed(1)} km away`;
}

function makeStopKey(memberId, placeName, lat, lng) {
  const safeMemberId = String(memberId || "").trim();
  const safePlaceName = String(placeName || "").trim().toLowerCase();
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  return [
    safeMemberId,
    safePlaceName,
    Number.isFinite(safeLat) ? safeLat.toFixed(6) : "",
    Number.isFinite(safeLng) ? safeLng.toFixed(6) : "",
  ].join("|");
}

function isSameStopLocation(stop, lat, lng, memberId = "") {
  const stopLat = Number(stop?.lat);
  const stopLng = Number(stop?.lng);
  const sameLat = Number.isFinite(stopLat) && Math.abs(stopLat - Number(lat)) < SAME_POINT_EPSILON;
  const sameLng = Number.isFinite(stopLng) && Math.abs(stopLng - Number(lng)) < SAME_POINT_EPSILON;

  if (!sameLat || !sameLng) return false;

  if (memberId) {
    return String(stop?.memberId || "") === String(memberId);
  }

  return true;
}

function getStoredNearbySearch() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.nearbySearch);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const originLat = Number(parsed?.origin?.lat);
    const originLng = Number(parsed?.origin?.lng);

    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return null;

    return {
      command: String(parsed?.command || "").trim(),
      placeType: String(parsed?.placeType || "").trim(),
      origin: { lat: originLat, lng: originLng },
      ts: Number(parsed?.ts || 0),
      places: Array.isArray(parsed?.places) ? parsed.places : [],
    };
  } catch {
    return null;
  }
}

function saveNearbySearch(search) {
  try {
    if (!search) {
      localStorage.removeItem(STORAGE_KEYS.nearbySearch);
      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.nearbySearch,
      JSON.stringify({
        command: String(search.command || "").trim(),
        placeType: String(search.placeType || "").trim(),
        origin: {
          lat: Number(search.origin?.lat),
          lng: Number(search.origin?.lng),
        },
        ts: Number(search.ts || Date.now()),
        places: Array.isArray(search.places) ? search.places : [],
      })
    );
  } catch {
    // Ignore device storage failures.
  }
}

function getRoomStopStateKey(roomId) {
  return roomId ? `mapplify_room_stops_${String(roomId)}` : "";
}

function getStoredRoomStopState(roomId) {
  const key = getRoomStopStateKey(roomId);
  if (!key) return { plannedStops: [], sharedStops: [] };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { plannedStops: [], sharedStops: [] };

    const parsed = JSON.parse(raw);
    return {
      plannedStops: Array.isArray(parsed?.plannedStops) ? parsed.plannedStops : [],
      sharedStops: Array.isArray(parsed?.sharedStops) ? parsed.sharedStops : [],
    };
  } catch {
    return { plannedStops: [], sharedStops: [] };
  }
}

function saveRoomStopState(roomId, plannedStops, sharedStops) {
  const key = getRoomStopStateKey(roomId);
  if (!key) return;

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        plannedStops: Array.isArray(plannedStops) ? plannedStops : [],
        sharedStops: Array.isArray(sharedStops) ? sharedStops : [],
      })
    );
  } catch {
    // Ignore device storage failures.
  }
}

function getRoomHiddenStopsKey(roomId) {
  return roomId ? `mapplify_hidden_stops_${String(roomId)}` : "";
}

function getStoredHiddenStopKeys(roomId) {
  const key = getRoomHiddenStopsKey(roomId);
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.hiddenStopKeys) ? parsed.hiddenStopKeys.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveHiddenStopKeys(roomId, hiddenStopKeys) {
  const key = getRoomHiddenStopsKey(roomId);
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify({ hiddenStopKeys: Array.from(new Set(hiddenStopKeys)).slice(0, 200) }));
  } catch {
    // Ignore device storage failures.
  }
}

export default function MapView() {
  const navigate = useNavigate();
  const initialNearbySearch = getStoredNearbySearch();

  const map = useRef(null);
  const stompRef = useRef(null);

  const publishQueue = useRef([]);
  const routeGraphicsRef = useRef(new Map());
  const routeSeqRef = useRef(0);
  const lastRouteRequestRef = useRef({ key: "", destinationKey: "", ts: 0 });
  const lastGpsUpdateRef = useRef(null);

  const [displayName, setDisplayName] = useState(() => getDefaultDisplayName());
  const [userId] = useState(() => getOrCreateRealtimeUserId());

  const [myRoom, setMyRoom] = useState(
    () => localStorage.getItem(STORAGE_KEYS.roomId) || null
  );
  const [ownerId, setOwnerId] = useState(null);
  const [members, setMembers] = useState([]);
  const [destination, setDestination] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [mapHeading, setMapHeading] = useState(0);
  const [mapTilt, setMapTilt] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(true);
  const [isRightSidebarHovered, setIsRightSidebarHovered] = useState(false);
  const [rightSidebarInteractionTick, setRightSidebarInteractionTick] = useState(0);
  const [routeStats, setRouteStats] = useState({});
  const [toasts, setToasts] = useState([]);
  const [navigationActive, setNavigationActive] = useState(false);
  const [showOtherMemberRoutes, setShowOtherMemberRoutes] = useState(false);
  const [turnByTurnSteps, setTurnByTurnSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [wellbeingPromptOpen, setWellbeingPromptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmEndTripOpen, setConfirmEndTripOpen] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [broadcastConfirmOpen, setBroadcastConfirmOpen] = useState(false);
  const [reconstructedBroadcast, setReconstructedBroadcast] = useState("");
  const [broadcastPreviewAudioUrl, setBroadcastPreviewAudioUrl] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState(() => initialNearbySearch?.places || []);
  const [nearbyPlaceType, setNearbyPlaceType] = useState(() => initialNearbySearch?.placeType || "");
  const [plannedStops, setPlannedStops] = useState([]);
  const [sharedStops, setSharedStops] = useState([]);
  const [hiddenStopKeys, setHiddenStopKeys] = useState(() => getStoredHiddenStopKeys(myRoom));
  const [broadcastFeed, setBroadcastFeed] = useState([]);
  const [navigationMonitor, setNavigationMonitor] = useState({
    status: "Idle",
    speedKmh: 0,
    etaMinutes: null,
    distanceMeters: null,
  });

  const authProfileRef = useRef(getAuthProfile());
  const activeProfileId = authProfileRef.current.id || String(userId);
  const accountProfileId = extractAccountId(authProfileRef.current.id || "");
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadError, setHistoryLoadError] = useState("");
  const [selectedTripId, setSelectedTripId] = useState(null);

  const myRoomRef = useRef(myRoom);
  const ownerIdRef = useRef(ownerId);
  const displayNameRef = useRef(displayName);
  const destinationRef = useRef(destination);
  const routeStatsRef = useRef(routeStats);
  const navigationMonitorRef = useRef(navigationMonitor);
  const navigationActiveRef = useRef(false);
  const currentTripRef = useRef(null);
  const turnByTurnStepsRef = useRef(turnByTurnSteps);
  const lastAnnouncedStepRef = useRef(-1);
  const lastNavigationCameraRef = useRef({ lat: NaN, lng: NaN, bearing: NaN });
  const wellbeingPromptActiveRef = useRef(false);
  const wellbeingPromptTimerRef = useRef(null);
  const alarmAudioCtxRef = useRef(null);
  const alarmCooldownRef = useRef(0);
  const processedSosTripSaveKeysRef = useRef(new Set());
  const pendingBroadcastTimersRef = useRef(new Map());
  const processedBroadcastIdsRef = useRef(new Set());
  const locallyPreviewedBroadcastIdsRef = useRef(new Set());
  const plannedStopsRef = useRef([]);
  const nearbySearchOriginRef = useRef(null);
  const nearbySearchCommandRef = useRef("");
  const inactivityTrackerRef = useRef({
    referenceLat: NaN,
    referenceLng: NaN,
    lastMovementTs: 0,
  });

  const nearbyPlacesWithStatus = nearbyPlaces.map((place) => {
    const placeLat = Number(place?.lat);
    const placeLng = Number(place?.lng);
    const placeName = String(place?.title || place?.label || "Stop").trim();
    const stopKey = makeStopKey(userId, placeName, placeLat, placeLng);
    const isHidden = hiddenStopKeys.includes(stopKey);
    const isAdded =
      !isHidden && (
        plannedStops.some((stop) => isSameStopLocation(stop, placeLat, placeLng)) ||
        sharedStops.some((stop) => isSameStopLocation(stop, placeLat, placeLng, String(userId)))
      );

    return {
      ...place,
      stopKey,
      isAdded,
    };
  });

  const visiblePlannedStops = plannedStops.filter((stop) => !hiddenStopKeys.includes(stop.stopKey));
  const visibleSharedStops = sharedStops.filter((stop) => !hiddenStopKeys.includes(stop.stopKey));
  const hasPendingBroadcast = broadcastFeed.some((item) => item.pending);
  const keepRightSidebarOpen = voiceBusy || hasPendingBroadcast || nearbyPlaces.length > 0;

  useEffect(() => {
    myRoomRef.current = myRoom;
  }, [myRoom]);

  useEffect(() => {
    ownerIdRef.current = ownerId;
  }, [ownerId]);

  useEffect(() => {
    displayNameRef.current = displayName;
    localStorage.setItem(STORAGE_KEYS.displayName, displayName || "");
  }, [displayName]);

  useEffect(() => {
    destinationRef.current = destination;
  }, [destination]);

  useEffect(() => {
    routeStatsRef.current = routeStats;
  }, [routeStats]);

  useEffect(() => {
    navigationMonitorRef.current = navigationMonitor;
  }, [navigationMonitor]);

  useEffect(() => {
    plannedStopsRef.current = plannedStops;
  }, [plannedStops]);

  useEffect(() => {
    turnByTurnStepsRef.current = turnByTurnSteps;
  }, [turnByTurnSteps]);

  useEffect(() => {
    wellbeingPromptActiveRef.current = wellbeingPromptOpen;
  }, [wellbeingPromptOpen]);

  useEffect(() => {
    navigationActiveRef.current = navigationActive;
    setNavigationMonitor((prev) => ({
      ...prev,
      status: navigationActive ? "Navigating" : "Tracking",
    }));
  }, [navigationActive]);

  useEffect(() => {
    if (myRoom) localStorage.setItem(STORAGE_KEYS.roomId, myRoom);
    else localStorage.removeItem(STORAGE_KEYS.roomId);
  }, [myRoom]);

  useEffect(() => {
    if (!myRoom) {
      setPlannedStops([]);
      setSharedStops([]);
      setHiddenStopKeys([]);
      return;
    }

    const stored = getStoredRoomStopState(myRoom);
    setPlannedStops(stored.plannedStops);
    setSharedStops(stored.sharedStops);
    setHiddenStopKeys(getStoredHiddenStopKeys(myRoom));
  }, [myRoom]);

  useEffect(() => {
    if (!myRoom) return;
    saveRoomStopState(myRoom, plannedStops, sharedStops);
  }, [myRoom, plannedStops, sharedStops]);

  useEffect(() => {
    if (!myRoom) return;
    saveHiddenStopKeys(myRoom, hiddenStopKeys);
  }, [myRoom, hiddenStopKeys]);

  useEffect(() => {
    if (
      !isRightSidebarExpanded ||
      keepRightSidebarOpen ||
      isRightSidebarHovered
    ) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setIsRightSidebarExpanded(false);
    }, RIGHT_SIDEBAR_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timerId);
  }, [
    isRightSidebarExpanded,
    keepRightSidebarOpen,
    isRightSidebarHovered,
    rightSidebarInteractionTick,
  ]);

  function handleRightSidebarToggle() {
    setIsRightSidebarExpanded((prev) => {
      const next = !prev;
      setIsRightSidebarHovered(false);
      return next;
    });
  }

  function handleRightSidebarInteraction() {
    if (!isRightSidebarExpanded) return;
    setRightSidebarInteractionTick((value) => value + 1);
  }

  function handleRightSidebarMouseEnter() {
    if (!isRightSidebarExpanded) return;
    setIsRightSidebarHovered(true);
    setRightSidebarInteractionTick((value) => value + 1);
  }

  function handleRightSidebarMouseLeave() {
    setIsRightSidebarHovered(false);
  }

  useEffect(() => {
    const tick = window.setInterval(() => {
      setBroadcastFeed((prev) =>
        prev.map((item) => {
          if (!item.pending) return item;
          const remainingMs = Math.max(0, Number(item.sendAt || 0) - Date.now());
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          if (remainingSeconds === item.remainingSeconds) return item;
          return { ...item, remainingSeconds };
        })
      );
    }, 250);

    return () => {
      window.clearInterval(tick);
    };
  }, []);

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function pushToast(message, type = "info", ttl = 2600) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => dismissToast(id), ttl);
  }

  function createClientMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function upsertBroadcastFeedItem(nextItem) {
    setBroadcastFeed((prev) => {
      const foundIndex = prev.findIndex((item) => item.id === nextItem.id);
      if (foundIndex < 0) {
        return [nextItem, ...prev].slice(0, 60);
      }

      const copy = [...prev];
      copy[foundIndex] = { ...copy[foundIndex], ...nextItem };
      return copy;
    });
  }

  async function playVoiceAgentLine(text) {
    const phrase = String(text || "").trim();
    if (!phrase) return;

    const fallbackSpeak = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const fallback = new SpeechSynthesisUtterance(phrase);
        fallback.rate = VOICE_PLAYBACK_RATE;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(fallback);
      }
    };

    try {
      const tts = await synthesizeSpeech(phrase);
      if (!tts.audioBase64) {
        fallbackSpeak();
        return;
      }

      const byteChars = atob(tts.audioBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i += 1) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: tts.audioMimeType || "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = VOICE_PLAYBACK_RATE;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        fallbackSpeak();
      };
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        fallbackSpeak();
      });
    } catch {
      fallbackSpeak();
    }
  }

  function cancelPendingBroadcast(messageId, fromUserAction = false) {
    const timer = pendingBroadcastTimersRef.current.get(messageId);
    if (timer) {
      window.clearTimeout(timer);
      pendingBroadcastTimersRef.current.delete(messageId);
    }

    setBroadcastFeed((prev) => prev.filter((item) => item.id !== messageId));
    if (fromUserAction) {
      pushToast("Broadcast canceled", "info", 1800);
    }
  }

  function clearWellbeingPromptTimer() {
    if (!wellbeingPromptTimerRef.current) return;
    window.clearTimeout(wellbeingPromptTimerRef.current);
    wellbeingPromptTimerRef.current = null;
  }

  async function loadHistoryEventsForTrips() {
    setHistoryLoading(true);
    setHistoryLoadError("");
    try {
      const rows = await fetchHistoryEvents();
      setHistoryEvents(rows);
      const ownedTrips = rows.filter(
        (item) =>
          item?.eventType === "trip" &&
          isTripOwnedByCurrentUser(item, accountProfileId, userId)
      );

      setSelectedTripId((prev) => {
        if (!ownedTrips.length) return null;
        const hasSelected = ownedTrips.some((item) => String(item.id) === String(prev));
        return hasSelected ? prev : ownedTrips[0].id;
      });
    } catch {
      setHistoryLoadError("Could not load trip history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleOpenTripsHistory() {
    loadHistoryEventsForTrips();
  }

  function fileExtensionFromMimeType(mimeType) {
    const value = String(mimeType || "").toLowerCase();
    if (value.includes("webm")) return "webm";
    if (value.includes("ogg")) return "ogg";
    if (value.includes("wav")) return "wav";
    if (value.includes("mpeg") || value.includes("mp3")) return "mp3";
    return "webm";
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : "";
        if (!base64) {
          reject(new Error("NO_AUDIO"));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("READ_FAILED"));
      reader.readAsDataURL(blob);
    });
  }

  async function recordVoiceSnippet(maxDurationMs = 6000) {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      throw new Error("MEDIA_UNSUPPORTED");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    try {
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/wav",
      ];
      const mimeType = preferredTypes.find(
        (type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)
      ) || "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      const completedBlob = await new Promise((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onerror = () => reject(new Error("RECORDING_FAILED"));
        recorder.onstop = () => {
          if (!chunks.length) {
            reject(new Error("NO_AUDIO"));
            return;
          }
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
        };

        recorder.start();
        window.setTimeout(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }, maxDurationMs);
      });

      const finalMimeType = completedBlob.type || mimeType || "audio/webm";
      const audioBase64 = await blobToBase64(completedBlob);
      const extension = fileExtensionFromMimeType(finalMimeType);

      return {
        audioBase64,
        mimeType: finalMimeType,
        fileName: `voice-input.${extension}`,
      };
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  async function captureSingleVoiceTranscript() {
    setVoiceBusy(true);
    try {
      const recording = await recordVoiceSnippet(9000);
      const transcript = await transcribeVoiceAudio(
        recording.audioBase64,
        recording.mimeType,
        recording.fileName
      );
      return String(transcript || "").trim();
    } finally {
      setVoiceBusy(false);
    }
  }

  async function startVoiceBroadcast() {
    if (!myRoomRef.current) {
      pushToast("Join a room to send broadcast", "error", 2600);
      return;
    }

    setIsRightSidebarExpanded(true);

    try {
      let spokenText = "";
      try {
        spokenText = await captureSingleVoiceTranscript();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : "";
        if (message.toLowerCase().includes("transcription failed")) {
          const typedFallback = window.prompt("Voice transcription failed. Type a short message:");
          spokenText = String(typedFallback || "").trim();
        } else {
          throw error;
        }
      }

      if (!spokenText) {
        pushToast("No speech detected", "error", 2200);
        return;
      }

      const reconstructed = await reconstructVoiceMessage(spokenText);
      if (!reconstructed) {
        pushToast("Could not reconstruct message", "error", 2400);
        return;
      }

      let conciseBroadcast = reconstructed;
      try {
        conciseBroadcast =
          (await createBriefVoiceLine(reconstructed, "broadcast", {
            audience: "party-members",
          })) || reconstructed;
      } catch {
        conciseBroadcast = reconstructed;
      }

      queueBroadcastMessage(conciseBroadcast);
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Could not process voice broadcast";
      pushToast(message, "error", 3200);
    }
  }

  function queueBroadcastMessage(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message || !myRoomRef.current) {
      return;
    }

    const messageId = createClientMessageId();
    const sendAt = Date.now() + BROADCAST_SEND_DELAY_MS;

    upsertBroadcastFeedItem({
      id: messageId,
      userId: String(userId),
      name: displayNameRef.current || String(userId),
      message,
      ts: Date.now(),
      pending: true,
      sendAt,
      remainingSeconds: Math.ceil(BROADCAST_SEND_DELAY_MS / 1000),
    });

    locallyPreviewedBroadcastIdsRef.current.add(messageId);
    playVoiceAgentLine(`${message}. Should I send this?`);

    const timerId = window.setTimeout(() => {
      pendingBroadcastTimersRef.current.delete(messageId);

      safePublish({
        destination: "/app/broadcast",
        body: JSON.stringify({
          roomId: myRoomRef.current,
          userId,
          name: displayNameRef.current || userId,
          message,
          messageId,
          type: "broadcast",
          ts: Date.now(),
        }),
      });

      upsertBroadcastFeedItem({
        id: messageId,
        pending: false,
        remainingSeconds: 0,
      });
      pushToast("Broadcast sent", "success", 2200);
    }, BROADCAST_SEND_DELAY_MS);

    pendingBroadcastTimersRef.current.set(messageId, timerId);
    pushToast("Broadcast queued. Tap X within 10s to cancel.", "info", 3200);
  }

  function confirmBroadcastVoiceMessage() {
    const message = String(reconstructedBroadcast || "").trim();
    queueBroadcastMessage(message);

    setBroadcastConfirmOpen(false);
    setReconstructedBroadcast("");
    if (broadcastPreviewAudioUrl) {
      URL.revokeObjectURL(broadcastPreviewAudioUrl);
      setBroadcastPreviewAudioUrl("");
    }
  }

  function cancelBroadcastVoiceMessage() {
    setBroadcastConfirmOpen(false);
    setReconstructedBroadcast("");
    if (broadcastPreviewAudioUrl) {
      URL.revokeObjectURL(broadcastPreviewAudioUrl);
      setBroadcastPreviewAudioUrl("");
    }
  }

  async function startNearbyVoiceSearch() {
    if (!myRoomRef.current) {
      pushToast("Join a room to search nearby places", "error", 2600);
      return;
    }

    setIsRightSidebarExpanded(true);

    try {
      let spokenCommand = "";
      try {
        spokenCommand = await captureSingleVoiceTranscript();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : "";
        if (message.toLowerCase().includes("transcription failed")) {
          const typedFallback = window.prompt("Voice transcription failed. Type nearby request:");
          spokenCommand = String(typedFallback || "").trim();
        } else {
          throw error;
        }
      }

      if (!spokenCommand) {
        pushToast("No command detected", "error", 2200);
        return;
      }

      const current = lastGpsUpdateRef.current || myPosition;
      const lat = Number(current?.lat);
      const lng = Number(current?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        pushToast("Current location unavailable", "error", 2600);
        return;
      }

        const cachedSearch = getStoredNearbySearch();
        if (
          cachedSearch &&
          cachedSearch.command &&
          cachedSearch.command.toLowerCase() === spokenCommand.toLowerCase()
        ) {
          const distanceFromCachedOrigin = haversine(
            cachedSearch.origin.lat,
            cachedSearch.origin.lng,
            lat,
            lng
          );

          if (distanceFromCachedOrigin < NEARBY_RESULTS_RESET_DISTANCE_METERS) {
            nearbySearchOriginRef.current = cachedSearch.origin;
            nearbySearchCommandRef.current = cachedSearch.command;
            setNearbyPlaceType(cachedSearch.placeType || "");
            setNearbyPlaces(Array.isArray(cachedSearch.places) ? cachedSearch.places : []);
            pushToast("Loaded saved nearby results", "info", 2200);
            return;
          }
        }

      const result = await findNearbyFromVoice(spokenCommand, lat, lng);
      const normalized = (result.places || [])
        .map((item) => {
          const placeLat = Number(item?.lat);
          const placeLng = Number(item?.lng);
          const approxDistanceMeters = Number.isFinite(placeLat) && Number.isFinite(placeLng)
            ? haversine(lat, lng, placeLat, placeLng)
            : null;

          return {
            ...item,
            placeType: result.placeType || "",
            approxDistanceMeters,
            approxDistanceLabel: formatApproxDistance(approxDistanceMeters),
          };
        })
        .sort((a, b) => {
          const da = Number.isFinite(a?.approxDistanceMeters) ? a.approxDistanceMeters : Number.POSITIVE_INFINITY;
          const db = Number.isFinite(b?.approxDistanceMeters) ? b.approxDistanceMeters : Number.POSITIVE_INFINITY;
          return da - db;
        });
      const placeLabel = prettyPlaceTypeLabel(result.placeType || "");

      nearbySearchOriginRef.current = { lat, lng };
      nearbySearchCommandRef.current = spokenCommand;
      setNearbyPlaceType(result.placeType || "");
      setNearbyPlaces(normalized);
      saveNearbySearch({
        command: spokenCommand,
        placeType: result.placeType || "",
        origin: { lat, lng },
        ts: Date.now(),
        places: normalized,
      });

      const agentSummaryBase = normalized.length
        ? `Showing ${normalized.length} ${placeLabel} near you.`
        : `No ${placeLabel} found near you.`;
      let agentSummary = agentSummaryBase;
      try {
        agentSummary =
          (await createBriefVoiceLine(agentSummaryBase, "nearby", {
            placeType: result.placeType || "nearby",
            count: normalized.length,
          })) || agentSummaryBase;
      } catch {
        agentSummary = agentSummaryBase;
      }

      playVoiceAgentLine(agentSummary);

      pushToast(
        normalized.length
          ? `Found ${normalized.length} nearby ${placeLabel}`
          : "No nearby places found",
        normalized.length ? "success" : "info",
        2600
      );
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Nearby search failed";
      pushToast(message, "error", 3200);
    }
  }

  function addStopForParty(place) {
    if (!myRoomRef.current || !place) return;

    const lat = Number(place.lat);
    const lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      pushToast("Selected place has no valid coordinates", "error", 2600);
      return;
    }

    const reason = String(place.placeType || nearbyPlaceType || "stop").trim() || "stop";
    const placeName = String(place.title || place.label || "Stop").trim();
    const stopKey = String(place.stopKey || makeStopKey(userId, placeName, lat, lng));
    const current = lastGpsUpdateRef.current || myPosition;
    const currentLat = Number(current?.lat);
    const currentLng = Number(current?.lng);
    const approxDistanceMeters = Number.isFinite(currentLat) && Number.isFinite(currentLng)
      ? haversine(currentLat, currentLng, lat, lng)
      : null;

    setPlannedStops((prev) => {
      const exists = prev.some((stop) => isSameStopLocation(stop, lat, lng));
      if (exists) return prev;

      return [
        ...prev,
        {
          id: `planned-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          stopKey,
          lat,
          lng,
          placeName,
          reason,
          approxDistanceMeters,
        },
      ];
    });
    setSharedStops((prev) => {
      const exists = prev.some((stop) => isSameStopLocation(stop, lat, lng, String(userId)));
      if (exists) return prev;

      return [
        {
          id: stopKey,
          memberId: String(userId),
          memberName: displayNameRef.current || String(userId),
          reason,
          placeName,
          lat,
          lng,
          visibility: "shared",
          stopKey,
        },
        ...prev,
      ].slice(0, 80);
    });

    nearbySearchOriginRef.current = null;
    nearbySearchCommandRef.current = "";
    setNearbyPlaces([]);
    setNearbyPlaceType("");
    saveNearbySearch(null);

    setHiddenStopKeys((prev) => prev.filter((key) => key !== stopKey));
    resetRouteThrottleState();

    safePublish({
      destination: "/app/add-stop",
      body: JSON.stringify({
        roomId: myRoomRef.current,
        memberId: String(userId),
        memberName: displayNameRef.current || String(userId),
        reason,
        placeName,
        lat,
        lng,
        stopKey,
        type: "STOP_ADDED",
        ts: Date.now(),
      }),
    });

    const distanceHint = formatApproxDistance(approxDistanceMeters);
    pushToast(
      distanceHint
        ? `Stop added: ${placeName} (${distanceHint})`
        : `Stop added: ${placeName}`,
      "success",
      2800
    );
  }

    function removeStopForParty(place) {
      if (!myRoomRef.current || !place) return;

      const lat = Number(place.lat);
      const lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        pushToast("Selected place has no valid coordinates", "error", 2600);
        return;
      }

      const placeName = String(place.title || place.label || "Stop").trim();
      const stopKey = String(place.stopKey || makeStopKey(userId, placeName, lat, lng));

      setPlannedStops((prev) => prev.filter((stop) => !isSameStopLocation(stop, lat, lng)));
      setSharedStops((prev) => prev.filter((stop) => !isSameStopLocation(stop, lat, lng, String(userId))));
      setHiddenStopKeys((prev) => (prev.includes(stopKey) ? prev : [...prev, stopKey]));
      resetRouteThrottleState();

      safePublish({
        destination: "/app/add-stop",
        body: JSON.stringify({
          roomId: myRoomRef.current,
          memberId: String(userId),
          memberName: displayNameRef.current || String(userId),
          placeName,
          lat,
          lng,
          stopKey,
          type: "STOP_REMOVED",
          ts: Date.now(),
        }),
      });

      pushToast(`Stop removed: ${placeName}`, "info", 2400);
    }

  function appendHistoryEntry(entry) {
    createHistoryEvent(entry)
      .then((created) => {
        if (!created) return;
        setHistoryEvents((prev) => [created, ...prev].slice(0, 300));
      })
      .catch(() => {});
  }

  function finalizeTripHistory(endReason) {
    const activeTrip = currentTripRef.current;
    if (!activeTrip) return;

    if (endReason !== "manual-end" && endReason !== "arrived") {
      currentTripRef.current = null;
      return;
    }

    const endedAt = Date.now();
    const myStats = routeStatsRef.current?.[String(userId)] || {};
    const distanceMeters = Number.isFinite(myStats?.distance)
      ? myStats.distance
      : navigationMonitorRef.current?.distanceMeters;
    const etaMinutes = Number.isFinite(myStats?.etaMinutes)
      ? myStats.etaMinutes
      : navigationMonitorRef.current?.etaMinutes;
    const durationMinutes = Math.max(1, Math.round((endedAt - activeTrip.startedAt) / 60000));

    appendHistoryEntry({
      eventType: "trip",
      actorUserId: String(userId),
      actorName: displayNameRef.current || String(userId),
      actorEmail: authProfileRef.current?.email || "",
      actorPhone: authProfileRef.current?.phoneNumber || "",
      roomId: activeTrip.roomId || null,
      destinationLabel: activeTrip.destinationLabel || "Shared destination",
      startedAt: activeTrip.startedAt,
      endedAt,
      durationMinutes,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      eventTs: endedAt,
      reason: endReason,
    });

    currentTripRef.current = null;

    // Keep trip list updated after a finalized trip save.
    loadHistoryEventsForTrips();
  }

  function endActiveTrip(endReason, toastMessage) {
    finalizeTripHistory(endReason);
    setNavigationActive(false);
    navigationActiveRef.current = false;
    setDestination(null);
    destinationRef.current = null;
    clearAllRouteLines();
    setRouteStats({});
    resetRouteThrottleState();
    setTurnByTurnSteps([]);
    setActiveStepIndex(0);
    lastAnnouncedStepRef.current = -1;
    lastNavigationCameraRef.current = { lat: NaN, lng: NaN, bearing: NaN };
    setNavigationMonitor((prev) => ({
      ...prev,
      status: "Tracking",
      etaMinutes: null,
      distanceMeters: null,
    }));

    if (toastMessage) {
      pushToast(toastMessage, "info", 2800);
    }
  }

  function saveTripSnapshotForSos({ roomId, sosUserId, sosTs, sosReason }) {
    const key = `${String(roomId || "")}:${String(sosUserId || "")}:${Number(sosTs || 0)}`;
    if (processedSosTripSaveKeysRef.current.has(key)) {
      return;
    }

    processedSosTripSaveKeysRef.current.add(key);
    if (processedSosTripSaveKeysRef.current.size > 50) {
      const oldest = processedSosTripSaveKeysRef.current.values().next().value;
      if (oldest) {
        processedSosTripSaveKeysRef.current.delete(oldest);
      }
    }

    const endedAtCandidate = Number(sosTs);
    const endedAt = Number.isFinite(endedAtCandidate) && endedAtCandidate > 0
      ? endedAtCandidate
      : Date.now();

    const activeTrip = currentTripRef.current;
    const startedAtCandidate = Number(activeTrip?.startedAt);
    const startedAt = Number.isFinite(startedAtCandidate) && startedAtCandidate > 0
      ? startedAtCandidate
      : Math.max(endedAt - 60 * 1000, 0);

    const myStats = routeStatsRef.current?.[String(userId)] || {};
    const distanceMeters = Number.isFinite(myStats?.distance)
      ? myStats.distance
      : navigationMonitorRef.current?.distanceMeters;
    const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));

    appendHistoryEntry({
      eventType: "trip",
      actorUserId: String(userId),
      actorName: displayNameRef.current || String(userId),
      actorEmail: authProfileRef.current?.email || "",
      actorPhone: authProfileRef.current?.phoneNumber || "",
      roomId: roomId || myRoomRef.current || null,
      destinationLabel: destinationRef.current?.label || "Shared destination",
      startedAt,
      endedAt,
      durationMinutes,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      eventTs: endedAt,
      reason: `sos-party-save: ${sosReason || "safety alert"}`,
    });

    loadHistoryEventsForTrips();
  }

  function playSafetyAlarm() {
    if (typeof window === "undefined") return;

    const now = Date.now();
    // Avoid stacked alarms if multiple related events arrive at once.
    if (now - alarmCooldownRef.current < 1200) return;
    alarmCooldownRef.current = now;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        if (!alarmAudioCtxRef.current) {
          alarmAudioCtxRef.current = new AudioCtx();
        }

        const ctx = alarmAudioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const tones = [880, 660, 880, 660];
        const beepDuration = 0.16;
        const gap = 0.07;
        const startAt = ctx.currentTime + 0.02;

        tones.forEach((frequency, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = startAt + index * (beepDuration + gap);

          osc.type = "square";
          osc.frequency.setValueAtTime(frequency, t);

          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + beepDuration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + beepDuration + 0.01);
        });
      } catch {
        // Ignore audio errors; alert toasts still provide visible signal.
      }
    }

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([180, 100, 180, 100, 180]);
    }
  }

  function resetInactivityTracker(closePrompt = true) {
    inactivityTrackerRef.current = {
      referenceLat: NaN,
      referenceLng: NaN,
      lastMovementTs: 0,
    };

    clearWellbeingPromptTimer();
    wellbeingPromptActiveRef.current = false;
    if (closePrompt) {
      setWellbeingPromptOpen(false);
    }
  }

  function publishSafetyAlert(reason) {
    const roomId = myRoomRef.current;
    if (!roomId) {
      pushToast("Could not send alert: not in a room", "error", 3600);
      return;
    }

    const now = Date.now();
    const latest = lastGpsUpdateRef.current;

    safePublish({
      destination: "/app/safety-alert",
      body: JSON.stringify({
        roomId,
        userId,
        name: displayNameRef.current || userId,
        reason,
        lat: Number.isFinite(latest?.lat) ? latest.lat : null,
        lng: Number.isFinite(latest?.lng) ? latest.lng : null,
        ts: now,
      }),
    });

    playSafetyAlarm();
    pushToast("Safety alert sent to all room members", "error", 4200);

    saveTripSnapshotForSos({
      roomId,
      sosUserId: String(userId),
      sosTs: now,
      sosReason: reason,
    });

    const tracker = inactivityTrackerRef.current;
    tracker.lastMovementTs = now;
    if (Number.isFinite(latest?.lat) && Number.isFinite(latest?.lng)) {
      tracker.referenceLat = Number(latest.lat);
      tracker.referenceLng = Number(latest.lng);
    }
  }

  function onWellbeingConfirmed() {
    clearWellbeingPromptTimer();
    wellbeingPromptActiveRef.current = false;
    setWellbeingPromptOpen(false);

    const now = Date.now();
    const tracker = inactivityTrackerRef.current;
    tracker.lastMovementTs = now;

    const latest = lastGpsUpdateRef.current;
    if (Number.isFinite(latest?.lat) && Number.isFinite(latest?.lng)) {
      tracker.referenceLat = Number(latest.lat);
      tracker.referenceLng = Number(latest.lng);
    }
  }

  function triggerEmergencyAlert(reason) {
    clearWellbeingPromptTimer();
    wellbeingPromptActiveRef.current = false;
    setWellbeingPromptOpen(false);
    publishSafetyAlert(reason);
  }

  function openWellbeingPrompt() {
    if (wellbeingPromptActiveRef.current) return;

    wellbeingPromptActiveRef.current = true;
    setWellbeingPromptOpen(true);
    clearWellbeingPromptTimer();

    wellbeingPromptTimerRef.current = window.setTimeout(() => {
      triggerEmergencyAlert("No response to 60-second safety check");
    }, INACTIVITY_RESPONSE_TIMEOUT_MS);
  }

  function safePublish(message) {
    const client = stompRef.current;
    if (client && client.active) {
      try {
        client.publish(message);
        return;
      } catch {
        // Queue and retry once socket reconnects.
      }
    }
    publishQueue.current.push(message);
  }

  function colorForUser(id) {
    let hash = 0;
    const str = String(id || "route");
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
    }
    return `hsl(${Math.abs(hash) % 360} 78% 48%)`;
  }

  function upsertRouteLine(id, geometry) {
    if (!map.current || !mapReady || !geometry) return;
    if (typeof window === "undefined" || !window.google?.maps) return;

    const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    if (!coordinates.length) return;

    const path = coordinates
      .map((point) => ({ lng: Number(point?.[0]), lat: Number(point?.[1]) }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    if (!path.length) return;

    const color = id === userId ? "#2563eb" : colorForUser(id);
    const existing = routeGraphicsRef.current.get(id);

    if (!existing) {
      const polyline = new window.google.maps.Polyline({
        map: map.current,
        path,
        strokeColor: color,
        strokeWeight: id === userId ? 6 : 4,
        strokeOpacity: id === userId ? 0.9 : 0.65,
      });
      routeGraphicsRef.current.set(id, polyline);
      return;
    }

    existing.setPath(path);
    existing.setOptions({
      strokeColor: color,
      strokeWeight: id === userId ? 6 : 4,
      strokeOpacity: id === userId ? 0.9 : 0.65,
    });
    if (!existing.getMap()) {
      existing.setMap(map.current);
    }
  }

  function clearRouteLine(id) {
    const existing = routeGraphicsRef.current.get(id);
    if (!existing) return;

    if (typeof existing.setMap === "function") {
      existing.setMap(null);
    }

    routeGraphicsRef.current.delete(id);
  }

  function clearAllRouteLines() {
    Array.from(routeGraphicsRef.current.keys()).forEach((id) => clearRouteLine(id));
  }

  function resetRouteThrottleState() {
    lastRouteRequestRef.current = { key: "", destinationKey: "", ts: 0 };
  }

  function setSharedDestination(lat, lng, label = "Shared destination") {
    if (!myRoomRef.current) {
      pushToast("Join or create a room first", "error");
      return;
    }

    if (ownerIdRef.current !== userId) {
      pushToast("Only owner can set destination", "error");
      return;
    }

    const nextDestination = { lat, lng, label };
    setDestination(nextDestination);
    setMapCenter({ lat, lng });

    if (map.current?.panTo) {
      map.current.panTo({ lat, lng });
    }

    safePublish({
      destination: "/app/destination",
      body: JSON.stringify({ roomId: myRoomRef.current, userId, lat, lng }),
    });

    pushToast("Destination updated", "success");

    if (!label || label === "Pinned destination" || label === "Shared destination") {
      reverseGeocode(lat, lng)
        .then((placeName) => {
          if (!placeName) return;
          setDestination((prev) => {
            if (!prev || !isSamePoint(prev, { lat, lng })) return prev;
            return { ...prev, label: placeName };
          });
        })
        .catch(() => {});
    }
  }

  function toggleDirections() {
    if (!destination) {
      pushToast("Set destination first", "error");
      return;
    }

    if (!myPosition) {
      pushToast("Waiting for live location", "error");
      return;
    }

    setNavigationActive((prev) => {
      const next = !prev;
      if (next) {
        currentTripRef.current = {
          startedAt: Date.now(),
          roomId: myRoomRef.current || null,
          destinationLabel: destinationRef.current?.label || "Shared destination",
        };
        setActiveStepIndex(0);
        setTurnByTurnSteps([]);
        resetRouteThrottleState();

        const navZoom = getDrivingNavigationZoom(navigationMonitor.speedKmh);
        const targetLat = Number.isFinite(destinationRef.current?.lat)
          ? destinationRef.current.lat
          : myPosition.lat;
        const targetLng = Number.isFinite(destinationRef.current?.lng)
          ? destinationRef.current.lng
          : myPosition.lng;
        const startBearing = Number.isFinite(targetLat) && Number.isFinite(targetLng)
          ? calculateBearing(myPosition.lat, myPosition.lng, targetLat, targetLng)
          : mapHeading;

        setMapCenter({ lat: myPosition.lat, lng: myPosition.lng });
        setMapZoom(navZoom);
        setMapHeading(startBearing);
        setMapTilt(NAV_CAMERA_PITCH);

        if (map.current) {
          map.current.setCenter({ lat: myPosition.lat, lng: myPosition.lng });
          map.current.setZoom(navZoom);
          if (typeof map.current.setHeading === "function") {
            map.current.setHeading(startBearing);
          }
          if (typeof map.current.setTilt === "function") {
            map.current.setTilt(NAV_CAMERA_PITCH);
          }
        }

        lastNavigationCameraRef.current = {
          lat: myPosition.lat,
          lng: myPosition.lng,
          bearing: startBearing,
        };
        pushToast("Directions started", "info");
      } else {
        endActiveTrip("manual-end", "Trip ended");
      }
      return next;
    });
  }

  function goToMyLocation() {
    if (typeof myPosition?.lat !== "number" || typeof myPosition?.lng !== "number") {
      pushToast("Waiting for live location", "error");
      return;
    }

    const nextZoom = navigationActiveRef.current
      ? getDrivingNavigationZoom(navigationMonitor.speedKmh)
      : Math.max(16, mapZoom);
    const nextHeading = navigationActiveRef.current
      ? (Number.isFinite(lastNavigationCameraRef.current.bearing)
        ? lastNavigationCameraRef.current.bearing
        : mapHeading)
      : mapHeading;
    const nextTilt = navigationActiveRef.current ? NAV_CAMERA_PITCH : mapTilt;

    setMapCenter({ lat: myPosition.lat, lng: myPosition.lng });
    setMapZoom(nextZoom);
    setMapHeading(nextHeading);
    setMapTilt(nextTilt);

    if (map.current) {
      map.current.setCenter({ lat: myPosition.lat, lng: myPosition.lng });
      map.current.setZoom(nextZoom);
      if (typeof map.current.setHeading === "function") {
        map.current.setHeading(nextHeading);
      }
      if (typeof map.current.setTilt === "function") {
        map.current.setTilt(nextTilt);
      }
    }
  }

  function handleRecenterButtonClick() {
    if (typeof myPosition?.lat !== "number" || typeof myPosition?.lng !== "number") {
      pushToast("Waiting for live location", "error");
      return;
    }

    goToMyLocation();

    if (destination && !navigationActiveRef.current) {
      toggleDirections();
    }
  }

  function toggleOtherMemberRoutes() {
    setShowOtherMemberRoutes((prev) => {
      const next = !prev;
      pushToast(next ? "Other members routes shown" : "Other members routes hidden", "info", 2200);
      return next;
    });
  }

  function endTripFromSidebar() {
    if (!navigationActiveRef.current) {
      pushToast("No active trip to end", "error", 2200);
      return;
    }

    setConfirmEndTripOpen(true);
  }

  function confirmEndTripYes() {
    setConfirmEndTripOpen(false);
    endActiveTrip("manual-end", "Trip ended. This trip will be saved in trip history");
  }

  function confirmEndTripNo() {
    setConfirmEndTripOpen(false);
    pushToast("Trip end canceled", "info", 1800);
  }

  function triggerSosFromRightPanel() {
    triggerEmergencyAlert("Member pressed SOS button");
  }

  function logout() {
    currentTripRef.current = null;
    setConfirmEndTripOpen(false);
    setBroadcastConfirmOpen(false);
    setReconstructedBroadcast("");
    if (broadcastPreviewAudioUrl) {
      URL.revokeObjectURL(broadcastPreviewAudioUrl);
      setBroadcastPreviewAudioUrl("");
    }
    pendingBroadcastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingBroadcastTimersRef.current.clear();
    setBroadcastFeed([]);

    if (myRoomRef.current) {
      leaveRoom();
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("mapplify_userId");
    localStorage.removeItem(STORAGE_KEYS.realtimeUserId);
    sessionStorage.removeItem(STORAGE_KEYS.realtimeUserId);
    localStorage.removeItem(STORAGE_KEYS.displayName);
    localStorage.removeItem(STORAGE_KEYS.roomId);
    navigate("/", { replace: true });
  }

  function connectToRoom(roomId) {
    const socket = new SockJS(`${BACKEND_BASE_URL}/ws`);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 2000,
    });

    client.onConnect = () => {
      stompRef.current = client;
      pushToast(`Connected to room ${roomId}`, "success");

      client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
        const msg = JSON.parse(frame.body);

        if (msg.type === "position") {
          const lat = Number(msg.lat);
          const lng = Number(msg.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || !msg.userId) return;
          const incomingUserId = String(msg.userId);

          setMembers((prev) => {
            let found = false;
            const updated = prev.map((member) => {
              if (String(member.userId) !== incomingUserId) return member;
              found = true;
              return {
                ...member,
                userId: incomingUserId,
                lat,
                lng,
                ts: msg.ts,
                name: member.name || msg.name || member.userId,
              };
            });

            if (found) return updated;

            return [
              ...updated,
              {
                userId: incomingUserId,
                name: msg.name || incomingUserId,
                lat,
                lng,
                ts: msg.ts,
              },
            ];
          });
          return;
        }

        if (msg.type === "destination") {
          const lat = Number(msg.lat);
          const lng = Number(msg.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const incoming = { lat, lng };
          if (isSamePoint(destinationRef.current, incoming)) return;

          setDestination({ ...incoming, label: "Resolving destination..." });
          setMapCenter(incoming);
          if (map.current?.panTo) {
            map.current.panTo(incoming);
          }

          reverseGeocode(lat, lng)
            .then((placeName) => {
              setDestination((prev) => {
                if (!prev || !isSamePoint(prev, incoming)) return prev;
                return { ...prev, label: placeName || "Shared destination" };
              });
            })
            .catch(() => {
              setDestination((prev) => {
                if (!prev || !isSamePoint(prev, incoming)) return prev;
                return { ...prev, label: "Shared destination" };
              });
            });

          pushToast("Shared destination changed", "info");
          return;
        }

        if (msg.type === "presence") {
          const memberName = msg.user?.name || msg.user?.userId || "Member";
          if (msg.action === "join") {
            pushToast(`${memberName} joined`, "info", 2200);
          }

          if (msg.action === "leave") {
            pushToast(`${memberName} left`, "info", 2200);

            const leavingUserId = String(msg.user?.userId || "");
            if (!leavingUserId) return;

            if (leavingUserId === String(ownerIdRef.current) && leavingUserId !== String(userId)) {
              cleanupRoomState("Party ended automatically");
              return;
            }

            setMembers((prev) => prev.filter((member) => String(member.userId) !== leavingUserId));
            setSharedStops((prev) => prev.filter((stop) => String(stop.memberId || "") !== leavingUserId));
          }
          return;
        }

        if (msg.type === "safety-alert") {
          playSafetyAlarm();

          const alertUserId = String(msg.userId || "");
          const alertName = msg.name || alertUserId || "A member";
          const reason = msg.reason || "Safety check failed";

          saveTripSnapshotForSos({
            roomId: msg.roomId || myRoomRef.current,
            sosUserId: alertUserId,
            sosTs: msg.ts,
            sosReason: reason,
          });

          if (alertUserId === String(userId)) {
            pushToast("Emergency alert shared with your room", "error", 4200);
            return;
          }

          pushToast(`${alertName} may need help: ${reason}. Please call/check them.`, "error", 8000);
          return;
        }

        if (msg.type === "broadcast") {
          const sender = msg.name || msg.userId || "Member";
          const message = String(msg.message || "").trim();
          const messageId = String(msg.messageId || `${msg.userId || "member"}-${msg.ts || Date.now()}`);
          const senderId = String(msg.userId || "");
          if (message) {
            pushToast(`${sender}: ${message}`, "info", 5200);

            if (!processedBroadcastIdsRef.current.has(messageId)) {
              processedBroadcastIdsRef.current.add(messageId);
              if (processedBroadcastIdsRef.current.size > 120) {
                const oldest = processedBroadcastIdsRef.current.values().next().value;
                if (oldest) processedBroadcastIdsRef.current.delete(oldest);
              }

              upsertBroadcastFeedItem({
                id: messageId,
                userId: senderId,
                name: sender,
                message,
                ts: Number(msg.ts) || Date.now(),
                pending: false,
                remainingSeconds: 0,
              });

              const isSender = senderId === String(userId);
              const hadLocalPreview = locallyPreviewedBroadcastIdsRef.current.has(messageId);

              if (isSender && hadLocalPreview) {
                locallyPreviewedBroadcastIdsRef.current.delete(messageId);
              } else {
                const spokenMessage = isSender ? message : `${sender} said ${message}`;
                playVoiceAgentLine(spokenMessage);
              }
            }
          }
          return;
        }

        if (msg.type === "stop-added") {
          const stopLat = Number(msg.lat);
          const stopLng = Number(msg.lng);
          if (!Number.isFinite(stopLat) || !Number.isFinite(stopLng)) return;
          const stopKey = String(msg.stopKey || makeStopKey(msg.memberId, msg.placeName || msg.placeLabel || "Stop", stopLat, stopLng));

          const stop = {
            id: stopKey || `${msg.memberId || "member"}-${msg.ts || Date.now()}`,
            memberId: String(msg.memberId || ""),
            memberName: msg.memberName || msg.memberId || "Member",
            reason: msg.reason || "stop",
            placeName: msg.placeName || "Stop",
            lat: stopLat,
            lng: stopLng,
            visibility: String(msg.visibility || "shared"),
            stopKey,
          };

          const isShared = stop.visibility === "shared";
          const isMine = stop.memberId === String(userId);

          if (isShared || isMine) {
            setSharedStops((prev) => {
              const next = prev.filter((item) => !isSameStopLocation(item, stopLat, stopLng, stop.memberId));
              next.unshift(stop);
              return next.slice(0, 80);
            });
          }

          if (isShared) {
            pushToast(`${stop.memberName} added a stop: ${stop.placeName}`, "info", 3600);
          } else {
            pushToast(`${stop.memberName} added a personal stop for ${stop.reason}`, "info", 3800);
          }
          return;
        }

        if (msg.type === "stop-removed") {
          const stopLat = Number(msg.lat);
          const stopLng = Number(msg.lng);
          const stopKey = String(msg.stopKey || makeStopKey(msg.memberId, msg.placeName || "Stop", stopLat, stopLng));
          const memberId = String(msg.memberId || "");

          setPlannedStops((prev) => prev.filter((stop) => !isSameStopLocation(stop, stopLat, stopLng)));
          setSharedStops((prev) => prev.filter((stop) => !isSameStopLocation(stop, stopLat, stopLng, memberId)));

          if (memberId === String(userId)) {
            pushToast(`Stop removed: ${msg.placeName || "Stop"}`, "info", 2400);
          }
          return;
        }

        if (msg.type === "error") {
          pushToast(msg.message || "Room action failed", "error", 3500);
          if (msg.code === "ROOM_NOT_FOUND") {
            setMyRoom(null);
            myRoomRef.current = null;
            localStorage.removeItem(STORAGE_KEYS.roomId);
            resetInactivityTracker();
          }
        }
      });

      client.subscribe(`/topic/rooms/${roomId}/members`, (frame) => {
        const data = JSON.parse(frame.body);
        if (data.type === "members") {
          setOwnerId(data.ownerId);
          setMembers((prev) => mergeMembersWithSnapshot(prev, data.members));
        }
      });

      client.publish({
        destination: "/app/join",
        body: JSON.stringify({
          roomId,
          userId,
          name: displayNameRef.current || userId,
        }),
      });

      while (publishQueue.current.length) {
        const queued = publishQueue.current.shift();
        try {
          client.publish(queued);
        } catch {
          publishQueue.current.unshift(queued);
          break;
        }
      }
    };

    client.onStompError = () => {
      pushToast("Realtime connection error", "error", 3200);
    };

    client.activate();
  }

  async function createRoom() {
    const currentProfile = getAuthProfile();
    authProfileRef.current = currentProfile;

    const canonicalName = getPreferredAuthDisplayName(currentProfile);
    if (!canonicalName) {
      pushToast("Account name is required before creating a room", "error");
      return;
    }

    if (canonicalName !== displayNameRef.current) {
      setDisplayName(canonicalName);
      displayNameRef.current = canonicalName;
      localStorage.setItem(STORAGE_KEYS.displayName, canonicalName);
    }

    try {
      const centerValue = map.current?.getCenter?.();
      const center = centerValue
        ? {
            lat: typeof centerValue.lat === "function" ? Number(centerValue.lat()) : Number(centerValue.lat),
            lng: typeof centerValue.lng === "function" ? Number(centerValue.lng()) : Number(centerValue.lng),
          }
        : mapCenter;

      if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng)) {
        pushToast("Map is not ready", "error");
        return;
      }

      const response = await fetch(`${BACKEND_BASE_URL}/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: userId,
          lat: center.lat,
          lng: center.lng,
        }),
      });

      if (!response.ok) {
        pushToast("Failed to create room", "error");
        return;
      }

      const data = await response.json();
      setMyRoom(data.roomId);
      myRoomRef.current = data.roomId;
      setOwnerId(userId);
      ownerIdRef.current = userId;
      pushToast(`Room created: ${data.roomId}`, "success", 3200);
    } catch {
      pushToast("Room create failed", "error", 3200);
    }
  }

  async function joinRoom() {
    const currentProfile = getAuthProfile();
    authProfileRef.current = currentProfile;

    const canonicalName = getPreferredAuthDisplayName(currentProfile);
    if (!canonicalName) {
      pushToast("Account name is required before joining a room", "error");
      return;
    }

    if (canonicalName !== displayNameRef.current) {
      setDisplayName(canonicalName);
      displayNameRef.current = canonicalName;
      localStorage.setItem(STORAGE_KEYS.displayName, canonicalName);
    }

    const roomId = window.prompt("Enter Room ID:");
    if (!roomId) return;

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/rooms/${roomId}`);
      if (!response.ok) {
        pushToast("Room does not exist", "error");
        return;
      }

      setMyRoom(roomId);
      myRoomRef.current = roomId;
      pushToast(`Joining room ${roomId}`, "info");
    } catch {
      pushToast("Unable to verify room", "error");
    }
  }

  function cleanupRoomState(toastMessage = "Left room") {
    currentTripRef.current = null;
    setConfirmEndTripOpen(false);
    setBroadcastConfirmOpen(false);
    setReconstructedBroadcast("");
    if (broadcastPreviewAudioUrl) {
      URL.revokeObjectURL(broadcastPreviewAudioUrl);
      setBroadcastPreviewAudioUrl("");
    }
    setNearbyPlaces([]);
    setNearbyPlaceType("");
    nearbySearchOriginRef.current = null;
    nearbySearchCommandRef.current = "";
    saveNearbySearch(null);
    setPlannedStops([]);
    setSharedStops([]);
    saveRoomStopState(myRoomRef.current, [], []);
    setHiddenStopKeys([]);
    pendingBroadcastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingBroadcastTimersRef.current.clear();
    setBroadcastFeed([]);

    setMyRoom(null);
    myRoomRef.current = null;
    setOwnerId(null);
    ownerIdRef.current = null;
    setMembers([]);
    setDestination(null);
    destinationRef.current = null;
    setNavigationActive(false);
    setShowOtherMemberRoutes(false);
    setTurnByTurnSteps([]);
    setActiveStepIndex(0);
    setWellbeingPromptOpen(false);
    navigationActiveRef.current = false;
    lastNavigationCameraRef.current = { lat: NaN, lng: NaN, bearing: NaN };
    setRouteStats({});
    setNavigationMonitor((prev) => ({
      ...prev,
      status: "Tracking",
      etaMinutes: null,
      distanceMeters: null,
    }));
    resetRouteThrottleState();
    pushToast(toastMessage, "info");
    resetInactivityTracker(false);
    localStorage.removeItem(STORAGE_KEYS.roomId);
    pushToast("Left room", "info");

    if (stompRef.current) {
      stompRef.current.deactivate();
      stompRef.current = null;
    }
  }

  function leaveRoom(options = {}) {
    if (!myRoomRef.current) return;

    const { publishLeave = true, toastMessage = "Left room" } = options;

    if (publishLeave) {
      safePublish({
        destination: "/app/leave",
        body: JSON.stringify({ roomId: myRoomRef.current, userId }),
      });
    }

    cleanupRoomState(toastMessage);
  }

  function closeRoom() {
    if (ownerId !== userId) {
      pushToast("Only owner can close room", "error");
      return;
    }
    leaveRoom();
  }

  useEffect(() => {
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return;
    pushToast("Google Maps key missing. Set VITE_GOOGLE_MAPS_API_KEY", "error", 4500);
  }, []);

  useEffect(() => {
    return () => {
      clearAllRouteLines();
      clearWellbeingPromptTimer();
      wellbeingPromptActiveRef.current = false;
      pendingBroadcastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingBroadcastTimersRef.current.clear();
      if (broadcastPreviewAudioUrl) {
        URL.revokeObjectURL(broadcastPreviewAudioUrl);
      }
      map.current = null;
    };
  }, [broadcastPreviewAudioUrl]);

  useEffect(() => {
    if (!myRoom || stompRef.current?.active) return;
    connectToRoom(myRoom);
  }, [myRoom]);

  useEffect(() => {
    resetRouteThrottleState();

    if (showOtherMemberRoutes) return;

    Array.from(routeGraphicsRef.current.keys()).forEach((id) => {
      if (String(id) !== String(userId)) {
        clearRouteLine(id);
      }
    });
  }, [showOtherMemberRoutes, userId]);

  useEffect(() => {
    const watchId = watchGPS(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        const now = Date.now();

        const current = { lat, lng };
        const previous = lastGpsUpdateRef.current;
        const enoughMovement = hasMeaningfulMove(previous, current);
        const enoughTime = !previous || now - previous.ts >= POSITION_PUBLISH_INTERVAL_MS;

        if (!enoughMovement && !enoughTime) return;

        const nativeSpeed = Number(position.coords.speed);
        let speedKmh = Number.isFinite(nativeSpeed) && nativeSpeed >= 0
          ? nativeSpeed * 3.6
          : 0;
        if (!speedKmh && previous) {
          const seconds = Math.max(1, (now - previous.ts) / 1000);
          const movedMeters = haversine(previous.lat, previous.lng, lat, lng);
          speedKmh = (movedMeters / seconds) * 3.6;
        }
        speedKmh = Math.max(0, Math.min(220, speedKmh));

        lastGpsUpdateRef.current = { ...current, ts: now };
        setMyPosition(current);
        setNavigationMonitor((prev) => ({
          ...prev,
          speedKmh,
          status: navigationActiveRef.current ? "Navigating" : "Tracking",
        }));

        const nearbyOrigin = nearbySearchOriginRef.current;
        if (
          nearbyOrigin &&
          Number.isFinite(nearbyOrigin.lat) &&
          Number.isFinite(nearbyOrigin.lng)
        ) {
          const movedSinceNearbySearch = haversine(nearbyOrigin.lat, nearbyOrigin.lng, lat, lng);
          if (movedSinceNearbySearch >= NEARBY_RESULTS_RESET_DISTANCE_METERS) {
            nearbySearchOriginRef.current = null;
            nearbySearchCommandRef.current = "";
            setNearbyPlaces([]);
            setNearbyPlaceType("");
            saveNearbySearch(null);
            pushToast("Nearby results cleared. You moved more than 1 km. Ask again.", "info", 3200);
          }
        }

        const nextPlannedStop = plannedStopsRef.current[0];
        if (nextPlannedStop) {
          const stopDistance = haversine(lat, lng, Number(nextPlannedStop.lat), Number(nextPlannedStop.lng));
          if (stopDistance <= STOP_ARRIVAL_RADIUS_METERS) {
            setPlannedStops((prev) => prev.slice(1));
            resetRouteThrottleState();
            pushToast(
              `Reached stop: ${nextPlannedStop.placeName || "Planned stop"}. Routing to destination.`,
              "success",
              3200
            );
          }
        }

        const tracker = inactivityTrackerRef.current;
        if (!Number.isFinite(tracker.referenceLat) || !Number.isFinite(tracker.referenceLng)) {
          tracker.referenceLat = lat;
          tracker.referenceLng = lng;
          tracker.lastMovementTs = now;
        } else {
          const movedFromReferenceMeters = haversine(
            tracker.referenceLat,
            tracker.referenceLng,
            lat,
            lng
          );

          if (movedFromReferenceMeters >= INACTIVITY_MOVE_RESET_METERS) {
            tracker.referenceLat = lat;
            tracker.referenceLng = lng;
            tracker.lastMovementTs = now;

            if (wellbeingPromptActiveRef.current) {
              clearWellbeingPromptTimer();
              wellbeingPromptActiveRef.current = false;
              setWellbeingPromptOpen(false);
            }
          } else if (
            myRoomRef.current &&
            !wellbeingPromptActiveRef.current &&
            tracker.lastMovementTs > 0 &&
            now - tracker.lastMovementTs >= INACTIVITY_ALERT_THRESHOLD_MS
          ) {
            openWellbeingPrompt();
          }
        }

        if (navigationActiveRef.current && turnByTurnStepsRef.current.length > 0) {
          let nearestIndex = -1;
          let nearestDistance = Number.POSITIVE_INFINITY;

          turnByTurnStepsRef.current.forEach((step, index) => {
            if (!step || typeof step.lat !== "number" || typeof step.lng !== "number") return;
            const distance = haversine(lat, lng, step.lat, step.lng);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = index;
            }
          });

          if (nearestIndex >= 0) {
            setActiveStepIndex((prev) => Math.max(prev, nearestIndex));
          }

          const nextStep = turnByTurnStepsRef.current[Math.max(0, nearestIndex)];
          const targetLat = Number.isFinite(nextStep?.lat) ? nextStep.lat : destinationRef.current?.lat;
          const targetLng = Number.isFinite(nextStep?.lng) ? nextStep.lng : destinationRef.current?.lng;
          if (
            map.current &&
            Number.isFinite(targetLat) &&
            Number.isFinite(targetLng)
          ) {
            const bearing = calculateBearing(lat, lng, targetLat, targetLng);

            const previousCamera = lastNavigationCameraRef.current;
            const movedSinceLastCamera = Number.isFinite(previousCamera.lat) && Number.isFinite(previousCamera.lng)
              ? haversine(previousCamera.lat, previousCamera.lng, lat, lng)
              : Number.POSITIVE_INFINITY;
            const directionDelta = bearingDifferenceDegrees(previousCamera.bearing, bearing);

            const locationChanged = movedSinceLastCamera >= NAV_CAMERA_CENTER_UPDATE_MIN_METERS;
            const directionChanged = directionDelta >= NAV_CAMERA_BEARING_UPDATE_MIN_DEGREES;

            if (locationChanged) {
              const nextCameraBearing = directionChanged || !Number.isFinite(previousCamera.bearing)
                ? bearing
                : previousCamera.bearing;

              setMapCenter({ lat, lng });
              setMapHeading(nextCameraBearing);
              setMapTilt(NAV_CAMERA_PITCH);
              setMapZoom(getDrivingNavigationZoom(speedKmh));

              if (map.current) {
                map.current.setCenter({ lat, lng });
                map.current.setZoom(getDrivingNavigationZoom(speedKmh));
                if (typeof map.current.setHeading === "function") {
                  map.current.setHeading(nextCameraBearing);
                }
                if (typeof map.current.setTilt === "function") {
                  map.current.setTilt(NAV_CAMERA_PITCH);
                }
              }

              lastNavigationCameraRef.current = {
                lat,
                lng,
                bearing: nextCameraBearing,
              };
            }
          }
        }

        if (navigationActiveRef.current) {
          const tripDestination = destinationRef.current;
          const destinationLat = Number(tripDestination?.lat);
          const destinationLng = Number(tripDestination?.lng);

          if (Number.isFinite(destinationLat) && Number.isFinite(destinationLng)) {
            const remainingMeters = haversine(lat, lng, destinationLat, destinationLng);
            if (remainingMeters <= DESTINATION_ARRIVAL_RADIUS_METERS) {
              endActiveTrip("arrived", "Destination reached. Trip ended");
            }
          }
        }

        if (myRoomRef.current) {
          safePublish({
            destination: "/app/position",
            body: JSON.stringify({
              type: "position",
              roomId: myRoomRef.current,
              userId,
              name: displayNameRef.current || userId,
              lat,
              lng,
              ts: now,
            }),
          });
        }
      },
      () => pushToast("Unable to access location", "error", 3200)
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);

  useEffect(() => {
    const activeStop = visiblePlannedStops[0] || null;
    const hasRouteTarget = Boolean(activeStop || destination);

    if (!mapReady || !hasRouteTarget) {
      clearAllRouteLines();
      setRouteStats({});
      setTurnByTurnSteps([]);
      setActiveStepIndex(0);
      setNavigationMonitor((prev) => ({
        ...prev,
        etaMinutes: null,
        distanceMeters: null,
        status: navigationActiveRef.current ? "Waiting for route" : "Tracking",
      }));
      resetRouteThrottleState();
      return;
    }

    const travelers = new Map();

    if (typeof myPosition?.lat === "number" && typeof myPosition?.lng === "number") {
      travelers.set(userId, {
        userId,
        name: displayNameRef.current || "You",
        lat: myPosition.lat,
        lng: myPosition.lng,
      });
    }

    members.forEach((member) => {
      if (!member?.userId) return;

      const memberId = String(member.userId);
      if (!memberId || memberId === String(userId)) return;

      const lat = Number(member.lat);
      const lng = Number(member.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      travelers.set(memberId, {
        ...member,
        userId: memberId,
        lat,
        lng,
      });
    });

    if (!travelers.size) {
      clearAllRouteLines();
      setRouteStats({});
      setTurnByTurnSteps([]);
      setActiveStepIndex(0);
      resetRouteThrottleState();
      return;
    }

    const travelerList = Array.from(travelers.values())
      .filter((person) => person.userId === userId || showOtherMemberRoutes)
      .sort((a, b) => String(a.userId).localeCompare(String(b.userId)));

    if (!travelerList.length) {
      clearAllRouteLines();
      setRouteStats({});
      setTurnByTurnSteps([]);
      setActiveStepIndex(0);
      resetRouteThrottleState();
      return;
    }

    const destinationForUser = activeStop
      ? {
          lat: Number(activeStop.lat),
          lng: Number(activeStop.lng),
          label: activeStop.placeName || "Planned stop",
        }
      : destination;

    const destinationForOthers = destination || destinationForUser;
    const destinationKey = `${destinationForUser.lat.toFixed(4)},${destinationForUser.lng.toFixed(4)}`;
    const travelerKey = travelerList
      .map((person) => `${person.userId}:${person.lat.toFixed(4)},${person.lng.toFixed(4)}`)
      .join("|");
    const requestKey = `${destinationKey}|${travelerKey}`;

    const now = Date.now();
    const previousRequest = lastRouteRequestRef.current;
    const sameDestination = previousRequest.destinationKey === destinationKey;
    const withinThrottleWindow = sameDestination && now - previousRequest.ts < ROUTE_REFRESH_MS;
    const duplicateSnapshot = previousRequest.key === requestKey;

    if (duplicateSnapshot || withinThrottleWindow) return;

    lastRouteRequestRef.current = { key: requestKey, destinationKey, ts: now };

    let cancelled = false;
    const seq = ++routeSeqRef.current;

    (async () => {
      const result = await Promise.all(
        travelerList.map(async (person) => {
          const routeTarget = person.userId === userId ? destinationForUser : destinationForOthers;
          if (!routeTarget) {
            return { person, route: null };
          }

          try {
            const route = await fetchRoute(
              { lat: person.lat, lng: person.lng },
              routeTarget
            );
            return { person, route };
          } catch {
            return { person, route: null };
          }
        })
      );

      if (cancelled || seq !== routeSeqRef.current) return;

      const nextStats = {};
      const alive = new Set();
      let ownSteps = [];

      result.forEach(({ person, route }) => {
        if (!route?.geometry) return;

        const shouldDrawRoute = person.userId === userId || showOtherMemberRoutes;
        if (shouldDrawRoute) {
          upsertRouteLine(person.userId, route.geometry);
          alive.add(person.userId);
        }

        nextStats[person.userId] = {
          name: person.name || person.userId,
          distance: Math.round(route.distance || 0),
          etaMinutes: Math.round((route.duration || 0) / 60),
        };

        if (person.userId === userId) {
          const steps = route?.legs?.[0]?.steps;
          if (Array.isArray(steps)) {
            ownSteps = steps
              .map((step) => {
                const loc = step?.maneuver?.location;
                if (!Array.isArray(loc) || loc.length < 2) return null;

                const lng = Number(loc[0]);
                const lat = Number(loc[1]);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                const instruction =
                  step?.maneuver?.instruction ||
                  step?.name ||
                  "Continue";

                const maneuverType = step?.maneuver?.type || "";
                const maneuverModifier = step?.maneuver?.modifier || "";
                const cue = toTurnCue(maneuverType, maneuverModifier, instruction);

                return {
                  cue,
                  instruction,
                  maneuverType,
                  maneuverModifier,
                  distance: Math.round(Number(step?.distance || 0)),
                  duration: Math.round(Number(step?.duration || 0)),
                  lat,
                  lng,
                };
              })
              .filter(Boolean);
          }
        }
      });

      Array.from(routeGraphicsRef.current.keys()).forEach((id) => {
        if (!alive.has(id)) clearRouteLine(id);
      });

      setRouteStats(nextStats);
      setTurnByTurnSteps(navigationActiveRef.current ? ownSteps : []);
      setActiveStepIndex((prev) => {
        if (!navigationActiveRef.current || !ownSteps.length) return 0;
        return Math.min(prev, Math.max(0, ownSteps.length - 1));
      });

      const own = nextStats[userId];
      setNavigationMonitor((prev) => ({
        ...prev,
        etaMinutes: own?.etaMinutes ?? null,
        distanceMeters: own?.distance ?? null,
        status: navigationActiveRef.current
          ? own
            ? "Navigating"
            : "Route unavailable"
          : "Tracking",
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, destination, plannedStops, members, myPosition, userId, showOtherMemberRoutes]);

  useEffect(() => {
    if (!navigationActive) return;
    if (!turnByTurnSteps.length) return;

    const active = turnByTurnSteps[activeStepIndex];
    if (!active) return;
    if (lastAnnouncedStepRef.current === activeStepIndex) return;

    lastAnnouncedStepRef.current = activeStepIndex;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const spoken =
        active.cue && active.cue !== active.instruction
          ? `${active.cue}. ${active.instruction}`
          : active.instruction;
      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [navigationActive, turnByTurnSteps, activeStepIndex]);

  useEffect(() => {
    return () => {
      if (stompRef.current) {
        stompRef.current.deactivate();
        stompRef.current = null;
      }

      clearWellbeingPromptTimer();
      wellbeingPromptActiveRef.current = false;
    };
  }, []);

  function handleSelectDestination(place) {
    if (!place) return;

    const lat =
      typeof place.lat === "number"
        ? place.lat
        : place?.geocodes?.main?.latitude;
    const lng =
      typeof place.lng === "number"
        ? place.lng
        : place?.geocodes?.main?.longitude;

    const label =
      place.label ||
      place.title ||
      place.name ||
      place?.location?.formatted_address ||
      "Shared destination";

    if (typeof lat !== "number" || typeof lng !== "number") {
      pushToast("Destination coordinates missing", "error");
      return;
    }

    setSharedDestination(lat, lng, label);
  }

  function handleMapLoad(event) {
    const loadedMap = event?.map || event?.detail?.map || null;
    if (!loadedMap) return;
    map.current = loadedMap;
    setMapReady(true);
  }

  function handleCameraChanged(event) {
    if (event?.map) {
      map.current = event.map;
    }

    const detail = event?.detail;
    if (!detail) return;

    const centerValue = detail.center;
    if (centerValue) {
      const nextLat = typeof centerValue.lat === "function" ? Number(centerValue.lat()) : Number(centerValue.lat);
      const nextLng = typeof centerValue.lng === "function" ? Number(centerValue.lng()) : Number(centerValue.lng);
      if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
        setMapCenter({ lat: nextLat, lng: nextLng });
      }
    }

    if (Number.isFinite(detail.zoom)) setMapZoom(detail.zoom);
    if (Number.isFinite(detail.heading)) setMapHeading(detail.heading);
    if (Number.isFinite(detail.tilt)) setMapTilt(detail.tilt);
  }

  function handleTilesLoaded(event) {
    if (event?.map) {
      map.current = event.map;
    }
    setMapReady(true);
  }

  function handleMapDoubleClick(event) {
    const point = extractLatLngFromMapClick(event);
    if (!point) return;
    setSharedDestination(point.lat, point.lng, "Pinned destination");
  }

  function zoomIn() {
    const nextZoom = Math.min(22, (map.current?.getZoom?.() ?? mapZoom) + 1);
    setMapZoom(nextZoom);
    if (map.current?.setZoom) {
      map.current.setZoom(nextZoom);
    }
  }

  function zoomOut() {
    const nextZoom = Math.max(2, (map.current?.getZoom?.() ?? mapZoom) - 1);
    setMapZoom(nextZoom);
    if (map.current?.setZoom) {
      map.current.setZoom(nextZoom);
    }
  }

  const myRoute = routeStats[userId];
  const pillEta = myRoute ? `${myRoute.etaMinutes} min` : "-";
  const activePlannedStop = visiblePlannedStops[0] || null;
  const pillDestination = activePlannedStop
    ? `${activePlannedStop.placeName || "Planned stop"} (stop first)`
    : (
      destination?.label ||
      (destination ? "Shared destination" : "Double click map or search")
    );

  const navigationItems = Object.entries(routeStats)
    .map(([id, info]) => ({
      userId: id,
      name: info.name,
      distance: info.distance,
      etaMinutes: info.etaMinutes,
    }))
    .sort((a, b) => a.etaMinutes - b.etaMinutes);

  const hasOtherMembers = members.some(
    (member) => member?.userId && String(member.userId) !== String(userId)
  );

  const tripHistory = historyEvents
    .filter(
      (item) =>
        item?.eventType === "trip" &&
        isTripOwnedByCurrentUser(item, accountProfileId, userId)
    )
    .sort((a, b) => getHistoryEventTs(b) - getHistoryEventTs(a));

  const selectedTrip =
    tripHistory.find((item) => String(item.id) === String(selectedTripId)) ||
    tripHistory[0] ||
    null;

  const selectedTripSosHistory = historyEvents
    .filter((item) => item?.eventType === "sos")
    .filter((item) => {
      if (!selectedTrip) return false;

      const tripRoom = String(selectedTrip.roomId || "").trim();
      const sosRoom = String(item?.roomId || "").trim();
      if (tripRoom && sosRoom && tripRoom !== sosRoom) {
        return false;
      }

      const tripStart = Number(selectedTrip.startedAt);
      const tripEnd = Number(selectedTrip.endedAt);
      const sosTs = getHistoryEventTs(item);

      if (Number.isFinite(tripStart) && Number.isFinite(tripEnd) && sosTs > 0) {
        return sosTs >= tripStart && sosTs <= tripEnd;
      }

      return true;
    })
    .sort((a, b) => getHistoryEventTs(b) - getHistoryEventTs(a));

  const nextTurn = turnByTurnSteps[activeStepIndex] || null;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={["marker", "places"]}>
      <div style={{ height: "100dvh", width: "100vw" }} className="relative overflow-hidden bg-slate-950">
        <GoogleMap
          className="absolute top-0 left-0 w-full h-[105%] z-10"
          center={mapCenter}
          zoom={mapZoom}
          heading={mapHeading}
          tilt={mapTilt}
          disableDoubleClickZoom
          mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
          onLoad={handleMapLoad}
          onCameraChanged={handleCameraChanged}
          onDblclick={handleMapDoubleClick}
          onTilesLoaded={handleTilesLoaded}
          disableDefaultUI
          gestureHandling="greedy"
        >
          {destination && (
            <AdvancedMarker position={{ lat: Number(destination.lat), lng: Number(destination.lng) }}>
              <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-black shadow" />
            </AdvancedMarker>
          )}

          {myPosition && (
            <AdvancedMarker position={{ lat: Number(myPosition.lat), lng: Number(myPosition.lng) }} title="Your location">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
            </AdvancedMarker>
          )}

          {visibleSharedStops.map((stop) => (
            <AdvancedMarker
              key={stop.id}
              position={{ lat: Number(stop.lat), lng: Number(stop.lng) }}
              title={`${stop.memberName} stopped for ${stop.reason}: ${stop.placeName}`}
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 shadow" />
            </AdvancedMarker>
          ))}

          <FriendsLayer members={members} userId={userId} />
        </GoogleMap>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-linear-to-b from-black/30 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-linear-to-t from-black/25 via-black/10 to-transparent" />

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
        <DestinationPill
          destination={pillDestination}
          eta={pillEta}
          navigationMonitor={navigationMonitor}
          nextTurnCue={nextTurn?.cue || "Continue"}
          nextTurnInstruction={nextTurn?.instruction || "No active turn"}
          nextTurnDistance={typeof nextTurn?.distance === "number" ? nextTurn.distance : null}
          turnByTurnSteps={turnByTurnSteps}
          activeStepIndex={activeStepIndex}
        />

        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded((value) => !value)}
          displayName={displayName}
          onSetDisplayName={setDisplayName}
          myRoom={myRoom}
          userId={userId}
          ownerId={ownerId}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onCloseRoom={closeRoom}
          destinationLabel={pillDestination}
          hasDestination={Boolean(destination)}
          currentLocation={myPosition}
          navigationActive={navigationActive}
          onToggleNavigation={toggleDirections}
          onGoToMyLocation={goToMyLocation}
          showOtherMemberRoutes={showOtherMemberRoutes}
          hasOtherMembers={hasOtherMembers}
          onToggleOtherMemberRoutes={toggleOtherMemberRoutes}
          onEndTrip={endTripFromSidebar}
          navigationMonitor={navigationMonitor}
          nextTurnCue={nextTurn?.cue || "Continue"}
          nextTurnInstruction={nextTurn?.instruction || "No active turn"}
          nextTurnDistance={typeof nextTurn?.distance === "number" ? nextTurn.distance : null}
          turnByTurnSteps={turnByTurnSteps}
          activeStepIndex={activeStepIndex}
          navigationItems={navigationItems}
          onSelectDestination={handleSelectDestination}
          members={members}
        />

        <RightSidebar
          isExpanded={isRightSidebarExpanded}
          onToggle={handleRightSidebarToggle}
          onPanelInteract={handleRightSidebarInteraction}
          onPanelMouseEnter={handleRightSidebarMouseEnter}
          onPanelMouseLeave={handleRightSidebarMouseLeave}
          myRoom={myRoom}
          wellbeingPromptOpen={wellbeingPromptOpen}
          onTriggerSos={triggerSosFromRightPanel}
          onStartVoiceBroadcast={startVoiceBroadcast}
          onStartNearbyVoiceSearch={startNearbyVoiceSearch}
          nearbyPlaces={nearbyPlacesWithStatus}
          onAddStop={addStopForParty}
          onRemoveStop={removeStopForParty}
          isVoiceBusy={voiceBusy}
          broadcastFeed={broadcastFeed}
          onCancelPendingBroadcast={(messageId) => cancelPendingBroadcast(messageId, true)}
        />

        <SettingsPanel
          isOpen={isSettingsOpen}
          onToggle={() => setIsSettingsOpen((value) => !value)}
          onOpenTrips={handleOpenTripsHistory}
          onLogout={logout}
          profileName={authProfileRef.current.name || displayName || "User"}
          profileId={activeProfileId}
          profileEmail={authProfileRef.current.email || ""}
          profilePhone={authProfileRef.current.phoneNumber || ""}
          tripHistory={tripHistory}
          sosHistory={selectedTripSosHistory}
          selectedTripId={selectedTrip?.id ?? null}
          onSelectTrip={setSelectedTripId}
          historyLoading={historyLoading}
          historyError={historyLoadError}
        />

        <button
          type="button"
          onClick={handleRecenterButtonClick}
          className="absolute bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/85 text-slate-900 shadow-lg backdrop-blur hover:bg-white"
          title="Recenter"
        >
          <RouteIcon className="h-5 w-5" />
        </button>

        {wellbeingPromptOpen && (
          <div className="absolute inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/45 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-900">Safety Check</h3>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                You have been at nearly the same location for 15 minutes. Are you alright?
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                If there is no response in 60 seconds, everyone in your room will be alerted to call and check on you.
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onWellbeingConfirmed}
                  className="flex-1 rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Tick - I am okay
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmergencyAlert("Member tapped cross on safety check")}
                  className="flex-1 rounded-xl border border-rose-600 bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Cross - Need help
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmEndTripOpen && (
          <div className="absolute inset-0 z-75 bg-black/45 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/45 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-900">End Trip?</h3>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                This trip will be saved in trip history. Do you want to end the trip?
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={confirmEndTripYes}
                  className="flex-1 rounded-xl border border-rose-600 bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={confirmEndTripNo}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
