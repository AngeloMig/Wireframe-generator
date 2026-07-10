"use client";

import { Paintbrush } from "lucide-react";
import type { BrandPreferences } from "@/types";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select } from "@/components/ui/input";
import { DEFAULT_BRAND } from "./wizard-types";

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#4f46e5"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9.5 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4f46e5"
          className="font-mono"
        />
      </div>
    </div>
  );
}

export function StepBrand({
  brand,
  skipped,
  onChange,
  onSkipToggle,
}: {
  brand: BrandPreferences | null;
  skipped: boolean;
  onChange: (brand: BrandPreferences) => void;
  onSkipToggle: () => void;
}) {
  if (skipped || !brand) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
        <Paintbrush className="size-6 text-slate-400" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-700">Brand preferences skipped</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          No problem — the agency will propose a direction. You can add preferences any time
          from the project questionnaire.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            onSkipToggle();
            onChange(DEFAULT_BRAND);
          }}
        >
          Add brand preferences
        </Button>
      </div>
    );
  }

  const set = <K extends keyof BrandPreferences>(key: K, value: BrandPreferences[K]) =>
    onChange({ ...brand, [key]: value });

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <ColorField id="primaryColor" label="Primary color" value={brand.primaryColor} onChange={(v) => set("primaryColor", v)} />
        <ColorField id="secondaryColor" label="Secondary color" value={brand.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
        <ColorField id="accentColor" label="Accent color" value={brand.accentColor} onChange={(v) => set("accentColor", v)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="headingStyle">Preferred heading style</Label>
          <Select
            id="headingStyle"
            value={brand.headingStyle}
            onChange={(e) => set("headingStyle", e.target.value as BrandPreferences["headingStyle"])}
          >
            <option value="not-sure">Not sure yet</option>
            <option value="sans-serif">Sans-serif (clean, modern)</option>
            <option value="serif">Serif (classic, editorial)</option>
            <option value="display">Display (expressive, distinctive)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="buttonStyle">Preferred button style</Label>
          <Select
            id="buttonStyle"
            value={brand.buttonStyle}
            onChange={(e) => set("buttonStyle", e.target.value as BrandPreferences["buttonStyle"])}
          >
            <option value="not-sure">Not sure yet</option>
            <option value="rounded">Rounded corners</option>
            <option value="pill">Pill shaped</option>
            <option value="square">Square corners</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="borderRadius">Border radius preference</Label>
          <Select
            id="borderRadius"
            value={brand.borderRadius}
            onChange={(e) => set("borderRadius", e.target.value as BrandPreferences["borderRadius"])}
          >
            <option value="not-sure">Not sure yet</option>
            <option value="sharp">Sharp (no rounding)</option>
            <option value="subtle">Subtle rounding</option>
            <option value="rounded">Noticeably rounded</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="spacing">General spacing preference</Label>
          <Select
            id="spacing"
            value={brand.spacing}
            onChange={(e) => set("spacing", e.target.value as BrandPreferences["spacing"])}
          >
            <option value="not-sure">Not sure yet</option>
            <option value="compact">Compact (dense, efficient)</option>
            <option value="balanced">Balanced</option>
            <option value="airy">Airy (lots of whitespace)</option>
          </Select>
          <FieldHint>These preferences shape the styled preview later on.</FieldHint>
        </div>
      </div>
      <Button variant="ghost" onClick={onSkipToggle}>
        Skip this step
      </Button>
    </div>
  );
}
