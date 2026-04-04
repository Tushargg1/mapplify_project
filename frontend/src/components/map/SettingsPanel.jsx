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

  const initials = profileName?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="tour-settings absolute bottom-[14px] left-[14px] z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/30 text-white shadow-xl backdrop-blur-md hover:bg-white/40 transition-all active:scale-95"
        title="Settings"
      >
        <Settings className="h-5 w-5 drop-shadow-sm" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "opacity" }}
            className="absolute inset-0 z-[70] bg-black/50"
            onClick={onToggle}
          >
            <motion.div
              initial={{ x: -400, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0.8 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
              style={{ willChange: "transform, opacity" }}
              className="absolute bottom-0 left-0 h-[88vh] w-[370px] max-w-[94vw] rounded-tr-[2.5rem] border-r border-t border-white/60 bg-white/95 p-6 shadow-2xl flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/10 border border-slate-900/5 flex items-center justify-center text-slate-900 font-bold text-lg shadow-sm">
                    {initials}
                  </div>
                  <div className="leading-tight">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{profileName || "Anonymous User"}</h2>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{profileEmail || "No Email Provided"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mb-6 flex h-11 items-center rounded-2xl bg-slate-100 p-1">
                <motion.div
                  className="absolute h-9 rounded-xl bg-white shadow-sm border border-slate-200"
                  animate={{
                    left: activeTab === "profile" ? "4px" : "calc(50% + 2px)",
                    width: "calc(50% - 6px)"
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
                <button
                  type="button"
                  onClick={showProfile}
                  className={`relative flex-1 z-10 text-sm font-bold transition-colors ${activeTab === "profile" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={showTrips}
                  className={`relative flex-1 z-10 text-sm font-bold transition-colors ${activeTab === "trips" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Trips & Safety
                </button>
              </div>

              <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
                {activeTab === "profile" ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-0.5">Account ID</span>
                        <span className="text-sm font-semibold text-slate-700 bg-white p-2 rounded-lg mt-1 border border-slate-100">{profileId || "guest_access"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-0.5">Phone Contact</span>
                        <span className="text-sm font-semibold text-slate-700 bg-white p-2 rounded-lg mt-1 border border-slate-100">{profilePhone || "Not configured"}</span>
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-medium text-sky-800 leading-relaxed text-center italic opacity-80">
                        "Your safety is our priority. Open Trips to audit your journey history."
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section>
                      <h3 className="mb-3 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Recent Journeys</span>
                        <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200 font-black">{tripHistory.length}</span>
                      </h3>

                      {historyLoading && (
                        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Scanning Trip Vault...</div>
                      )}

                      {!historyLoading && historyError && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700 text-center">{historyError}</div>
                      )}

                      <div className="space-y-3">
                        {!historyLoading && tripHistory.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium italic">No travel data found.</div>
                        )}
                        {!historyLoading &&
                          tripHistory.map((item) => {
                            const isSelected = String(item.id) === String(selectedTripId);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectTrip?.(item.id)}
                                className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                                  isSelected
                                    ? "border-sky-300 bg-sky-50 shadow-[0_4px_12px_rgba(14,165,233,0.1)]"
                                    : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className={`text-sm font-bold tracking-tight ${isSelected ? "text-sky-700" : "text-slate-900"}`}>
                                    {item.destinationLabel || "Regional Destination"}
                                  </div>
                                  <div className="text-[10px] font-black text-slate-400 bg-white/80 px-2 py-1 rounded-lg border border-slate-100">
                                    {item.durationMinutes}m
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col opacity-75">
                                    <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">DISTANCE</span>
                                    <span className="text-xs font-semibold text-slate-700">{formatDistance(item.distanceMeters)}</span>
                                  </div>
                                  <div className="flex flex-col opacity-75">
                                    <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">COMPLETED</span>
                                    <span className="text-xs font-semibold text-slate-700">{new Date(item.endedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </section>

                    <section className="pb-4">
                      <h3 className="mb-3 flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-widest">
                        <span>SOS Alert Logs</span>
                        {sosHistory.length > 0 && (
                           <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 font-black">{sosHistory.length}</span>
                        )}
                      </h3>
                      
                      <div className="space-y-3">
                        {sosHistory.length === 0 && (
                          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-400 text-center italic">
                            No emergency events for selected trip.
                          </div>
                        )}
                        {sosHistory.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 group">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors uppercase tracking-tight">{item.actorName || "Unknown Member"}</span>
                               <ShieldAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            </div>
                            <div className="space-y-1.5 opacity-80">
                                <p className="text-xs text-slate-600 font-medium leading-none">{item.reason || "Automatic Emergency Signal"}</p>
                                <p className="text-[10px] text-slate-400 font-black tracking-wider pt-1">{formatCoords(item.sosLat, item.sosLng)}</p>
                                <p className="text-[10px] font-bold text-rose-600/80">{formatTime(item.eventTs || item.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
