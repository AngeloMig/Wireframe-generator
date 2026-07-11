"use client";

import { Building2, ShieldAlert } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody } from "@/components/ui/card";

/** Mock organizations view; real orgs arrive with the backend. */
export default function AdminOrganizationsPage() {
  const user = useSessionStore((s) => s.user);
  const projects = useProjectsStore((s) => s.projects);

  if (user.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator access required"
        description="Switch to the Administrator role from the user menu or Settings to view organizations."
      />
    );
  }

  const companies = Array.from(new Set(projects.map((p) => p.companyName))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Organizations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Client organizations derived from the demo projects. Full organization
          management arrives with the backend integration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardBody className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50">
              <Building2 className="size-5 text-indigo-600" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{APP_CONFIG.agencyName}</p>
              <p className="mt-0.5 text-xs text-slate-500">Agency workspace (owner)</p>
            </div>
          </CardBody>
        </Card>
        {companies.map((company) => {
          const count = projects.filter((p) => p.companyName === company).length;
          return (
            <Card key={company}>
              <CardBody className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="size-5 text-slate-500" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{company}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Client · {count} {count === 1 ? "project" : "projects"}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
