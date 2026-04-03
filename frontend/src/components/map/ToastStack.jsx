import React from "react";

const TYPE_STYLES = {
  info: "bg-slate-900/90 border-slate-700 text-white",
  success: "bg-emerald-600/90 border-emerald-400 text-white",
  error: "bg-rose-600/90 border-rose-400 text-white",
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-2000 flex w-[340px] max-w-[calc(100vw-1.5rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm leading-snug font-medium">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="rounded-md px-1 text-xs opacity-80 transition hover:bg-white/20 hover:opacity-100"
              aria-label="Dismiss"
              type="button"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
