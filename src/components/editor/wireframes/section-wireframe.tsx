"use client";

import {
  ChevronDown,
  Menu,
  Quote,
  Search,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import { imageOf, itemsOf, str } from "@/lib/editor-utils";
import type { PageSection, SectionLayoutSettings, SectionTemplate } from "@/types";
import { cn } from "@/utils/cn";
import {
  alignClass,
  Bar,
  ButtonRow,
  effectiveColumns,
  Eyebrow,
  Grid,
  Heading,
  HeadingBlock,
  ImagePh,
  Para,
  SectionFrame,
  useWire,
  WireButton,
  WireCard,
} from "./primitives";

/**
 * Realistic wireframe rendering for every section template. Falls back to a
 * generic card layout for unknown ids so new templates degrade gracefully.
 */

/** Variations tweak layout at render time so switching them is visible. */
const VARIATION_LAYOUT: Record<string, Partial<SectionLayoutSettings>> = {
  "image-left": { imagePosition: "left" },
  "image-right": { imagePosition: "right" },
  "product-left": { imagePosition: "left" },
  "start-right": { imagePosition: "right" },
  "left-overlay": { alignment: "left" },
  "left-aligned": { alignment: "left" },
  "two-column": { columns: 2 },
  "two-cards": { columns: 2 },
  "two-wide": { columns: 2 },
  "four-columns": { columns: 4 },
  "three-large": { columns: 3 },
  three: { columns: 3 },
  single: { columns: 1 },
  "single-column": { columns: 1 },
  vertical: { columns: 1 },
  simple: { columns: 1 },
  stacked: { alignment: "center" },
};

export function SectionWireframe({
  section,
  template,
}: {
  section: PageSection;
  template: SectionTemplate;
}) {
  const layout: SectionLayoutSettings = {
    ...section.layout,
    ...VARIATION_LAYOUT[section.variationId],
  };
  return (
    <SectionFrame section={section}>
      <SectionBody section={section} template={template} layout={layout} />
    </SectionFrame>
  );
}

function SectionBody({
  section,
  template,
  layout,
}: {
  section: PageSection;
  template: SectionTemplate;
  layout: SectionLayoutSettings;
}) {
  const { device } = useWire();
  const c = section.content;
  const cols = effectiveColumns(
    device,
    layout.columns,
    template.responsiveSettings.mobileColumns,
    template.responsiveSettings.stackOnMobile,
  );
  const items = itemsOf(c, "items");
  const shown = layout.itemCount > 0 ? items.slice(0, layout.itemCount) : items;

  switch (template.id) {
    // ----- Navigation -----------------------------------------------------
    case "announcement-bar":
      return (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span>{str(c, "message") || <Bar width={180} />}</span>
          {section.variationId === "with-link" && str(c, "linkLabel") && (
            <span className="font-medium underline underline-offset-2">
              {str(c, "linkLabel")}
            </span>
          )}
        </div>
      );
    case "header-standard":
    case "header-centered":
    case "header-ecommerce":
      return <HeaderWire section={section} kind={template.id} />;

    // ----- Heroes -----------------------------------------------------------
    case "hero-centered":
    case "brand-intro":
    case "consultation-cta":
      return (
        <div className={cn("flex flex-col gap-4", alignClass(layout.alignment))}>
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size={template.id === "hero-centered" ? "xl" : "lg"} />
          <Para
            text={str(c, "description")}
            className={layout.alignment === "center" ? "max-w-lg" : "max-w-xl"}
          />
          <ButtonRow
            primary={str(c, "buttonLabel")}
            secondary={str(c, "secondaryButtonLabel")}
            center={layout.alignment === "center"}
          />
          {(section.variationId === "with-image" || imageOf(c, "image")) &&
            template.id === "hero-centered" && (
              <ImagePh image={imageOf(c, "image")} ratio="aspect-[21/9]" className="mt-4 w-full" />
            )}
        </div>
      );
    case "hero-split":
    case "image-text":
      return (
        <Split layout={layout} image={<ImagePh image={imageOf(c, "image")} label="Image" />}>
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size={template.id === "hero-split" ? "xl" : "lg"} />
          <Para text={str(c, "description")} />
          <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} />
        </Split>
      );
    case "hero-fullwidth":
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
              alignClass(layout.alignment),
            )}
          >
            <Eyebrow text={str(c, "eyebrow")} />
            <Heading text={str(c, "heading")} size="xl" />
            <Para text={str(c, "description")} className="max-w-md" muted={false} />
            <ButtonRow primary={str(c, "buttonLabel")} center={layout.alignment === "center"} />
          </div>
        </div>
      );
    case "hero-product":
      return (
        <Split layout={layout} image={<ImagePh image={imageOf(c, "image")} ratio="aspect-square" label="Product image" />}>
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size="xl" />
          <Para text={str(c, "description")} />
          <p className="text-2xl font-semibold">{str(c, "price") || <Bar width={64} className="h-5" />}</p>
          <ButtonRow primary={str(c, "buttonLabel")} />
        </Split>
      );
    case "hero-form":
    case "contact-form":
      return (
        <Split layout={layout} image={<FormCard content={c} />}>
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size="lg" />
          <Para text={str(c, "description")} />
          {template.id === "contact-form" && (
            <div className="mt-2 space-y-2">
              {itemsOf(c, "details").map((detail, i) => (
                <p key={i} className="text-sm opacity-70">
                  <span className="font-medium">{String(detail.label ?? "")}:</span>{" "}
                  {String(detail.value ?? "")}
                </p>
              ))}
            </div>
          )}
        </Split>
      );
    case "hero-stats":
      return (
        <div className={cn("flex flex-col gap-4", alignClass(layout.alignment))}>
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size="xl" />
          <Para text={str(c, "description")} className="max-w-lg" />
          <ButtonRow primary={str(c, "buttonLabel")} center={layout.alignment === "center"} />
          <div className="mt-6 w-full">
            <StatRow items={itemsOf(c, "stats")} cols={effectiveColumns(device, 3, 1, true)} />
          </div>
        </div>
      );

    // ----- Content ----------------------------------------------------------
    case "mission-statement":
      return (
        <div className={cn("flex flex-col gap-5", alignClass(layout.alignment))}>
          <Eyebrow text={str(c, "eyebrow")} />
          <p className="text-2xl leading-snug font-medium">
            {str(c, "heading") || <Bar width="80%" className="h-5" />}
          </p>
          {str(c, "attribution") && (
            <p className="text-sm tracking-wide uppercase opacity-60">— {str(c, "attribution")}</p>
          )}
        </div>
      );
    case "stats-section":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <StatRow items={itemsOf(c, "stats")} cols={cols} />
        </>
      );
    case "company-values":
    case "product-benefits":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            description={str(c, "description")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className={cn("flex flex-col gap-2", alignClass(layout.alignment))}>
                <IconDot />
                <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
                <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );

    // ----- Services ---------------------------------------------------------
    case "services-cards":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            description={str(c, "description")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <WireCard key={i} className="flex flex-col gap-2.5">
                {section.variationId === "image-cards" ? (
                  <ImagePh ratio="aspect-[3/2]" />
                ) : (
                  <IconDot />
                )}
                <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
                <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
                {item.linkLabel ? (
                  <p className="text-xs font-medium underline underline-offset-2">
                    {String(item.linkLabel)}
                  </p>
                ) : null}
              </WireCard>
            ))}
          </Grid>
        </>
      );
    case "services-alternating":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <div className="space-y-10">
            {shown.map((item, i) => {
              const imageLeft = layout.imagePosition === "left" ? i % 2 === 0 : i % 2 === 1;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-8",
                    device === "mobile" && "flex-col",
                    device !== "mobile" && !imageLeft && "flex-row-reverse",
                  )}
                >
                  <ImagePh ratio="aspect-[4/3]" className={device === "mobile" ? "w-full" : "w-1/2"} />
                  <div className={cn("flex flex-col gap-2", device === "mobile" ? "w-full" : "w-1/2")}>
                    <p className="text-lg font-semibold">{String(item.title ?? "")}</p>
                    <p className="text-sm opacity-70">{String(item.description ?? "")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    case "services-list":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols} className="gap-3">
            {shown.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 border-b border-current/10 pb-2.5">
                <IconDot small />
                <p className="text-sm">{String(item.title ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );
    case "services-process":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            description={str(c, "description")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className={cn("flex flex-col gap-2", alignClass(layout.alignment))}>
                <NumberDot n={i + 1} />
                <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
                <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );

    // ----- Ecommerce ----------------------------------------------------------
    case "featured-products":
    case "product-grid":
    case "best-sellers":
      return (
        <>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className={cn("flex flex-col gap-2", alignClass(layout.alignment))}>
              <Eyebrow text={str(c, "eyebrow")} />
              <Heading text={str(c, "heading")} size="md" />
            </div>
            {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" />}
          </div>
          {section.variationId === "with-filters" && (
            <div className="mb-5 flex gap-2">
              {["Filter", "Sort", "Availability"].map((f) => (
                <span key={f} className="rounded-full border border-current/20 px-3 py-1 text-xs opacity-60">
                  {f} ▾
                </span>
              ))}
            </div>
          )}
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="relative">
                  <ImagePh ratio="aspect-square" />
                  {section.variationId === "default" && template.id === "best-sellers" && (
                    <span className="absolute top-2 left-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      #{i + 1}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{String(item.title ?? "")}</p>
                <p className="text-sm opacity-70">{String(item.price ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );
    case "collection-cards":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className="relative">
                <ImagePh ratio="aspect-[4/5]" />
                <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between rounded bg-white/85 px-3 py-2 text-slate-800">
                  <span className="text-sm font-semibold">{String(item.title ?? "")}</span>
                  <span className="text-xs">→</span>
                </div>
              </div>
            ))}
          </Grid>
        </>
      );

    // ----- Social proof --------------------------------------------------------
    case "testimonial-cards":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <WireCard key={i} className="flex flex-col gap-3">
                <Quote className="size-4 opacity-30" aria-hidden />
                <p className="text-sm leading-relaxed">{String(item.quote ?? "")}</p>
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200">
                    <UserRound className="size-3.5 opacity-50" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{String(item.author ?? "")}</p>
                    <p className="text-[11px] opacity-60">{String(item.role ?? "")}</p>
                  </div>
                </div>
              </WireCard>
            ))}
          </Grid>
        </>
      );
    case "testimonial-featured":
      return (
        <div className={cn("flex flex-col gap-4", alignClass(layout.alignment))}>
          <Quote className="size-6 opacity-30" aria-hidden />
          <p className="text-xl leading-snug font-medium">
            {str(c, "quote") || <Bar width="70%" className="h-5" />}
          </p>
          <div>
            <p className="text-sm font-semibold">{str(c, "author")}</p>
            <p className="text-xs opacity-60">{str(c, "role")}</p>
          </div>
        </div>
      );
    case "logo-row":
      return (
        <div className="flex flex-col items-center gap-6">
          {(section.variationId === "with-heading" || str(c, "heading")) && (
            <p className="text-xs font-medium tracking-wide uppercase opacity-50">
              {str(c, "heading")}
            </p>
          )}
          <Grid columns={cols} className="w-full gap-4">
            {shown.map((item, i) => (
              <div
                key={i}
                className="flex h-12 items-center justify-center rounded border border-current/10 text-xs font-medium opacity-40"
              >
                {String(item.name ?? "Logo")}
              </div>
            ))}
          </Grid>
        </div>
      );
    case "review-summary":
      return (
        <div className={cn("flex flex-col gap-6", alignClass(layout.alignment))}>
          <div className={cn("flex flex-col gap-1.5", alignClass(layout.alignment))}>
            <p className="text-4xl font-bold">{str(c, "rating")}</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              ))}
            </div>
            <p className="text-xs opacity-60">{str(c, "ratingLabel")}</p>
            <Heading text={str(c, "heading")} size="md" className="mt-2" />
          </div>
          <Grid columns={effectiveColumns(device, layout.columns, 1, true)} className="w-full">
            {shown.map((item, i) => (
              <WireCard key={i} className="flex flex-col gap-2">
                <p className="text-sm">{String(item.quote ?? "")}</p>
                <p className="text-xs font-medium opacity-60">{String(item.author ?? "")}</p>
              </WireCard>
            ))}
          </Grid>
        </div>
      );
    case "case-study-cards":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <WireCard key={i} flat className="flex flex-col gap-2.5">
                <ImagePh ratio="aspect-[3/2]" />
                <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
                <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
                {item.result ? (
                  <span className="w-fit rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {String(item.result)}
                  </span>
                ) : null}
              </WireCard>
            ))}
          </Grid>
        </>
      );

    // ----- Conversion & information ---------------------------------------------
    case "faq-accordion":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols} className="gap-3">
            {shown.map((item, i) => (
              <div key={i} className="rounded-lg border border-current/15 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{String(item.question ?? "")}</p>
                  <ChevronDown
                    className={cn("size-4 shrink-0 opacity-40", i === 0 && "rotate-180")}
                    aria-hidden
                  />
                </div>
                {i === 0 && <p className="mt-2 text-xs opacity-70">{String(item.answer ?? "")}</p>}
              </div>
            ))}
          </Grid>
        </>
      );
    case "newsletter-signup":
      return (
        <div className={cn("flex flex-col gap-4", alignClass(layout.alignment))}>
          <Heading text={str(c, "heading")} size="md" />
          <Para text={str(c, "description")} className="max-w-md" />
          <div className={cn("flex w-full max-w-sm gap-2", device === "mobile" && "flex-col")}>
            <span className="flex h-9 flex-1 items-center rounded border border-current/25 bg-white/80 px-3 text-xs text-slate-500">
              {str(c, "placeholder") || "Email address"}
            </span>
            <WireButton label={str(c, "buttonLabel") || "Subscribe"} />
          </div>
        </div>
      );
    case "blog-cards":
      return (
        <>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Eyebrow text={str(c, "eyebrow")} />
              <Heading text={str(c, "heading")} size="md" />
            </div>
            {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" />}
          </div>
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <ImagePh ratio="aspect-[3/2]" />
                <p className="text-[11px] font-semibold tracking-wide uppercase opacity-50">
                  {String(item.category ?? "")}
                </p>
                <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );
    case "team-grid":
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            alignment={layout.alignment}
          />
          <Grid columns={cols}>
            {shown.map((item, i) => (
              <div key={i} className={cn("flex flex-col gap-2", alignClass(layout.alignment))}>
                <ImagePh ratio="aspect-square" label="Photo" />
                <p className="text-sm font-semibold">{String(item.name ?? "")}</p>
                <p className="text-xs opacity-60">{String(item.role ?? "")}</p>
              </div>
            ))}
          </Grid>
        </>
      );

    // ----- Footer -------------------------------------------------------------
    case "footer-standard":
      return <FooterWire section={section} cols={cols} />;

    // ----- Fallback -------------------------------------------------------------
    default:
      return (
        <>
          <HeadingBlock
            eyebrow={str(c, "eyebrow")}
            heading={str(c, "heading")}
            description={str(c, "description")}
            alignment={layout.alignment}
          />
          {shown.length > 0 && (
            <Grid columns={cols}>
              {shown.map((item, i) => (
                <WireCard key={i} className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">{String(item.title ?? item.name ?? "")}</p>
                  <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
                </WireCard>
              ))}
            </Grid>
          )}
          <ButtonRow primary={str(c, "buttonLabel")} secondary={str(c, "secondaryButtonLabel")} />
        </>
      );
  }
}

// ---------------------------------------------------------------------------
// Compound pieces
// ---------------------------------------------------------------------------

function Split({
  layout,
  image,
  children,
}: {
  layout: SectionLayoutSettings;
  image: React.ReactNode;
  children: React.ReactNode;
}) {
  const { device } = useWire();
  const stacked = device === "mobile";
  const imageFirst = stacked
    ? layout.mobileStacking === "reverse"
    : layout.imagePosition === "left";
  return (
    <div className={cn("flex items-center gap-10", stacked && "flex-col gap-6")}>
      {imageFirst && <div className={stacked ? "w-full" : "w-1/2"}>{image}</div>}
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>{children}</div>
      {!imageFirst && <div className={stacked ? "w-full" : "w-1/2"}>{image}</div>}
    </div>
  );
}

function FormCard({ content }: { content: Record<string, unknown> }) {
  const { theme } = useWire();
  const fields = itemsOf(content, "fields");
  return (
    <div className={cn("border border-current/15 bg-white/90 p-5 text-slate-800", theme.cardRadius)}>
      {str(content, "formTitle") && (
        <p className="mb-3 text-sm font-semibold">{str(content, "formTitle")}</p>
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
        <WireButton label={str(content, "buttonLabel") || "Submit"} />
      </div>
    </div>
  );
}

function StatRow({ items, cols }: { items: Record<string, unknown>[]; cols: number }) {
  return (
    <Grid columns={Math.min(cols, Math.max(1, items.length))}>
      {items.map((stat, i) => (
        <div key={i} className="flex flex-col items-center gap-1 text-center">
          <p className="text-3xl font-bold">{String(stat.value ?? "")}</p>
          <p className="text-xs opacity-60">{String(stat.label ?? "")}</p>
        </div>
      ))}
    </Grid>
  );
}

function IconDot({ small }: { small?: boolean }) {
  const { styled, theme } = useWire();
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        small ? "size-5" : "size-9",
        !styled && "bg-slate-200",
      )}
      style={styled ? { backgroundColor: theme.accent + "33" } : undefined}
    >
      <span
        className={cn("rounded-full", small ? "size-1.5" : "size-2.5", !styled && "bg-slate-500")}
        style={styled ? { backgroundColor: theme.accent } : undefined}
      />
    </span>
  );
}

function NumberDot({ n }: { n: number }) {
  const { styled, theme } = useWire();
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
        !styled && "bg-slate-200 text-slate-600",
      )}
      style={styled ? { backgroundColor: theme.primary, color: "#fff" } : undefined}
    >
      {n}
    </span>
  );
}

function HeaderWire({
  section,
  kind,
}: {
  section: PageSection;
  kind: "header-standard" | "header-centered" | "header-ecommerce";
}) {
  const { device } = useWire();
  const c = section.content;
  const links = itemsOf(c, "links");
  const logo = (
    <span className="text-base font-bold tracking-tight">{str(c, "logoText") || "Logo"}</span>
  );

  if (device === "mobile") {
    return (
      <div className="flex items-center justify-between">
        <Menu className="size-5 opacity-70" aria-hidden />
        {logo}
        {kind === "header-ecommerce" ? (
          <ShoppingBag className="size-4.5 opacity-70" aria-hidden />
        ) : (
          <span className="size-5" />
        )}
      </div>
    );
  }

  const nav = (
    <nav className="flex items-center gap-5">
      {links.map((link, i) => (
        <span key={i} className="text-sm opacity-80">
          {String(link.label ?? "")}
        </span>
      ))}
    </nav>
  );

  if (kind === "header-centered") {
    if (section.variationId === "stacked") {
      return (
        <div className="flex flex-col items-center gap-3">
          {logo}
          {nav}
        </div>
      );
    }
    const mid = Math.ceil(links.length / 2);
    return (
      <div className="flex items-center justify-between">
        <nav className="flex flex-1 items-center gap-5">
          {links.slice(0, mid).map((link, i) => (
            <span key={i} className="text-sm opacity-80">{String(link.label ?? "")}</span>
          ))}
        </nav>
        {logo}
        <nav className="flex flex-1 items-center justify-end gap-5">
          {links.slice(mid).map((link, i) => (
            <span key={i} className="text-sm opacity-80">{String(link.label ?? "")}</span>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-6">
      {logo}
      {nav}
      <div className="flex items-center gap-3">
        {kind === "header-ecommerce" ? (
          <>
            {section.variationId !== "icons-only" && (
              <span className="flex h-8 w-40 items-center gap-2 rounded-full border border-current/20 px-3 text-xs opacity-50">
                <Search className="size-3.5" aria-hidden />
                Search
              </span>
            )}
            <UserRound className="size-4.5 opacity-60" aria-hidden />
            <ShoppingBag className="size-4.5 opacity-60" aria-hidden />
          </>
        ) : section.variationId === "with-cta" && str(c, "buttonLabel") ? (
          <WireButton label={str(c, "buttonLabel")} />
        ) : null}
      </div>
    </div>
  );
}

function FooterWire({ section, cols }: { section: PageSection; cols: number }) {
  const c = section.content;
  const columns = itemsOf(c, "columns");
  const simple = section.variationId === "simple";

  return (
    <div className="space-y-8">
      <div className={cn("flex gap-10", simple ? "flex-col items-center text-center" : "flex-wrap")}>
        <div className={cn("space-y-2", !simple && "min-w-44 flex-1")}>
          <p className="text-base font-bold">{str(c, "logoText") || "Logo"}</p>
          <p className="max-w-52 text-xs opacity-60">{str(c, "tagline")}</p>
        </div>
        {!simple && (
          <Grid columns={Math.min(cols, Math.max(1, columns.length))} className="flex-2 gap-8">
            {columns.map((column, i) => (
              <div key={i} className="space-y-2">
                <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
                  {String(column.title ?? "")}
                </p>
                {String(column.links ?? "")
                  .split(",")
                  .map((link) => link.trim())
                  .filter(Boolean)
                  .map((link) => (
                    <p key={link} className="text-xs opacity-60">
                      {link}
                    </p>
                  ))}
              </div>
            ))}
          </Grid>
        )}
        {section.variationId === "with-newsletter" && (
          <div className="min-w-52 space-y-2">
            <p className="text-xs font-semibold tracking-wide uppercase opacity-70">Newsletter</p>
            <div className="flex gap-1.5">
              <span className="h-8 flex-1 rounded border border-current/25 bg-white/10" />
              <WireButton label="Join" />
            </div>
          </div>
        )}
      </div>
      <p className="border-t border-current/15 pt-4 text-center text-[11px] opacity-50">
        {str(c, "legalText")}
      </p>
    </div>
  );
}
