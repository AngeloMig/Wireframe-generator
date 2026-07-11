"use client";

import { Play } from "lucide-react";
import { imageOf, itemsOf, str } from "@/lib/editor-utils";
import type { SectionLayoutSettings } from "@/types";
import { cn } from "@/utils/cn";
import {
  alignClass,
  Bar,
  ButtonRow,
  effectiveColumns,
  Eyebrow,
  Grid,
  Heading,
  ImagePh,
  Para,
  useWire,
  WireButton,
  WireCard,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Hero design variations. */

function Split({
  layout,
  media,
  children,
}: {
  layout: SectionLayoutSettings;
  media: React.ReactNode;
  children: React.ReactNode;
}) {
  const { device } = useWire();
  const stacked = device === "mobile";
  const mediaFirst = stacked
    ? layout.mobileStacking === "reverse"
    : layout.imagePosition === "left";
  return (
    <div className={cn("flex items-center gap-10", stacked && "flex-col gap-6")}>
      {mediaFirst && <div className={stacked ? "w-full" : "w-1/2"}>{media}</div>}
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>{children}</div>
      {!mediaFirst && <div className={stacked ? "w-full" : "w-1/2"}>{media}</div>}
    </div>
  );
}

function HeroText({
  section,
  headingSize = "xl",
}: {
  section: SectionComponentProps["section"];
  headingSize?: "lg" | "xl";
}) {
  const c = section.content;
  const center = section.layout.alignment === "center";
  return (
    <>
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <Heading text={str(c, "heading")} path="heading" size={headingSize} />
      <Para text={str(c, "description")} path="description" className={center ? "max-w-lg" : "max-w-xl"} />
      <ButtonRow
        primary={str(c, "buttonLabel")}
        secondary={str(c, "secondaryButtonLabel")}
        primaryPath="buttonLabel"
        secondaryPath="secondaryButtonLabel"
        center={center}
      />
    </>
  );
}

// 01 — Centered
export function HeroCentered({ section }: SectionComponentProps) {
  const c = section.content;
  const image = imageOf(c, "image");
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <HeroText section={section} />
      {image && <ImagePh image={image} ratio="aspect-[21/9]" className="mt-4 w-full" />}
    </div>
  );
}

// 02 — Split image
export function HeroSplit({ section }: SectionComponentProps) {
  return (
    <Split
      layout={section.layout}
      media={<ImagePh image={imageOf(section.content, "image")} label="Hero image" />}
    >
      <HeroText section={section} />
    </Split>
  );
}

// 03 — Full-background image
export function HeroFullBg({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className="relative">
      <ImagePh
        image={imageOf(c, "image")}
        ratio="aspect-auto"
        className="absolute inset-0 h-full"
        label="Background image"
      />
      <div
        className={cn(
          "relative flex min-h-72 flex-col justify-center gap-4 p-12",
          alignClass(section.layout.alignment),
        )}
      >
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="xl" />
        <Para text={str(c, "description")} path="description" className="max-w-md" muted={false} />
        <ButtonRow
          primary={str(c, "buttonLabel")}
          primaryPath="buttonLabel"
          center={section.layout.alignment === "center"}
        />
      </div>
    </div>
  );
}

// 04 — With form
export function HeroForm({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  const fields = itemsOf(c, "fields");
  return (
    <Split
      layout={section.layout}
      media={
        <div className={cn("border border-current/15 bg-white/90 p-5 text-slate-800", theme.cardRadius)}>
          {str(c, "formTitle") && (
            <p className="mb-3 text-sm font-semibold">{str(c, "formTitle")}</p>
          )}
          <div className="space-y-2.5">
            {fields.map((field, i) => (
              <div key={i}>
                <p className="mb-1 text-[11px] font-medium opacity-60">{String(field.label ?? "")}</p>
                <div
                  className={cn(
                    "rounded border border-slate-300 bg-white",
                    String(field.label ?? "").toLowerCase() === "message" ? "h-14" : "h-8",
                  )}
                />
              </div>
            ))}
            <WireButton label={str(c, "buttonLabel") || "Submit"} path="buttonLabel" />
          </div>
        </div>
      }
    >
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <Heading text={str(c, "heading")} path="heading" size="lg" />
      <Para text={str(c, "description")} path="description" />
    </Split>
  );
}

// 05 — Product-focused
export function HeroProduct({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <Split
      layout={section.layout}
      media={<ImagePh image={imageOf(c, "image")} ratio="aspect-square" label="Product image" />}
    >
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <Heading text={str(c, "heading")} path="heading" size="xl" />
      <Para text={str(c, "description")} path="description" />
      <p className="text-2xl font-semibold">
        {str(c, "price") || <Bar width={64} className="h-5" />}
      </p>
      <ButtonRow primary={str(c, "buttonLabel")} primaryPath="buttonLabel" />
    </Split>
  );
}

// 06 — With statistics
export function HeroStats({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stats = itemsOf(c, "stats");
  const cols = effectiveColumns(device, Math.min(section.layout.columns, stats.length || 1), 1, true);
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <HeroText section={section} />
      <div className="mt-6 w-full">
        <Grid columns={cols}>
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <p className="text-3xl font-bold">{String(stat.value ?? "")}</p>
              <p className="text-xs opacity-60">{String(stat.label ?? "")}</p>
            </div>
          ))}
        </Grid>
      </div>
    </div>
  );
}

// 07 — With logo row
export function HeroLogos({ section }: SectionComponentProps) {
  const c = section.content;
  const logos = itemsOf(c, "logos");
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <HeroText section={section} />
      <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-current/10 pt-6">
        {logos.map((logo, i) => (
          <span key={i} className="text-xs font-semibold tracking-wide uppercase opacity-40">
            {String(logo.name ?? "Logo")}
          </span>
        ))}
      </div>
    </div>
  );
}

// 08 — Video
export function HeroVideo({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <HeroText section={section} />
      <div className="relative mt-4 w-full">
        <ImagePh ratio="aspect-video" className="w-full" label="Video" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-md">
            <Play className="ml-0.5 size-6 text-slate-700" aria-hidden />
          </span>
        </span>
        {str(c, "videoUrl") && (
          <span className="absolute bottom-2 left-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white">
            {str(c, "videoUrl")}
          </span>
        )}
      </div>
    </div>
  );
}

// 09 — Editorial text
export function HeroEditorial({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-6 py-6", alignClass(section.layout.alignment))}>
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      {str(c, "heading") ? (
        <h3 className={cn("max-w-3xl text-5xl leading-[1.08] font-semibold tracking-tight", theme.headingFont)}>
          {str(c, "heading")}
        </h3>
      ) : (
        <div className="w-full space-y-2.5">
          <Bar width="85%" className="h-7" />
          <Bar width="60%" className="h-7" />
        </div>
      )}
      <Para text={str(c, "description")} path="description" className="max-w-xl" />
      <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} primaryPath="buttonLabel" secondaryPath="secondaryButtonLabel" />
    </div>
  );
}

// 10 — With cards
export function HeroCards({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const items = itemsOf(c, "items");
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <HeroText section={section} />
      <div className="mt-6 w-full">
        <Grid columns={cols}>
          {items.map((item, i) => (
            <WireCard key={i} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
              <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
            </WireCard>
          ))}
        </Grid>
      </div>
    </div>
  );
}

// 11 — Ecommerce promotion
export function HeroPromo({ section }: SectionComponentProps) {
  const { styled, theme } = useWire();
  const c = section.content;
  return (
    <Split
      layout={section.layout}
      media={<ImagePh image={imageOf(c, "image")} ratio="aspect-[4/3]" label="Promotion image" />}
    >
      {str(c, "badge") && (
        <span
          className={cn(
            "w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase",
            !styled && "bg-slate-800 text-white",
          )}
          style={styled ? { backgroundColor: theme.accent, color: "#fff" } : undefined}
        >
          {str(c, "badge")}
        </span>
      )}
      <HeroText section={section} />
    </Split>
  );
}

// 12 — Minimal headline
export function HeroMinimal({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-6 py-8", alignClass(section.layout.alignment))}>
      {str(c, "heading") ? (
        <h3 className={cn("max-w-2xl text-5xl leading-[1.05] font-semibold tracking-tight", theme.headingFont)}>
          {str(c, "heading")}
        </h3>
      ) : (
        <Bar width="70%" className="h-8" />
      )}
      <ButtonRow
        primary={str(c, "buttonLabel")}
        primaryPath="buttonLabel"
        center={section.layout.alignment === "center"}
      />
    </div>
  );
}
