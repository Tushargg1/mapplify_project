import React from "react";
import { motion } from "framer-motion";
import { Navigation } from "lucide-react";

function formatDistance(meters) {
  if (typeof meters !== "number") return "-";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatSpeed(speedKmh) {
  if (typeof speedKmh !== "number") return "-";
  return `${speedKmh.toFixed(1)} km/h`;
}

export default function DestinationPill({
  destination,
  eta,
  navigationMonitor,
  nextTurnCue,
  nextTurnInstruction,
  nextTurnDistance,
}) {
  return (
    <div className="absolute left-1/2 top-4 z-50 w-[min(92vw,460px)] -translate-x-1/2 sm:top-6 pointer-events-none">
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
        className="tour-destination flex w-full items-center justify-between gap-3 rounded-2xl border border-white/45 bg-white/25 px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl pointer-events-auto"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 w-full">
          <Navigation className="w-5 h-5 text-black opacity-80 shrink-0" strokeWidth={1.5} />

          <div className="flex flex-col leading-tight text-left min-w-0">
            <span className="max-w-full truncate text-sm font-semibold text-black">{destination}</span>
            <span className="text-[11px] font-medium text-slate-700">
              ETA: {eta} · {formatDistance(navigationMonitor?.distanceMeters)} · {formatSpeed(navigationMonitor?.speedKmh)}
            </span>
            <span className="max-w-full truncate text-[11px] font-medium text-emerald-800">
              Next: {nextTurnCue || "Continue"} · {typeof nextTurnDistance === "number" ? formatDistance(nextTurnDistance) : "-"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
