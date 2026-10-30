"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const ICON_CLASSES = { success: "text-success", error: "text-error", info: "text-muted" };
/** Errors stay longer: they usually need reading, not just noticing. */
const DURATION_MS = { success: 3500, error: 7000, info: 4000 };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS[tone]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[var(--z-toast)] flex w-[360px] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-2.5 rounded-md border-[1.5px] border-line bg-card px-3.5 py-3 shadow-popover"
            >
              <Icon size={15} className={cn("mt-px shrink-0", ICON_CLASSES[toast.tone])} aria-hidden />
              <p className="flex-1 text-[12.5px] leading-snug">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="cursor-pointer text-muted hover:text-ink">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
