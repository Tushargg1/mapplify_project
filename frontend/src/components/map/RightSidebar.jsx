import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";

export default function RightSidebar({
	isExpanded,
	onToggle,
	onPanelInteract,
	onPanelMouseEnter,
	onPanelMouseLeave,
	myRoom,
	wellbeingPromptOpen,
	onTriggerSos,
	onStartVoiceBroadcast,
	onStartNearbyVoiceSearch,
	nearbyPlaces = [],
	onAddStop,
	onRemoveStop,
	isVoiceBusy = false,
	broadcastFeed = [],
	onCancelPendingBroadcast,
}) {
	const isInRoom = Boolean(myRoom);
	const [isNearbyResultsOpen, setIsNearbyResultsOpen] = useState(true);

	return (
		<div className="absolute right-0 top-[56%] -translate-y-1/2 z-40 h-[65vh] min-w-0">
			<AnimatePresence mode="wait">
				{isExpanded ? (
					<motion.div
						key="expanded"
						initial={{ x: 300, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 300, opacity: 0 }}
						transition={{ duration: 0.28, ease: "easeOut" }}
						style={{ willChange: "transform, opacity" }}
						className="relative w-[276px] h-full"
						onPointerDown={onPanelInteract}
						onMouseEnter={onPanelMouseEnter}
						onMouseLeave={onPanelMouseLeave}
					>
						<div className="h-full bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-zinc-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-l-3xl pt-4 px-6 pb-6 flex flex-col text-white">
							<button
								onClick={onToggle}
								className="tour-right-sidebar absolute -left-[43px] top-6 w-[43px] h-[43px] bg-gradient-to-br from-slate-800/95 to-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-xl rounded-l-2xl flex items-center justify-center hover:from-slate-700 hover:to-slate-800 transition-all duration-200 hover:shadow-2xl"
							>
								<ChevronRight className="w-5 h-5 text-slate-300" />
							</button>

							<div className="grid grid-cols-2 gap-3 mt-0">
								<button
									type="button"
									onClick={onStartVoiceBroadcast}
									disabled={!isInRoom || isVoiceBusy}
									className="py-2.5 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs font-bold hover:from-slate-500 hover:to-slate-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
								>
									{isVoiceBusy ? "..." : "Broadcast"}
								</button>

								<button
									type="button"
									onClick={onStartNearbyVoiceSearch}
									disabled={!isInRoom || isVoiceBusy}
									className="py-2.5 rounded-xl bg-gradient-to-r from-zinc-600 to-zinc-700 text-white text-xs font-bold hover:from-zinc-500 hover:to-zinc-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
								>
									{isVoiceBusy ? "..." : "Find Nearby"}
								</button>
							</div>

							{nearbyPlaces.length > 0 && (
								<div className="mt-4 rounded-2xl border border-slate-600/60 bg-gradient-to-br from-slate-800/80 to-zinc-800/80 p-3 text-xs shadow-sm">
									<button
										type="button"
										onClick={() => setIsNearbyResultsOpen((value) => !value)}
										className="mb-2 flex w-full items-center justify-between gap-2 text-left"
									>
										<span className="font-bold text-slate-100">Nearby Results</span>
										{isNearbyResultsOpen ? (
											<ChevronUp className="h-4 w-4 shrink-0 text-slate-300" />
										) : (
											<ChevronDown className="h-4 w-4 shrink-0 text-slate-300" />
										)}
									</button>

									<AnimatePresence initial={false}>
										{isNearbyResultsOpen && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.2 }}
												className="overflow-hidden"
											>
												<div className="max-h-48 overflow-auto pr-1 custom-scrollbar-dark">
													{nearbyPlaces.map((place) => (
														<div key={place.id} className="mb-2 rounded-xl border border-slate-700/70 bg-slate-800/90 p-2.5 last:mb-0 shadow-sm hover:shadow-md transition-all duration-200">
															<div className="font-bold text-slate-100 text-sm">{place.title || place.label || "Place"}</div>
															<div className="text-[11px] text-slate-400 mt-0.5">{place.label || ""}</div>
															{place.approxDistanceLabel && (
																<div className="text-[11px] font-semibold text-slate-300 mt-1">{place.approxDistanceLabel}</div>
															)}
															<button
																type="button"
																onClick={() => (place.isAdded ? onRemoveStop?.(place) : onAddStop?.(place))}
																className={`mt-2 w-full py-1.5 rounded-lg text-white font-semibold text-xs transition-all duration-200 shadow-sm hover:shadow-md ${place.isAdded ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700" : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600"}`}
															>
																{place.isAdded ? "Remove Stop" : "Add Stop"}
															</button>
														</div>
													))}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

							<div className="mt-4 rounded-2xl border border-slate-600/60 bg-gradient-to-br from-slate-800/80 to-zinc-800/80 p-3 text-xs max-h-56 overflow-auto custom-scrollbar-dark shadow-sm">
								<div className="font-bold text-slate-100 mb-2.5">Voice Messages</div>
								{broadcastFeed.length === 0 && (
									<div className="text-slate-400 text-center py-2">No messages yet</div>
								)}
								{broadcastFeed.map((item) => (
									<div key={item.id} className="mb-2 rounded-xl border border-slate-700/70 bg-slate-800/90 p-2.5 shadow-sm">
										<div className="flex items-start justify-between gap-2">
											<div className="font-bold text-slate-100">{item.name || "Member"}</div>
											{item.pending && item.remainingSeconds > 0 && (
												<button
													type="button"
													onClick={() => onCancelPendingBroadcast?.(item.id)}
													className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-all duration-200"
												>
													<X className="h-3 w-3" />
													{item.remainingSeconds}s
												</button>
											)}
										</div>
										<div className="mt-1 text-[11px] text-slate-300 font-medium">{item.message}</div>
									</div>
								))}
							</div>

							<div className="mt-auto pt-4 space-y-3">
								<button
									type="button"
									onClick={onTriggerSos}
									disabled={!isInRoom}
									className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight shadow-lg hover:shadow-xl"
								>
									<div className="flex items-center gap-2 font-bold text-sm">
										<AlertTriangle className="w-4 h-4" />
										SOS - Alert Party
									</div>
									<div className="text-[10px] opacity-90 mt-0.5">
										Use only for urgent situations
									</div>
								</button>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.button
						key="collapsed"
						initial={{ x: 56, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 56, opacity: 0 }}
						transition={{ duration: 0.24, ease: "easeOut" }}
						style={{ willChange: "transform, opacity" }}
						onClick={onToggle}
						className="tour-right-sidebar w-[40px] h-32 bg-gradient-to-br from-slate-800/95 to-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-xl border-r-0 rounded-l-2xl flex items-center justify-center hover:from-slate-700 hover:to-slate-800 transition-all duration-200 hover:shadow-2xl"
					>
						<ChevronLeft className="w-6 h-6 text-slate-300" />
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	);
}
