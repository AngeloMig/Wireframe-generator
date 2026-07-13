"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PAGE_STATUS_META, PAGE_TYPE_LABELS } from "@/config/labels";
import { PAGE_TEMPLATES } from "@/data/page-templates";
import type { PageFormValues } from "@/lib/pages";
import type { PageStatus, PageType, ProjectPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, FieldHint, Input, Label, Select } from "@/components/ui/input";

const pageSchema = z.object({
  name: z.string().trim().min(1, "Give the page a name."),
  navLabel: z.string().trim(),
  type: z.string().min(1),
  status: z.string().min(1),
  parentId: z.string(),
  inMainNav: z.boolean(),
  footerOnly: z.boolean(),
  templateId: z.string(),
});

type PageFormShape = z.infer<typeof pageSchema>;

const DEFAULT_VALUES: PageFormShape = {
  name: "",
  navLabel: "",
  type: "custom",
  status: "draft",
  parentId: "",
  inMainNav: true,
  footerOnly: false,
  templateId: "",
};

/** Add/edit dialog for a project page. Pass `page` to edit an existing one. */
export function PageDialog({
  open,
  onClose,
  onSubmit,
  page,
  pages,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PageFormValues) => void;
  /** When set, the dialog edits this page instead of creating a new one. */
  page?: ProjectPage | null;
  pages: ProjectPage[];
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PageFormShape>({
    resolver: zodResolver(pageSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      page
        ? {
            name: page.name,
            navLabel: page.navLabel,
            type: page.type,
            status: page.status,
            parentId: page.parentId ?? "",
            inMainNav: page.inMainNav,
            footerOnly: page.footerOnly,
            templateId: "",
          }
        : DEFAULT_VALUES,
    );
  }, [open, page, reset]);

  const footerOnly = watch("footerOnly");
  const selectedType = watch("type");

  // Templates that fit the chosen page type — shown only when creating.
  const templateOptions = page
    ? []
    : PAGE_TEMPLATES.filter((t) => t.isActive && t.pageType === selectedType);

  // A page that already has children can't be nested (two levels max), and
  // valid parents are top-level, non-footer pages other than the page itself.
  const hasChildren = Boolean(page && pages.some((p) => p.parentId === page.id));
  const parentOptions = hasChildren
    ? []
    : pages.filter(
        (candidate) =>
          !candidate.parentId && !candidate.footerOnly && candidate.id !== page?.id,
      );

  const submit = handleSubmit((values) => {
    onSubmit({
      name: values.name,
      navLabel: values.navLabel || values.name,
      type: values.type as PageType,
      status: values.status as PageStatus,
      parentId: values.parentId || null,
      inMainNav: values.inMainNav,
      footerOnly: values.footerOnly,
      templateId: values.templateId || null,
    });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={page ? `Edit “${page.name}”` : "Add a page"}
      description={
        page
          ? "Update this page's details and navigation settings."
          : "Start from a ready-made template for the page type, or empty."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="page-dialog-form">
            {page ? "Save changes" : "Add page"}
          </Button>
        </>
      }
    >
      <form id="page-dialog-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="page-name">Page name</Label>
          <Input
            id="page-name"
            placeholder="e.g. About Us"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="page-nav-label" optional>
            Navigation label
          </Label>
          <Input id="page-nav-label" placeholder="Defaults to the page name" {...register("navLabel")} />
        </div>
        <div>
          <Label htmlFor="page-type">Page type</Label>
          <Select id="page-type" {...register("type")}>
            {(Object.entries(PAGE_TYPE_LABELS) as [PageType, string][])
              .filter(([value]) => value !== "homepage" || page?.isHomepage)
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </Select>
        </div>
        {templateOptions.length > 0 && (
          <div>
            <Label htmlFor="page-template">Start from</Label>
            <Select id="page-template" {...register("templateId")}>
              <option value="">Empty page</option>
              {templateOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.sections.length} sections)
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="page-status">Page status</Label>
          <Select id="page-status" {...register("status")}>
            {(Object.entries(PAGE_STATUS_META) as [PageStatus, { label: string }][]).map(
              ([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ),
            )}
          </Select>
        </div>
        {!footerOnly && !page?.isHomepage && (
          <div className="sm:col-span-2">
            <Label htmlFor="page-parent" optional>
              Nest beneath
            </Label>
            <Select id="page-parent" {...register("parentId")}>
              <option value="">None — top-level page</option>
              {parentOptions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </Select>
            <FieldHint>The sitemap supports one level of child pages.</FieldHint>
          </div>
        )}
        {!page?.isHomepage && (
          <fieldset className="space-y-2.5 sm:col-span-2">
            <legend className="sr-only">Navigation placement</legend>
            {!footerOnly && (
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 accent-indigo-600"
                  {...register("inMainNav")}
                />
                Include in the main navigation
              </label>
            )}
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300 accent-indigo-600"
                {...register("footerOnly")}
              />
              Footer-only page
              <span className="text-xs text-slate-400">(e.g. Privacy Policy, Terms)</span>
            </label>
          </fieldset>
        )}
      </form>
    </Dialog>
  );
}
