import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigation, Route, ChevronDown } from "lucide-react";

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
  turnByTurnSteps = [],
  activeStepIndex = 0,
}) {
  const [open, setOpen] = useState(false);

  const upcomingTurns = useMemo(
    () => turnByTurnSteps.slice(Math.max(0, activeStepIndex), Math.max(0, activeStepIndex) + 8),
    [turnByTurnSteps, activeStepIndex]
  );

  return (
    <div className="absolute left-1/2 top-4 z-50 w-[min(92vw,460px)] -translate-x-1/2 sm:top-6">
      <motion.button
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="tour-destination flex w-full items-center justify-between gap-3 rounded-2xl border border-white/45 bg-white/25 px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        role="status"
        aria-live="polite"
        aria-label={`Destination: ${destination}, ETA: ${eta}, Distance: ${formatDistance(navigationMonitor?.distanceMeters)}, Speed: ${formatSpeed(navigationMonitor?.speedKmh)}, Next turn: ${nextTurnCue || "Continue"} ${nextTurnInstruction || "No active turn"}`}
      >
        <div className="flex items-center gap-3">
          <Navigation className="w-5 h-5 text-black opacity-80" strokeWidth={1.5} />

          <div className="flex flex-col leading-tight text-left">
            <span className="max-w-60 truncate text-sm font-semibold text-black sm:max-w-[290px]">{destination}</span>
            <span className="text-[11px] font-medium text-slate-700">
              ETA: {eta} · {formatDistance(navigationMonitor?.distanceMeters)} · {formatSpeed(navigationMonitor?.speedKmh)}
            </span>
            <span className="max-w-60 truncate text-[11px] font-medium text-emerald-800 sm:max-w-[290px]">
              Next: {nextTurnCue || "Continue"} · {typeof nextTurnDistance === "number" ? formatDistance(nextTurnDistance) : "-"}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-black/75 transition ${open ? "rotate-180" : "rotate-0"}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2 max-h-[62vh] w-full overflow-auto rounded-2xl border border-white/55 bg-white/92 p-4 shadow-2xl backdrop-blur-xl"
          >
            <h3 className="text-sm font-semibold text-slate-900">Destination</h3>
            <div className="mt-2 rounded-lg border bg-white/75 p-3 text-sm font-medium text-slate-900">
              {destination || "No destination"}
            </div>

            <div className="mt-3 rounded-lg border bg-white/75 p-3 text-xs">
              <div className="mb-2 inline-flex items-center gap-2 text-slate-600 uppercase tracking-wide">
                <Route className="w-4 h-4" />
                Future Turns
              </div>

              {upcomingTurns.length === 0 ? (
                <div className="text-slate-600">No upcoming turns yet.</div>
              ) : (
                <ul className="space-y-2">
                  {upcomingTurns.map((step, index) => {
                    const absoluteIndex = activeStepIndex + index;
                    const active = absoluteIndex === activeStepIndex;
                    return (
                      <li
                        key={`${absoluteIndex}-${step.instruction}`}
                        className={`rounded-lg border p-2 ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-900"}`}
                      >
                        <div className={`text-[10px] uppercase tracking-wide ${active ? "text-slate-300" : "text-slate-600"}`}>
                          {step.cue || "Continue"}
                        </div>
                        <div className="font-medium">{step.instruction}</div>
                        <div className={`text-[11px] ${active ? "text-slate-200" : "text-slate-600"}`}>
                          {formatDistance(step.distance)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
