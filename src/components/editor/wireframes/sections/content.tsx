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
      <Eyebrow text={str(c, "eyebrow")} />
      <Heading text={str(c, "heading")} size="lg" />
      <Para
        text={str(c, "description")}
        className={section.layout.alignment === "center" ? "max-w-lg" : "max-w-xl"}
      />
      <ButtonRow
        primary={str(c, "buttonLabel")}
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
        <Eyebrow text={str(c, "eyebrow")} />
        <Heading text={str(c, "heading")} size="lg" />
        <Para text={str(c, "description")} />
        <ButtonRow primary={str(c, "buttonLabel")} />
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
      <Eyebrow text={str(c, "eyebrow")} />
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
          <Eyebrow text={str(c, "eyebrow")} />
          <Heading text={str(c, "heading")} size="md" />
        </div>
        {str(c, "buttonLabel") && <WireButton label={str(c, "buttonLabel")} kind="secondary" />}
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
