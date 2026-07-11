"use client";

import { imageOf, itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  alignClass,
  ButtonRow,
  Eyebrow,
  Heading,
  ImagePh,
  Para,
  useWire,
  WireButton,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Call-to-action design variations. */

function CtaText({
  section,
  headingSize = "lg",
}: {
  section: SectionComponentProps["section"];
  headingSize?: "md" | "lg";
}) {
  const c = section.content;
  const center = section.layout.alignment === "center";
  return (
    <>
      <Eyebrow text={str(c, "eyebrow")} />
      <Heading text={str(c, "heading")} size={headingSize} />
      <Para text={str(c, "description")} className={center ? "max-w-lg" : "max-w-xl"} />
    </>
  );
}

// 01 — Centered band
export function CtaCentered({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <CtaText section={section} />
      <ButtonRow
        primary={str(c, "buttonLabel")}
        secondary={str(c, "secondaryButtonLabel")}
        center={section.layout.alignment === "center"}
      />
    </div>
  );
}

// 02 — Text + button split
export function CtaSplit({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  return (
    <div className={cn("flex items-center justify-between gap-8", stacked && "flex-col items-start gap-5")}>
      <div className="flex flex-col gap-2">
        <CtaText section={section} headingSize="md" />
      </div>
      <div className="shrink-0">
        <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} />
      </div>
    </div>
  );
}

// 03 + 04 — Newsletter (centered or split via layout.columns)
export function CtaNewsletter({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const split = section.layout.columns > 1 && device !== "mobile";

  const input = (
    <div className={cn("flex w-full max-w-sm gap-2", device === "mobile" && "flex-col")}>
      <span className="flex h-9 flex-1 items-center rounded border border-current/25 bg-white/80 px-3 text-xs text-slate-500">
        {str(c, "placeholder") || "Email address"}
      </span>
      <WireButton label={str(c, "buttonLabel") || "Subscribe"} />
    </div>
  );

  if (split) {
    return (
      <div className="flex items-center justify-between gap-10">
        <div className="flex flex-col gap-2">
          <Heading text={str(c, "heading")} size="md" />
          <Para text={str(c, "description")} className="max-w-md" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {input}
          {str(c, "note") && <p className="text-[11px] opacity-50">{str(c, "note")}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <Heading text={str(c, "heading")} size="md" />
      <Para text={str(c, "description")} className="max-w-md" />
      {input}
      {str(c, "note") && <p className="text-[11px] opacity-50">{str(c, "note")}</p>}
    </div>
  );
}

// 05 — Contact form with details
export function CtaContactForm({ section }: SectionComponentProps) {
  const { device, theme } = useWire();
  const c = section.content;
  const fields = itemsOf(c, "fields");
  const details = itemsOf(c, "details");
  const stacked = device === "mobile";

  return (
    <div className={cn("flex items-start gap-10", stacked && "flex-col gap-6")}>
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>
        <CtaText section={section} />
        <div className="mt-2 space-y-2">
          {details.map((detail, i) => (
            <p key={i} className="text-sm opacity-70">
              <span className="font-medium">{String(detail.label ?? "")}:</span>{" "}
              {String(detail.value ?? "")}
            </p>
          ))}
        </div>
      </div>
      <div className={cn(stacked ? "w-full" : "w-1/2")}>
        <div className={cn("border border-current/15 bg-white/90 p-5 text-slate-800", theme.cardRadius)}>
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
            <WireButton label={str(c, "buttonLabel") || "Send message"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 06 — With image
export function CtaImage({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  const imageFirst = !stacked && section.layout.imagePosition === "left";
  const media = (
    <div className={stacked ? "w-full" : "w-1/2"}>
      <ImagePh image={imageOf(c, "image")} ratio="aspect-[4/3]" label="Image" />
    </div>
  );
  return (
    <div className={cn("flex items-center gap-10", stacked && "flex-col gap-6")}>
      {imageFirst && media}
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>
        <CtaText section={section} />
        <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} />
      </div>
      {!imageFirst && media}
    </div>
  );
}

// 07 — Stat banner
export function CtaStatBanner({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  return (
    <div className={cn("flex items-center justify-between gap-6", stacked && "flex-col text-center")}>
      <div className={cn("flex flex-col gap-1", stacked && "items-center")}>
        <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
          {str(c, "eyebrow")}
        </p>
        <Heading text={str(c, "heading")} size="md" />
      </div>
      <WireButton label={str(c, "buttonLabel") || "Get started"} />
    </div>
  );
}

// 08 — Floating card
export function CtaCard({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  return (
    <div
      className={cn(
        "mx-auto flex max-w-xl flex-col items-center gap-4 border border-current/10 bg-white/95 p-10 text-center text-slate-800 shadow-lg",
        theme.cardRadius,
      )}
    >
      <CtaText section={section} />
      <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} center />
    </div>
  );
}
