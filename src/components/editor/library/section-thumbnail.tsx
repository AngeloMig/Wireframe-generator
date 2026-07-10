"use client";

import type { SectionTemplate } from "@/types";
import { cn } from "@/utils/cn";

/**
 * Tiny schematic drawing of a section template for the library list.
 * Pure CSS shapes — enough to telegraph the section's structure.
 */
export function SectionThumbnail({ template }: { template: SectionTemplate }) {
  return (
    <div
      aria-hidden
      className="flex h-14 w-20 shrink-0 flex-col justify-center gap-1 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5"
    >
      <Sketch template={template} />
    </div>
  );
}

const line = (w: string, extra?: string) => (
  <div className={cn("h-1 rounded-full bg-slate-300", w, extra)} />
);
const block = (extra?: string) => <div className={cn("rounded-sm bg-slate-200", extra)} />;

function Sketch({ template }: { template: SectionTemplate }) {
  const id = template.id;

  if (template.category === "navigation") {
    if (id === "announcement-bar") {
      return <div className="mx-auto h-1.5 w-3/4 rounded-full bg-slate-700" />;
    }
    return (
      <div className="flex items-center justify-between">
        <div className="size-2 rounded-sm bg-slate-500" />
        <div className="flex gap-0.5">
          {line("w-2")}
          {line("w-2")}
          {line("w-2")}
        </div>
      </div>
    );
  }

  switch (id) {
    case "hero-split":
    case "image-text":
    case "hero-product":
      return (
        <div className="flex h-full items-center gap-1">
          <div className="flex flex-1 flex-col gap-1">
            {line("w-full", "bg-slate-500")}
            {line("w-3/4")}
            <div className="h-1.5 w-4 rounded-sm bg-slate-600" />
          </div>
          {block("h-full flex-1")}
        </div>
      );
    case "hero-fullwidth":
      return (
        <div className="relative h-full w-full rounded-sm bg-slate-300">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {line("w-1/2", "bg-white")}
            <div className="h-1.5 w-4 rounded-sm bg-white" />
          </div>
        </div>
      );
    case "hero-form":
    case "contact-form":
      return (
        <div className="flex h-full items-center gap-1">
          <div className="flex flex-1 flex-col gap-1">
            {line("w-full", "bg-slate-500")}
            {line("w-2/3")}
          </div>
          <div className="flex h-full flex-1 flex-col justify-center gap-0.5 rounded-sm border border-slate-300 p-0.5">
            {line("w-full")}
            {line("w-full")}
            <div className="h-1.5 w-3 rounded-sm bg-slate-600" />
          </div>
        </div>
      );
    case "hero-stats":
    case "stats-section":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          <div className="flex w-full justify-around">
            <span className="text-[8px] font-bold text-slate-500">12</span>
            <span className="text-[8px] font-bold text-slate-500">98%</span>
            <span className="text-[8px] font-bold text-slate-500">4.9</span>
          </div>
        </div>
      );
    case "mission-statement":
    case "testimonial-featured":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-3/4", "bg-slate-500")}
          {line("w-2/3", "bg-slate-500")}
          {line("w-1/4")}
        </div>
      );
    case "services-alternating":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {block("h-3 flex-1")}
            <div className="flex flex-1 flex-col justify-center gap-0.5">{line("w-full")}{line("w-2/3")}</div>
          </div>
          <div className="flex gap-1">
            <div className="flex flex-1 flex-col justify-center gap-0.5">{line("w-full")}{line("w-2/3")}</div>
            {block("h-3 flex-1")}
          </div>
        </div>
      );
    case "services-list":
      return (
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div className="size-1 rounded-full bg-slate-400" />
              {line("flex-1")}
            </div>
          ))}
        </div>
      );
    case "faq-accordion":
      return (
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-sm border border-slate-200 px-1 py-0.5">
              {line("w-2/3")}
              <span className="text-[7px] text-slate-400">▾</span>
            </div>
          ))}
        </div>
      );
    case "newsletter-signup":
      return (
        <div className="flex flex-col items-center gap-1">
          {line("w-1/2", "bg-slate-500")}
          <div className="flex w-3/4 gap-0.5">
            <div className="h-2 flex-1 rounded-sm border border-slate-300" />
            <div className="h-2 w-4 rounded-sm bg-slate-600" />
          </div>
        </div>
      );
    case "consultation-cta":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-sm bg-slate-700 p-1">
          {line("w-1/2", "bg-white")}
          <div className="h-1.5 w-4 rounded-sm bg-white" />
        </div>
      );
    case "logo-row":
      return (
        <div className="flex items-center justify-between gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-2.5 flex-1 rounded-sm border border-slate-200" />
          ))}
        </div>
      );
    case "footer-standard":
      return (
        <div className="flex h-full flex-col justify-end gap-1 rounded-sm bg-slate-700 p-1">
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col gap-0.5">
                <div className="h-0.5 w-full rounded-full bg-slate-400" />
                <div className="h-0.5 w-2/3 rounded-full bg-slate-500" />
                <div className="h-0.5 w-2/3 rounded-full bg-slate-500" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      break;
  }

  // Grid-of-cards default: centered heading + N columns.
  const cols = Math.min(template.defaultLayout.columns, 4) || 3;
  if (cols <= 1) {
    return (
      <div className="flex flex-col items-center gap-1">
        {line("w-1/2", "bg-slate-500")}
        {line("w-3/4")}
        {line("w-2/3")}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="mx-auto h-1 w-1/2 rounded-full bg-slate-500" />
      <div className="flex gap-1">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col gap-0.5">
            {block("h-2.5 w-full")}
            <div className="h-0.5 w-2/3 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
