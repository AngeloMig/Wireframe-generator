"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Save } from "lucide-react";
import { getPageTemplate } from "@/data/page-templates";
import { bestTemplateFor } from "@/lib/recommendations";
import { createSectionByVariationId } from "@/lib/sections";
import { withActivity } from "@/lib/project-utils";
import { clearWizardDraft, readWizardDraft, writeWizardDraft } from "@/lib/wizard-draft";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { CreateProjectInput, PageSection } from "@/types";
import { createId } from "@/utils/id";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { StepBrand } from "./step-brand";
import { StepGoals } from "./step-goals";
import { StepInfo } from "./step-info";
import { StepInspiration } from "./step-inspiration";
import { StepStartingPoint } from "./step-starting-point";
import {
  DEFAULT_BRAND,
  EMPTY_WIZARD_DATA,
  WIZARD_STEPS,
  type WizardData,
  type WizardInfo,
} from "./wizard-types";
import { StepStyles } from "./step-styles";

const INFO_FORM_ID = "wizard-step-info";

function buildHomepageSections(data: WizardData): PageSection[] {
  const { mode, templateId } = data.startingPoint;
  if (mode === "blank") return [];
  const template =
    (templateId ? getPageTemplate(templateId) : undefined) ??
    bestTemplateFor(data.info.industry, data.goals);
  if (!template) return [];
  const sections: PageSection[] = [];
  template.sections.forEach((entry, index) => {
    const section = createSectionByVariationId(entry.variationId, {
      contentOverrides: entry.contentOverrides,
      order: index,
    });
    if (!section) return;
    sections.push({
      ...section,
      layout: { ...section.layout, ...entry.layoutOverrides },
      style: { ...section.style, ...entry.styleOverrides },
    });
  });
  return sections;
}

export function NewProjectWizard() {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [restored, setRestored] = useState(false);
  // An unfinished draft is offered as an explicit choice, never auto-applied —
  // so "Start a new project" always begins fresh.
  const [pendingDraft, setPendingDraft] = useState<WizardData | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    const draft = readWizardDraft();
    // Only offer to resume a draft that has real progress; otherwise start clean.
    const hasProgress =
      draft &&
      (draft.step > 0 ||
        draft.info.projectName.trim().length > 0 ||
        draft.info.companyName.trim().length > 0);
    if (hasProgress) setPendingDraft(draft);
    setRestored(true);
  }, []);

  useEffect(() => {
    const templateId = new URLSearchParams(window.location.search).get("template");
    if (!templateId || !getPageTemplate(templateId)) return;
    setData((current) => ({
      ...current,
      startingPoint: { mode: "template", templateId },
    }));
  }, []);

  const resumeDraft = () => {
    if (pendingDraft) setData(pendingDraft);
    setPendingDraft(null);
  };

  const discardDraft = () => {
    clearWizardDraft();
    setData(EMPTY_WIZARD_DATA);
    setPendingDraft(null);
    setStepError(null);
  };

  const update = (partial: Partial<WizardData>) => {
    setStepError(null);
    setData((current) => {
      const next = { ...current, ...partial };
      writeWizardDraft(next);
      return next;
    });
  };

  const goToStep = (step: number) => update({ step });

  const handleInfoSubmit = (info: WizardInfo) => {
    update({ info, step: 1 });
  };

  const handleContinue = () => {
    if (data.step === 1 && data.goals.length === 0) {
      setStepError("Select at least one goal so we can recommend the right structure.");
      return;
    }
    goToStep(data.step + 1);
  };

  const handleSaveAndExit = () => {
    writeWizardDraft(data);
    toast("Progress saved", "success", "Continue any time from “Create New Blueprint”.");
    router.push("/dashboard");
  };

  const handleFinish = async () => {
    setCreating(true);
    try {
      const sections = buildHomepageSections(data);
      const templateName =
        data.startingPoint.mode === "blank"
          ? null
          : (
              (data.startingPoint.templateId
                ? getPageTemplate(data.startingPoint.templateId)
                : undefined) ?? bestTemplateFor(data.info.industry, data.goals)
            )?.name ?? null;

      const input: CreateProjectInput = {
        name: data.info.projectName,
        companyName: data.info.companyName,
        websiteType: data.info.industry || "Website",
        // New projects belong to the creating staff member's agency; customers
        // creating their own stay owners under the default agency.
        organization: user.role === "customer" ? undefined : user.organization,
        ownerId: user.role === "customer" ? user.id : undefined,
        questionnaire: {
          companyName: data.info.companyName,
          existingUrl: data.info.existingUrl,
          industry: data.info.industry,
          businessDescription: data.info.businessDescription,
          mainGoal: data.info.mainGoal,
          targetAudience: data.info.targetAudience,
          estimatedPages: data.info.estimatedPages,
          platform: data.info.platform,
          goals: data.goals,
          visualStyles: data.styles,
          brand: data.brandSkipped ? null : data.brand,
          inspirations: data.inspirations,
        },
        pages: [
          {
            id: createId(),
            name: "Homepage",
            navLabel: "Home",
            type: "homepage",
            status: sections.length > 0 ? "content-needed" : "draft",
            isHomepage: true,
            inMainNav: true,
            footerOnly: false,
            parentId: null,
            order: 0,
            sections,
          },
        ],
      };

      const project = await createProject(input);
      updateProject(
        project.id,
        (p) => {
          let next = withActivity(p, "project-created", "Project created", user);
          next = withActivity(
            next,
            "page-added",
            templateName
              ? `Homepage added from the ${templateName} template`
              : "Blank homepage added",
            user,
          );
          return { ...next, status: "customer-editing" as const };
        },
        { immediate: true },
      );
      clearWizardDraft();
      toast("Blueprint created", "success", "Your homepage is ready to build on.");
      router.push(`/projects/${project.id}/overview`);
    } catch {
      toast("Something went wrong creating the project", "error");
      setCreating(false);
    }
  };

  if (!restored) return null;

  const isFirst = data.step === 0;
  const isLast = data.step === WIZARD_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 text-center">
        <p className="text-xs font-bold tracking-[0.12em] text-[var(--primary)] uppercase">New website plan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[var(--text-primary)]">Let’s shape the right starting point</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">A few simple choices help us recommend pages and sections that fit your business. You can change everything later.</p>
      </div>

      {/* Unfinished-draft choice — resume or start fresh, never auto-applied. */}
      {pendingDraft && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-[var(--text-secondary)]" aria-hidden />
            <p className="text-sm text-[var(--text-secondary)]">
              You have an unfinished project draft
              {pendingDraft.info.projectName.trim()
                ? ` for “${pendingDraft.info.projectName.trim()}”`
                : ""}
              . Pick up where you left off, or start a new one.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={discardDraft}>
              Start fresh
            </Button>
            <Button variant="outline" size="sm" onClick={resumeDraft}>
              Resume draft
            </Button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <ol className="mb-8 flex items-center gap-1.5 sm:gap-2" aria-label="Wizard progress">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = index < data.step;
          const isCurrent = index === data.step;
          return (
            <li key={step.id} className="flex flex-1 flex-col gap-1.5">
              <button
                type="button"
                disabled={index > data.step}
                onClick={() => index < data.step && goToStep(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  isComplete && "cursor-pointer bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
                  isCurrent && "bg-[var(--primary)]",
                  !isComplete && !isCurrent && "bg-slate-200",
                )}
                aria-label={`Step ${index + 1}: ${step.label}${isComplete ? " (completed)" : ""}`}
              />
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  isCurrent ? "text-[var(--primary)]" : isComplete ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-[1.5rem] border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-panel)] sm:p-9">
        <div className="mb-6">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Step {data.step + 1} of {WIZARD_STEPS.length}
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {
              [
                "Tell us about your project",
                "What should this website achieve?",
                "Which visual styles feel right?",
                "Your brand preferences",
                "Websites that inspire you",
                "Choose your starting point",
              ][data.step]
            }
          </h2>
        </div>

        {data.step === 0 && (
          <StepInfo defaultValues={data.info} onSubmit={handleInfoSubmit} formId={INFO_FORM_ID} />
        )}
        {data.step === 1 && (
          <StepGoals selected={data.goals} onChange={(goals) => update({ goals })} />
        )}
        {data.step === 2 && (
          <StepStyles selected={data.styles} onChange={(styles) => update({ styles })} />
        )}
        {data.step === 3 && (
          <StepBrand
            brand={data.brand ?? DEFAULT_BRAND}
            skipped={data.brandSkipped}
            onChange={(brand) => update({ brand, brandSkipped: false })}
            onSkipToggle={() => update({ brandSkipped: !data.brandSkipped, brand: data.brand ?? DEFAULT_BRAND })}
          />
        )}
        {data.step === 4 && (
          <StepInspiration
            inspirations={data.inspirations}
            onChange={(inspirations) => update({ inspirations })}
          />
        )}
        {data.step === 5 && (
          <StepStartingPoint
            industry={data.info.industry}
            goals={data.goals}
            styles={data.styles}
            mode={data.startingPoint.mode}
            templateId={data.startingPoint.templateId}
            onChange={(mode, templateId) => update({ startingPoint: { mode, templateId } })}
          />
        )}

        {stepError && (
          <p role="alert" className="mt-4 text-sm text-rose-600">
            {stepError}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <Button variant="ghost" onClick={handleSaveAndExit}>
            <Save className="size-4" aria-hidden />
            Save and Exit
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" onClick={() => goToStep(data.step - 1)}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
            )}
            {data.step === 0 ? (
              <Button type="submit" form={INFO_FORM_ID}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : isLast ? (
              <Button onClick={() => void handleFinish()} isLoading={creating}>
                <Check className="size-4" aria-hidden />
                Create Blueprint
              </Button>
            ) : (
              <Button onClick={handleContinue}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
