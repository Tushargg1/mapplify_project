import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clipboard, Users, LogOut, XCircle } from "lucide-react";
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
              className="tour-left-sidebar absolute -right-[43px] top-6 w-[43px] h-[43px] bg-gradient-to-br from-slate-800/95 to-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-xl rounded-r-2xl flex items-center justify-center hover:from-slate-700 hover:to-slate-800 z-50 pointer-events-auto transition-all duration-200 hover:shadow-2xl"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>

            <div className="h-full bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-zinc-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-r-3xl pt-4 px-6 pb-6 flex flex-col text-white overflow-y-auto min-h-0">
              {/* Sidebar Content */}
              {isInRoom ? (
                <div className="mb-4 rounded-2xl border border-slate-600/60 bg-gradient-to-br from-slate-800/80 to-zinc-800/80 px-4 py-3 shadow-sm">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-slate-500/50">
                        {displayName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-bold text-slate-100 truncate" title={displayName || "User"}>
                        {displayName || "User"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 bg-slate-700/70 px-2 py-1 rounded-lg truncate max-w-[92px]" title={myRoom || ""}>
                      {myRoom}
                    </span>
                    <button
                      onClick={copyRoomId}
                      className="w-8 h-8 shrink-0 flex items-center justify-center border border-slate-600 bg-slate-800/80 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 shadow-sm"
                      title="Copy room ID"
                    >
                      <Clipboard className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  value={displayName}
                  onChange={(event) => onSetDisplayName(event.target.value)}
                  placeholder="Enter your name"
                  className="mb-4 w-full px-4 py-3 rounded-2xl border-2 border-slate-600 text-white bg-slate-800/80 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                />
              )}

              {!isInRoom && (
                <div className="flex gap-3 mt-2">
                  <button
                    className="flex-1 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-2xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                    disabled={!nameProvided}
                    onClick={onCreateRoom}
                  >
                    Create Party
                  </button>

                  <button
                    className="flex-1 py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 text-white font-semibold rounded-2xl hover:from-zinc-600 hover:to-zinc-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                    disabled={!nameProvided}
                    onClick={onJoinRoom}
                  >
                    Join Party
                  </button>
                </div>
              )}

              {isInRoom && !isOwner && (
                <button
                  className="w-full py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-2xl hover:from-slate-500 hover:to-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  onClick={onLeaveRoom}
                >
                  <LogOut className="w-4 h-4" />
                  Leave Party
                </button>
              )}

              {isInRoom && isOwner && (
                <button
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  onClick={() => {
                    if (window.confirm("End the party? All members will be removed and the trip will be saved to history.")) {
                      onCloseRoom();
                    }
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  End Party
                </button>
              )}

              {!isInRoom && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400 font-medium">Not in a party</p>
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
                  <div className="mb-3 shrink-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-300" />
                      <h3 className="text-base font-bold text-slate-100">Members</h3>
                      <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full">
                        {members.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleOtherMemberRoutes}
                      disabled={!hasDestination || !hasOtherMembers}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs font-bold hover:from-slate-500 hover:to-slate-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {showOtherMemberRoutes ? "Hide Routes" : "Show Routes"}
                    </button>
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-auto pr-2 custom-scrollbar-dark">
                    {members.length === 0 && (
                      <li className="text-sm text-slate-400 text-center py-4 font-medium">No members yet</li>
                    )}

                    {members.map((member) => {
                      const memberIsOwner = member.userId === ownerId;

                      return (
                        <li
                          key={member.userId}
                          className={`flex items-center justify-between bg-gradient-to-br ${
                            memberIsOwner 
                              ? 'from-slate-700/90 to-slate-800/80 border-slate-600/70' 
                              : 'from-slate-800/80 to-zinc-800/70 border-slate-700/60'
                          } p-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full ${
                              memberIsOwner 
                                ? 'bg-gradient-to-br from-slate-500 to-slate-600 ring-2 ring-slate-400/50' 
                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            } flex items-center justify-center font-bold text-white shadow-md text-sm`}>
                              {member.name?.charAt(0)?.toUpperCase()}
                            </div>

                            <span className={`text-sm truncate ${memberIsOwner ? "font-bold text-slate-100" : "font-semibold text-slate-200"}`}>
                              {member.name}
                            </span>
                          </div>

                          {memberIsOwner && (
                            <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg font-bold shadow-sm">
                              Admin
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
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
            className="tour-left-sidebar w-[40px] h-32 bg-gradient-to-br from-slate-800/95 to-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-xl border-l-0 rounded-r-2xl flex items-center justify-center hover:from-slate-700 hover:to-slate-800 transition-all duration-200 hover:shadow-2xl"
          >
            <ChevronRight className="w-6 h-6 text-slate-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
