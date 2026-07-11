"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Quote, Star, UserRound } from "lucide-react";
import { itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  alignClass,
  Bar,
  effectiveColumns,
  Grid,
  Heading,
  HeadingBlock,
  useWire,
  WireCard,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/** Testimonial & social-proof design variations. */

interface TestimonialQuote {
  quote: string;
  author: string;
  role: string;
}

function quotesOf(content: Record<string, unknown>): TestimonialQuote[] {
  return itemsOf(content, "quotes").map((item) => ({
    quote: String(item.quote ?? ""),
    author: String(item.author ?? ""),
    role: String(item.role ?? ""),
  }));
}

function AuthorRow({ quote }: { quote: TestimonialQuote }) {
  return (
    <div className="mt-auto flex items-center gap-2 pt-1">
      <span className="flex size-7 items-center justify-center rounded-full bg-slate-200">
        <UserRound className="size-3.5 opacity-50" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold">{quote.author}</p>
        <p className="text-[11px] opacity-60">{quote.role}</p>
      </div>
    </div>
  );
}

function TestimonialHeader({ section }: { section: SectionComponentProps["section"] }) {
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

// 01 + 02 — Cards grid / two-column (columns come from layout)
export function TestiCards({ section }: SectionComponentProps) {
  const { device } = useWire();
  const quotes = quotesOf(section.content);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <TestimonialHeader section={section} />
      <Grid columns={cols}>
        {quotes.map((q, i) => (
          <WireCard key={i} className="flex flex-col gap-3">
            <Quote className="size-4 opacity-30" aria-hidden />
            <p className="text-sm leading-relaxed">{q.quote}</p>
            <AuthorRow quote={q} />
          </WireCard>
        ))}
      </Grid>
    </>
  );
}

// 03 + 08 — Featured quote / dark spotlight (background from style defaults)
export function TestiFeatured({ section }: SectionComponentProps) {
  const quotes = quotesOf(section.content);
  const featured = quotes[0];
  return (
    <div className={cn("flex flex-col gap-4", alignClass(section.layout.alignment))}>
      <Quote className="size-6 opacity-30" aria-hidden />
      <p className="text-xl leading-snug font-medium">
        {featured?.quote || <Bar width="70%" className="h-5" />}
      </p>
      <div>
        <p className="text-sm font-semibold">{featured?.author}</p>
        <p className="text-xs opacity-60">{featured?.role}</p>
      </div>
    </div>
  );
}

// 04 — Masonry wall (staggered column offsets)
export function TestiMasonry({ section }: SectionComponentProps) {
  const { device } = useWire();
  const quotes = quotesOf(section.content);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <TestimonialHeader section={section} />
      <Grid columns={cols} className="items-start">
        {Array.from({ length: cols }).map((_, col) => (
          <div key={col} className={cn("space-y-5", col % 2 === 1 && cols > 1 && "mt-8")}>
            {quotes
              .filter((_, i) => i % cols === col)
              .map((q, i) => (
                <WireCard key={i} className="flex flex-col gap-3">
                  <p className={cn("leading-relaxed", i % 2 === 0 ? "text-sm" : "text-base")}>
                    {q.quote}
                  </p>
                  <AuthorRow quote={q} />
                </WireCard>
              ))}
          </div>
        ))}
      </Grid>
    </>
  );
}

// 05 — Carousel (working previous/next)
export function TestiCarousel({ section }: SectionComponentProps) {
  const quotes = quotesOf(section.content);
  const [index, setIndex] = useState(0);
  const count = Math.max(1, quotes.length);
  const active = quotes[((index % count) + count) % count];

  const arrow = (dir: -1 | 1, label: string, Icon: typeof ChevronLeft) => (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        setIndex((i) => i + dir);
      }}
      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-current/20 opacity-60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );

  return (
    <>
      <TestimonialHeader section={section} />
      <div className="flex items-center gap-6">
        {arrow(-1, "Previous testimonial", ChevronLeft)}
        <div className="flex min-h-32 flex-1 flex-col items-center gap-3 text-center">
          <Quote className="size-5 opacity-30" aria-hidden />
          <p className="text-lg leading-snug font-medium">
            {active?.quote || <Bar width="60%" className="h-5" />}
          </p>
          <p className="text-xs font-semibold">
            {active?.author}
            {active?.role && <span className="font-normal opacity-60"> — {active.role}</span>}
          </p>
        </div>
        {arrow(1, "Next testimonial", ChevronRight)}
      </div>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
        {quotes.map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-1.5 rounded-full bg-current",
              i === ((index % count) + count) % count ? "opacity-70" : "opacity-20",
            )}
          />
        ))}
      </div>
    </>
  );
}

// 06 — Review summary
export function TestiReviewSummary({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const quotes = quotesOf(c);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <div className={cn("flex flex-col gap-6", alignClass(section.layout.alignment))}>
      <div className={cn("flex flex-col gap-1.5", alignClass(section.layout.alignment))}>
        <p className="text-4xl font-bold">{str(c, "rating")}</p>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          ))}
        </div>
        <p className="text-xs opacity-60">{str(c, "ratingLabel")}</p>
        <Heading text={str(c, "heading")} path="heading" size="md" className="mt-2" />
      </div>
      <Grid columns={cols} className="w-full">
        {quotes.map((q, i) => (
          <WireCard key={i} className="flex flex-col gap-2">
            <p className="text-sm">{q.quote}</p>
            <p className="text-xs font-medium opacity-60">{q.author}</p>
          </WireCard>
        ))}
      </Grid>
    </div>
  );
}

// 07 — Case study cards
export function TestiCaseStudies({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const caseStudies = itemsOf(section.content, "caseStudies");
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <TestimonialHeader section={section} />
      <Grid columns={cols}>
        {caseStudies.map((item, i) => (
          <WireCard key={i} flat className="flex flex-col gap-2.5">
            <div
              className={cn("flex aspect-[3/2] items-center justify-center", theme.cardRadius, !styled && "bg-slate-200")}
              style={styled ? { backgroundColor: `${theme.primary}1f` } : undefined}
            >
              <ImageIcon className="size-6 opacity-40" aria-hidden />
            </div>
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
}
