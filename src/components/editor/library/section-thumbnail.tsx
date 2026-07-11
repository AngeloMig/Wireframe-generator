"use client";

import type { SectionVariation } from "@/types";
import { cn } from "@/utils/cn";

/**
 * Tiny code-drawn schematic of a section design for the library and preview
 * surfaces. Pure CSS shapes — no external images — telegraphing columns,
 * hierarchy, images, cards, accordions, and buttons.
 */
export function SectionThumbnail({
  variation,
  className,
}: {
  variation: SectionVariation;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-14 w-20 shrink-0 flex-col justify-center gap-1 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5",
        className,
      )}
    >
      <Sketch variation={variation} />
    </div>
  );
}

const line = (w: string, extra?: string) => (
  <div className={cn("h-1 rounded-full bg-slate-300", w, extra)} />
);
const block = (extra?: string) => <div className={cn("rounded-sm bg-slate-200", extra)} />;
const btn = (extra?: string) => <div className={cn("h-1.5 w-4 rounded-sm bg-slate-600", extra)} />;

function AccordionRows({ n = 3, cols = 1 }: { n?: number; cols?: number }) {
  return (
    <div className={cn("grid gap-0.5", cols === 2 && "grid-cols-2 gap-x-1")}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-sm border border-slate-200 px-1 py-0.5"
        >
          {line("w-2/3")}
          <span className="text-[7px] text-slate-400">▾</span>
        </div>
      ))}
    </div>
  );
}

function MarqueeChips({ dark, rows = 1 }: { dark?: boolean; rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className={cn("flex gap-0.5", row % 2 === 1 && "-translate-x-1")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2.5 flex-1 rounded-sm",
                dark ? "bg-slate-500" : "border border-slate-200",
              )}
            />
          ))}
        </div>
      ))}
      <div className="mx-auto h-0.5 w-1/3 rounded-full bg-slate-200" />
    </div>
  );
}

function NavBar({ cta, icons, centered }: { cta?: boolean; icons?: boolean; centered?: boolean }) {
  if (centered) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">{line("w-2")}{line("w-2")}</div>
        <div className="size-2 rounded-sm bg-slate-500" />
        <div className="flex gap-0.5">{line("w-2")}{line("w-2")}</div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <div className="size-2 rounded-sm bg-slate-500" />
      <div className="flex items-center gap-0.5">
        {line("w-2")}
        {line("w-2")}
        {line("w-2")}
        {cta && <div className="ml-0.5 h-2 w-3 rounded-sm bg-slate-600" />}
        {icons && (
          <>
            <div className="ml-0.5 size-1.5 rounded-full border border-slate-400" />
            <div className="size-1.5 rounded-full border border-slate-400" />
          </>
        )}
      </div>
    </div>
  );
}

function Sketch({ variation }: { variation: SectionVariation }) {
  switch (variation.id) {
    // ----- Navigation ------------------------------------------------------
    case "nav-standard":
      return <NavBar cta />;
    case "nav-centered":
      return <NavBar centered />;
    case "nav-minimal":
      return (
        <div className="flex items-center justify-between px-1">
          <div className="size-2 rounded-sm bg-slate-500" />
          <div className="flex gap-1.5">{line("w-2")}{line("w-2")}{line("w-2")}</div>
        </div>
      );
    case "nav-ecommerce":
      return <NavBar icons />;
    case "nav-mega":
      return (
        <div className="space-y-1">
          <NavBar cta />
          <div className="flex gap-1 rounded-sm border border-slate-200 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-0.5">
                <div className="h-0.5 w-full rounded-full bg-slate-300" />
                <div className="h-0.5 w-2/3 rounded-full bg-slate-200" />
              </div>
            ))}
            {block("h-4 w-4")}
          </div>
        </div>
      );
    case "nav-overlay":
      return (
        <div className="flex h-full flex-col justify-start gap-1 rounded-sm bg-slate-600 p-1">
          <div className="flex items-center justify-between">
            <div className="size-1.5 rounded-sm bg-white/80" />
            <div className="flex gap-0.5">
              <div className="h-0.5 w-2 rounded-full bg-white/60" />
              <div className="h-0.5 w-2 rounded-full bg-white/60" />
            </div>
          </div>
          <div className="mx-auto mt-1 h-1 w-1/2 rounded-full bg-white/40" />
        </div>
      );
    case "nav-sidebar":
      return (
        <div className="flex h-full gap-1">
          <div className="flex w-1/3 flex-col gap-0.5 rounded-sm border border-slate-300 p-0.5">
            <div className="size-1.5 rounded-sm bg-slate-500" />
            {line("w-full")}
            {line("w-full")}
            {line("w-2/3")}
          </div>
          {block("h-full flex-1 opacity-50")}
        </div>
      );
    case "nav-utility":
      return (
        <div className="space-y-0.5">
          <div className="h-1.5 w-full rounded-sm bg-slate-700" />
          <NavBar cta />
        </div>
      );
    case "nav-cta":
      return (
        <div className="flex items-center justify-between">
          <div className="size-2 rounded-sm bg-slate-500" />
          <div className="flex items-center gap-0.5">
            {line("w-2")}
            <div className="h-2.5 w-5 rounded-sm bg-slate-700" />
          </div>
        </div>
      );
    case "nav-editorial":
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-2.5 w-8 rounded-sm bg-slate-600" />
          <div className="flex gap-1">{line("w-2")}{line("w-2")}{line("w-2")}</div>
        </div>
      );
    case "nav-announcement-bar":
      return <div className="mx-auto h-1.5 w-3/4 rounded-full bg-slate-700" />;

    // ----- FAQ ---------------------------------------------------------------
    case "faq-accordion":
      return <AccordionRows />;
    case "faq-two-column":
      return <AccordionRows n={4} cols={2} />;
    case "faq-sidebar":
      return (
        <div className="flex gap-1">
          <div className="flex w-1/3 flex-col gap-0.5">
            {line("w-full", "bg-slate-500")}
            {line("w-full")}
            {line("w-2/3")}
          </div>
          <div className="flex-1"><AccordionRows n={3} /></div>
        </div>
      );
    case "faq-tabs":
      return (
        <div className="space-y-1">
          <div className="flex justify-center gap-0.5">
            <div className="h-1.5 w-4 rounded-full bg-slate-500" />
            <div className="h-1.5 w-4 rounded-full border border-slate-300" />
            <div className="h-1.5 w-4 rounded-full border border-slate-300" />
          </div>
          <AccordionRows n={2} />
        </div>
      );
    case "faq-cards":
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-0.5 rounded-sm border border-slate-200 p-0.5">
              <div className="h-0.5 w-full rounded-full bg-slate-400" />
              <div className="h-0.5 w-2/3 rounded-full bg-slate-200" />
              <div className="h-0.5 w-2/3 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    case "faq-featured":
      return (
        <div className="space-y-0.5">
          <div className="space-y-0.5 rounded-sm border-2 border-slate-400 p-0.5">
            <div className="h-0.5 w-2/3 rounded-full bg-slate-500" />
            <div className="h-0.5 w-full rounded-full bg-slate-200" />
          </div>
          <AccordionRows n={2} />
        </div>
      );
    case "faq-search":
      return (
        <div className="space-y-1">
          <div className="mx-auto flex h-2 w-3/4 items-center gap-0.5 rounded-full border border-slate-300 px-1">
            <div className="size-1 rounded-full border border-slate-400" />
            {line("w-1/3", "h-0.5")}
          </div>
          <AccordionRows n={2} />
        </div>
      );
    case "faq-contact-cta":
      return (
        <div className="flex gap-1">
          <div className="flex-1"><AccordionRows n={3} /></div>
          <div className="flex w-1/3 flex-col justify-center gap-0.5 rounded-sm bg-slate-100 p-0.5">
            <div className="h-0.5 w-full rounded-full bg-slate-400" />
            {btn("w-3")}
          </div>
        </div>
      );
    case "faq-numbered":
      return (
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[8px] font-bold text-slate-400">{i + 1}</span>
              <div className="flex-1 space-y-0.5">
                {line("w-3/4", "bg-slate-500 h-0.5")}
                {line("w-full", "h-0.5")}
              </div>
            </div>
          ))}
        </div>
      );
    case "faq-dark":
      return (
        <div className="flex h-full flex-col justify-center gap-0.5 rounded-sm bg-slate-700 p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-sm border border-slate-500 px-1 py-0.5">
              <div className="h-0.5 w-2/3 rounded-full bg-slate-400" />
              <span className="text-[6px] text-slate-400">▾</span>
            </div>
          ))}
        </div>
      );

    // ----- Marquee ------------------------------------------------------------
    case "marquee-logos":
    case "marquee-categories":
      return <MarqueeChips />;
    case "marquee-text":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[9px] font-bold whitespace-nowrap text-slate-500">
              Statement · Statement
            </span>
          </div>
          <div className="mx-auto h-0.5 w-1/3 rounded-full bg-slate-200" />
        </div>
      );
    case "marquee-reviews":
      return (
        <div className="space-y-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-0.5 rounded-sm border border-slate-200 p-0.5">
                <span className="block text-[5px] leading-none text-amber-400">★★★★★</span>
                <div className="h-0.5 w-full rounded-full bg-slate-300" />
              </div>
            ))}
          </div>
          <div className="mx-auto h-0.5 w-1/3 rounded-full bg-slate-200" />
        </div>
      );
    case "marquee-images":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 flex-1 rounded-sm bg-slate-200" />
          ))}
        </div>
      );
    case "marquee-ticker":
      return (
        <div className="flex h-2 items-center gap-1 overflow-hidden rounded-sm bg-slate-700 px-1">
          <span className="text-[6px] whitespace-nowrap text-white/80">
            Free shipping · New arrivals · Returns
          </span>
        </div>
      );
    case "marquee-dual":
      return <MarqueeChips rows={2} />;
    case "marquee-logo-static":
      return (
        <div className="flex items-center justify-between gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-2.5 flex-1 rounded-sm border border-slate-200" />
          ))}
        </div>
      );

    // ----- Hero ---------------------------------------------------------------
    case "hero-split":
    case "hero-product":
    case "hero-promo":
      return (
        <div className="flex h-full items-center gap-1">
          <div className="flex flex-1 flex-col gap-1">
            {variation.id === "hero-promo" && <div className="h-1.5 w-4 rounded-full bg-slate-600" />}
            {line("w-full", "bg-slate-500")}
            {line("w-3/4")}
            {btn()}
          </div>
          {block("h-full flex-1")}
        </div>
      );
    case "hero-fullbg":
      return (
        <div className="relative h-full w-full rounded-sm bg-slate-300">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {line("w-1/2", "bg-white")}
            {btn("bg-white")}
          </div>
        </div>
      );
    case "hero-form":
      return (
        <div className="flex h-full items-center gap-1">
          <div className="flex flex-1 flex-col gap-1">
            {line("w-full", "bg-slate-500")}
            {line("w-2/3")}
          </div>
          <div className="flex h-full flex-1 flex-col justify-center gap-0.5 rounded-sm border border-slate-300 p-0.5">
            {line("w-full")}
            {line("w-full")}
            {btn("w-3")}
          </div>
        </div>
      );
    case "hero-stats":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          <div className="flex w-full justify-around">
            <span className="text-[8px] font-bold text-slate-500">12</span>
            <span className="text-[8px] font-bold text-slate-500">98%</span>
            <span className="text-[8px] font-bold text-slate-500">4.9</span>
          </div>
        </div>
      );
    case "hero-logos":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          {btn()}
          <div className="flex w-full justify-between gap-0.5 border-t border-slate-100 pt-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-sm bg-slate-200" />
            ))}
          </div>
        </div>
      );
    case "hero-video":
      return (
        <div className="relative h-full w-full rounded-sm bg-slate-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-3.5 items-center justify-center rounded-full bg-white shadow">
              <span className="ml-px border-y-[2.5px] border-l-4 border-y-transparent border-l-slate-500" />
            </div>
          </div>
        </div>
      );
    case "hero-editorial":
      return (
        <div className="flex h-full flex-col justify-center gap-1">
          <div className="h-2 w-full rounded-sm bg-slate-600" />
          <div className="h-2 w-2/3 rounded-sm bg-slate-600" />
        </div>
      );
    case "hero-cards":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          <div className="flex w-full gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-3 flex-1 rounded-sm border border-slate-200" />
            ))}
          </div>
        </div>
      );
    case "hero-minimal":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-3/4 rounded-sm bg-slate-600" />
          {btn()}
        </div>
      );

    // ----- Testimonials ---------------------------------------------------------
    case "testi-featured":
    case "testi-dark":
      return (
        <div
          className={cn(
            "flex h-full flex-col items-center justify-center gap-1 rounded-sm p-1",
            variation.id === "testi-dark" && "bg-slate-700",
          )}
        >
          <span className={cn("text-[10px] leading-none", variation.id === "testi-dark" ? "text-slate-400" : "text-slate-300")}>
            “
          </span>
          {line("w-3/4", variation.id === "testi-dark" ? "bg-slate-400" : "bg-slate-500")}
          {line("w-1/3", variation.id === "testi-dark" ? "bg-slate-500" : undefined)}
        </div>
      );
    case "testi-carousel":
      return (
        <div className="flex h-full items-center gap-1">
          <span className="text-[8px] text-slate-400">‹</span>
          <div className="flex flex-1 flex-col items-center gap-1">
            {line("w-3/4", "bg-slate-500")}
            {line("w-1/3")}
            <div className="flex gap-0.5">
              <span className="size-0.5 rounded-full bg-slate-500" />
              <span className="size-0.5 rounded-full bg-slate-200" />
              <span className="size-0.5 rounded-full bg-slate-200" />
            </div>
          </div>
          <span className="text-[8px] text-slate-400">›</span>
        </div>
      );
    case "testi-masonry":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn("flex-1 space-y-0.5", i === 1 && "mt-1")}>
              <div className={cn("rounded-sm border border-slate-200 p-0.5", i === 1 ? "h-5" : "h-4")}>
                <div className="h-0.5 w-full rounded-full bg-slate-300" />
              </div>
            </div>
          ))}
        </div>
      );
    case "testi-review-summary":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold text-slate-600">4.9</span>
          <span className="text-[5px] leading-none text-amber-400">★★★★★</span>
          <div className="flex w-full gap-0.5">
            {block("h-2 flex-1")}
            {block("h-2 flex-1")}
          </div>
        </div>
      );

    // ----- Services / CTA / Footer specials --------------------------------------
    case "svc-alternating":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {block("h-3 flex-1")}
            <div className="flex flex-1 flex-col justify-center gap-0.5">{line("w-full")}{line("w-2/3")}</div>
          </div>
          <div className="flex gap-1">
            <div className="flex flex-1 flex-col justify-center gap-0.5">{line("w-full")}{line("w-2/3")}</div>
            {block("h-3 flex-1")}
          </div>
        </div>
      );
    case "svc-list":
      return (
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div className="size-1 rounded-full bg-slate-400" />
              {line("flex-1")}
            </div>
          ))}
        </div>
      );
    case "svc-timeline":
      return (
        <div className="ml-2 space-y-1 border-l border-slate-300 pl-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-0.5">
              {line("w-1/2", "bg-slate-500 h-0.5")}
              {line("w-3/4", "h-0.5")}
            </div>
          ))}
        </div>
      );
    case "svc-featured":
      return (
        <div className="flex gap-1">
          <div className="flex w-1/2 flex-col gap-0.5 rounded-sm border-2 border-slate-400 p-0.5">
            {line("w-2/3", "bg-slate-500 h-0.5")}
            {line("w-full", "h-0.5")}
          </div>
          <div className="flex flex-1 flex-col justify-around gap-0.5">
            {line("w-full", "h-0.5")}
            {line("w-full", "h-0.5")}
            {line("w-2/3", "h-0.5")}
          </div>
        </div>
      );
    case "svc-pricing":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn("flex-1 space-y-0.5 rounded-sm border p-0.5", i === 1 ? "border-slate-500" : "border-slate-200")}>
              <div className="h-0.5 w-2/3 rounded-full bg-slate-400" />
              <span className="block text-[7px] font-bold leading-none text-slate-500">$</span>
              {btn("w-full h-1")}
            </div>
          ))}
        </div>
      );
    case "cta-centered":
    case "cta-stat-banner":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-sm bg-slate-700 p-1">
          {line("w-1/2", "bg-white")}
          {btn("bg-white")}
        </div>
      );
    case "cta-split":
      return (
        <div className="flex h-full items-center justify-between gap-1 rounded-sm bg-slate-100 p-1">
          <div className="flex-1 space-y-0.5">
            {line("w-3/4", "bg-slate-500")}
            {line("w-1/2")}
          </div>
          {btn()}
        </div>
      );
    case "cta-newsletter":
    case "cta-newsletter-split":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          <div className="flex w-3/4 gap-0.5">
            <div className="h-2 flex-1 rounded-sm border border-slate-300" />
            <div className="h-2 w-4 rounded-sm bg-slate-600" />
          </div>
        </div>
      );
    case "cta-contact-form":
      return (
        <div className="flex h-full items-center gap-1">
          <div className="flex flex-1 flex-col gap-1">
            {line("w-full", "bg-slate-500")}
            {line("w-2/3")}
          </div>
          <div className="flex h-full flex-1 flex-col justify-center gap-0.5 rounded-sm border border-slate-300 p-0.5">
            {line("w-full")}
            {line("w-full")}
            {btn("w-3")}
          </div>
        </div>
      );
    case "cta-image":
      return (
        <div className="flex h-full items-center gap-1 rounded-sm bg-slate-100 p-0.5">
          <div className="flex flex-1 flex-col gap-0.5">
            {line("w-full", "bg-slate-500")}
            {btn()}
          </div>
          {block("h-full flex-1")}
        </div>
      );
    case "cta-card":
      return (
        <div className="flex h-full items-center justify-center rounded-sm bg-slate-100 p-1">
          <div className="flex w-3/4 flex-col items-center gap-0.5 rounded-sm border border-slate-300 bg-white p-1 shadow-sm">
            {line("w-2/3", "bg-slate-500 h-0.5")}
            {btn("h-1")}
          </div>
        </div>
      );
    case "footer-simple":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-0.5 rounded-sm bg-slate-700 p-1">
          <div className="size-1.5 rounded-sm bg-slate-400" />
          <div className="h-0.5 w-1/2 rounded-full bg-slate-500" />
        </div>
      );
    case "footer-editorial":
      return (
        <div className="flex h-full flex-col justify-end gap-1 p-0.5">
          <div className="h-3 w-2/3 rounded-sm bg-slate-500" />
          <div className="flex justify-between border-t border-slate-200 pt-0.5">
            {line("w-1/4", "h-0.5")}
            {line("w-1/4", "h-0.5")}
          </div>
        </div>
      );
    case "footer-minimal":
      return (
        <div className="flex h-full items-end">
          <div className="flex w-full items-center justify-between border-t border-slate-300 pt-1">
            <div className="size-1.5 rounded-sm bg-slate-500" />
            <div className="flex gap-0.5">{line("w-2", "h-0.5")}{line("w-2", "h-0.5")}</div>
          </div>
        </div>
      );
    case "footer-columns":
    case "footer-newsletter":
    case "footer-mega":
    case "footer-dark-cta":
    case "footer-contact":
      return (
        <div className="flex h-full flex-col justify-end gap-1 rounded-sm bg-slate-700 p-1">
          {variation.id === "footer-dark-cta" && (
            <div className="mx-auto h-1 w-1/2 rounded-full bg-slate-400" />
          )}
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col gap-0.5">
                <div className="h-0.5 w-full rounded-full bg-slate-400" />
                <div className="h-0.5 w-2/3 rounded-full bg-slate-500" />
                <div className="h-0.5 w-2/3 rounded-full bg-slate-500" />
              </div>
            ))}
            {variation.id === "footer-newsletter" || variation.id === "footer-mega" ? (
              <div className="h-2 w-4 self-end rounded-sm bg-slate-500" />
            ) : null}
          </div>
        </div>
      );
    case "content-statement":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-sm bg-slate-700 p-1">
          <div className="h-1 w-3/4 rounded-full bg-slate-400" />
          <div className="h-1 w-2/3 rounded-full bg-slate-400" />
        </div>
      );
    case "content-image-text":
      return (
        <div className="flex h-full items-center gap-1">
          {block("h-full flex-1")}
          <div className="flex flex-1 flex-col gap-1">
            {line("w-full", "bg-slate-500")}
            {line("w-3/4")}
            {btn()}
          </div>
        </div>
      );
    case "content-stats":
      return (
        <div className="flex h-full items-center justify-around">
          <span className="text-[8px] font-bold text-slate-500">10k</span>
          <span className="text-[8px] font-bold text-slate-500">4.9</span>
          <span className="text-[8px] font-bold text-slate-500">24/7</span>
        </div>
      );
    case "ecom-collections":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative h-8 flex-1 rounded-sm bg-slate-200">
              <div className="absolute right-0.5 bottom-0.5 left-0.5 h-1 rounded-sm bg-white" />
            </div>
          ))}
        </div>
      );
    default:
      break;
  }

  // Grid-of-cards default: centered heading + N columns.
  const cols = Math.min(variation.defaultLayout.columns, 4) || 3;
  if (cols <= 1) {
    return (
      <div className="flex flex-col items-center gap-1">
        {line("w-1/2", "bg-slate-500")}
        {line("w-3/4")}
        {line("w-2/3")}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="mx-auto h-1 w-1/2 rounded-full bg-slate-500" />
      <div className="flex gap-1">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col gap-0.5">
            {block("h-2.5 w-full")}
            <div className="h-0.5 w-2/3 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
