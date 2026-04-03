import React from "react";
import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";

export default function MapControls({ onZoomIn, onZoomOut, onGoToMyLocation }) {
  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
      <button
        onClick={onGoToMyLocation}
        aria-label="Go to my location"
        title="Go to my location"
        className="w-12 h-12 bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 shadow-lg rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <LocateFixed className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <button
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="w-12 h-12 bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 shadow-lg rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <button
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="w-12 h-12 bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 shadow-lg rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <ZoomOut className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
