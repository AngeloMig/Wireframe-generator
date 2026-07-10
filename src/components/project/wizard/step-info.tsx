"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ESTIMATED_PAGES_OPTIONS, INDUSTRY_OPTIONS, PLATFORM_OPTIONS } from "@/config/options";
import type { PlatformPreference } from "@/types";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import type { WizardInfo } from "./wizard-types";

const infoSchema = z.object({
  projectName: z.string().trim().min(2, "Give your project a name (at least 2 characters)."),
  companyName: z.string().trim().min(1, "Enter your company or brand name."),
  existingUrl: z
    .string()
    .trim()
    .url("Enter a full URL, e.g. https://example.com")
    .or(z.literal("")),
  industry: z.string().min(1, "Choose the closest industry."),
  businessDescription: z.string().trim().min(10, "A sentence or two helps the agency understand you."),
  mainGoal: z.string().trim().min(5, "What should this website achieve for you?"),
  targetAudience: z.string().trim(),
  estimatedPages: z.string(),
  platform: z.enum(["shopify", "wordpress", "webflow", "statamic", "custom", "not-sure"]),
});

export type InfoFormValues = z.infer<typeof infoSchema>;

export function StepInfo({
  defaultValues,
  onSubmit,
  formId,
}: {
  defaultValues: WizardInfo;
  onSubmit: (values: WizardInfo) => void;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues,
  });

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, platform: values.platform as PlatformPreference }),
      )}
      className="grid gap-5 sm:grid-cols-2"
    >
      <div>
        <Label htmlFor="projectName">Project name</Label>
        <Input
          id="projectName"
          placeholder="e.g. Acme Website Redesign"
          aria-invalid={Boolean(errors.projectName)}
          {...register("projectName")}
        />
        <FieldError message={errors.projectName?.message} />
      </div>
      <div>
        <Label htmlFor="companyName">Company name</Label>
        <Input
          id="companyName"
          placeholder="e.g. Acme Co."
          aria-invalid={Boolean(errors.companyName)}
          {...register("companyName")}
        />
        <FieldError message={errors.companyName?.message} />
      </div>
      <div>
        <Label htmlFor="existingUrl" optional>
          Existing website URL
        </Label>
        <Input
          id="existingUrl"
          type="url"
          placeholder="https://example.com"
          aria-invalid={Boolean(errors.existingUrl)}
          {...register("existingUrl")}
        />
        <FieldError message={errors.existingUrl?.message} />
      </div>
      <div>
        <Label htmlFor="industry">Industry</Label>
        <Select id="industry" aria-invalid={Boolean(errors.industry)} {...register("industry")}>
          <option value="">Choose an industry…</option>
          {INDUSTRY_OPTIONS.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>
        <FieldError message={errors.industry?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="businessDescription">Business description</Label>
        <Textarea
          id="businessDescription"
          placeholder="What does your business do, and for whom?"
          aria-invalid={Boolean(errors.businessDescription)}
          {...register("businessDescription")}
        />
        <FieldError message={errors.businessDescription?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="mainGoal">Main website goal</Label>
        <Input
          id="mainGoal"
          placeholder="e.g. Get more online bookings for first appointments"
          aria-invalid={Boolean(errors.mainGoal)}
          {...register("mainGoal")}
        />
        <FieldError message={errors.mainGoal?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="targetAudience" optional>
          Target audience
        </Label>
        <Input
          id="targetAudience"
          placeholder="Who are your ideal customers?"
          {...register("targetAudience")}
        />
      </div>
      <div>
        <Label htmlFor="estimatedPages">Estimated number of pages</Label>
        <Select id="estimatedPages" {...register("estimatedPages")}>
          {ESTIMATED_PAGES_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="platform">Preferred platform</Label>
        <Select id="platform" {...register("platform")}>
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldHint>Not sure? The agency will recommend the best fit.</FieldHint>
      </div>
    </form>
  );
}
