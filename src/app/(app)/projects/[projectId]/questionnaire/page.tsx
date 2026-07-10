"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { withActivity } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { BrandPreferences, InspirationSite, VisualStyle, WebsiteGoal } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StepBrand } from "@/components/project/wizard/step-brand";
import { StepGoals } from "@/components/project/wizard/step-goals";
import { StepInfo } from "@/components/project/wizard/step-info";
import { StepInspiration } from "@/components/project/wizard/step-inspiration";
import { StepStyles } from "@/components/project/wizard/step-styles";
import { DEFAULT_BRAND, type WizardInfo } from "@/components/project/wizard/wizard-types";

const INFO_FORM_ID = "questionnaire-info-form";

/**
 * Post-wizard questionnaire editing. Reuses the wizard step components;
 * everything is saved together when the (validated) form is submitted.
 */
export default function QuestionnairePage() {
  const { project, projectId } = useProject();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useSessionStore((s) => s.user);

  const [goals, setGoals] = useState<WebsiteGoal[]>([]);
  const [styles, setStyles] = useState<VisualStyle[]>([]);
  const [brand, setBrand] = useState<BrandPreferences>(DEFAULT_BRAND);
  const [brandSkipped, setBrandSkipped] = useState(false);
  const [inspirations, setInspirations] = useState<InspirationSite[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!project || loadedId === project.id) return;
    const q = project.questionnaire;
    setGoals(q.goals);
    setStyles(q.visualStyles);
    setBrand(q.brand ?? DEFAULT_BRAND);
    setBrandSkipped(q.brand === null);
    setInspirations(q.inspirations);
    setLoadedId(project.id);
  }, [project, loadedId]);

  if (!project || loadedId !== project.id) return null;

  const info: WizardInfo = {
    projectName: project.name,
    companyName: project.questionnaire.companyName || project.companyName,
    existingUrl: project.questionnaire.existingUrl,
    industry: project.questionnaire.industry,
    businessDescription: project.questionnaire.businessDescription,
    mainGoal: project.questionnaire.mainGoal,
    targetAudience: project.questionnaire.targetAudience,
    estimatedPages: project.questionnaire.estimatedPages,
    platform: project.questionnaire.platform,
  };

  const handleSave = (values: WizardInfo) => {
    updateProject(projectId, (p) =>
      withActivity(
        {
          ...p,
          name: values.projectName,
          companyName: values.companyName,
          websiteType: values.industry || p.websiteType,
          questionnaire: {
            companyName: values.companyName,
            existingUrl: values.existingUrl,
            industry: values.industry,
            businessDescription: values.businessDescription,
            mainGoal: values.mainGoal,
            targetAudience: values.targetAudience,
            estimatedPages: values.estimatedPages,
            platform: values.platform,
            goals,
            visualStyles: styles,
            brand: brandSkipped ? null : brand,
            inspirations,
          },
        },
        "project-updated",
        "Questionnaire updated",
        user,
      ),
    );
    toast("Questionnaire saved", "success");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Website questionnaire</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            The agency uses these answers to guide recommendations and the final build.
          </p>
        </div>
        <Button type="submit" form={INFO_FORM_ID}>
          <Save className="size-4" aria-hidden />
          Save changes
        </Button>
      </div>

      <Card>
        <CardHeader title="Project details" />
        <CardBody>
          <StepInfo defaultValues={info} onSubmit={handleSave} formId={INFO_FORM_ID} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Website goals" description="Select everything that applies." />
        <CardBody>
          <StepGoals selected={goals} onChange={setGoals} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Visual style" description="Pick up to three directions." />
        <CardBody>
          <StepStyles selected={styles} onChange={setStyles} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Brand preferences" />
        <CardBody>
          <StepBrand
            brand={brand}
            skipped={brandSkipped}
            onChange={(next) => {
              setBrand(next);
              setBrandSkipped(false);
            }}
            onSkipToggle={() => setBrandSkipped((s) => !s)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Inspiration websites" />
        <CardBody>
          <StepInspiration inspirations={inspirations} onChange={setInspirations} />
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" form={INFO_FORM_ID}>
          <Save className="size-4" aria-hidden />
          Save changes
        </Button>
      </div>
    </div>
  );
}
