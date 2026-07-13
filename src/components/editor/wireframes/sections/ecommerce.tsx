"use client";

import { Star } from "lucide-react";
import { imageOf, itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  alignClass,
  Bar,
  effectiveColumns,
  Eyebrow,
  Grid,
  Heading,
  HeadingBlock,
  ImagePh,
  InlineText,
  Para,
  useWire,
  WireButton,
  WireCard,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Ecommerce design variations (carried over from phase 3). */

function shownItems(section: SectionComponentProps["section"]) {
  const items = itemsOf(section.content, "items");
  const count = section.layout.itemCount;
  return count > 0 ? items.slice(0, count) : items;
}

function ProductHeader({ section }: { section: SectionComponentProps["section"] }) {
  const c = section.content;
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className={cn("flex flex-col gap-2", alignClass(section.layout.alignment))}>
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="md" />
      </div>
      {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" path="buttonLabel" />}
    </div>
  );
}

function ProductGrid({
  section,
  withRank,
}: {
  section: SectionComponentProps["section"];
  withRank?: boolean;
}) {
  const { device } = useWire();
  const items = shownItems(section);
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <Grid columns={cols}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="relative">
            <ImagePh ratio="aspect-square" />
            {withRank && (
              <span className="absolute top-2 left-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                #{i + 1}
              </span>
            )}
          </div>
          <InlineText text={String(item.title ?? "")} path={`items.${i}.title`} className="text-sm font-medium" />
          <InlineText text={String(item.price ?? "")} path={`items.${i}.price`} className="text-sm opacity-70" />
        </div>
      ))}
    </Grid>
  );
}

// Featured products
export function EcomFeatured({ section }: SectionComponentProps) {
  return (
    <>
      <ProductHeader section={section} />
      <ProductGrid section={section} />
    </>
  );
}

// Product grid
export function EcomGrid({ section }: SectionComponentProps) {
  return (
    <>
      <ProductHeader section={section} />
      <ProductGrid section={section} />
    </>
  );
}

// Best sellers (rank badges)
export function EcomBestSellers({ section }: SectionComponentProps) {
  return (
    <>
      <ProductHeader section={section} />
      <ProductGrid section={section} withRank />
    </>
  );
}

// Collection cards
export function EcomCollections({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const items = shownItems(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <Grid columns={cols}>
        {items.map((item, i) => (
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
}

// Store benefits
export function EcomBenefits({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  const items = shownItems(section);
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <Grid columns={cols}>
        {items.map((item, i) => (
          <div key={i} className={cn("flex flex-col gap-2", alignClass(section.layout.alignment))}>
            <span
              className={cn("flex size-9 items-center justify-center rounded-full", !styled && "bg-slate-200")}
              style={styled ? { backgroundColor: theme.accent + "33" } : undefined}
            >
              <span
                className={cn("size-2.5 rounded-full", !styled && "bg-slate-500")}
                style={styled ? { backgroundColor: theme.accent } : undefined}
              />
            </span>
            <InlineText text={String(item.title ?? "")} path={`items.${i}.title`} className="text-sm font-semibold" />
            <InlineText text={String(item.description ?? "")} path={`items.${i}.description`} className="text-xs opacity-70" />
          </div>
        ))}
      </Grid>
    </>
  );
}

// ---------------------------------------------------------------------------
// Detail-page additions
// ---------------------------------------------------------------------------

// Product detail — thumbnail gallery, main image, and a buy box.
export function EcomProductDetail({ section }: SectionComponentProps) {
  const { device, theme } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  const variants = shownItems(section).slice(0, 3);
  return (
    <div className={cn("flex gap-10", stacked && "flex-col")}>
      {/* Gallery */}
      <div className={cn("flex gap-3", stacked ? "w-full" : "w-1/2")}>
        <div className="hidden w-14 shrink-0 flex-col gap-2 sm:flex">
          {[0, 1, 2, 3].map((i) => (
            <ImagePh key={i} ratio="aspect-square" className={i === 0 ? "ring-2 ring-current/60" : undefined} />
          ))}
        </div>
        <div className="flex-1">
          <ImagePh image={imageOf(c, "image")} ratio="aspect-[4/5]" label="Product image" />
        </div>
      </div>

      {/* Buy box */}
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="md" />
        <div className="flex items-center gap-3">
          <InlineText text={str(c, "price")} path="price" className="text-2xl font-bold" as="span" />
          <span className="rounded-full bg-current/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            In stock
          </span>
        </div>
        <Para text={str(c, "description")} className="max-w-md" />

        {/* Variant picker */}
        {variants.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide uppercase opacity-60">
              Options
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs",
                    i === 0 ? "border-current font-semibold" : "border-current/25 opacity-70",
                  )}
                >
                  {String(v.title ?? `Option ${i + 1}`)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className={cn("flex items-center gap-3 border border-current/25 px-3 py-2 text-xs", theme.buttonRadius)}>
            − <span className="w-4 text-center font-semibold">1</span> +
          </span>
          <span className="flex-1"><WireButton label={str(c, "buttonLabel") || "Add to cart"} path="buttonLabel" /></span>
        </div>

        {/* Detail accordions */}
        <div className="mt-2 divide-y divide-current/10 border-y border-current/10">
          {["Details & materials", "Shipping & returns", "Care"].map((label) => (
            <div key={label} className="flex items-center justify-between py-2.5 text-xs font-medium">
              {label}
              <span className="opacity-40">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Collection browser — filter rail beside a product grid.
export function EcomFilterGrid({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const items = shownItems(section);
  const products: Record<string, unknown>[] =
    items.length > 0 ? items : Array.from({ length: 6 }, () => ({}));
  const stacked = device !== "desktop";
  const cols = stacked ? 2 : 3;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
          <Heading text={str(c, "heading")} path="heading" size="md" />
        </div>
        <span className="rounded-md border border-current/25 px-3 py-1.5 text-[11px] opacity-70">
          Sort: Featured ▾
        </span>
      </div>
      <div className={cn("flex gap-8", stacked && "flex-col")}>
        {/* Filter rail */}
        <aside className={cn("shrink-0", stacked ? "w-full" : "w-44")}>
          <div className={cn("gap-5", stacked ? "flex flex-wrap" : "flex flex-col")}>
            {["Category", "Price", "Colour", "Material"].map((group) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-semibold tracking-wide uppercase opacity-70">
                  {group}
                </p>
                <div className="space-y-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="size-3 rounded-sm border border-current/40" aria-hidden />
                      <Bar width={`${60 - i * 12}%`} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        {/* Grid */}
        <div className="grid flex-1 gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {products.map((item, i) => (
            <div key={i}>
              <ImagePh ratio="aspect-[4/5]" />
              <p className="mt-2 text-xs font-semibold">{String(item.title ?? "Product name")}</p>
              <p className="text-[11px] opacity-60">{String(item.price ?? "$0")}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Customer reviews — aggregate rating summary plus individual star reviews.
export function EcomReviews({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const reviews = shownItems(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <div className={cn("flex flex-col gap-6", alignClass(section.layout.alignment))}>
      <div className={cn("flex flex-col gap-1.5", alignClass(section.layout.alignment))}>
        <div className="flex items-center gap-2">
          <InlineText text={str(c, "rating")} path="rating" className="text-3xl font-bold" as="span" />
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            ))}
          </div>
        </div>
        <InlineText text={str(c, "ratingLabel")} path="ratingLabel" className="text-xs opacity-60" as="span" />
        <Heading text={str(c, "heading")} path="heading" size="md" className="mt-2" />
      </div>
      <Grid columns={cols} className="w-full">
        {reviews.map((review, i) => {
          const filled = Math.min(5, Math.max(0, Math.round(Number(review.rating) || 5)));
          return (
            <WireCard key={i} className="flex flex-col gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={cn("size-3.5", s < filled ? "fill-amber-400 text-amber-400" : "text-current/20")}
                    aria-hidden
                  />
                ))}
              </div>
              <InlineText text={String(review.description ?? "")} path={`items.${i}.description`} className="text-sm" />
              <InlineText text={String(review.title ?? "")} path={`items.${i}.title`} className="text-xs font-medium opacity-60" />
            </WireCard>
          );
        })}
      </Grid>
    </div>
  );
}

// Size & options — a compact buy box with size pills, quantity, and add to cart.
export function EcomVariantSelector({ section }: SectionComponentProps) {
  const { device, theme } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  const sizes = shownItems(section);
  return (
    <div className={cn("flex gap-10", stacked && "flex-col")}>
      <div className={cn(stacked ? "w-full" : "w-2/5")}>
        <ImagePh image={imageOf(c, "image")} ratio="aspect-square" label="Product image" />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="md" />
        <InlineText text={str(c, "price")} path="price" className="text-xl font-bold" as="span" />
        <Para text={str(c, "description")} className="max-w-md" />

        {sizes.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide uppercase opacity-60">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-xs",
                    i === 0 ? "border-current font-semibold" : "border-current/25 opacity-70",
                  )}
                >
                  {String(size.title ?? `Size ${i + 1}`)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className={cn("flex items-center gap-3 border border-current/25 px-3 py-2 text-xs", theme.buttonRadius)}>
            − <span className="w-4 text-center font-semibold">1</span> +
          </span>
          <span className="flex-1"><WireButton label={str(c, "buttonLabel") || "Add to cart"} path="buttonLabel" /></span>
        </div>
      </div>
    </div>
  );
}

// You may also like — a compact upsell row with quick-add controls.
export function EcomUpsell({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const items = shownItems(section);
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
        size="sm"
      />
      <Grid columns={cols}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <ImagePh ratio="aspect-square" className="w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <InlineText text={String(item.title ?? "")} path={`items.${i}.title`} className="truncate text-sm font-medium" />
              <InlineText text={String(item.price ?? "")} path={`items.${i}.price`} className="text-xs opacity-70" />
            </div>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-current/25 text-sm">
              +
            </span>
          </div>
        ))}
      </Grid>
    </>
  );
}
