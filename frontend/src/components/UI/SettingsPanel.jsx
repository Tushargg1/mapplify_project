import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, ShieldAlert, Route as RouteIcon, X } from "lucide-react";

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "-";
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function formatCoords(lat, lng) {
  if (!lat || !lng) return "-";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

export default function SettingsPanel({
  isOpen,
  onToggle,
  onOpenTrips,
  onLogout,
  profileName,
  profileId,
  profileEmail,
  profilePhone,
  sosHistory,
  tripHistory,
  selectedTripId,
  onSelectTrip,
  historyLoading,
  historyError,
}) {
  const [activeTab, setActiveTab] = React.useState("profile");

  function showProfile() {
    setActiveTab("profile");
  }

  function showTrips() {
    setActiveTab("trips");
    if (typeof onOpenTrips === "function") {
      onOpenTrips();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="absolute bottom-4 left-4 z-50 rounded-2xl border border-white/50 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur hover:bg-white"
      >
        <span className="inline-flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-black/35"
            onClick={onToggle}
          >
            <motion.div
              initial={{ x: -380, opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -380, opacity: 0.9 }}
              transition={{ duration: 0.22 }}
              className="absolute bottom-0 left-0 h-[86vh] w-[360px] max-w-[92vw] rounded-tr-2xl border border-white/50 bg-white/90 p-4 shadow-2xl backdrop-blur"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
                  <p className="text-xs text-slate-600">{profileName || "User"} ({profileId || "guest"})</p>
                  <p className="text-[11px] text-slate-500">{profileEmail || "No email"} | {profilePhone || "No phone"}</p>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={showProfile}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    activeTab === "profile"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={showTrips}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    activeTab === "trips"
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100"
                  }`}
                >
                  Trips
                </button>
              </div>

              {activeTab === "profile" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Open Trips to load your recent trip history.</p>
                  <p className="mt-1">When you select a trip, only SOS alerts from that trip will be shown.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <RouteIcon className="h-4 w-4" />
                      Your Trip History ({tripHistory.length})
                    </h3>

                    {historyLoading && (
                      <p className="text-xs text-blue-700">Loading trip history...</p>
                    )}

                    {!historyLoading && historyError && (
                      <p className="text-xs text-rose-700">{historyError}</p>
                    )}

                    <ul className="max-h-52 space-y-2 overflow-auto pr-1 text-xs text-blue-900">
                      {!historyLoading && tripHistory.length === 0 && (
                        <li className="text-blue-700">No trips recorded yet.</li>
                      )}
                      {!historyLoading &&
                        tripHistory.map((item) => {
                          const isSelected = String(item.id) === String(selectedTripId);
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => onSelectTrip?.(item.id)}
                                className={`w-full rounded-lg border bg-white/90 p-2 text-left ${
                                  isSelected
                                    ? "border-blue-500 ring-1 ring-blue-400"
                                    : "border-blue-200 hover:border-blue-300"
                                }`}
                              >
                                <div className="font-medium">{item.destinationLabel || "Shared destination"}</div>
                                <div className="text-blue-700">Distance: {formatDistance(item.distanceMeters)}</div>
                                <div className="text-blue-700">Duration: {item.durationMinutes} min</div>
                                <div className="text-blue-600">Started: {formatTime(item.startedAt)}</div>
                                <div className="text-blue-600">Ended: {formatTime(item.endedAt)}</div>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-rose-800">
                      <ShieldAlert className="h-4 w-4" />
                      SOS For Selected Trip ({sosHistory.length})
                    </h3>
                    <ul className="max-h-52 space-y-2 overflow-auto pr-1 text-xs text-rose-900">
                      {sosHistory.length === 0 && (
                        <li className="text-rose-700">No SOS events for this trip.</li>
                      )}
                      {sosHistory.map((item) => (
                        <li key={item.id} className="rounded-lg border border-rose-200 bg-white/80 p-2">
                          <div className="font-medium">{item.actorName || item.actorUserId || "Member"}</div>
                          <div className="text-rose-700">{item.actorEmail || "No email"}</div>
                          <div className="text-rose-700">{item.actorPhone || "No phone"}</div>
                          <div className="text-rose-700">{item.reason || "Safety alert"}</div>
                          <div className="text-rose-600">Location: {formatCoords(item.sosLat, item.sosLng)}</div>
                          <div className="text-rose-600">Room: {item.roomId || "-"}</div>
                          <div className="text-rose-600">{formatTime(item.eventTs || item.createdAt)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
