"use client";

import { createContext, useContext } from "react";
import { ImageIcon } from "lucide-react";
import type { BrandTheme } from "@/lib/editor-utils";
import { colorsTooSimilar, needsLightText, tint, type ImageValue } from "@/lib/editor-utils";
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
  /**
   * Whether the nearest SectionFrame ancestor resolved to a dark background —
   * so a descendant drawing an inverse-fill badge (a solid dot using
   * `currentColor`) knows which way to invert instead of guessing.
   */
  sectionIsDark: boolean;
  /**
   * The nearest SectionFrame ancestor's actual resolved background color
   * (styled mode only) — lets a descendant check its own fixed brand color
   * against it, e.g. an outline button in theme.primary sitting on a
   * background that's also theme.primary ("brand" background type).
   */
  sectionBackgroundColor?: string;
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
  sectionIsDark: false,
});

export const WireProvider = Ctx.Provider;
export const useWire = () => useContext(Ctx);

// ---------------------------------------------------------------------------
// Inline text editing
// ---------------------------------------------------------------------------

export interface InlineEditContextValue {
  /** Commit an edited text value at a dot-path inside section.content. */
  onEdit: (path: string, value: string) => void;
}

/** Null when the surrounding section isn't editable (preview, locked, role). */
const EditCtx = createContext<InlineEditContextValue | null>(null);
export const InlineEditProvider = EditCtx.Provider;

/** Merge onto editable elements alongside the spread from useEditableText. */
export const EDITABLE_TEXT_CLASS =
  "-mx-0.5 cursor-text rounded-sm px-0.5 outline-none transition-shadow hover:ring-1 hover:ring-[#f5c000]/60 focus:ring-2 focus:ring-[#eab308]";

/**
 * Spread onto a text element to make it editable in place. Commits on blur;
 * Enter commits, Escape reverts. Uncontrolled while focused — React only
 * sees the value again once it lands in the store.
 */
export function useEditableText(
  path: string | undefined,
  current: string,
): React.HTMLAttributes<HTMLElement> | null {
  const edit = useContext(EditCtx);
  if (!edit || !path) return null;
  return {
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onBlur: (e) => {
      const value = (e.currentTarget.textContent ?? "").trim();
      if (value !== current) edit.onEdit(path, value);
    },
    onKeyDown: (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      } else if (e.key === "Escape") {
        e.currentTarget.textContent = current;
        e.currentTarget.blur();
      }
    },
    onPaste: (e) => {
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    },
    onClick: (e) => {
      // Let the click select the section, but never trigger links/buttons.
      e.preventDefault();
    },
  };
}

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
  const wire = useWire();
  const { styled, theme, device } = wire;
  const { style, layout } = section;

  let backgroundColor: string;
  if (styled && style.backgroundColor) backgroundColor = style.backgroundColor;
  else if (style.background === "dark") backgroundColor = styled ? theme.secondary : "#1e293b";
  else if (style.background === "brand") backgroundColor = styled ? theme.primary : "#cbd5e1";
  else if (style.background === "muted")
    backgroundColor = styled ? tint(theme.primary, 0.06) : "#f1f5f9";
  else if (style.background === "image") backgroundColor = styled ? "#334155" : "#94a3b8";
  else backgroundColor = "#ffffff";

  // Text color follows the background's own brightness, not the semantic
  // background name — a brand color light enough to defeat the "dark"/"brand"
  // assumption would otherwise still force white text onto a pale surface.
  // A custom textColor (styled mode only — wireframe mode never applies one)
  // overrides this below, so it doesn't need to factor into the fallback.
  const isDark = styled && style.textColor ? false : needsLightText(backgroundColor);

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
      <div
        className={cn("mx-auto w-full", device === "mobile" ? "px-[15px]" : "px-10")}
        style={{ maxWidth }}
      >
        <Ctx.Provider
          value={{
            ...wire,
            sectionIsDark: isDark,
            sectionBackgroundColor: styled ? backgroundColor : undefined,
          }}
        >
          {children}
        </Ctx.Provider>
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

/**
 * Click-to-fill affordance for empty text: an editable ghost showing a hint
 * via ::before so nothing phantom ever lands in the committed value. Only
 * rendered when inline editing is active — read-only views keep skeletons.
 */
export function GhostText({
  path,
  hint,
  className,
}: {
  path: string;
  hint: string;
  className?: string;
}) {
  const editable = useEditableText(path, "");
  if (!editable) return null;
  return (
    <span
      {...editable}
      data-placeholder={hint}
      className={cn(
        EDITABLE_TEXT_CLASS,
        "block min-w-24 empty:before:opacity-40 empty:before:content-[attr(data-placeholder)]",
        className,
      )}
    />
  );
}

/**
 * Free-form editable text for repeated items (card titles, quotes, FAQ
 * answers…) that don't fit the Heading/Para primitives. Renders nothing when
 * empty — item-level ghosts would make card grids noisy.
 */
export function InlineText({
  text,
  path,
  className,
  as: Tag = "p",
}: {
  text: string;
  path?: string;
  className?: string;
  as?: "p" | "span";
}) {
  const editable = useEditableText(path, text);
  if (!text) return null;
  return (
    <Tag {...editable} className={cn(className, editable && EDITABLE_TEXT_CLASS)}>
      {text}
    </Tag>
  );
}

export function Eyebrow({ text, path }: { text: string; path?: string }) {
  const { styled, theme } = useWire();
  const editable = useEditableText(path, text);
  if (!text) return null;
  return (
    <p
      {...editable}
      className={cn(
        "text-xs font-semibold tracking-widest uppercase opacity-80",
        editable && EDITABLE_TEXT_CLASS,
      )}
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
  path,
}: {
  text: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  path?: string;
}) {
  const { theme } = useWire();
  const editable = useEditableText(path, text);
  const sizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[size];
  if (!text) {
    if (path && editable) {
      return (
        <GhostText
          path={path}
          hint="Add a heading…"
          className={cn(sizeClass, "leading-tight font-semibold", theme.headingFont, className)}
        />
      );
    }
    return <Bar width="55%" className="h-5" />;
  }
  return (
    <h3
      {...editable}
      className={cn(
        sizeClass,
        "leading-tight font-semibold",
        theme.headingFont,
        editable && EDITABLE_TEXT_CLASS,
        className,
      )}
    >
      {text}
    </h3>
  );
}

export function Para({
  text,
  className,
  muted = true,
  path,
}: {
  text: string;
  className?: string;
  muted?: boolean;
  path?: string;
}) {
  const editable = useEditableText(path, text);
  if (!text) {
    if (path && editable) {
      return (
        <GhostText
          path={path}
          hint="Add a short description…"
          className={cn("text-sm leading-relaxed", muted && "opacity-70", className)}
        />
      );
    }
    return (
      <div className={cn("w-full space-y-1.5", className)}>
        <Bar width="90%" />
        <Bar width="70%" />
      </div>
    );
  }
  return (
    <p
      {...editable}
      className={cn(
        "text-sm leading-relaxed",
        muted && "opacity-70",
        editable && EDITABLE_TEXT_CLASS,
        className,
      )}
    >
      {text}
    </p>
  );
}

export function WireButton({
  label,
  kind = "primary",
  path,
}: {
  label: string;
  kind?: "primary" | "secondary";
  path?: string;
}) {
  const { styled, theme, sectionBackgroundColor } = useWire();
  const editable = useEditableText(path, label);
  if (!label) return null;
  if (styled) {
    // An outline button colored in the brand primary disappears if the
    // section it sits on is filled with that same primary (a "brand"
    // background) — fall back to whatever the section's own text already
    // uses, which is guaranteed to read against that specific background.
    const collides = sectionBackgroundColor && colorsTooSimilar(theme.primary, sectionBackgroundColor);
    const secondaryColor = collides
      ? (needsLightText(sectionBackgroundColor!) ? "#ffffff" : "#0f172a")
      : theme.primary;
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center px-4 text-sm font-medium",
          theme.buttonRadius,
          kind === "secondary" && "border",
        )}
        style={
          kind === "primary"
            ? { backgroundColor: theme.primary, color: needsLightText(theme.primary) ? "#ffffff" : "#0f172a" }
            : { borderColor: secondaryColor, color: secondaryColor }
        }
      >
        <span {...editable} className={cn(editable && EDITABLE_TEXT_CLASS)}>{label}</span>
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
      <span {...editable} className={cn(editable && EDITABLE_TEXT_CLASS)}>{label}</span>
    </span>
  );
}

export function ButtonRow({
  primary,
  secondary,
  center,
  primaryPath,
  secondaryPath,
}: {
  primary: string;
  secondary?: string;
  center?: boolean;
  primaryPath?: string;
  secondaryPath?: string;
}) {
  if (!primary && !secondary) return null;
  return (
    <div className={cn("flex flex-wrap gap-2.5", center && "justify-center")}>
      <WireButton label={primary} path={primaryPath} />
      {secondary && <WireButton label={secondary} kind="secondary" path={secondaryPath} />}
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
        "relative flex items-center justify-center overflow-hidden",
        ratio,
        theme.cardRadius,
        !styled && "bg-slate-100",
        className,
      )}
      style={styled ? { backgroundColor: tint(theme.primary, 0.12) } : undefined}
    >
      {/* Classic wireframe cross-hatch so placeholders read as intentional. */}
      {!styled && (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full text-slate-300"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div className="relative flex flex-col items-center gap-1 opacity-50">
        <span className={cn("rounded-full p-1.5", !styled && "bg-slate-100")}>
          <ImageIcon className="size-5" aria-hidden />
        </span>
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
  // Every caller stores these under the same content keys, so the block is
  // inline-editable by default.
  return (
    <div className={cn("mb-8 flex flex-col gap-2.5", ALIGN_CLASS[alignment])}>
      <Eyebrow text={eyebrow} path="eyebrow" />
      <Heading text={heading} size={size} path="heading" />
      {description ? (
        <Para
          text={description}
          path="description"
          className={alignment === "center" ? "max-w-lg" : "max-w-xl"}
        />
      ) : null}
    </div>
  );
}
