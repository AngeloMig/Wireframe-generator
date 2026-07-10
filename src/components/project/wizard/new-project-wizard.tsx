"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { getPageTemplate } from "@/data/page-templates";
import { bestTemplateFor } from "@/lib/recommendations";
import { createSectionByTemplateId } from "@/lib/sections";
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
    const section = createSectionByTemplateId(entry.templateId, {
      variationId: entry.variationId,
      contentOverrides: entry.contentOverrides,
      order: index,
    });
    if (section) sections.push(section);
  });
  return sections;
}

export function NewProjectWizard() {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [restored, setRestored] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    const draft = readWizardDraft();
    if (draft) {
      setData(draft);
      toast("Draft restored", "info", "We picked up where you left off.");
    }
    setRestored(true);
  }, []);

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
            status: sections.length > 0 ? "in-progress" : "draft",
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
    <div className="mx-auto max-w-3xl">
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
                  isComplete && "cursor-pointer bg-indigo-500 hover:bg-indigo-600",
                  isCurrent && "bg-indigo-500",
                  !isComplete && !isCurrent && "bg-slate-200",
                )}
                aria-label={`Step ${index + 1}: ${step.label}${isComplete ? " (completed)" : ""}`}
              />
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  isCurrent ? "text-indigo-700" : isComplete ? "text-slate-600" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
            Step {data.step + 1} of {WIZARD_STEPS.length}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
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
          </h1>
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
