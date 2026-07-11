"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, LifeBuoy, Search } from "lucide-react";
import { itemsOf, str } from "@/lib/editor-utils";
import { cn } from "@/utils/cn";
import {
  effectiveColumns,
  Grid,
  HeadingBlock,
  Para,
  useWire,
  WireButton,
  WireCard,
  InlineText,
} from "../primitives";
import type { SectionComponentProps } from "../registry-types";

/**
 * FAQ design variations. Accordions, tabs, and search are real interactions
 * (aria-expanded, keyboard focusable) so customers can feel the behaviour.
 */

interface FaqQuestion {
  question: string;
  answer: string;
  categoryId: string;
}

interface FaqCategory {
  id: string;
  name: string;
}

function questionsOf(content: Record<string, unknown>): FaqQuestion[] {
  return itemsOf(content, "questions").map((item) => ({
    question: String(item.question ?? ""),
    answer: String(item.answer ?? ""),
    categoryId: String(item.categoryId ?? ""),
  }));
}

function categoriesOf(content: Record<string, unknown>): FaqCategory[] {
  return itemsOf(content, "categories").map((item, i) => ({
    id: String(item.id ?? `cat-${i}`),
    name: String(item.name ?? `Category ${i + 1}`),
  }));
}

function FaqHeader({ section }: { section: SectionComponentProps["section"] }) {
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

/** One expandable question. Fully keyboard accessible. */
function AccordionItem({
  question,
  answer,
  defaultOpen,
  flush,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
  flush?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const panelId = useId();
  return (
    <div
      className={cn(
        flush
          ? "border-b border-current/15"
          : "rounded-lg border border-current/15 px-4",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
          flush && "px-0",
        )}
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 opacity-40 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div id={panelId} hidden={!open} className={cn("pb-3 text-xs opacity-70", flush && "px-0")}>
        {answer}
      </div>
    </div>
  );
}

function AccordionList({
  questions,
  columns,
  flush,
}: {
  questions: FaqQuestion[];
  columns: number;
  flush?: boolean;
}) {
  const { device } = useWire();
  const cols = effectiveColumns(device, columns, 1, true);
  return (
    <Grid columns={cols} className="items-start gap-3">
      {Array.from({ length: cols }).map((_, col) => (
        <div key={col} className="space-y-3">
          {questions
            .filter((_, i) => i % cols === col)
            .map((q, i) => (
              <AccordionItem
                key={`${q.question}-${i}`}
                question={q.question}
                answer={q.answer}
                defaultOpen={col === 0 && i === 0}
                flush={flush}
              />
            ))}
        </div>
      ))}
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// 01 + 02 + 10 — Standard / two-column / dark accordion (shared component;
// columns and background come from the variation's layout/style defaults)
// ---------------------------------------------------------------------------

export function FaqAccordion({ section }: SectionComponentProps) {
  return (
    <>
      <FaqHeader section={section} />
      <AccordionList questions={questionsOf(section.content)} columns={section.layout.columns} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 03 — Sidebar categories (dropdown on mobile)
// ---------------------------------------------------------------------------

export function FaqSidebar({ section }: SectionComponentProps) {
  const { device } = useWire();
  const c = section.content;
  const categories = categoriesOf(c);
  const questions = questionsOf(c);
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");
  const active = categories.find((cat) => cat.id === activeId) ?? categories[0];
  const visible = active
    ? questions.filter((q) => !q.categoryId || q.categoryId === active.id)
    : questions;

  return (
    <>
      <FaqHeader section={section} />
      {device === "mobile" ? (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium opacity-60">Category</span>
            <select
              value={active?.id ?? ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setActiveId(e.target.value)}
              className="w-full rounded-lg border border-current/20 bg-white/90 px-3 py-2 text-sm text-slate-800"
              aria-label="FAQ category"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <AccordionList questions={visible} columns={1} />
        </div>
      ) : (
        <div className="flex items-start gap-8">
          <nav aria-label="FAQ categories" className="w-44 shrink-0">
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    aria-current={cat.id === active?.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveId(cat.id);
                    }}
                    className={cn(
                      "w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      cat.id === active?.id
                        ? "bg-current/10 font-semibold"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 flex-1">
            <AccordionList questions={visible} columns={1} />
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 04 — Tabbed categories
// ---------------------------------------------------------------------------

export function FaqTabs({ section }: SectionComponentProps) {
  const c = section.content;
  const categories = categoriesOf(c);
  const questions = questionsOf(c);
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");
  const active = categories.find((cat) => cat.id === activeId) ?? categories[0];
  const visible = active
    ? questions.filter((q) => !q.categoryId || q.categoryId === active.id)
    : questions;

  return (
    <>
      <FaqHeader section={section} />
      <div
        role="tablist"
        aria-label="FAQ categories"
        className="mb-5 flex flex-wrap justify-center gap-1.5"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={cat.id === active?.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveId(cat.id);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              cat.id === active?.id
                ? "border-current bg-current/10 font-semibold"
                : "border-current/20 opacity-70 hover:opacity-100",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <AccordionList questions={visible} columns={1} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 05 — FAQ cards (open answers in a grid)
// ---------------------------------------------------------------------------

export function FaqCards({ section }: SectionComponentProps) {
  const { device } = useWire();
  const questions = questionsOf(section.content);
  const cols = effectiveColumns(device, section.layout.columns, 1, true);
  return (
    <>
      <FaqHeader section={section} />
      <Grid columns={cols}>
        {questions.map((q, i) => (
          <WireCard key={i} className="flex flex-col gap-2">
            <InlineText text={q.question} path={`questions.${i}.question`} className="text-sm font-semibold" />
            <InlineText text={q.answer} path={`questions.${i}.answer`} className="text-xs opacity-70" />
          </WireCard>
        ))}
      </Grid>
    </>
  );
}

// ---------------------------------------------------------------------------
// 06 — Featured question + list
// ---------------------------------------------------------------------------

export function FaqFeatured({ section }: SectionComponentProps) {
  const questions = questionsOf(section.content);
  const [featured, ...rest] = questions;
  return (
    <>
      <FaqHeader section={section} />
      {featured && (
        <WireCard className="mb-5 flex flex-col gap-2 border-2">
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-50">
            Most asked
          </p>
          <p className="text-base font-semibold">{featured.question}</p>
          <p className="text-sm opacity-70">{featured.answer}</p>
        </WireCard>
      )}
      <AccordionList questions={rest} columns={1} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 07 — Searchable FAQ (filters locally)
// ---------------------------------------------------------------------------

export function FaqSearch({ section }: SectionComponentProps) {
  const c = section.content;
  const questions = questionsOf(c);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    );
  }, [query, questions]);

  return (
    <>
      <FaqHeader section={section} />
      <div className="relative mx-auto mb-5 max-w-md">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-40"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={str(c, "searchPlaceholder") || "Search questions…"}
          aria-label="Search questions"
          className="w-full rounded-full border border-current/20 bg-white/90 py-2.5 pr-4 pl-9 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      </div>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm opacity-60">
          No questions match “{query}”.
        </p>
      ) : (
        <AccordionList questions={visible} columns={1} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 08 — With contact / support CTA card
// ---------------------------------------------------------------------------

export function FaqContactCta({ section }: SectionComponentProps) {
  const { device, styled, theme } = useWire();
  const c = section.content;
  const questions = questionsOf(c);
  const stacked = device === "mobile";
  return (
    <>
      <FaqHeader section={section} />
      <div className={cn("flex items-start gap-8", stacked && "flex-col")}>
        <div className={cn("min-w-0 flex-1", stacked && "w-full")}>
          <AccordionList questions={questions} columns={1} />
        </div>
        <div
          className={cn(
            "flex shrink-0 flex-col gap-3 rounded-xl p-5 text-slate-800",
            stacked ? "w-full" : "w-64",
            !styled && "bg-slate-100",
          )}
          style={styled ? { backgroundColor: `${theme.primary}14` } : undefined}
        >
          <LifeBuoy className="size-6 opacity-50" aria-hidden />
          <p className="text-sm font-semibold">{str(c, "ctaHeading") || "Still have questions?"}</p>
          <Para text={str(c, "ctaDescription")} path="ctaDescription" className="text-xs" />
          <WireButton label={str(c, "ctaButtonLabel") || "Contact support"} path="ctaButtonLabel" />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 09 — Numbered editorial list
// ---------------------------------------------------------------------------

export function FaqNumbered({ section }: SectionComponentProps) {
  const { theme } = useWire();
  const questions = questionsOf(section.content);
  return (
    <>
      <FaqHeader section={section} />
      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-6">
            <span
              className={cn("text-4xl font-bold tabular-nums opacity-20", theme.headingFont)}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 border-b border-current/10 pb-6">
              <InlineText text={q.question} path={`questions.${i}.question`} className={cn("mb-2 text-lg font-semibold", theme.headingFont)} />
              <InlineText text={q.answer} path={`questions.${i}.answer`} className="text-sm leading-relaxed opacity-70" />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
