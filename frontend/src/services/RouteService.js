const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const ROUTE_CACHE_TTL_MS = parsePositiveInt(import.meta.env.VITE_ROUTE_CACHE_TTL_MS, 60000);
const REVERSE_CACHE_TTL_MS = parsePositiveInt(import.meta.env.VITE_REVERSE_CACHE_TTL_MS, 300000);
const SEARCH_RADIUS_METERS = 40000;
const ENABLE_CLIENT_GOOGLE_FALLBACK = parseBoolean(
  import.meta.env.VITE_ENABLE_CLIENT_GOOGLE_FALLBACK,
  false
);

const routeCache = new Map();
const reverseGeocodeCache = new Map();

function rounded(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function hasGoogleMaps() {
  return typeof window !== "undefined" && Boolean(window.google?.maps);
}

async function ensureGooglePlacesLibrary() {
  if (!hasGoogleMaps()) return false;
  if (window.google.maps.places?.PlacesService) return true;

  if (typeof window.google.maps.importLibrary === "function") {
    try {
      await window.google.maps.importLibrary("places");
      return Boolean(window.google.maps.places?.PlacesService);
    } catch {
      return false;
    }
  }

  return false;
}

function mapManeuver(maneuverRaw, instruction) {
  const raw = String(maneuverRaw || "").toLowerCase();

  let type = "";
  if (raw.includes("arrive")) type = "arrive";
  else if (raw.includes("depart")) type = "depart";
  else if (raw.includes("roundabout") || raw.includes("rotary")) type = "roundabout";
  else if (raw.includes("merge")) type = "merge";
  else if (raw.includes("fork")) type = "fork";
  else if (raw) type = "turn";

  let modifier = "";
  if (raw.includes("uturn")) modifier = "uturn";
  else if (raw.includes("sharp-left")) modifier = "sharp left";
  else if (raw.includes("slight-left")) modifier = "slight left";
  else if (raw.includes("left")) modifier = "left";
  else if (raw.includes("sharp-right")) modifier = "sharp right";
  else if (raw.includes("slight-right")) modifier = "slight right";
  else if (raw.includes("right")) modifier = "right";
  else if (raw.includes("straight")) modifier = "straight";

  if (!modifier) {
    const text = String(instruction || "").toLowerCase();
    if (text.includes("u-turn")) modifier = "uturn";
    else if (text.includes("sharp left")) modifier = "sharp left";
    else if (text.includes("slight left")) modifier = "slight left";
    else if (text.includes(" left")) modifier = "left";
    else if (text.includes("sharp right")) modifier = "sharp right";
    else if (text.includes("slight right")) modifier = "slight right";
    else if (text.includes(" right")) modifier = "right";
    else if (text.includes("straight") || text.includes("continue")) modifier = "straight";
  }

  return { type, modifier };
}

function mapGoogleDirectionsRoute(route) {
  const overviewPath = Array.isArray(route?.overview_path) ? route.overview_path : [];
  const coordinates = overviewPath
    .map((point) => {
      const lat = typeof point?.lat === "function" ? Number(point.lat()) : Number(point?.lat);
      const lng = typeof point?.lng === "function" ? Number(point.lng()) : Number(point?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lng, lat];
    })
    .filter(Boolean);

  let totalDistance = 0;
  let totalDuration = 0;

  const legs = (Array.isArray(route?.legs) ? route.legs : []).map((leg) => {
    const legDistance = Number(leg?.distance?.value || 0);
    const legDuration = Number(leg?.duration?.value || 0);
    totalDistance += legDistance;
    totalDuration += legDuration;

    const steps = (Array.isArray(leg?.steps) ? leg.steps : [])
      .map((step) => {
        const loc = step?.start_location || step?.end_location;
        const lat = typeof loc?.lat === "function" ? Number(loc.lat()) : Number(loc?.lat);
        const lng = typeof loc?.lng === "function" ? Number(loc.lng()) : Number(loc?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const instruction = stripHtml(step?.instructions || "") || "Continue";
        const maneuverInfo = mapManeuver(step?.maneuver, instruction);

        return {
          distance: Number(step?.distance?.value || 0),
          duration: Number(step?.duration?.value || 0),
          name: instruction,
          maneuver: {
            location: [lng, lat],
            instruction,
            type: maneuverInfo.type,
            modifier: maneuverInfo.modifier,
          },
        };
      })
      .filter(Boolean);

    return {
      distance: legDistance,
      duration: legDuration,
      steps,
    };
  });

  return {
    geometry: {
      type: "LineString",
      coordinates,
    },
    distance: totalDistance,
    duration: totalDuration,
    legs,
  };
}

async function fetchRouteFromGoogle(from, to) {
  if (!hasGoogleMaps()) return null;
  if (typeof window.google.maps.DirectionsService !== "function") return null;

  try {
    const directionsService = new window.google.maps.DirectionsService();
    const statusOk = window.google.maps.DirectionsStatus?.OK || "OK";
    const result = await new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: Number(from.lat), lng: Number(from.lng) },
          destination: { lat: Number(to.lat), lng: Number(to.lng) },
          travelMode: window.google.maps.TravelMode?.DRIVING || "DRIVING",
          provideRouteAlternatives: false,
          unitSystem: window.google.maps.UnitSystem?.METRIC,
        },
        (response, status) => {
          if (status === statusOk && response) {
            resolve(response);
            return;
          }
          reject(new Error(status || "DIRECTIONS_FAILED"));
        }
      );
    });

    const firstRoute = result?.routes?.[0];
    if (!firstRoute) return null;
    return mapGoogleDirectionsRoute(firstRoute);
  } catch {
    return null;
  }
}

async function searchDestinationsFromGoogle(query, currentLocation) {
  if (!(await ensureGooglePlacesLibrary())) return [];
  if (typeof window.google.maps.places?.PlacesService !== "function") return [];

  try {
    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    const statusOk = window.google.maps.places.PlacesServiceStatus?.OK || "OK";
    const statusZero = window.google.maps.places.PlacesServiceStatus?.ZERO_RESULTS || "ZERO_RESULTS";

    const request = { query: query.trim() };
    if (
      currentLocation &&
      typeof currentLocation.lat === "number" &&
      typeof currentLocation.lng === "number"
    ) {
      request.location = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
      request.radius = SEARCH_RADIUS_METERS;
    }

    const results = await new Promise((resolve) => {
      service.textSearch(request, (places, status) => {
        if (status !== statusOk && status !== statusZero) {
          resolve([]);
          return;
        }
        resolve(Array.isArray(places) ? places : []);
      });
    });

    return results
      .map((place) => {
        const location = place?.geometry?.location;
        const lat = typeof location?.lat === "function" ? Number(location.lat()) : Number(location?.lat);
        const lng = typeof location?.lng === "function" ? Number(location.lng()) : Number(location?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const title = place?.name || place?.formatted_address || query;
        const label = place?.formatted_address || title;
        return {
          id: place?.place_id || `${title}-${lat}-${lng}`,
          title,
          label,
          lat,
          lng,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function reverseGeocodeFromGoogle(lat, lng) {
  if (!hasGoogleMaps()) return null;
  if (typeof window.google.maps.Geocoder !== "function") return null;

  try {
    const geocoder = new window.google.maps.Geocoder();
    const statusOk = window.google.maps.GeocoderStatus?.OK || "OK";

    const results = await new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (response, status) => {
        if (status !== statusOk || !Array.isArray(response)) {
          resolve([]);
          return;
        }
        resolve(response);
      });
    });

    return results?.[0]?.formatted_address || null;
  } catch {
    return null;
  }
}

function buildApiUrl(path, params = {}) {
  const base = API_BASE ? `${API_BASE}${path}` : path;
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const q = search.toString();
  return q ? `${base}?${q}` : base;
}

export async function fetchRoute(from, to) {
  const { lat: lat1, lng: lng1 } = from;
  const { lat: lat2, lng: lng2 } = to;

  const cacheKey = `${rounded(lat1)}:${rounded(lng1)}->${rounded(lat2)}:${rounded(lng2)}`;
  const cached = routeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < ROUTE_CACHE_TTL_MS) {
    return cached.value;
  }

  let route = null;
  let backendFailed = false;

  try {
    const url = buildApiUrl("/api/google/route", {
      fromLat: lat1,
      fromLng: lng1,
      toLat: lat2,
      toLng: lng2,
    });

    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.geometry) {
        route = json;
      }
    } else {
      backendFailed = true;
    }
  } catch {
    backendFailed = true;
    route = null;
  }

  if (!route && ENABLE_CLIENT_GOOGLE_FALLBACK && backendFailed) {
    route = await fetchRouteFromGoogle(from, to);
  }

  if (!route?.geometry) return null;

  routeCache.set(cacheKey, { ts: now, value: route });
  return route;
}

export async function searchDestinations(query, currentLocation) {
  if (!query || !query.trim()) return [];

  const params = {
    query: query.trim(),
  };

  if (
    currentLocation &&
    typeof currentLocation.lat === "number" &&
    typeof currentLocation.lng === "number"
  ) {
    params.proximity = `${currentLocation.lng},${currentLocation.lat}`;
  }

  let results = [];
  let backendFailed = false;

  try {
    const url = buildApiUrl("/api/google/search", params);
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.results) && json.results.length) {
        results = json.results;
      }
    } else {
      backendFailed = true;
    }
  } catch {
    backendFailed = true;
    results = [];
  }

  if (results.length) return results;
  if (!ENABLE_CLIENT_GOOGLE_FALLBACK || !backendFailed) return [];

  return searchDestinationsFromGoogle(query, currentLocation);
}

export async function reverseGeocode(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const cacheKey = `${rounded(lat, 5)}:${rounded(lng, 5)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < REVERSE_CACHE_TTL_MS) {
    return cached.value;
  }

  let placeName = null;
  let backendFailed = false;

  try {
    const url = buildApiUrl("/api/google/reverse", { lat, lng });
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      placeName = json?.placeName || null;
    } else {
      backendFailed = true;
    }
  } catch {
    backendFailed = true;
    placeName = null;
  }

  if (!placeName && ENABLE_CLIENT_GOOGLE_FALLBACK && backendFailed) {
    placeName = await reverseGeocodeFromGoogle(lat, lng);
  }

  reverseGeocodeCache.set(cacheKey, { ts: now, value: placeName });
  return placeName;
}
