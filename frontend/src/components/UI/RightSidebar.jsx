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
		<div className="absolute right-0 top-[56%] -translate-y-1/2 z-40 h-[65vh]">
			<AnimatePresence mode="wait">
				{isExpanded ? (
					<motion.div
						key="expanded"
						initial={{ x: 300, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 300, opacity: 0 }}
						transition={{ duration: 0.28 }}
						className="relative w-[276px] h-full"
						onPointerDown={onPanelInteract}
						onMouseEnter={onPanelMouseEnter}
						onMouseLeave={onPanelMouseLeave}
					>
						<div className="h-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg rounded-l-2xl p-6 flex flex-col text-black">
							<button
								onClick={onToggle}
								className="absolute -left-[43px] top-6 w-[43px] h-[43px] bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg rounded-l-xl flex items-center justify-center hover:bg-white/30"
							>
								<ChevronRight className="w-5 h-5 text-black" />
							</button>






							<button
								type="button"
								onClick={onStartVoiceBroadcast}
								disabled={!isInRoom || isVoiceBusy}
								className="mt-4 w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isVoiceBusy ? "Listening..." : "Voice Broadcast"}
							</button>

							<button
								type="button"
								onClick={onStartNearbyVoiceSearch}
								disabled={!isInRoom || isVoiceBusy}
								className="mt-2 w-full py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isVoiceBusy ? "Listening..." : "Voice Nearby Search"}
							</button>

							{nearbyPlaces.length > 0 && (
								<div className="mt-3 rounded-xl border bg-white/40 p-3 text-xs text-slate-700">
									<button
										type="button"
										onClick={() => setIsNearbyResultsOpen((value) => !value)}
										className="mb-2 flex w-full items-center justify-between gap-2 text-left"
									>
										<span className="font-semibold text-slate-800">Nearby Results</span>
										{isNearbyResultsOpen ? (
											<ChevronUp className="h-4 w-4 shrink-0 text-slate-700" />
										) : (
											<ChevronDown className="h-4 w-4 shrink-0 text-slate-700" />
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
												<div className="max-h-48 overflow-auto pr-1">
													{nearbyPlaces.map((place) => (
														<div key={place.id} className="mb-2 rounded-lg border bg-white/70 p-2 last:mb-0">
															<div className="font-medium text-slate-900">{place.title || place.label || "Place"}</div>
															<div className="text-[11px] text-slate-600">{place.label || ""}</div>
															{place.approxDistanceLabel && (
																<div className="text-[11px] font-medium text-slate-700">{place.approxDistanceLabel}</div>
															)}
															<button
																type="button"
																onClick={() => (place.isAdded ? onRemoveStop?.(place) : onAddStop?.(place))}
																className={`mt-1 w-full py-1 rounded-md text-white transition ${place.isAdded ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"}`}
															>
																{place.isAdded ? "Remove Stop" : "Add Stop For Party"}
															</button>
														</div>
													))}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

							<div className="mt-3 rounded-xl border bg-white/40 p-3 text-xs text-slate-700 max-h-56 overflow-auto">
								<div className="font-semibold text-slate-800 mb-2">Room Voice Chat</div>
								{broadcastFeed.length === 0 && (
									<div>No voice messages yet.</div>
								)}
								{broadcastFeed.map((item) => (
									<div key={item.id} className="mb-2 rounded-lg border bg-white/75 p-2">
										<div className="flex items-start justify-between gap-2">
											<div className="font-medium text-slate-900">{item.name || "Member"}</div>
											{item.pending && item.remainingSeconds > 0 && (
												<button
													type="button"
													onClick={() => onCancelPendingBroadcast?.(item.id)}
													className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
												>
													<X className="h-3 w-3" />
													{item.remainingSeconds}s
												</button>
											)}
										</div>
										<div className="mt-1 text-[11px] text-slate-700">{item.message}</div>
									</div>
								))}
							</div>

						<div className="mt-auto pt-4 space-y-3">
							<button
								type="button"
								onClick={onTriggerSos}
								disabled={!isInRoom}
								className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								<AlertTriangle className="w-4 h-4" />
								SOS - Alert Party
							</button>

							<div className="text-xs text-gray-700">
								Tip: Use SOS only for urgent situations.
							</div>
						</div>
						</div>
					</motion.div>
				) : (
					<motion.button
						key="collapsed"
						initial={{ x: 56, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 56, opacity: 0 }}
						transition={{ duration: 0.24 }}
						onClick={onToggle}
						className="w-[45px] h-32 bg-white/20 backdrop-blur-xl border rounded-l-2xl shadow-lg flex items-center justify-center hover:bg-white/30"
					>
						<ChevronLeft className="w-6 h-6 text-black" />
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	);
}
