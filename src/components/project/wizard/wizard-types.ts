import type {
  BrandPreferences,
  InspirationSite,
  PlatformPreference,
  VisualStyle,
  WebsiteGoal,
} from "@/types";

export interface WizardInfo {
  projectName: string;
  companyName: string;
  existingUrl: string;
  industry: string;
  businessDescription: string;
  mainGoal: string;
  targetAudience: string;
  estimatedPages: string;
  platform: PlatformPreference;
}

export type StartingPointMode = "recommended" | "template" | "blank";

export interface WizardData {
  step: number;
  info: WizardInfo;
  goals: WebsiteGoal[];
  styles: VisualStyle[];
  brand: BrandPreferences | null;
  brandSkipped: boolean;
  inspirations: InspirationSite[];
  startingPoint: { mode: StartingPointMode; templateId: string | null };
}

export const DEFAULT_BRAND: BrandPreferences = {
  primaryColor: "#4f46e5",
  secondaryColor: "#0f172a",
  accentColor: "#f59e0b",
  headingStyle: "not-sure",
  buttonStyle: "not-sure",
  borderRadius: "not-sure",
  spacing: "not-sure",
};

export const EMPTY_WIZARD_DATA: WizardData = {
  step: 0,
  info: {
    projectName: "",
    companyName: "",
    existingUrl: "",
    industry: "",
    businessDescription: "",
    mainGoal: "",
    targetAudience: "",
    estimatedPages: "4-6 pages",
    platform: "not-sure",
  },
  goals: [],
  styles: [],
  brand: null,
  brandSkipped: false,
  inspirations: [],
  startingPoint: { mode: "recommended", templateId: null },
};

export const WIZARD_STEPS = [
  { id: "info", label: "Project Info" },
  { id: "goals", label: "Goals" },
  { id: "styles", label: "Visual Style" },
  { id: "brand", label: "Brand" },
  { id: "inspiration", label: "Inspiration" },
  { id: "start", label: "Starting Point" },
] as const;
