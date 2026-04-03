import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const TYPE_STYLES = {
  info: {
    bg: "bg-slate-900/90 border-slate-700 text-white",
    icon: <Info className="w-5 h-5 text-sky-400" />,
  },
  success: {
    bg: "bg-emerald-600/90 border-emerald-400 text-white",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-200" />,
  },
  error: {
    bg: "bg-rose-600/90 border-rose-400 text-white",
    icon: <AlertCircle className="w-5 h-5 text-rose-200" />,
  },
};

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
          return (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`rounded-2xl border px-3 py-3 shadow-2xl backdrop-blur-xl flex items-start gap-3 pointer-events-auto ${style.bg}`}
              role="status"
              aria-live="polite"
            >
              <div className="shrink-0 mt-0.5">{style.icon}</div>
              <div className="flex-1 text-sm leading-snug font-medium pt-0.5">{toast.message}</div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 rounded-full p-1 opacity-70 transition hover:bg-white/20 hover:opacity-100"
                aria-label="Dismiss"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
