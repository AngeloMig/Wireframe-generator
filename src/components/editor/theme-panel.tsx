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

const PALETTE_PRESETS: {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}[] = [
  { name: "Indigo Ink", primary: "#4F46E5", secondary: "#0F172A", accent: "#F59E0B" },
  { name: "Forest Study", primary: "#1F3A34", secondary: "#E8E2D9", accent: "#C47F45" },
  { name: "Ocean Slate", primary: "#0F4C5C", secondary: "#E6EEF0", accent: "#FF6B35" },
  { name: "Terracotta Clay", primary: "#B75C3B", secondary: "#F5EDE4", accent: "#2F5D62" },
  { name: "Plum Velvet", primary: "#5B2A86", secondary: "#F4F0F8", accent: "#E8A33D" },
  { name: "Midnight Coral", primary: "#1B263B", secondary: "#F1F3F5", accent: "#EF6461" },
  { name: "Sage & Rust", primary: "#4A5D46", secondary: "#F2EFE9", accent: "#C1502E" },
  { name: "Royal Gold", primary: "#1E3A5F", secondary: "#FAF6EE", accent: "#D4AF37" },
  { name: "Blush Charcoal", primary: "#2B2B2B", secondary: "#F7E9E3", accent: "#E07A5F" },
  { name: "Emerald Ink", primary: "#065F46", secondary: "#ECFDF5", accent: "#F59E0B" },
  { name: "Crimson Slate", primary: "#7F1D1D", secondary: "#F8FAFC", accent: "#0EA5E9" },
  { name: "Teal Sunset", primary: "#0F766E", secondary: "#FFF7ED", accent: "#F97316" },
  { name: "Berry Cream", primary: "#6D28D9", secondary: "#FDF4FF", accent: "#EC4899" },
  { name: "Navy Mustard", primary: "#1E293B", secondary: "#FFFBEB", accent: "#EAB308" },
  { name: "Olive Brick", primary: "#3F3B24", secondary: "#FBEFE3", accent: "#A3402B" },
  { name: "Steel Coral", primary: "#334155", secondary: "#F0F9FF", accent: "#FB7185" },
  { name: "Deep Rose", primary: "#831843", secondary: "#FDF2F8", accent: "#FBBF24" },
  { name: "Cobalt Peach", primary: "#1D4ED8", secondary: "#FFF1E6", accent: "#FB923C" },
  { name: "Charcoal Mint", primary: "#18181B", secondary: "#ECFEFF", accent: "#2DD4BF" },
  { name: "Espresso Cream", primary: "#3B2A20", secondary: "#FBF7F0", accent: "#C08A4E" },
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
          className="absolute top-9 right-0 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-panel)]"
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

          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-slate-600">Suggested palettes</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  aria-label={`Apply ${preset.name} palette`}
                  onClick={() =>
                    onChange({
                      primary: preset.primary,
                      secondary: preset.secondary,
                      accent: preset.accent,
                    })
                  }
                  className="group flex size-8 cursor-pointer overflow-hidden rounded-md border border-slate-200 transition-transform hover:scale-105 hover:border-slate-400"
                >
                  <span className="h-full w-1/2" style={{ backgroundColor: preset.primary }} />
                  <span className="flex h-full w-1/2 flex-col">
                    <span className="h-1/2 w-full" style={{ backgroundColor: preset.secondary }} />
                    <span className="h-1/2 w-full" style={{ backgroundColor: preset.accent }} />
                  </span>
                </button>
              ))}
            </div>
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
