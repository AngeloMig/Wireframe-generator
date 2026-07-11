"use client";

import { itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  alignClass,
  effectiveColumns,
  Grid,
  HeadingBlock,
  ImagePh,
  useWire,
  WireButton,
  WireCard,
  InlineText,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Services design variations. */

interface ServiceItem {
  title: string;
  description: string;
  linkLabel: string;
  price: string;
}

function servicesOf(section: SectionComponentProps["section"]): ServiceItem[] {
  const items = itemsOf(section.content, "items").map((item) => ({
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    linkLabel: String(item.linkLabel ?? ""),
    price: String(item.price ?? ""),
  }));
  const count = section.layout.itemCount;
  return count > 0 ? items.slice(0, count) : items;
}

function ServicesHeader({ section }: { section: SectionComponentProps["section"] }) {
  const c = section.content;
  return (
    <HeadingBlock
      eyebrow={str(c, "eyebrow")}
      heading={str(c, "heading")}
      description={str(c, "description")}
      alignment={section.layout.alignment}
    />
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
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        !styled && "bg-slate-200 text-slate-600",
      )}
      style={styled ? { backgroundColor: theme.primary, color: "#fff" } : undefined}
    >
      {n}
    </span>
  );
}

// 01 + 02 — Icon cards / image cards
export function SvcCards({ section, variation }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  const withImages = variation.componentKey === "svc-image-cards";
  return (
    <>
      <ServicesHeader section={section} />
      <Grid columns={cols}>
        {items.map((item, i) => (
          <WireCard key={i} className="flex flex-col gap-2.5">
            {withImages ? <ImagePh ratio="aspect-[3/2]" /> : <IconDot />}
            <InlineText text={item.title} path={`items.${i}.title`} className="text-sm font-semibold" />
            <InlineText text={item.description} path={`items.${i}.description`} className="text-xs opacity-70" />
            {item.linkLabel && (
              <InlineText text={item.linkLabel} path={`items.${i}.linkLabel`} className="text-xs font-medium underline underline-offset-2" />
            )}
          </WireCard>
        ))}
      </Grid>
    </>
  );
}

// 03 — Alternating rows
export function SvcAlternating({ section }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  return (
    <>
      <ServicesHeader section={section} />
      <div className="space-y-10">
        {items.map((item, i) => {
          const imageLeft =
            section.layout.imagePosition === "left" ? i % 2 === 0 : i % 2 === 1;
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
                <InlineText text={item.title} path={`items.${i}.title`} className="text-lg font-semibold" />
                <InlineText text={item.description} path={`items.${i}.description`} className="text-sm opacity-70" />
                {item.linkLabel && (
                  <InlineText text={item.linkLabel} path={`items.${i}.linkLabel`} className="text-xs font-medium underline underline-offset-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// 04 — Compact list
export function SvcList({ section }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <ServicesHeader section={section} />
      <Grid columns={cols} className="gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 border-b border-current/10 pb-2.5">
            <IconDot small />
            <InlineText text={item.title} path={`items.${i}.title`} className="text-sm" />
          </div>
        ))}
      </Grid>
    </>
  );
}

// 05 — Process steps (horizontal)
export function SvcProcess({ section }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <ServicesHeader section={section} />
      <Grid columns={cols}>
        {items.map((item, i) => (
          <div key={i} className={cn("flex flex-col gap-2", alignClass(section.layout.alignment))}>
            <NumberDot n={i + 1} />
            <InlineText text={item.title} path={`items.${i}.title`} className="text-sm font-semibold" />
            <InlineText text={item.description} path={`items.${i}.description`} className="text-xs opacity-70" />
          </div>
        ))}
      </Grid>
    </>
  );
}

// 06 — Vertical timeline
export function SvcTimeline({ section }: SectionComponentProps) {
  const items = servicesOf(section);
  return (
    <>
      <ServicesHeader section={section} />
      <ol className="relative space-y-8 border-l border-current/15 pl-8">
        {items.map((item, i) => (
          <li key={i} className="relative">
            <span className="absolute top-0 -left-[3.05rem]">
              <NumberDot n={i + 1} />
            </span>
            <InlineText text={item.title} path={`items.${i}.title`} className="text-sm font-semibold" />
            <InlineText text={item.description} path={`items.${i}.description`} className="mt-1 text-xs opacity-70" />
          </li>
        ))}
      </ol>
    </>
  );
}

// 07 — Featured service + list
export function SvcFeatured({ section }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  const [featured, ...rest] = items;
  const stacked = device === "mobile";
  return (
    <>
      <ServicesHeader section={section} />
      <div className={cn("flex items-stretch gap-6", stacked && "flex-col")}>
        {featured && (
          <WireCard className={cn("flex flex-col gap-3 border-2 p-6", stacked ? "w-full" : "w-1/2")}>
            <IconDot />
            <p className="text-lg font-semibold">{featured.title}</p>
            <p className="text-sm opacity-70">{featured.description}</p>
            {featured.linkLabel && <WireButton label={featured.linkLabel} kind="secondary" />}
          </WireCard>
        )}
        <div className={cn("flex flex-col justify-center gap-4", stacked ? "w-full" : "w-1/2")}>
          {rest.map((item, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-current/10 pb-4">
              <IconDot small />
              <div>
                <InlineText text={item.title} path={`items.${i}.title`} className="text-sm font-semibold" />
                <InlineText text={item.description} path={`items.${i}.description`} className="text-xs opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// 08 — Simple pricing cards
export function SvcPricing({ section }: SectionComponentProps) {
  const { device } = useWire();
  const items = servicesOf(section);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <ServicesHeader section={section} />
      <Grid columns={cols}>
        {items.map((item, i) => (
          <WireCard key={i} className={cn("flex flex-col gap-2.5", i === 1 && "border-2")}>
            <InlineText text={item.title} path={`items.${i}.title`} className="text-sm font-semibold" />
            <InlineText text={item.price} path={`items.${i}.price`} className="text-2xl font-bold" />
            <InlineText text={item.description} path={`items.${i}.description`} className="text-xs opacity-70" />
            {item.linkLabel && (
              <div className="mt-auto pt-2">
                <WireButton label={item.linkLabel} kind={i === 1 ? "primary" : "secondary"} />
              </div>
            )}
          </WireCard>
        ))}
      </Grid>
    </>
  );
}
