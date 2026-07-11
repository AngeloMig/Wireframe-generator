"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/utils/cn";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const ICON_COLORS = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-blue-300",
} as const;

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-full max-w-sm flex-col items-center gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full animate-fade-in items-start gap-3 rounded-lg bg-slate-900 px-3.5 py-3 shadow-[var(--shadow-overlay)]"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", ICON_COLORS[toast.variant])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[13px] text-slate-300">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-white"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
