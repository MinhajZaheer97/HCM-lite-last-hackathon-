"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const tones = {
  success: "border-success-600/30 bg-success-50 text-success-700",
  error: "border-danger-600/30 bg-danger-50 text-danger-700",
  info: "border-brand-200 bg-brand-50 text-brand-700",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, tone = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, success: (m) => toast(m, "success"), error: (m) => toast(m, "error"), info: (m) => toast(m, "info") }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-sm ${tones[t.tone] || tones.info}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span>{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
