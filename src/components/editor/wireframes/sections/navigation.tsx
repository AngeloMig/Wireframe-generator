"use client";

import {
  ChevronDown,
  Globe,
  Mail,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { bool, itemsOf, str, tint } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import { useWire, WireButton } from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/**
 * Navigation design variations. All render a semantic <nav>, collapse to a
 * hamburger presentation on the mobile device preview, and read the shared
 * navigation content schema (logo, links, CTA, announcement, icon toggles).
 */

function Logo({ content, size = "md" }: { content: Record<string, unknown>; size?: "md" | "lg" | "xl" }) {
  const { theme, styled } = useWire();
  const sizeClass = { md: "text-base", lg: "text-2xl", xl: "text-4xl tracking-tight" }[size];
  return (
    <span
      className={cn(sizeClass, "font-bold tracking-tight", theme.headingFont)}
      style={styled ? { color: "inherit" } : undefined}
    >
      {str(content, "logoText") || "Logo"}
    </span>
  );
}

function NavLinks({
  content,
  className,
  max,
  withCaret,
}: {
  content: Record<string, unknown>;
  className?: string;
  max?: number;
  withCaret?: boolean;
}) {
  const links = itemsOf(content, "links");
  const shown = max ? links.slice(0, max) : links;
  return (
    <ul className={cn("flex items-center gap-5", className)}>
      {shown.map((link, i) => (
        <li key={i} className="flex items-center gap-0.5 text-sm opacity-80">
          {String(link.label ?? "")}
          {withCaret && <ChevronDown className="size-3 opacity-60" aria-hidden />}
        </li>
      ))}
    </ul>
  );
}

/** Compact hamburger presentation used by most designs on mobile. */
function MobileBar({
  content,
  trailing,
}: {
  content: Record<string, unknown>;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <Menu className="size-5 opacity-70" aria-hidden />
      <Logo content={content} />
      {trailing ?? <span className="size-5" aria-hidden />}
    </div>
  );
}

function AnnouncementRow({ text, linkLabel }: { text: string; linkLabel?: string }) {
  const { styled, theme } = useWire();
  if (!text) return null;
  return (
    <div
      className="-mx-10 mb-3 flex items-center justify-center gap-3 px-10 py-1.5 text-xs text-white"
      style={{ backgroundColor: styled ? theme.secondary : "#1e293b" }}
    >
      <span>{text}</span>
      {linkLabel && <span className="font-medium underline underline-offset-2">{linkLabel}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 01 — Standard left logo
// ---------------------------------------------------------------------------

export function NavStandard({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  if (device === "mobile") return <MobileBar content={c} />;
  return (
    <nav aria-label="Main" className="flex items-center justify-between gap-6">
      <Logo content={c} />
      <NavLinks content={c} />
      {str(c, "ctaLabel") && <WireButton label={str(c, "ctaLabel")} />}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// 02 — Centered logo, links split both sides
// ---------------------------------------------------------------------------

export function NavCentered({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const links = itemsOf(c, "links");
  const mid = Math.ceil(links.length / 2);
  return (
    <div>
      <AnnouncementRow text={str(c, "announcementText")} />
      {device === "mobile" ? (
        <MobileBar content={c} />
      ) : (
        <nav aria-label="Main" className="flex items-center justify-between gap-6">
          <ul className="flex flex-1 items-center gap-5">
            {links.slice(0, mid).map((link, i) => (
              <li key={i} className="text-sm opacity-80">{String(link.label ?? "")}</li>
            ))}
          </ul>
          <Logo content={c} size="lg" />
          <ul className="flex flex-1 items-center justify-end gap-5">
            {links.slice(mid).map((link, i) => (
              <li key={i} className="text-sm opacity-80">{String(link.label ?? "")}</li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 03 — Minimal
// ---------------------------------------------------------------------------

export function NavMinimal({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  if (device === "mobile") return <MobileBar content={c} />;
  return (
    <nav aria-label="Main" className="flex items-center justify-between gap-10 py-2">
      <Logo content={c} />
      <div className="flex items-center gap-10">
        <NavLinks content={c} max={5} className="gap-8" />
        {str(c, "ctaLabel") && (
          <span className="text-sm font-medium underline underline-offset-4">
            {str(c, "ctaLabel")}
          </span>
        )}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// 04 — Ecommerce
// ---------------------------------------------------------------------------

export function NavEcommerce({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const icons = (
    <div className="flex items-center gap-3">
      {bool(c, "showAccount") && <UserRound className="size-4.5 opacity-60" aria-hidden />}
      {bool(c, "showCart") && <ShoppingBag className="size-4.5 opacity-60" aria-hidden />}
    </div>
  );
  return (
    <div>
      <AnnouncementRow text={str(c, "announcementText")} />
      {device === "mobile" ? (
        <MobileBar content={c} trailing={icons} />
      ) : (
        <nav aria-label="Main" className="flex items-center justify-between gap-6">
          <Logo content={c} />
          <NavLinks content={c} />
          <div className="flex items-center gap-3">
            {bool(c, "showSearch") && (
              <span className="flex h-8 w-40 items-center gap-2 rounded-full border border-current/20 px-3 text-xs opacity-50">
                <Search className="size-3.5" aria-hidden />
                Search
              </span>
            )}
            {icons}
          </div>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 05 — Mega menu (rendered open as a wireframe preview)
// ---------------------------------------------------------------------------

export function NavMega({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  const links = itemsOf(c, "links");
  if (device === "mobile") return <MobileBar content={c} />;
  return (
    <div>
      <nav aria-label="Main" className="flex items-center justify-between gap-6">
        <Logo content={c} />
        <NavLinks content={c} withCaret />
        {str(c, "ctaLabel") && <WireButton label={str(c, "ctaLabel")} />}
      </nav>
      {/* Open dropdown preview for the first category */}
      <div className="relative mt-3">
        <div className="rounded-lg border border-current/15 bg-white/95 p-5 text-slate-800 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold tracking-wide uppercase opacity-50">
            {String(links[0]?.label ?? "Menu")} — open menu preview
          </p>
          <div className="flex gap-6">
            {Array.from({ length: 3 }).map((_, col) => (
              <div key={col} className="flex-1 space-y-2">
                <div className="h-2 w-16 rounded-full bg-slate-400" />
                {Array.from({ length: 4 }).map((_, row) => (
                  <div key={row} className="h-1.5 w-4/5 rounded-full bg-slate-200" />
                ))}
              </div>
            ))}
            <div
              className={cn("flex w-48 flex-col justify-end gap-2 p-3", theme.cardRadius)}
              style={{ backgroundColor: styled ? tint(theme.primary, 0.12) : "#f1f5f9" }}
            >
              <div className="h-14 rounded bg-slate-300/70" />
              <p className="text-xs font-semibold">Featured promotion</p>
              <p className="text-[11px] opacity-60">Highlight a product or offer here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 06 — Transparent overlay (shows overlay state + sticky state)
// ---------------------------------------------------------------------------

export function NavOverlay({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  const light = str(c, "overlayTone") !== "dark";

  const bar = (solid: boolean) => (
    <nav
      aria-label="Main"
      className={cn(
        "flex items-center justify-between gap-6 px-6 py-3",
        !solid && (light ? "text-white" : "text-slate-900"),
        solid && "rounded-md bg-white/95 text-slate-900 shadow-sm",
      )}
    >
      <Logo content={c} />
      {device !== "mobile" ? (
        <>
          <NavLinks content={c} />
          {str(c, "ctaLabel") && <WireButton label={str(c, "ctaLabel")} />}
        </>
      ) : (
        <Menu className="size-5 opacity-80" aria-hidden />
      )}
    </nav>
  );

  return (
    <div className="-my-2 space-y-3">
      {/* Overlay state: transparent bar sitting on a hero backdrop */}
      <div
        className={cn("relative overflow-hidden rounded-lg", light ? "bg-slate-600" : "bg-slate-200")}
        style={styled ? { backgroundColor: light ? theme.secondary : tint(theme.primary, 0.15) } : undefined}
      >
        {bar(false)}
        <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-10 opacity-60">
          <div className={cn("h-3 w-1/3 rounded-full", light ? "bg-white/60" : "bg-slate-500/50")} />
          <div className={cn("h-2 w-1/4 rounded-full", light ? "bg-white/40" : "bg-slate-500/30")} />
        </div>
        <span
          className={cn(
            "absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-[10px] font-medium",
            light ? "bg-white/20 text-white" : "bg-slate-900/10 text-slate-700",
          )}
        >
          Over hero
        </span>
      </div>
      {/* Sticky state: solid background once scrolled */}
      <div className="relative rounded-lg border border-dashed border-current/20 p-1.5">
        {bar(true)}
        <span className="absolute right-2 bottom-2 rounded bg-slate-900/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
          Sticky / scrolled
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 07 — Sidebar navigation
// ---------------------------------------------------------------------------

export function NavSidebar({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const links = itemsOf(c, "links");
  if (device === "mobile") return <MobileBar content={c} />;
  return (
    <div className="flex gap-6">
      <nav
        aria-label="Main"
        className="flex w-44 shrink-0 flex-col gap-4 rounded-lg border border-current/15 p-4"
      >
        <Logo content={c} />
        <ul className="space-y-2.5">
          {links.map((link, i) => (
            <li key={i} className="text-sm opacity-80">{String(link.label ?? "")}</li>
          ))}
        </ul>
        {str(c, "ctaLabel") && (
          <span className="mt-2 text-sm font-medium underline underline-offset-4">
            {str(c, "ctaLabel")}
          </span>
        )}
      </nav>
      {/* Ghost of the page content beside the fixed sidebar */}
      <div className="flex min-h-40 flex-1 flex-col justify-center gap-2 opacity-40" aria-hidden>
        <div className="h-3 w-2/3 rounded-full bg-current opacity-20" />
        <div className="h-2 w-1/2 rounded-full bg-current opacity-15" />
        <div className="mt-3 h-20 rounded-lg bg-current opacity-10" />
        <p className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
          Page content flows beside the fixed sidebar
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 08 — Utility bar above main nav
// ---------------------------------------------------------------------------

export function NavUtility({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  return (
    <div>
      <div
        className="-mx-10 mb-3 flex items-center justify-between px-10 py-1.5 text-[11px] text-white"
        style={{ backgroundColor: styled ? theme.secondary : "#1e293b" }}
      >
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3" aria-hidden />
            {str(c, "contactPhone")}
          </span>
          {device !== "mobile" && (
            <span className="flex items-center gap-1.5">
              <Mail className="size-3" aria-hidden />
              {str(c, "contactEmail")}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <Globe className="size-3" aria-hidden />
          {str(c, "languageLabel")}
        </span>
      </div>
      {device === "mobile" ? (
        <MobileBar content={c} />
      ) : (
        <nav aria-label="Main" className="flex items-center justify-between gap-6">
          <Logo content={c} />
          <NavLinks content={c} />
          {str(c, "ctaLabel") && <WireButton label={str(c, "ctaLabel")} />}
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 09 — CTA-focused
// ---------------------------------------------------------------------------

export function NavCta({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  if (device === "mobile") {
    return <MobileBar content={c} trailing={<WireButton label={str(c, "ctaLabel") || "Start"} />} />;
  }
  return (
    <nav aria-label="Main" className="flex items-center justify-between gap-6">
      <Logo content={c} />
      <div className="flex items-center gap-5">
        <NavLinks content={c} max={3} />
        {str(c, "loginLabel") && (
          <span className="text-sm font-medium opacity-70">{str(c, "loginLabel")}</span>
        )}
        <WireButton label={str(c, "ctaLabel") || "Get started"} />
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// 10 — Editorial (oversized centered logo)
// ---------------------------------------------------------------------------

export function NavEditorial({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  if (device === "mobile") return <MobileBar content={c} />;
  return (
    <nav aria-label="Main" className="flex flex-col items-center gap-5 py-4">
      <Logo content={c} size="xl" />
      <NavLinks content={c} className="gap-8" />
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Announcement bar (standalone slim bar)
// ---------------------------------------------------------------------------

export function NavAnnouncementBar({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className="flex items-center justify-center gap-3 text-xs">
      <span>{str(c, "announcementText") || "Announcement message"}</span>
      {str(c, "ctaLabel") && (
        <span className="font-medium underline underline-offset-2">{str(c, "ctaLabel")}</span>
      )}
    </div>
  );
}
