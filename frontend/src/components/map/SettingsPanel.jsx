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
        className="tour-settings absolute bottom-[14px] left-[14px] z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "opacity" }}
            className="absolute inset-0 z-[70] bg-black/30"
            onClick={onToggle}
          >
            <motion.div
              initial={{ x: "-100%", opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 1 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              style={{ willChange: "transform" }}
              className="absolute bottom-0 left-0 h-full w-[85vw] max-w-[360px] rounded-r-[24px] bg-[#f8fafc] shadow-2xl flex flex-col overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-slate-200 shrink-0">
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Settings</h1>
                <button
                  type="button"
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Control */}
              <div className="px-5 pt-5 shrink-0">
                <div className="flex p-[3px] bg-slate-200 rounded-[10px] relative">
                  <motion.div
                    className="absolute inset-y-[3px] rounded-[7px] bg-white shadow-sm border border-slate-200/50"
                    animate={{
                      left: activeTab === "profile" ? "3px" : "calc(50% + 1.5px)",
                      width: "calc(50% - 4.5px)",
                    }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                  <button
                    type="button"
                    onClick={showProfile}
                    className={`flex-1 relative z-10 py-1.5 text-[13px] font-semibold transition-colors ${
                      activeTab === "profile" ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    onClick={showTrips}
                    className={`flex-1 relative z-10 py-1.5 text-[13px] font-semibold transition-colors ${
                      activeTab === "trips" ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    Trips & History
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 custom-scrollbar">
                {activeTab === "profile" ? (
                  <div className="space-y-6">
                    {/* Avatar Group */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm mb-3">
                        <span className="text-[28px] font-semibold text-slate-700">{initials}</span>
                      </div>
                      <h2 className="text-[19px] font-bold text-slate-900">{profileName || "Anonymous User"}</h2>
                      <p className="text-[14px] text-slate-500 mt-0.5">{profileEmail || "No Email Provided"}</p>
                    </div>

                    {/* Info List */}
                    <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                        <span className="text-[15px] text-slate-800">Account ID</span>
                        <span className="text-[14px] text-slate-500 max-w-[140px] truncate">{profileId || "Guest"}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-[15px] text-slate-800">Phone</span>
                        <span className="text-[14px] text-slate-500">{profilePhone || "Not set"}</span>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex items-center justify-center py-3.5 bg-white border border-rose-200 text-rose-600 rounded-[14px] font-semibold text-[15px] hover:bg-rose-50 transition-colors active:scale-[0.98]"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-7">
                    {/* Trips Section */}
                    <section>
                      <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
                        Recent Trips
                      </h3>

                      <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
                        {historyLoading && (
                          <div className="px-4 py-6 text-center text-[14px] text-slate-400 animate-pulse">
                            Loading history...
                          </div>
                        )}

                        {!historyLoading && historyError && (
                          <div className="px-4 py-4 text-center text-[14px] text-rose-600">
                            {historyError}
                          </div>
                        )}

                        {!historyLoading && tripHistory.length === 0 && !historyError && (
                          <div className="px-4 py-6 text-center text-[14px] text-slate-400">
                            No trips found.
                          </div>
                        )}

                        {!historyLoading &&
                          tripHistory.map((item, index) => {
                            const isSelected = String(item.id) === String(selectedTripId);
                            const isLast = index === tripHistory.length - 1;
                            
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectTrip?.(item.id)}
                                className={`w-full flex flex-col px-4 py-3.5 text-left transition-colors ${
                                  isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                                } ${!isLast ? "border-b border-slate-100" : ""}`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className={`text-[15px] font-semibold truncate pr-4 ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>
                                    {item.destinationLabel || "Regional Destination"}
                                  </span>
                                  <span className="text-[13px] text-slate-500 shrink-0">
                                    {new Date(item.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex items-center text-[13px] text-slate-500 space-x-3">
                                  <span>{formatDistance(item.distanceMeters)}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span>{item.durationMinutes} min</span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </section>

                    {/* SOS Logs Section */}
                    <section>
                      <h3 className="text-[13px] font-semibold text-rose-500 uppercase tracking-widest pl-1 mb-2.5">
                        SOS Activity
                      </h3>

                      <div className="bg-white border border-rose-100 rounded-[14px] overflow-hidden">
                        {sosHistory.length === 0 ? (
                          <div className="px-4 py-6 text-center text-[14px] text-slate-400">
                            No emergency events recorded.
                          </div>
                        ) : (
                          sosHistory.map((item, index) => {
                            const isLast = index === sosHistory.length - 1;
                            return (
                              <div
                                key={item.id}
                                className={`px-4 py-3.5 ${!isLast ? "border-b border-rose-50" : ""}`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className="text-[15px] font-semibold text-slate-900">
                                    {item.actorName || "Unknown"}
                                  </span>
                                  <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5" />
                                </div>
                                <div className="text-[13px] text-slate-600 mb-1">
                                  {item.reason || "Emergency Signal"}
                                </div>
                                <div className="flex items-center justify-between text-[12px] text-slate-400 mt-2">
                                  <span>{formatCoords(item.sosLat, item.sosLng)}</span>
                                  <span>{formatTime(item.eventTs || item.createdAt).split(',')[1] || formatTime(item.eventTs || item.createdAt)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
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
