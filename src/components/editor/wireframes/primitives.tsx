"use client";

import { createContext, useContext } from "react";
import { ImageIcon } from "lucide-react";
import type { BrandTheme } from "@/lib/editor-utils";
import { tint, type ImageValue } from "@/lib/editor-utils";
import type { DeviceKind } from "@/stores/editor-store";
import type { PageSection, SectionLayoutSettings } from "@/types";
import { cn } from "@/utils/cn";

/**
 * Shared building blocks for wireframe section rendering. Everything is
 * mode-aware: grayscale skeleton in wireframe mode, brand colors in styled
 * mode. Sizes are fixed px-ish because the canvas renders at a fixed device
 * width and is scaled with a CSS transform.
 */

export interface WireContext {
  styled: boolean;
  theme: BrandTheme;
  device: DeviceKind;
}

const Ctx = createContext<WireContext>({
  styled: false,
  theme: {
    primary: "#4f46e5",
    secondary: "#0f172a",
    accent: "#f59e0b",
    cardRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
    headingFont: "font-sans",
  },
  device: "desktop",
});

export const WireProvider = Ctx.Provider;
export const useWire = () => useContext(Ctx);

/** Columns to actually render at the current device width. */
export function effectiveColumns(
  device: DeviceKind,
  columns: number,
  mobileColumns: number,
  stackOnMobile: boolean,
): number {
  if (device === "mobile") return stackOnMobile ? Math.max(1, mobileColumns) : columns;
  if (device === "tablet") return Math.min(columns, 2);
  return Math.max(1, columns);
}

const CONTENT_WIDTHS: Record<SectionLayoutSettings["contentWidth"], number> = {
  narrow: 620,
  normal: 820,
  wide: 1080,
  full: 10_000,
};

/** Outer wrapper: applies background, spacing, border, and text color. */
export function SectionFrame({
  section,
  children,
  className,
}: {
  section: PageSection;
  children: React.ReactNode;
  className?: string;
}) {
  const { styled, theme } = useWire();
  const { style, layout } = section;

  const isDark =
    style.background === "dark" || (styled && style.background === "brand");

  let backgroundColor: string | undefined;
  if (styled && style.backgroundColor) backgroundColor = style.backgroundColor;
  else if (style.background === "dark") backgroundColor = styled ? theme.secondary : "#1e293b";
  else if (style.background === "brand") backgroundColor = styled ? theme.primary : "#cbd5e1";
  else if (style.background === "muted")
    backgroundColor = styled ? tint(theme.primary, 0.06) : "#f1f5f9";
  else if (style.background === "image") backgroundColor = styled ? "#334155" : "#94a3b8";
  else backgroundColor = "#ffffff";

  const paddingY = style.spacing === "compact" ? 24 : style.spacing === "spacious" ? 72 : 48;
  const maxWidth = CONTENT_WIDTHS[layout.contentWidth];

  return (
    <div
      className={cn(
        isDark ? "text-white" : "text-slate-800",
        style.border === "top" && "border-t border-slate-300",
        style.border === "bottom" && "border-b border-slate-300",
        style.border === "both" && "border-y border-slate-300",
        className,
      )}
      style={{
        backgroundColor,
        color: styled && style.textColor ? style.textColor : undefined,
        paddingTop: paddingY,
        paddingBottom: paddingY,
      }}
    >
      <div className="mx-auto w-full px-10" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

const ALIGN_CLASS = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
} as const;

export function alignClass(alignment: SectionLayoutSettings["alignment"]): string {
  return ALIGN_CLASS[alignment];
}

/** Skeleton bar used when a text field is empty. */
export function Bar({ width, className }: { width: number | string; className?: string }) {
  return (
    <div
      className={cn("h-3 rounded-full bg-current opacity-15", className)}
      style={{ width }}
    />
  );
}

export function Eyebrow({ text }: { text: string }) {
  const { styled, theme } = useWire();
  if (!text) return null;
  return (
    <p
      className="text-xs font-semibold tracking-widest uppercase opacity-80"
      style={styled ? { color: theme.accent } : undefined}
    >
      {text}
    </p>
  );
}

export function Heading({
  text,
  size = "lg",
  className,
}: {
  text: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const { theme } = useWire();
  const sizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[size];
  if (!text) return <Bar width="55%" className="h-5" />;
  return (
    <h3 className={cn(sizeClass, "leading-tight font-semibold", theme.headingFont, className)}>
      {text}
    </h3>
  );
}

export function Para({
  text,
  className,
  muted = true,
}: {
  text: string;
  className?: string;
  muted?: boolean;
}) {
  if (!text) {
    return (
      <div className={cn("w-full space-y-1.5", className)}>
        <Bar width="90%" />
        <Bar width="70%" />
      </div>
    );
  }
  return <p className={cn("text-sm leading-relaxed", muted && "opacity-70", className)}>{text}</p>;
}

export function WireButton({
  label,
  kind = "primary",
}: {
  label: string;
  kind?: "primary" | "secondary";
}) {
  const { styled, theme } = useWire();
  if (!label) return null;
  if (styled) {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center px-4 text-sm font-medium",
          theme.buttonRadius,
          kind === "secondary" && "border",
        )}
        style={
          kind === "primary"
            ? { backgroundColor: theme.primary, color: "#ffffff" }
            : { borderColor: theme.primary, color: theme.primary }
        }
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded px-4 text-sm font-medium",
        kind === "primary"
          ? "bg-slate-700 text-white"
          : "border border-current opacity-70",
      )}
    >
      {label}
    </span>
  );
}

export function ButtonRow({
  primary,
  secondary,
  center,
}: {
  primary: string;
  secondary?: string;
  center?: boolean;
}) {
  if (!primary && !secondary) return null;
  return (
    <div className={cn("flex flex-wrap gap-2.5", center && "justify-center")}>
      <WireButton label={primary} />
      {secondary && <WireButton label={secondary} kind="secondary" />}
    </div>
  );
}

/** Image placeholder or actual image when the customer set one. */
export function ImagePh({
  image,
  ratio = "aspect-[4/3]",
  className,
  label,
}: {
  image?: ImageValue | null;
  ratio?: string;
  className?: string;
  label?: string;
}) {
  const { styled, theme } = useWire();
  if (image?.url) {
    return (
      <div className={cn("overflow-hidden bg-slate-200", ratio, theme.cardRadius, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- customer-provided preview URLs */}
        <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        ratio,
        theme.cardRadius,
        !styled && "bg-slate-200",
        className,
      )}
      style={styled ? { backgroundColor: tint(theme.primary, 0.12) } : undefined}
    >
      <div className="flex flex-col items-center gap-1 opacity-40">
        <ImageIcon className="size-6" aria-hidden />
        {label && <span className="text-[10px] font-medium">{label}</span>}
      </div>
    </div>
  );
}

/** Card shell used by grid items. */
export function WireCard({
  children,
  className,
  flat,
}: {
  children: React.ReactNode;
  className?: string;
  flat?: boolean;
}) {
  const { theme } = useWire();
  return (
    <div
      className={cn(
        theme.cardRadius,
        !flat && "border border-current/15 bg-white/60 p-4 text-slate-800",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Grid({
  columns,
  children,
  className,
}: {
  columns: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-5", className)}
      style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

/** Standard heading block (eyebrow + heading + description) above grids. */
export function HeadingBlock({
  eyebrow,
  heading,
  description,
  alignment,
  size = "md",
}: {
  eyebrow: string;
  heading: string;
  description?: string;
  alignment: SectionLayoutSettings["alignment"];
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!eyebrow && !heading && !description) return null;
  return (
    <div className={cn("mb-8 flex flex-col gap-2.5", ALIGN_CLASS[alignment])}>
      <Eyebrow text={eyebrow} />
      <Heading text={heading} size={size} />
      {description ? (
        <Para text={description} className={alignment === "center" ? "max-w-lg" : "max-w-xl"} />
      ) : null}
    </div>
  );
}
