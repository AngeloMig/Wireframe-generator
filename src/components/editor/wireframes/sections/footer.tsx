"use client";

import { Mail, Phone } from "lucide-react";
import { itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import { effectiveColumns, Grid, useWire, WireButton } from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Footer design variations. */

interface FooterColumn {
  title: string;
  links: string[];
}

function columnsOf(content: Record<string, unknown>): FooterColumn[] {
  return itemsOf(content, "columns").map((column) => ({
    title: String(column.title ?? ""),
    links: String(column.links ?? "")
      .split(",")
      .map((link) => link.trim())
      .filter(Boolean),
  }));
}

function FooterLogo({ content, size = "md" }: { content: Record<string, unknown>; size?: "md" | "xl" }) {
  const { theme } = useWire();
  return (
    <p className={cn(size === "xl" ? "text-4xl tracking-tight" : "text-base", "font-bold", theme.headingFont)}>
      {str(content, "logoText") || "Logo"}
    </p>
  );
}

function LegalLine({ content }: { content: Record<string, unknown> }) {
  return (
    <p className="border-t border-current/15 pt-4 text-center text-[11px] opacity-50">
      {str(content, "legalText")}
    </p>
  );
}

function LinkColumns({ columns, cols }: { columns: FooterColumn[]; cols: number }) {
  return (
    <Grid columns={Math.min(cols, Math.max(1, columns.length))} className="flex-2 gap-8">
      {columns.map((column, i) => (
        <nav key={i} aria-label={column.title || `Footer links ${i + 1}`} className="space-y-2">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-70">{column.title}</p>
          <ul className="space-y-1.5">
            {column.links.map((link) => (
              <li key={link} className="text-xs opacity-60">{link}</li>
            ))}
          </ul>
        </nav>
      ))}
    </Grid>
  );
}

function NewsletterBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="min-w-52 space-y-2">
      <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
        {str(content, "newsletterHeading") || "Newsletter"}
      </p>
      <div className="flex gap-1.5">
        <span className="flex h-8 flex-1 items-center rounded border border-current/25 bg-white/10 px-2 text-[11px] opacity-50">
          {str(content, "newsletterPlaceholder") || "Email"}
        </span>
        <WireButton label="Join" />
      </div>
    </div>
  );
}

// 01 — Link columns
export function FooterColumns({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <div className="space-y-8">
      <div className={cn("flex gap-10", device === "mobile" ? "flex-col" : "flex-wrap")}>
        <div className={cn("space-y-2", device !== "mobile" && "min-w-44 flex-1")}>
          <FooterLogo content={c} />
          <p className="max-w-52 text-xs opacity-60">{str(c, "tagline")}</p>
        </div>
        <LinkColumns columns={columns} cols={cols} />
      </div>
      <LegalLine content={c} />
    </div>
  );
}

// 02 — Simple centered
export function FooterSimple({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <FooterLogo content={c} />
      <p className="max-w-64 text-xs opacity-60">{str(c, "tagline")}</p>
      <p className="mt-3 text-[11px] opacity-50">{str(c, "legalText")}</p>
    </div>
  );
}

// 03 — With newsletter
export function FooterNewsletter({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <div className="space-y-8">
      <div className={cn("flex gap-10", device === "mobile" ? "flex-col" : "flex-wrap")}>
        <div className={cn("space-y-2", device !== "mobile" && "min-w-44 flex-1")}>
          <FooterLogo content={c} />
          <p className="max-w-52 text-xs opacity-60">{str(c, "tagline")}</p>
        </div>
        <LinkColumns columns={columns} cols={cols} />
        <NewsletterBlock content={c} />
      </div>
      <LegalLine content={c} />
    </div>
  );
}

// 04 — Mega footer
export function FooterMega({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  const socials = itemsOf(c, "socials");
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <div className="space-y-8">
      <div className={cn("flex gap-10", device === "mobile" ? "flex-col" : "flex-wrap")}>
        <div className={cn("space-y-3", device !== "mobile" && "min-w-48 flex-1")}>
          <FooterLogo content={c} />
          <p className="max-w-52 text-xs opacity-60">{str(c, "tagline")}</p>
          <div className="space-y-1.5 pt-1 text-xs opacity-70">
            <p className="flex items-center gap-1.5">
              <Mail className="size-3" aria-hidden />
              {str(c, "contactEmail")}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="size-3" aria-hidden />
              {str(c, "contactPhone")}
            </p>
          </div>
        </div>
        <LinkColumns columns={columns} cols={cols} />
        <NewsletterBlock content={c} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-current/15 pt-4">
        <p className="text-[11px] opacity-50">{str(c, "legalText")}</p>
        <div className="flex gap-2">
          {socials.map((social, i) => (
            <span
              key={i}
              className="flex h-6 items-center rounded-full border border-current/25 px-2.5 text-[10px] opacity-60"
            >
              {String(social.label ?? "")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 05 — With closing CTA
export function FooterDarkCta({ section }: SectionComponentProps) {
  const { device, theme } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className={cn("text-3xl font-semibold", theme.headingFont)}>
          {str(c, "tagline") || "Ready to start? Let's talk."}
        </p>
        <WireButton label="Get in touch" />
      </div>
      <div
        className={cn(
          "flex items-center justify-between gap-6 border-t border-current/15 pt-5",
          device === "mobile" && "flex-col",
        )}
      >
        <FooterLogo content={c} />
        <ul className="flex flex-wrap justify-center gap-4">
          {columns.flatMap((column) => column.links).slice(0, 6).map((link) => (
            <li key={link} className="text-xs opacity-60">{link}</li>
          ))}
        </ul>
        <p className="text-[11px] opacity-50">{str(c, "legalText")}</p>
      </div>
    </div>
  );
}

// 06 — Editorial (oversized wordmark)
export function FooterEditorial({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  return (
    <div className="space-y-8">
      <FooterLogo content={c} size="xl" />
      <div
        className={cn(
          "flex items-center justify-between gap-6 border-t border-current/15 pt-5",
          device === "mobile" && "flex-col items-start",
        )}
      >
        <ul className="flex flex-wrap gap-5">
          {columns.flatMap((column) => column.links).slice(0, 6).map((link) => (
            <li key={link} className="text-xs opacity-70">{link}</li>
          ))}
        </ul>
        <p className="text-[11px] opacity-50">{str(c, "legalText")}</p>
      </div>
    </div>
  );
}

// 07 — Contact-first
export function FooterContact({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  const cols = effectiveColumns(device, 3, 1, true);
  return (
    <div className="space-y-8">
      <div className={cn("flex gap-10", device === "mobile" && "flex-col")}>
        <div className={cn("space-y-3", device !== "mobile" && "w-1/2")}>
          <FooterLogo content={c} />
          <p className="max-w-60 text-xs opacity-60">{str(c, "tagline")}</p>
          <div className="space-y-2 pt-2">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <Phone className="size-4 opacity-60" aria-hidden />
              {str(c, "contactPhone")}
            </p>
            <p className="flex items-center gap-2 text-sm opacity-80">
              <Mail className="size-4 opacity-60" aria-hidden />
              {str(c, "contactEmail")}
            </p>
          </div>
        </div>
        <div className={cn(device !== "mobile" && "w-1/2")}>
          <LinkColumns columns={columns} cols={cols} />
        </div>
      </div>
      <LegalLine content={c} />
    </div>
  );
}

// 08 — Minimal bar
export function FooterMinimal({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const columns = columnsOf(c);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6",
        device === "mobile" && "flex-col gap-3",
      )}
    >
      <FooterLogo content={c} />
      <ul className="flex flex-wrap justify-center gap-4">
        {columns.flatMap((column) => column.links).slice(0, 5).map((link) => (
          <li key={link} className="text-xs opacity-60">{link}</li>
        ))}
      </ul>
      <p className="text-[11px] opacity-50">{str(c, "legalText")}</p>
    </div>
  );
}
