"use client";

import { AlertTriangle, Check, CloudOff, Loader2 } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { isBrowser } from "@/lib/storage/local-storage";

/** Live autosave status shown in the project header. */
export function SaveIndicator() {
  const saveState = useProjectsStore((s) => s.saveState);
  const offline = isBrowser() && typeof navigator !== "undefined" && !navigator.onLine;

  if (saveState === "idle") return null;

  if (offline && saveState === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <CloudOff className="size-3.5" aria-hidden />
        Offline changes
      </span>
    );
  }

  if (saveState === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600" role="status">
        <AlertTriangle className="size-3.5" aria-hidden />
        Save failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600" role="status">
      <Check className="size-3.5" aria-hidden />
      Saved
    </span>
  );
}
