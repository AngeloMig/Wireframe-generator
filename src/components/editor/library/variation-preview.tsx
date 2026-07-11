"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Plus, Smartphone, Tablet } from "lucide-react";
import type { BrandTheme } from "@/lib/editor-utils";
import { createSectionFromVariation } from "@/lib/sections";
import { DEVICE_WIDTHS, type DeviceKind, type EditorMode } from "@/stores/editor-store";
import type { SectionVariation } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { WireProvider } from "../wireframes/primitives";
import { SectionRenderer } from "../wireframes/section-renderer";

const DEVICES: { id: DeviceKind; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

/**
 * Large preview of one design variation with device and wireframe/styled
 * toggles, rendered from the variation's example content.
 */
export function VariationPreview({
  variation,
  theme,
  onClose,
  onAdd,
}: {
  variation: SectionVariation | null;
  theme: BrandTheme;
  onClose: () => void;
  onAdd: (variation: SectionVariation) => void;
}) {
  const [device, setDevice] = useState<DeviceKind>("desktop");
  const [mode, setMode] = useState<EditorMode>("wireframe");
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [innerHeight, setInnerHeight] = useState(0);

  // Example content: the variation's defaults over the type's shared schema.
  const previewSection = useMemo(
    () => (variation ? createSectionFromVariation(variation) : null),
    [variation],
  );

  const deviceWidth = DEVICE_WIDTHS[device];

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner || !variation) return;
    const measure = () => {
      setScale(Math.min(1, Math.max(0.25, (frame.clientWidth - 34) / deviceWidth)));
      setInnerHeight(inner.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [deviceWidth, variation, mode]);

  if (!variation || !previewSection) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={variation.name}
      description={variation.description}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onAdd(variation);
              onClose();
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add to Page
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Preview device"
            className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            {DEVICES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={device === id}
                aria-label={`Preview on ${label}`}
                onClick={() => setDevice(id)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  device === id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Preview mode"
            className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            {(
              [
                { id: "wireframe", label: "Wireframe" },
                { id: "styled", label: "Styled" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div ref={frameRef} className="overflow-hidden rounded-lg bg-slate-100 p-4">
          <div
            className="mx-auto"
            style={{ width: deviceWidth * scale, height: innerHeight * scale || undefined }}
          >
            <div
              ref={innerRef}
              style={{
                width: deviceWidth,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <WireProvider value={{ styled: mode === "styled", theme, device }}>
                <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-slate-200">
                  <SectionRenderer section={previewSection} />
                </div>
              </WireProvider>
            </div>
          </div>
        </div>

        {variation.tags.length > 0 && (
          <p className="flex flex-wrap gap-1">
            {variation.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                {tag}
              </span>
            ))}
          </p>
        )}
      </div>
    </Dialog>
  );
}
