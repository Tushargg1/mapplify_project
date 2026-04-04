import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clipboard } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Sidebar({
  isExpanded,
  onToggle,
  displayName,
  onSetDisplayName,
  myRoom,
  userId,
  ownerId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onCloseRoom,
  destinationLabel,
  hasDestination,
  currentLocation,
  navigationActive,
  onToggleNavigation,
  onGoToMyLocation,
  showOtherMemberRoutes,
  hasOtherMembers,
  onToggleOtherMemberRoutes,
  onEndTrip,
  navigationMonitor,
  nextTurnCue,
  nextTurnInstruction,
  nextTurnDistance,
  turnByTurnSteps = [],
  activeStepIndex = 0,
  navigationItems = [],
  onSelectDestination,
  members = [],
}) {
  const isInRoom = Boolean(myRoom);
  const isOwner = isInRoom && ownerId === userId;
  const nameProvided = Boolean(displayName?.trim());

  const copyRoomId = async () => {
    if (!myRoom) return;

    try {
      await navigator.clipboard.writeText(myRoom);
      alert("Room ID copied");
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="absolute left-0 top-[56%] -translate-y-1/2 z-40 h-[65vh] flex flex-col items-start min-h-0">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ x: -276, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -276, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
            className="relative w-[276px] h-full"
          >
            <button
              onClick={onToggle}
              className="tour-left-sidebar absolute -right-[43px] top-6 w-[43px] h-[43px] bg-white/85 backdrop-blur-md border border-slate-400/60 border-l-0 shadow-lg rounded-r-xl flex items-center justify-center hover:bg-white/90 z-50 pointer-events-auto"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>

            <div className="h-full bg-white/85 backdrop-blur-md border border-white/40 shadow-lg rounded-r-2xl pt-3 px-6 pb-6 flex flex-col text-black overflow-y-auto min-h-0">
              {/* Sidebar Content */}
              {isInRoom ? (
                <div className="mb-3 rounded-xl border bg-white/20 px-3 py-2">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate" title={displayName || "User"}>
                      {displayName || "User"}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[92px]" title={myRoom || ""}>
                      {myRoom}
                    </span>
                    <button
                      onClick={copyRoomId}
                      className="w-7 h-7 shrink-0 flex items-center justify-center border bg-white/40 rounded-lg hover:bg-white/60"
                      title="Copy room ID"
                    >
                      <Clipboard className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  value={displayName}
                  onChange={(event) => onSetDisplayName(event.target.value)}
                  placeholder="Enter your name"
                  className="mb-3 w-full px-3 py-2 rounded-xl border text-black bg-white/30 focus:outline-none focus:ring-2"
                />
              )}

              {!isInRoom && (
                <div className="flex gap-3 mt-2">
                  <button
                    className="flex-1 py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
                    disabled={!nameProvided}
                    onClick={onCreateRoom}
                  >
                    Create
                  </button>

                  <button
                    className="flex-1 py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
                    disabled={!nameProvided}
                    onClick={onJoinRoom}
                  >
                    Join
                  </button>
                </div>
              )}

              {isInRoom ? (
                <button
                  className="w-full py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
                  onClick={onLeaveRoom}
                >
                  Leave Party
                </button>
              ) : (
                <div className="mt-6">
                  <p className="text-xs text-gray-700">Not in a room</p>
                </div>
              )}

              <div className="mt-6 flex-1 min-h-0 flex flex-col gap-6">
                <div className="shrink-0">
                  <SearchBar
                    onSelectDestination={onSelectDestination}
                    currentLocation={currentLocation}
                    destinationLabel={destinationLabel}
                    isEditable={isOwner}
                  />
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="mb-2 shrink-0 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Members ({members.length})</h3>
                    <button
                      type="button"
                      onClick={onToggleOtherMemberRoutes}
                      disabled={!hasDestination || !hasOtherMembers}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {showOtherMemberRoutes ? "Hide Routes" : "Show Routes"}
                    </button>
                  </div>

                  <ul className="flex flex-col gap-3 flex-1 min-h-0 overflow-auto pr-2">
                    {members.length === 0 && (
                      <li className="text-xs text-gray-700">No members</li>
                    )}

                    {members.map((member) => {
                      const memberIsOwner = member.userId === ownerId;

                      return (
                        <li
                          key={member.userId}
                          className="flex items-center justify-between bg-white/20 p-2 rounded-xl border"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-semibold">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </div>

                            <span className={`text-sm truncate ${memberIsOwner ? "font-bold" : ""}`}>
                              {member.name}
                            </span>
                          </div>

                          {memberIsOwner && (
                            <span className="text-xs px-2 py-1 bg-black text-white rounded-lg">
                              Owner
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="shrink-0 mb-2">
                  <button
                    type="button"
                    onClick={onEndTrip}
                    disabled={!navigationActive}
                    className="w-full py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    End Trip
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ x: -56, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -56, opacity: 0 }}
            transition={{ duration: 0.24 }}
            style={{ willChange: "transform, opacity" }}
            onClick={onToggle}
            className="tour-left-sidebar w-[40px] h-32 bg-white/85 backdrop-blur-md border border-slate-400/60 border-l-0 rounded-r-2xl shadow-lg flex items-center justify-center hover:bg-white/90"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
