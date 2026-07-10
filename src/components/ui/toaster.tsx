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
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-indigo-500",
} as const;

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", ICON_COLORS[toast.variant])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-sm text-slate-500">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600"
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
