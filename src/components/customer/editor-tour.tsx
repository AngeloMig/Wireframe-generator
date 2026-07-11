"use client";

import { useCallback, useEffect, useState } from "react";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import { Button } from "@/components/ui/button";

interface TourStep {
  /** CSS selector of the element to spotlight. */
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="structure"]',
    title: "Your page at a glance",
    body: "Every section of this page is listed here. Click one to jump to it, drag to reorder, or use “Add section” to grow the page.",
  },
  {
    target: "[data-canvas-section]",
    title: "Click any text to edit it",
    body: "Headings, paragraphs, buttons — click and type right on the wireframe. Changes save automatically.",
  },
  {
    target: '[data-tour="inspector"]',
    title: "Fine-tune the selected section",
    body: "Choose a section and edit its words, swap its design, or leave a note for the agency here.",
  },
  {
    target: '[data-tour="submit"]',
    title: "Done? Send it in",
    body: "When the pages feel right, submit them for review. The agency gets notified and takes it from there.",
  },
];

const PADDING = 6;
const CARD_WIDTH = 288;

/**
 * First-run coach marks for the customer editor. Shows once (localStorage
 * flag); Skip or finishing dismisses it for good.
 */
export function EditorTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Mount once the editor has settled; never again after dismissal.
  useEffect(() => {
    if (readJson(STORAGE_KEYS.editorTourDone, false)) return;
    const timer = setTimeout(() => setStep(0), 900);
    return () => clearTimeout(timer);
  }, []);

  const finish = useCallback(() => {
    writeJson(STORAGE_KEYS.editorTourDone, true);
    setStep(null);
  }, []);

  // Measure the current step's target; skip steps whose target is missing.
  useEffect(() => {
    if (step === null) return;
    const el = document.querySelector(STEPS[step].target);
    if (!el) {
      if (step < STEPS.length - 1) setStep(step + 1);
      else finish();
      return;
    }
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, finish]);

  if (step === null || !rect) return null;
  const current = STEPS[step];

  // Card beside the spotlight: right of it when there's room, else left/below.
  const spaceRight = window.innerWidth - rect.right;
  const cardLeft =
    spaceRight > CARD_WIDTH + 24
      ? rect.right + 16
      : rect.left - CARD_WIDTH - 16 > 16
        ? rect.left - CARD_WIDTH - 16
        : Math.max(16, Math.min(rect.left, window.innerWidth - CARD_WIDTH - 16));
  const cardTop =
    spaceRight > CARD_WIDTH + 24 || rect.left - CARD_WIDTH - 16 > 16
      ? Math.max(16, Math.min(rect.top, window.innerHeight - 220))
      : Math.min(rect.bottom + 16, window.innerHeight - 220);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Editor introduction">
      {/* Dim everything except the spotlight target */}
      <div className="absolute inset-0 bg-slate-900/40" onClick={finish} aria-hidden />
      <div
        aria-hidden
        className="absolute rounded-lg ring-2 ring-white/90"
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
          boxShadow: "0 0 0 9999px rgb(26 26 26 / 0.4)",
        }}
      />
      <div
        className="absolute w-72 rounded-xl bg-white p-4 shadow-[var(--shadow-overlay)]"
        style={{ top: cardTop, left: cardLeft }}
      >
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
          {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-900">{current.title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{current.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Skip tour
          </button>
          <Button
            size="sm"
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
          >
            {step < STEPS.length - 1 ? "Next" : "Start editing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
