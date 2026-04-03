import React, { useEffect, useRef, useState } from "react";
import { searchDestinations } from "../../services/RouteService";

const parsedDebounceMs = Number(import.meta.env.VITE_SEARCH_DEBOUNCE_MS || 700);
const SEARCH_DEBOUNCE_MS = Number.isFinite(parsedDebounceMs) && parsedDebounceMs > 0
  ? Math.floor(parsedDebounceMs)
  : 700;

export default function SearchBar({
  onSelectDestination,
  currentLocation,
  destinationLabel,
  isEditable = true,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const cacheRef = useRef(new Map());
  const locationRef = useRef(currentLocation);
  const inputRef = useRef(null);

  useEffect(() => {
    locationRef.current = currentLocation;
  }, [currentLocation]);

  const hasDestination = Boolean((destinationLabel || "").trim());
  const canType = isEditable && (!hasDestination || isUnlocked);

  useEffect(() => {
    if (!canType) {
      setLoading(false);
      setResults([]);
      setError("");
      return;
    }

    const val = query.trim();

    if (val.length <= 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const loc = locationRef.current;
      const ll =
        loc?.lat && loc?.lng
          ? `${Number(loc.lat).toFixed(5)},${Number(loc.lng).toFixed(5)}`
          : "";

      const cacheKey = `${val.toLowerCase()}|${ll}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setResults(cached);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const next = await searchDestinations(val, loc);
        cacheRef.current.set(cacheKey, next);
        setResults(next);
      } catch {
        setResults([]);
        setError("Unable to search right now");
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, canType]);

  const shownValue = canType ? query : destinationLabel || "";

  function clearInputForChange() {
    if (!isEditable) return;
    setIsUnlocked(true);
    setQuery("");
    setResults([]);
    setError("");
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  return (
    <div className="relative w-full mt-2">
      <textarea
        ref={inputRef}
        rows={2}
        className="w-full resize-none p-2.5 pr-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white/70 disabled:bg-white/50 text-sm leading-5"
        placeholder={isEditable ? "Search locations..." : "Destination"}
        value={shownValue}
        readOnly={!canType}
        onChange={(e) => {
          if (!canType) return;
          setQuery(e.target.value);
        }}
      />

      {isEditable && hasDestination && (
        <button
          type="button"
          onClick={clearInputForChange}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
          aria-label="Clear destination"
          title="Clear destination text"
        >
          x
        </button>
      )}

      {loading && <p className="mt-1 text-xs text-gray-600">Searching...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {canType && results.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border rounded-b-lg shadow-lg max-h-44 overflow-auto">
          {results.map((place) => (
            <li
              key={place.id}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
              onClick={() => {
                onSelectDestination(place);
                setQuery("");
                setIsUnlocked(false);
                setResults([]);
                setError("");
              }}
            >
              <p className="font-bold text-sm">{place.title || place.label}</p>
              <p className="text-xs text-gray-500">{place.label}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
