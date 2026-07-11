"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import type { BrandTheme } from "@/lib/editor-utils";
import type { ThemeOverrides } from "@/lib/theme-overrides";
import { cn } from "@/utils/cn";

const COLOR_FIELDS: { key: "primary" | "secondary" | "accent"; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
];

/**
 * Styled-mode theme tweaks: brand colors, heading font, and corner style.
 * Adjustments preview instantly on the canvas and persist per project.
 */
export function ThemePanelButton({
  theme,
  hasOverrides,
  onChange,
  onReset,
  buttonClass,
}: {
  theme: BrandTheme;
  hasOverrides: boolean;
  onChange: (patch: ThemeOverrides) => void;
  onReset: () => void;
  buttonClass: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        aria-label="Theme settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Palette className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Theme settings"
          className="absolute top-9 right-0 z-40 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-panel)]"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              Styled preview theme
            </p>
            {hasOverrides && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="size-3" aria-hidden />
                Reset
              </button>
            )}
          </div>

          <div className="space-y-2">
            {COLOR_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600">{label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 uppercase">{theme[key]}</span>
                  <input
                    type="color"
                    value={theme[key]}
                    aria-label={`${label} color`}
                    onChange={(e) => onChange({ [key]: e.target.value })}
                    className="size-6 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-slate-600">Headings</p>
            <Segmented
              value={theme.headingFont}
              options={[
                { value: "font-sans", label: "Sans" },
                { value: "font-serif", label: "Serif" },
              ]}
              onSelect={(headingFont) => onChange({ headingFont })}
            />
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-slate-600">Corners</p>
            <Segmented
              value={theme.cardRadius}
              options={[
                { value: "rounded-none", label: "Sharp" },
                { value: "rounded-lg", label: "Soft" },
                { value: "rounded-2xl", label: "Round" },
              ]}
              onSelect={(cardRadius) =>
                onChange({
                  cardRadius,
                  buttonRadius:
                    cardRadius === "rounded-none"
                      ? "rounded-none"
                      : cardRadius === "rounded-2xl"
                        ? "rounded-full"
                        : "rounded-lg",
                })
              }
            />
          </div>

          <p className="mt-3 text-[11px] leading-snug text-slate-400">
            A preview direction, not the final design — your agency refines it later.
          </p>
        </div>
      )}
    </div>
  );
}

function Segmented({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onSelect(option.value)}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-white text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
