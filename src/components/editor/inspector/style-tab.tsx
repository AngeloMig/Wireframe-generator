"use client";

import { useId } from "react";
import type { PageSection, SectionStyleSettings } from "@/types";
import { Button } from "@/components/ui/button";
import type { SectionMutator } from "./inspector-types";
import { SegmentedControl } from "./layout-tab";

/** Controlled style settings — deliberately no custom CSS. */
export function StyleTab({
  section,
  onChange,
}: {
  section: PageSection;
  onChange: SectionMutator;
}) {
  const setStyle = (patch: Partial<SectionStyleSettings>) =>
    onChange((s) => ({ ...s, style: { ...s.style, ...patch } }));

  return (
    <div className="space-y-4 p-4">
      <SegmentedControl
        label="Background type"
        value={section.style.background}
        options={[
          { value: "none", label: "None" },
          { value: "muted", label: "Muted" },
          { value: "brand", label: "Brand" },
          { value: "dark", label: "Dark" },
          { value: "image", label: "Image" },
        ]}
        onChange={(background) =>
          setStyle({ background: background as SectionStyleSettings["background"] })
        }
      />

      <ColorField
        label="Background color"
        hint="Overrides the background type in styled preview."
        value={section.style.backgroundColor}
        onChange={(backgroundColor) => setStyle({ backgroundColor })}
      />
      <ColorField
        label="Text color"
        value={section.style.textColor}
        onChange={(textColor) => setStyle({ textColor })}
      />
      <ColorField
        label="Accent color"
        value={section.style.accentColor}
        onChange={(accentColor) => setStyle({ accentColor })}
      />

      <SegmentedControl
        label="Border"
        value={section.style.border}
        options={[
          { value: "none", label: "None" },
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "both", label: "Both" },
        ]}
        onChange={(border) => setStyle({ border: border as SectionStyleSettings["border"] })}
      />

      <SegmentedControl
        label="Section spacing"
        value={section.style.spacing}
        options={[
          { value: "compact", label: "Compact" },
          { value: "normal", label: "Normal" },
          { value: "spacious", label: "Spacious" },
        ]}
        onChange={(spacing) => setStyle({ spacing: spacing as SectionStyleSettings["spacing"] })}
      />

      <SegmentedControl
        label="Card radius"
        value={section.style.cardRadius}
        options={[
          { value: "none", label: "None" },
          { value: "small", label: "S" },
          { value: "medium", label: "M" },
          { value: "large", label: "L" },
        ]}
        onChange={(radius) =>
          setStyle({ cardRadius: radius as SectionStyleSettings["cardRadius"] })
        }
      />

      <SegmentedControl
        label="Button style"
        value={section.style.buttonStyle}
        options={[
          { value: "solid", label: "Solid" },
          { value: "outline", label: "Outline" },
          { value: "soft", label: "Soft" },
          { value: "link", label: "Link" },
        ]}
        onChange={(buttonStyle) =>
          setStyle({ buttonStyle: buttonStyle as SectionStyleSettings["buttonStyle"] })
        }
      />

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        Colors apply in styled preview mode. The wireframe view stays grayscale so
        everyone focuses on structure first.
      </p>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value ?? "#e2e8f0"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
        />
        <span className="flex-1 text-[11px] text-slate-500">
          {value ? value.toUpperCase() : "Using the project default"}
        </span>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Reset
          </Button>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
