"use client";

import { itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  alignClass,
  effectiveColumns,
  Eyebrow,
  Grid,
  Heading,
  HeadingBlock,
  ImagePh,
  useWire,
  WireButton,
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
        <Eyebrow text={str(c, "eyebrow")} />
        <Heading text={str(c, "heading")} size="md" />
      </div>
      {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" />}
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
          <p className="text-sm font-medium">{String(item.title ?? "")}</p>
          <p className="text-sm opacity-70">{String(item.price ?? "")}</p>
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
            <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
            <p className="text-xs opacity-70">{String(item.description ?? "")}</p>
          </div>
        ))}
      </Grid>
    </>
  );
}
