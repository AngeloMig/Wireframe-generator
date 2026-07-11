"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Pause, Play, Star } from "lucide-react";
import { bool, itemsOf, str, tint } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import { useWire } from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/**
 * Marquee & ticker designs. One engine drives them all:
 * - CSS keyframe scroll with speed/direction from content settings
 * - pauses on hover, keyboard focus, and via an explicit pause button
 * - respects prefers-reduced-motion (falls back to a scrollable static row)
 * - the mobile device preview is always a manually scrollable static row
 */

interface MarqueeItem {
  type: string;
  label: string;
  description: string;
}

function marqueeItems(content: Record<string, unknown>): MarqueeItem[] {
  return itemsOf(content, "items").map((item) => ({
    type: String(item.type ?? "logo"),
    label: String(item.label ?? ""),
    description: String(item.description ?? ""),
  }));
}

const SPEED_SECONDS: Record<string, number> = { slow: 48, medium: 32, fast: 18 };
const GAP_CLASS: Record<string, string> = {
  compact: "gap-3",
  normal: "gap-6",
  spacious: "gap-10",
};
/** Trailing padding matching the gap keeps the -50% loop point seamless. */
const GAP_PAD_CLASS: Record<string, string> = {
  compact: "pr-3",
  normal: "pr-6",
  spacious: "pr-10",
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

// ---------------------------------------------------------------------------
// Item renderers per item type
// ---------------------------------------------------------------------------

function MarqueeItemView({ item, showLabel }: { item: MarqueeItem; showLabel: boolean }) {
  const { styled, theme } = useWire();

  switch (item.type) {
    case "text":
      return (
        <span className={cn("text-2xl font-semibold tracking-tight whitespace-nowrap", theme.headingFont)}>
          {item.label}
          <span className="mx-4 inline-block size-1.5 rounded-full bg-current opacity-30 align-middle" aria-hidden />
        </span>
      );
    case "category":
      return (
        <span className="rounded-full border border-current/25 px-4 py-1.5 text-sm font-medium whitespace-nowrap opacity-80">
          {item.label}
        </span>
      );
    case "review":
      return (
        <span className="flex items-center gap-2.5 rounded-lg border border-current/15 bg-white/60 px-4 py-2 whitespace-nowrap text-slate-800">
          <span className="flex gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
            ))}
          </span>
          <span className="text-xs font-medium">{item.label}</span>
          {item.description && <span className="text-[11px] opacity-50">— {item.description}</span>}
        </span>
      );
    case "image":
      return (
        <span className="flex w-40 shrink-0 flex-col gap-1.5">
          <span
            className={cn("flex aspect-[4/3] items-center justify-center", theme.cardRadius, !styled && "bg-slate-200")}
            style={styled ? { backgroundColor: tint(theme.primary, 0.12) } : undefined}
          >
            <ImageIcon className="size-5 opacity-40" aria-hidden />
          </span>
          {showLabel && <span className="text-xs font-medium">{item.label}</span>}
        </span>
      );
    default: // logo
      return (
        <span className="flex h-11 w-32 shrink-0 items-center justify-center rounded border border-current/10 text-xs font-semibold tracking-wide uppercase opacity-50 whitespace-nowrap">
          {showLabel ? item.label || "Logo" : ""}
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// The marquee engine
// ---------------------------------------------------------------------------

function MarqueeRow({
  items,
  content,
  reverse,
  forceStatic,
}: {
  items: MarqueeItem[];
  content: Record<string, unknown>;
  reverse?: boolean;
  forceStatic?: boolean;
}) {
  const { device } = useWire();
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);

  const animationOn = bool(content, "animation");
  const showLabels = bool(content, "showLabels");
  const fadeEdges = bool(content, "fadeEdges");
  const pauseOnHover = bool(content, "pauseOnHover");
  const spacing = str(content, "itemSpacing");
  const gap = GAP_CLASS[spacing] ?? GAP_CLASS.normal;
  const gapPad = GAP_PAD_CLASS[spacing] ?? GAP_PAD_CLASS.normal;
  const speed = SPEED_SECONDS[str(content, "speed")] ?? SPEED_SECONDS.medium;
  const direction = str(content, "direction") === "right" ? "right" : "left";
  const effectiveDirection = reverse ? (direction === "left" ? "right" : "left") : direction;

  // Static, manually scrollable fallback: reduced motion, animation off,
  // static-to-motion designs that fit, and the mobile preview.
  const isStatic = forceStatic || reducedMotion || !animationOn || device === "mobile";

  const row = (
    <div className={cn("flex w-max items-center", gap)} aria-hidden={!isStatic || undefined}>
      {items.map((item, i) => (
        <MarqueeItemView key={i} item={item} showLabel={showLabels} />
      ))}
    </div>
  );

  if (isStatic) {
    return (
      <div
        className={cn(
          "overflow-x-auto py-1",
          fadeEdges &&
            "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        )}
      >
        {row}
      </div>
    );
  }

  return (
    <div className="group/marquee relative">
      <div
        className={cn(
          "overflow-hidden py-1",
          pauseOnHover && "wf-marquee-pausable",
          paused && "wf-marquee-paused",
          fadeEdges &&
            "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        )}
      >
        <div
          className="wf-marquee-track flex w-max items-center"
          data-direction={effectiveDirection}
          style={{ "--wf-marquee-duration": `${speed}s` } as React.CSSProperties}
        >
          {/* Two copies make the -50% translate loop seamless. */}
          <div className={cn("flex items-center", gap, gapPad)}>
            {items.map((item, i) => (
              <MarqueeItemView key={`a-${i}`} item={item} showLabel={showLabels} />
            ))}
          </div>
          <div className={cn("flex items-center", gap, gapPad)} aria-hidden>
            {items.map((item, i) => (
              <MarqueeItemView key={`b-${i}`} item={item} showLabel={showLabels} />
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label={paused ? "Play marquee" : "Pause marquee"}
        aria-pressed={paused}
        onClick={(e) => {
          e.stopPropagation();
          setPaused((v) => !v);
        }}
        className="absolute -right-1 -bottom-1 flex size-6 cursor-pointer items-center justify-center rounded-full border border-current/20 bg-white/90 text-slate-600 opacity-0 shadow-sm transition-opacity group-hover/marquee:opacity-100 focus-visible:opacity-100"
      >
        {paused ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
      </button>
    </div>
  );
}

function MarqueeHeading({ content }: { content: Record<string, unknown> }) {
  const heading = str(content, "heading");
  if (!heading) return null;
  return (
    <p className="mb-4 text-center text-xs font-medium tracking-wide uppercase opacity-50">
      {heading}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Design variations
// ---------------------------------------------------------------------------

/** 01–06 — single row; the item type carries the visual difference. */
export function MarqueeSingle({ section }: SectionComponentProps) {
  const items = marqueeItems(section.content);
  return (
    <>
      <MarqueeHeading content={section.content} />
      <MarqueeRow items={items} content={section.content} />
    </>
  );
}

/** 07 — two rows moving in opposite directions. */
export function MarqueeDual({ section }: SectionComponentProps) {
  const items = marqueeItems(section.content);
  const mid = Math.ceil(items.length / 2);
  const first = items.slice(0, mid);
  const second = items.slice(mid);
  return (
    <>
      <MarqueeHeading content={section.content} />
      <div className="space-y-4">
        <MarqueeRow items={first.length ? first : items} content={section.content} />
        <MarqueeRow items={second.length ? second : items} content={section.content} reverse />
      </div>
    </>
  );
}

/** 08 — static while the items fit, animating only on overflow. */
export function MarqueeAuto({ section }: SectionComponentProps) {
  const items = marqueeItems(section.content);
  const probeRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const node = probeRef.current;
    if (!node) return;
    const measure = () => setOverflows(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <>
      <MarqueeHeading content={section.content} />
      {/* Invisible probe measures whether one set of items fits the width. */}
      <div ref={probeRef} className="pointer-events-none h-0 overflow-hidden" aria-hidden>
        <div className="flex w-full items-center gap-6">
          {items.map((item, i) => (
            <MarqueeItemView key={i} item={item} showLabel />
          ))}
        </div>
      </div>
      {overflows ? (
        <MarqueeRow items={items} content={section.content} />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {items.map((item, i) => (
            <MarqueeItemView key={i} item={item} showLabel={bool(section.content, "showLabels")} />
          ))}
        </div>
      )}
    </>
  );
}
