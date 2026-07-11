"use client";

import { useEffect, useState } from "react";
import { PencilLine, ShieldAlert } from "lucide-react";
import { PAGE_TYPE_LABELS, SECTION_TYPE_LABELS } from "@/config/labels";
import { templateRepository } from "@/lib/repositories/local-template-repository";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { SectionVariation } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Admin template management (simplified for this phase): toggle availability
 * and edit metadata. Edits persist as local overrides via the repository.
 */
export default function AdminTemplatesPage() {
  const user = useSessionStore((s) => s.user);
  const [templates, setTemplates] = useState<SectionVariation[] | null>(null);
  const [editing, setEditing] = useState<SectionVariation | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void templateRepository.getSectionVariations().then(setTemplates);
  }, []);

  if (user.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator access required"
        description="Switch to the Administrator role from the user menu or Settings to manage templates."
      />
    );
  }

  if (!templates) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading templates">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const handleToggle = async (template: SectionVariation) => {
    const updated = await templateRepository.updateSectionVariation(template.id, {
      isActive: !template.isActive,
    });
    if (updated) {
      setTemplates((prev) => prev?.map((t) => (t.id === template.id ? updated : t)) ?? null);
      toast(
        updated.isActive ? "Template enabled" : "Template disabled",
        "info",
        updated.isActive
          ? `“${updated.name}” is available in the section library again.`
          : `“${updated.name}” is hidden from the section library.`,
      );
    }
  };

  const openEdit = (template: SectionVariation) => {
    setEditing(template);
    setName(template.name);
    setDescription(template.description);
  };

  const handleSaveEdit = async () => {
    if (!editing || !name.trim()) return;
    const updated = await templateRepository.updateSectionVariation(editing.id, {
      name: name.trim(),
      description: description.trim(),
    });
    if (updated) {
      setTemplates((prev) => prev?.map((t) => (t.id === editing.id ? updated : t)) ?? null);
      toast("Template updated", "success");
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Template Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Control which section designs customers can use. Full design building comes
          in a later phase.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
              <th scope="col" className="px-5 py-3 font-medium">Template</th>
              <th scope="col" className="px-5 py-3 font-medium">Category</th>
              <th scope="col" className="px-5 py-3 font-medium">Page types</th>
              <th scope="col" className="px-5 py-3 font-medium">Tags</th>
              <th scope="col" className="px-5 py-3 font-medium">Updated</th>
              <th scope="col" className="px-5 py-3 font-medium">Active</th>
              <th scope="col" className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map((template) => (
              <tr key={template.id} className={cn(!template.isActive && "opacity-60")}>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{template.name}</p>
                  <p className="mt-0.5 max-w-64 truncate text-xs text-slate-500">
                    {template.description}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                    {SECTION_TYPE_LABELS[template.sectionType]}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">
                  {template.supportedPageTypes.length >= 10
                    ? "All"
                    : template.supportedPageTypes
                        .slice(0, 2)
                        .map((t) => PAGE_TYPE_LABELS[t])
                        .join(", ") +
                      (template.supportedPageTypes.length > 2
                        ? ` +${template.supportedPageTypes.length - 2}`
                        : "")}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">{template.tags.slice(0, 3).join(", ")}</td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {formatRelative(template.updatedAt)}
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={template.isActive}
                    aria-label={`${template.isActive ? "Disable" : "Enable"} ${template.name}`}
                    onClick={() => void handleToggle(template)}
                    className={cn(
                      "relative h-5.5 w-10 cursor-pointer rounded-full transition-colors",
                      template.isActive ? "bg-indigo-600" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white shadow transition-transform",
                        template.isActive && "translate-x-4.5",
                      )}
                    />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${template.name}`}
                    onClick={() => openEdit(template)}
                  >
                    <PencilLine className="size-4 text-slate-400" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Edit “${editing?.name ?? ""}”`}
        description="Metadata changes are stored locally in this prototype."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveEdit()}>Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template name</Label>
            <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
