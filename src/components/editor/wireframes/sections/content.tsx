"use client";

import { imageOf, itemsOf, str } from "@/lib/editor-utils";
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
  useWire,
  WireButton,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Introduction & content design variations (carried over from phase 3). */

function shownItems(section: SectionComponentProps["section"], key: string) {
  const items = itemsOf(section.content, key);
  const count = section.layout.itemCount;
  return count > 0 ? items.slice(0, count) : items;
}

// Brand introduction
export function ContentIntro({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <Heading text={str(c, "heading")} path="heading" size="lg" />
      <Para
        text={str(c, "description")}
        className={section.layout.alignment === "center" ? "max-w-lg" : "max-w-xl"}
      />
      <ButtonRow
        primary={str(c, "buttonLabel")}
        primaryPath="buttonLabel"
        center={section.layout.alignment === "center"}
      />
    </div>
  );
}

// Image & text
export function ContentImageText({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stacked = device === "mobile";
  const imageFirst = stacked
    ? section.layout.mobileStacking === "reverse"
    : section.layout.imagePosition !== "right";
  const media = (
    <div className={stacked ? "w-full" : "w-1/2"}>
      <ImagePh image={imageOf(c, "image")} label="Image" />
    </div>
  );
  return (
    <div className={cn("flex items-center gap-10", stacked && "flex-col gap-6")}>
      {imageFirst && media}
      <div className={cn("flex flex-col gap-4", stacked ? "w-full" : "w-1/2")}>
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="lg" />
        <Para text={str(c, "description")} path="description" />
        <ButtonRow primary={str(c, "buttonLabel")} primaryPath="buttonLabel" />
      </div>
      {!imageFirst && media}
    </div>
  );
}

// Mission statement
export function ContentStatement({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-5", alignClass(section.layout.alignment))}>
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <p className="text-2xl leading-snug font-medium">
        {str(c, "heading") || <Bar width="80%" className="h-5" />}
      </p>
      {str(c, "attribution") && (
        <p className="text-sm tracking-wide uppercase opacity-60">— {str(c, "attribution")}</p>
      )}
    </div>
  );
}

// Company values
export function ContentValues({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  const items = shownItems(section, "items");
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        description={str(c, "description")}
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

// Statistics section
export function ContentStats({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const stats = shownItems(section, "stats");
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <Grid columns={Math.min(cols, Math.max(1, stats.length))}>
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1 text-center">
            <p className="text-3xl font-bold">{String(stat.value ?? "")}</p>
            <p className="text-xs opacity-60">{String(stat.label ?? "")}</p>
          </div>
        ))}
      </Grid>
    </>
  );
}

// Blog cards
export function ContentBlog({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const posts = shownItems(section, "posts");
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
          <Heading text={str(c, "heading")} path="heading" size="md" />
        </div>
        {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" path="buttonLabel" />}
      </div>
      <Grid columns={cols}>
        {posts.map((post, i) => (
          <div key={i} className="flex flex-col gap-2">
            <ImagePh ratio="aspect-[3/2]" />
            <p className="text-[11px] font-semibold tracking-wide uppercase opacity-50">
              {String(post.category ?? "")}
            </p>
            <p className="text-sm font-semibold">{String(post.title ?? "")}</p>
          </div>
        ))}
      </Grid>
    </>
  );
}

// Team grid
export function ContentTeam({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const people = shownItems(section, "people");
  const cols = effectiveColumns(device, section.layout.columns, 2, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <Grid columns={cols}>
        {people.map((person, i) => (
          <div key={i} className={cn("flex flex-col gap-2", alignClass(section.layout.alignment))}>
            <ImagePh ratio="aspect-square" label="Photo" />
            <p className="text-sm font-semibold">{String(person.name ?? "")}</p>
            <p className="text-xs opacity-60">{String(person.role ?? "")}</p>
          </div>
        ))}
      </Grid>
    </>
  );
}

// ---------------------------------------------------------------------------
// Design-path additions
// ---------------------------------------------------------------------------

// Bento feature grid — one hero tile + supporting tiles (SaaS, dark/tech).
export function ContentBento({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  const items = shownItems(section, "items");
  const [first, ...rest] = items.length > 0 ? items : [{ title: "", description: "" }];
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          className={cn(
            "flex min-h-44 flex-col justify-end gap-2 border border-current/15 p-5 md:col-span-2 md:row-span-2",
            theme.cardRadius,
          )}
        >
          <ImagePh ratio="aspect-[16/7]" label="Feature visual" />
          <p className="text-base font-bold">{String(first?.title ?? "")}</p>
          <p className="text-xs opacity-60">{String(first?.description ?? "")}</p>
        </div>
        {rest.slice(0, 4).map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex min-h-24 flex-col gap-1.5 border border-current/15 p-4",
              theme.cardRadius,
            )}
          >
            <span className="size-5 rounded bg-current opacity-20" aria-hidden />
            <p className="text-sm font-semibold">{String(item.title ?? "")}</p>
            <p className="text-[11px] leading-snug opacity-60">
              {String(item.description ?? "")}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

// Comparison / spec table — labelled rows with check cells (SaaS, tech).
export function ContentSpecTable({ section }: SectionComponentProps) {
  const c = section.content;
  const items = shownItems(section, "items");
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <div className="overflow-hidden rounded-lg border border-current/15">
        <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-2 border-b border-current/15 bg-current/5 px-4 py-2.5">
          <span className="text-[11px] font-semibold tracking-wide uppercase opacity-60">
            Feature
          </span>
          <span className="text-center text-[11px] font-semibold tracking-wide uppercase opacity-60">
            Us
          </span>
          <span className="text-center text-[11px] font-semibold tracking-wide uppercase opacity-60">
            Others
          </span>
        </div>
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[2fr_1fr_1fr] items-center gap-2 px-4 py-3",
              i > 0 && "border-t border-current/10",
            )}
          >
            <div>
              <p className="text-sm font-medium">{String(item.title ?? "")}</p>
              {item.description ? (
                <p className="text-[11px] opacity-50">{String(item.description)}</p>
              ) : null}
            </div>
            <span className="mx-auto flex size-5 items-center justify-center rounded-full bg-current/80 text-[10px] font-bold text-white">
              ✓
            </span>
            <span className="mx-auto size-2 rounded-full bg-current opacity-20" aria-hidden />
          </div>
        ))}
      </div>
    </>
  );
}

// Oversized pull quote (editorial, minimal, luxury).
export function ContentQuote({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <figure className={cn("flex flex-col gap-5", alignClass(section.layout.alignment))}>
      <span className="text-6xl leading-none opacity-20" aria-hidden>
        “
      </span>
      <blockquote className="-mt-8 max-w-2xl">
        <Heading text={str(c, "description")} path="description" size="md" />
      </blockquote>
      <figcaption className="flex items-center gap-2 text-xs tracking-wide uppercase opacity-60">
        <span className="h-px w-8 bg-current" aria-hidden />
        {str(c, "attribution") || "Attribution"}
      </figcaption>
    </figure>
  );
}

// Lookbook gallery — varied-height image grid (luxury, portfolio, organic).
export function ContentGallery({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const items = shownItems(section, "items");
  const count = Math.max(items.length, 4);
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"];
  const cols = effectiveColumns(device, section.layout.columns || 4, 2, true);
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={i % 2 === 1 ? "mt-6" : undefined}>
            <ImagePh ratio={ratios[i % ratios.length]} label={String(items[i]?.title ?? "")} />
          </div>
        ))}
      </div>
    </>
  );
}

// Scroll story — pinned frames with motion annotations (animated path).
export function ContentScrollStory({ section }: SectionComponentProps) {
  const c = section.content;
  const items = shownItems(section, "items");
  const frames = items.length > 0 ? items.slice(0, 4) : [{}, {}, {}];
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <div className="space-y-3">
        {frames.map((item, i) => (
          <div
            key={i}
            className="flex items-stretch gap-4 rounded-lg border border-dashed border-current/25 p-4"
          >
            <div className="flex w-10 shrink-0 flex-col items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-current/80 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {i < frames.length - 1 && (
                <span className="w-px flex-1 bg-current opacity-20" aria-hidden />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">
                  {String(item.title ?? `Scroll frame ${i + 1}`)}
                </p>
                <span className="rounded-full border border-current/25 px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase opacity-60">
                  pins on scroll
                </span>
              </div>
              <p className="mt-1 max-w-md text-xs opacity-60">
                {String(item.description ?? "Content reveals as the visitor scrolls.")}
              </p>
            </div>
            <div className="hidden w-32 sm:block">
              <ImagePh ratio="aspect-video" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Code snippet block (dark/tech, developer products).
export function ContentCode({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const c = section.content;
  const widths = [70, 45, 85, 60, 30, 75, 50];
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
        <Heading text={str(c, "heading")} path="heading" size="md" />
        <Para text={str(c, "description")} className="max-w-md" />
        <ButtonRow primary={str(c, "buttonLabel")} primaryPath="buttonLabel" />
      </div>
      <div className={cn("overflow-hidden border border-current/20", theme.cardRadius)}>
        <div className="flex items-center gap-1.5 border-b border-current/15 bg-current/10 px-3 py-2">
          <span className="size-2 rounded-full bg-current opacity-30" aria-hidden />
          <span className="size-2 rounded-full bg-current opacity-30" aria-hidden />
          <span className="size-2 rounded-full bg-current opacity-30" aria-hidden />
          <span className="ml-2 font-mono text-[9px] opacity-50">example.ts</span>
        </div>
        <div className="space-y-2 bg-current/5 p-4 font-mono">
          {widths.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 text-right text-[9px] opacity-30">{i + 1}</span>
              <Bar width={`${w}%`} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blog / article-page additions
// ---------------------------------------------------------------------------

// Article header — category, title, byline, and the lead image.
export function ContentArticleHeader({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <Eyebrow text={str(c, "eyebrow")} path="eyebrow" />
      <Heading text={str(c, "heading")} path="heading" size="xl" className="max-w-3xl" />
      <Para text={str(c, "description")} className="max-w-2xl" />
      <div className="flex items-center gap-3 text-xs opacity-70">
        <span className="size-8 rounded-full bg-current/20" aria-hidden />
        <span className="font-semibold">{str(c, "attribution") || "Author name"}</span>
        <span aria-hidden>·</span>
        <span>8 min read</span>
      </div>
      <div className="mt-2 w-full">
        <ImagePh image={imageOf(c, "image")} ratio="aspect-[21/9]" label="Lead image" />
      </div>
    </div>
  );
}

// Article body — reading-width prose skeleton with a subhead and inline image.
export function ContentProse({ section }: SectionComponentProps) {
  const c = section.content;
  const paragraph = (widths: number[]) => (
    <div className="space-y-2.5">
      {widths.map((w, i) => (
        <Bar key={i} width={`${w}%`} className="h-2.5" />
      ))}
    </div>
  );
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      <Para text={str(c, "description")} className="text-base leading-7" />
      {paragraph([100, 96, 92, 60])}
      <Heading text={str(c, "heading") || "A section subheading"} path="heading" size="sm" />
      {paragraph([100, 94, 98, 88, 45])}
      <ImagePh image={imageOf(c, "image")} ratio="aspect-video" label="Inline image" />
      <p className="text-center text-[11px] opacity-50">Image caption goes here</p>
      {paragraph([98, 95, 70])}
    </div>
  );
}

// Author bio — closes an article with the person behind it.
export function ContentAuthor({ section }: SectionComponentProps) {
  const c = section.content;
  return (
    <div className="mx-auto flex max-w-2xl items-start gap-4 border-y border-current/10 py-6">
      <span className="size-14 shrink-0 rounded-full bg-current/15" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wide uppercase opacity-50">
          Written by
        </p>
        <p className="mt-0.5 text-sm font-bold">{str(c, "attribution") || "Author name"}</p>
        <Para text={str(c, "description")} className="mt-1 text-xs" />
      </div>
      <span className="ml-auto shrink-0 rounded-full border border-current/25 px-3 py-1 text-[10px] font-semibold">
        Follow
      </span>
    </div>
  );
}

// Post list — article rows with date and category, magazine-index style.
export function ContentPostList({ section }: SectionComponentProps) {
  const c = section.content;
  const posts = itemsOf(section.content, "posts");
  const rows = posts.length > 0 ? posts : Array.from({ length: 4 }, () => ({}));
  return (
    <>
      <HeadingBlock
        eyebrow={str(c, "eyebrow")}
        heading={str(c, "heading")}
        alignment={section.layout.alignment}
      />
      <div className="divide-y divide-current/10 border-y border-current/10">
        {rows.map((post, i) => (
          <div key={i} className="flex items-center gap-5 py-4">
            <span className="w-16 shrink-0 font-mono text-[10px] tracking-wide uppercase opacity-50">
              Jun {String(24 - i * 3).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {String((post as Record<string, unknown>).title ?? "Article headline goes here")}
              </p>
              <p className="mt-0.5 text-[11px] opacity-50">
                {String((post as Record<string, unknown>).category ?? "Category")}
              </p>
            </div>
            <span className="hidden w-24 shrink-0 sm:block">
              <ImagePh ratio="aspect-video" />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
