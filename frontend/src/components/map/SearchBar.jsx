import React, { useEffect, useRef, useState } from "react";
import { Search, X, MapPin, Loader2 } from "lucide-react";
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
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-3 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        
        <textarea
          ref={inputRef}
          rows={2}
          className="w-full resize-none pl-10 pr-10 py-3 border-2 border-slate-600 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none bg-slate-800/90 disabled:bg-slate-900/80 text-sm leading-5 text-slate-100 placeholder:text-slate-500 font-medium transition-all duration-200 hover:border-slate-500"
          placeholder={isEditable ? "Search destinations..." : "Destination"}
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
            className="absolute right-3 top-3 text-slate-400 hover:text-rose-400 transition-colors duration-200 bg-slate-700/80 rounded-lg p-1 hover:bg-rose-900/30"
            aria-label="Clear destination"
            title="Clear destination"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {loading && (
          <div className="absolute right-3 top-3 pointer-events-none">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      {loading && (
        <p className="mt-2 text-xs text-slate-300 font-semibold flex items-center gap-1.5 ml-1">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
          Searching locations...
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1.5 ml-1">
          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
          {error}
        </p>
      )}

      {canType && results.length > 0 && (
        <ul className="absolute z-20 w-full bg-slate-800 border-2 border-slate-600 rounded-2xl shadow-2xl max-h-64 overflow-auto mt-2 custom-scrollbar-dark">
          {results.map((place, index) => (
            <li
              key={place.id}
              className={`p-3.5 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-700/80 cursor-pointer transition-all duration-200 ${
                index !== results.length - 1 ? 'border-b border-slate-700' : ''
              } ${index === 0 ? 'rounded-t-2xl' : ''} ${index === results.length - 1 ? 'rounded-b-2xl' : ''}`}
              onClick={() => {
                onSelectDestination(place);
                setQuery("");
                setIsUnlocked(false);
                setResults([]);
                setError("");
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-100 truncate">{place.title || place.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{place.label}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
