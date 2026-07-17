import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => addToast(message, "success", duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, "error", duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, "info", duration), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast(message, "warning", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bgColor = "bg-slate-900/95";
          let borderColor = "border-white/10";
          let Icon = Info;
          let iconColor = "text-sky-400";
          let progressBg = "bg-sky-500";

          if (t.type === "success") {
            borderColor = "border-emerald-500/30";
            Icon = CheckCircle2;
            iconColor = "text-emerald-400";
            progressBg = "bg-emerald-500";
          } else if (t.type === "error") {
            borderColor = "border-rose-500/30";
            Icon = AlertCircle;
            iconColor = "text-rose-400";
            progressBg = "bg-rose-500";
          } else if (t.type === "warning") {
            borderColor = "border-amber-500/30";
            Icon = AlertCircle;
            iconColor = "text-amber-400";
            progressBg = "bg-amber-500";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex flex-col rounded-xl border ${borderColor} ${bgColor} backdrop-blur-md shadow-2xl p-4 transition-all duration-300 transform translate-y-0 animate-slide-in relative overflow-hidden`}
              style={{
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6), 0 1px 3px rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`${iconColor} shrink-0 mt-0.5`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-xs font-semibold text-slate-100 pr-5 leading-normal">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 absolute top-3 right-3"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Progress bar animation */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div
                  className={`h-full ${progressBg} animate-toast-progress`}
                  style={{
                    animationDuration: `${t.duration || 4000}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
