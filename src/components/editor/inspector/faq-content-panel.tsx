"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import type { PageSection } from "@/types";
import { createId } from "@/utils/id";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { RepeaterButton } from "./content-tab";
import type { SectionMutator } from "./inspector-types";

/**
 * Bespoke content panel for FAQ sections: heading fields, category
 * management (create/rename/remove), questions with category assignment
 * (add/edit/duplicate/reorder/remove), CTA, and search placeholder — shown
 * according to what the current design displays.
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

export function FaqContentPanel({
  section,
  contentKeys,
  onChange,
}: {
  section: PageSection;
  contentKeys?: string[];
  onChange: SectionMutator;
}) {
  const keys = new Set(contentKeys ?? []);
  const has = (key: string) => !contentKeys || keys.has(key);
  const c = section.content;

  const questions: FaqQuestion[] = (Array.isArray(c.questions) ? c.questions : [])
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q) => ({
      question: String(q.question ?? ""),
      answer: String(q.answer ?? ""),
      categoryId: String(q.categoryId ?? ""),
    }));

  const categories: FaqCategory[] = (Array.isArray(c.categories) ? c.categories : [])
    .filter((cat): cat is Record<string, unknown> => typeof cat === "object" && cat !== null)
    .map((cat, i) => ({
      id: String(cat.id ?? `cat-${i}`),
      name: String(cat.name ?? `Category ${i + 1}`),
    }));

  const setContent = (patch: Record<string, unknown>, editKey?: string) =>
    onChange((s) => ({ ...s, content: { ...s.content, ...patch } }), editKey);

  const setText = (key: string, value: string) =>
    setContent({ [key]: value }, `content:${section.id}:${key}`);

  const setQuestions = (next: FaqQuestion[], editKey?: string) =>
    setContent({ questions: next }, editKey);

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
  };

  return (
    <div className="space-y-4 p-4">
      {has("eyebrow") && (
        <TextField label="Eyebrow" value={String(c.eyebrow ?? "")} onSet={(v) => setText("eyebrow", v)} />
      )}
      {has("heading") && (
        <TextField label="Heading" value={String(c.heading ?? "")} onSet={(v) => setText("heading", v)} />
      )}
      {has("description") && (
        <TextField
          label="Description"
          textarea
          value={String(c.description ?? "")}
          onSet={(v) => setText("description", v)}
        />
      )}
      {has("searchPlaceholder") && (
        <TextField
          label="Search placeholder"
          value={String(c.searchPlaceholder ?? "")}
          onSet={(v) => setText("searchPlaceholder", v)}
        />
      )}

      {has("categories") && (
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-medium text-slate-700">
            Categories ({categories.length})
          </legend>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <Input
                  aria-label={`Category ${index + 1} name`}
                  value={category.name}
                  onChange={(e) =>
                    setContent(
                      {
                        categories: categories.map((cat, i) =>
                          i === index ? { ...cat, name: e.target.value } : cat,
                        ),
                      },
                      `content:${section.id}:categories.${index}`,
                    )
                  }
                  className="h-8 flex-1 text-xs"
                />
                <RepeaterButton
                  label={`Remove category ${category.name}`}
                  destructive
                  onClick={() =>
                    // Removing a category unassigns its questions.
                    setContent({
                      categories: categories.filter((_, i) => i !== index),
                      questions: questions.map((q) =>
                        q.categoryId === category.id ? { ...q, categoryId: "" } : q,
                      ),
                    })
                  }
                >
                  <Trash2 className="size-3" aria-hidden />
                </RepeaterButton>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={categories.length >= 6}
              onClick={() =>
                setContent({
                  categories: [...categories, { id: createId(), name: "New category" }],
                })
              }
            >
              <Plus className="size-3.5" aria-hidden />
              Add category
            </Button>
          </div>
        </fieldset>
      )}

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-700">
          Questions ({questions.length})
        </legend>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Question {index + 1}
                </span>
                <div className="flex gap-0.5">
                  <RepeaterButton
                    label={`Move question ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveQuestion(index, -1)}
                  >
                    <ArrowUp className="size-3" aria-hidden />
                  </RepeaterButton>
                  <RepeaterButton
                    label={`Move question ${index + 1} down`}
                    disabled={index === questions.length - 1}
                    onClick={() => moveQuestion(index, 1)}
                  >
                    <ArrowDown className="size-3" aria-hidden />
                  </RepeaterButton>
                  <RepeaterButton
                    label={`Duplicate question ${index + 1}`}
                    disabled={questions.length >= 16}
                    onClick={() => {
                      const next = [...questions];
                      next.splice(index + 1, 0, { ...question });
                      setQuestions(next);
                    }}
                  >
                    <Copy className="size-3" aria-hidden />
                  </RepeaterButton>
                  <RepeaterButton
                    label={`Remove question ${index + 1}`}
                    destructive
                    onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </RepeaterButton>
                </div>
              </div>
              <div className="space-y-2">
                <TextField
                  compact
                  label="Question"
                  value={question.question}
                  onSet={(v) =>
                    setQuestions(
                      questions.map((q, i) => (i === index ? { ...q, question: v } : q)),
                      `content:${section.id}:questions.${index}.question`,
                    )
                  }
                />
                <TextField
                  compact
                  textarea
                  label="Answer"
                  value={question.answer}
                  onSet={(v) =>
                    setQuestions(
                      questions.map((q, i) => (i === index ? { ...q, answer: v } : q)),
                      `content:${section.id}:questions.${index}.answer`,
                    )
                  }
                />
                {has("categories") && categories.length > 0 && (
                  <div>
                    <Label className="mb-1 text-xs">Category</Label>
                    <Select
                      aria-label={`Question ${index + 1} category`}
                      value={question.categoryId}
                      onChange={(e) =>
                        setQuestions(
                          questions.map((q, i) =>
                            i === index ? { ...q, categoryId: e.target.value } : q,
                          ),
                        )
                      }
                      className="h-8 text-xs"
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={questions.length >= 16}
            onClick={() =>
              setQuestions([
                ...questions,
                { question: "New question?", answer: "", categoryId: "" },
              ])
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Add question
          </Button>
        </div>
      </fieldset>

      {has("ctaHeading") && (
        <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-medium text-slate-700">Support CTA</legend>
          <TextField
            compact
            label="CTA heading"
            value={String(c.ctaHeading ?? "")}
            onSet={(v) => setText("ctaHeading", v)}
          />
          <TextField
            compact
            textarea
            label="CTA description"
            value={String(c.ctaDescription ?? "")}
            onSet={(v) => setText("ctaDescription", v)}
          />
          <TextField
            compact
            label="CTA button label"
            value={String(c.ctaButtonLabel ?? "")}
            onSet={(v) => setText("ctaButtonLabel", v)}
          />
          <TextField
            compact
            label="CTA button URL"
            value={String(c.ctaButtonUrl ?? "")}
            onSet={(v) => setText("ctaButtonUrl", v)}
          />
        </fieldset>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onSet,
  textarea,
  compact,
}: {
  label: string;
  value: string;
  onSet: (value: string) => void;
  textarea?: boolean;
  compact?: boolean;
}) {
  const labelClass = compact ? "mb-1 text-xs" : "mb-1.5 text-xs";
  return (
    <div>
      <Label className={labelClass}>{label}</Label>
      {textarea ? (
        <Textarea
          rows={compact ? 2 : 3}
          value={value}
          onChange={(e) => onSet(e.target.value)}
          className="text-xs"
          aria-label={label}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onSet(e.target.value)}
          className="h-8 text-xs"
          aria-label={label}
        />
      )}
    </div>
  );
}
