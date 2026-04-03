export function watchGPS(onSuccess, onError) {
  if (!("geolocation" in navigator)) {
    onError({ message: "Geolocation unavailable" });
    return null;
  }

  return navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 20000,
  });
}
