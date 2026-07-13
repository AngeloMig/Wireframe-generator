"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, FolderOpen, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { effectiveContentSchema } from "@/data/section-schemas";
import { suggestCopy } from "@/lib/copy-suggestions";
import { imageOf } from "@/lib/editor-utils";
import { useProject } from "@/hooks/use-project";
import { toast } from "@/stores/ui-store";
import type {
  PageSection,
  SectionFieldDefinition,
  SectionTypeDefinition,
  SectionVariation,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AssetPickerDialog } from "./asset-picker-dialog";
import { FaqContentPanel } from "./faq-content-panel";
import type { SectionMutator } from "./inspector-types";

const MAX_IMAGE_BYTES = 800_000; // Keep data URLs small enough for localStorage.

/**
 * Content editing for the selected section. Fields load from the section
 * type's shared schema, filtered to the keys the current design displays.
 * FAQ gets a bespoke panel for category management and question assignment.
 */
export function ContentTab({
  section,
  definition,
  variation,
  onChange,
}: {
  section: PageSection;
  definition: SectionTypeDefinition;
  variation: SectionVariation | null;
  onChange: SectionMutator;
}) {
  if (section.sectionType === "faq") {
    return (
      <FaqContentPanel
        section={section}
        contentKeys={variation?.contentKeys}
        onChange={onChange}
      />
    );
  }

  const schema = effectiveContentSchema(definition, variation?.contentKeys);
  if (schema.length === 0) {
    return (
      <p className="p-4 text-xs text-slate-500">
        This section has no editable content fields.
      </p>
    );
  }

  const setValue = (key: string, value: unknown) =>
    onChange(
      (s) => ({ ...s, content: { ...s.content, [key]: value } }),
      `content:${section.id}:${key}`,
    );

  return (
    <div className="space-y-4 p-4">
      {schema.map((field) =>
        field.type === "repeater" ? (
          <RepeaterField
            key={field.key}
            field={field}
            section={section}
            onChange={onChange}
          />
        ) : field.type === "image" ? (
          <ImageField
            key={field.key}
            field={field}
            section={section}
            onSet={(value) => setValue(field.key, value)}
          />
        ) : (
          <ScalarFieldWithSuggestions
            key={field.key}
            field={field}
            section={section}
            value={section.content[field.key]}
            onSet={(value) => setValue(field.key, value)}
          />
        ),
      )}
    </div>
  );
}

/** Scalar field plus brief-derived copy suggestions when it's still empty. */
function ScalarFieldWithSuggestions({
  field,
  section,
  value,
  onSet,
}: {
  field: SectionFieldDefinition;
  section: PageSection;
  value: unknown;
  onSet: (value: unknown) => void;
}) {
  const { project } = useProject();
  const isEmpty = typeof value !== "string" || value.trim() === "";
  const suggestions =
    project && isEmpty && (field.type === "text" || field.type === "textarea")
      ? suggestCopy(project, section.sectionType, field.key)
      : [];

  return (
    <div>
      <ScalarField field={field} value={value} onSet={onSet} />
      {suggestions.length > 0 && (
        <div className="mt-1.5">
          <p className="mb-1 text-[11px] text-slate-400">From your project brief:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSet(suggestion)}
                className="max-w-full cursor-pointer truncate rounded-full border border-[#f2b90d]/40 bg-[#f7d34e]/20 px-2 py-0.5 text-left text-[11px] text-[#5c4600] transition-colors hover:bg-[#f7d34e]/35"
                title={suggestion}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ScalarField({
  field,
  value,
  onSet,
  compact,
}: {
  field: SectionFieldDefinition;
  value: unknown;
  onSet: (value: unknown) => void;
  compact?: boolean;
}) {
  const id = useId();
  const stringValue = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const labelClass = compact ? "mb-1 text-xs" : "mb-1.5 text-xs";

  if (field.type === "toggle") {
    return (
      <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onSet(e.target.checked)}
          className="size-4 rounded border-slate-300 accent-[#1a2028]"
        />
        {field.label}
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <div>
        <Label htmlFor={id} className={labelClass}>
          {field.label}
        </Label>
        <Textarea
          id={id}
          rows={compact ? 2 : 3}
          value={stringValue}
          placeholder={field.placeholder}
          onChange={(e) => onSet(e.target.value)}
          className="text-xs"
        />
      </div>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <div>
        <Label htmlFor={id} className={labelClass}>
          {field.label}
        </Label>
        <Select id={id} value={stringValue} onChange={(e) => onSet(e.target.value)} className="h-8 text-xs">
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id} className={labelClass}>
        {field.label}
      </Label>
      <Input
        id={id}
        type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
        value={stringValue}
        placeholder={field.placeholder}
        onChange={(e) =>
          onSet(field.type === "number" ? Number(e.target.value) : e.target.value)
        }
        className="h-8 text-xs"
      />
      {field.helpText && <p className="mt-1 text-[11px] text-slate-400">{field.helpText}</p>}
    </div>
  );
}

function ImageField({
  field,
  section,
  onSet,
}: {
  field: SectionFieldDefinition;
  section: PageSection;
  onSet: (value: { url: string; alt: string } | null) => void;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const image = imageOf(section.content, field.key);
  const { project } = useProject();
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasAssets = (project?.assets ?? []).some(
    (a) => a.kind === "image" || a.kind === "logo",
  );

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast("Image too large for the prototype", "error", "Use an image under ~800 KB or paste a URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSet({ url: reader.result, alt: image?.alt ?? "" });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-700">{field.label}</legend>
      {image ? (
        <div className="mb-2.5 overflow-hidden rounded-md border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
          <img src={image.url} alt={image.alt} className="h-24 w-full object-cover" />
        </div>
      ) : (
        <p className="mb-2.5 rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
          Using a placeholder — that&apos;s expected. Your agency adds final imagery
          during the design phase; anything you set here is a preview to convey intent.
        </p>
      )}
      <div className="space-y-2">
        <Input
          aria-label={`${field.label} URL`}
          type="url"
          placeholder="Paste an image URL…"
          value={image?.url.startsWith("data:") ? "" : (image?.url ?? "")}
          onChange={(e) =>
            onSet(e.target.value ? { url: e.target.value, alt: image?.alt ?? "" } : null)
          }
          className="h-8 text-xs"
        />
        <Input
          aria-label={`${field.label} alt text`}
          placeholder="Alt text (describes the image)"
          value={image?.alt ?? ""}
          onChange={(e) => image && onSet({ url: image.url, alt: e.target.value })}
          disabled={!image}
          className="h-8 text-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-3.5" aria-hidden />
            Upload
          </Button>
          {hasAssets && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <FolderOpen className="size-3.5" aria-hidden />
              Choose
            </Button>
          )}
          {image && (
            <Button variant="ghost" size="sm" onClick={() => onSet(null)}>
              <X className="size-3.5" aria-hidden />
              Use placeholder
            </Button>
          )}
        </div>
      </div>
      <AssetPickerDialog
        assets={project?.assets ?? []}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(asset) => onSet({ url: asset.url, alt: image?.alt || asset.name })}
      />
    </fieldset>
  );
}

function RepeaterField({
  field,
  section,
  onChange,
}: {
  field: SectionFieldDefinition;
  section: PageSection;
  onChange: SectionMutator;
}) {
  const raw = section.content[field.key];
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? raw.filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    : [];
  const max = field.maxItems ?? 12;

  const setItems = (next: Record<string, unknown>[], editKey?: string) =>
    onChange((s) => ({ ...s, content: { ...s.content, [field.key]: next } }), editKey);

  const emptyItem = () =>
    Object.fromEntries(
      (field.itemFields ?? []).map((f) => [
        f.key,
        f.type === "select" ? (f.options?.[0]?.value ?? "") : "",
      ]),
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-700">
        {field.label} ({items.length})
      </legend>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {field.itemLabel ?? "Item"} {index + 1}
              </span>
              <div className="flex gap-0.5">
                <RepeaterButton
                  label={`Move ${field.itemLabel ?? "item"} ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-3" aria-hidden />
                </RepeaterButton>
                <RepeaterButton
                  label={`Move ${field.itemLabel ?? "item"} ${index + 1} down`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-3" aria-hidden />
                </RepeaterButton>
                <RepeaterButton
                  label={`Duplicate ${field.itemLabel ?? "item"} ${index + 1}`}
                  disabled={items.length >= max}
                  onClick={() => {
                    const next = [...items];
                    next.splice(index + 1, 0, { ...item });
                    setItems(next);
                  }}
                >
                  <Copy className="size-3" aria-hidden />
                </RepeaterButton>
                <RepeaterButton
                  label={`Remove ${field.itemLabel ?? "item"} ${index + 1}`}
                  destructive
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-3" aria-hidden />
                </RepeaterButton>
              </div>
            </div>
            <div className="space-y-2">
              {(field.itemFields ?? []).map((itemField) => (
                <ScalarField
                  key={itemField.key}
                  compact
                  field={itemField}
                  value={item[itemField.key]}
                  onSet={(value) => {
                    const next = items.map((existing, i) =>
                      i === index ? { ...existing, [itemField.key]: value } : existing,
                    );
                    setItems(next, `content:${section.id}:${field.key}.${index}.${itemField.key}`);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={items.length >= max}
          onClick={() => setItems([...items, emptyItem()])}
        >
          <Plus className="size-3.5" aria-hidden />
          Add {field.itemLabel?.toLowerCase() ?? "item"}
        </Button>
      </div>
    </fieldset>
  );
}

export function RepeaterButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        destructive
          ? "flex size-6 cursor-pointer items-center justify-center rounded text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
          : "flex size-6 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
      }
    >
      {children}
    </button>
  );
}
