"use client";

import { useState } from "react";
import { RotateCcw, UserRound } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { ROLE_LABELS } from "@/config/labels";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";

export default function SettingsPage() {
  const user = useSessionStore((s) => s.user);
  const switchRole = useSessionStore((s) => s.switchRole);
  const resetDemoData = useProjectsStore((s) => s.resetDemoData);
  const refreshNotifications = useNotificationsStore((s) => s.refresh);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = async () => {
    await resetDemoData();
    await refreshNotifications();
    toast("Demo data reset", "success", "Projects and notifications were restored to the original examples.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prototype settings — accounts and workspaces arrive with the real backend.
        </p>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <UserRound className="size-4 text-slate-400" aria-hidden />
              Simulated role
            </span>
          }
          description="Switch how you experience the app during this prototype phase. This is also available from the user menu."
        />
        <CardBody className="flex flex-wrap gap-2">
          {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
            <Button
              key={role}
              variant={user.role === role ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                switchRole(role);
                toast(`Now viewing as ${label}`, "info");
              }}
            >
              {label}
            </Button>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Demo data"
          description="Everything in this prototype is stored in your browser's local storage."
        />
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-sm text-sm text-slate-600">
            Reset to restore the original example projects, notifications, and template
            settings. Anything you created will be removed.
          </p>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" aria-hidden />
            Reset Demo Data
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="About" />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Product</dt>
              <dd className="mt-0.5 text-slate-800">{APP_CONFIG.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Agency</dt>
              <dd className="mt-0.5 text-slate-800">{APP_CONFIG.agencyName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Local data schema</dt>
              <dd className="mt-0.5 text-slate-800">v{APP_CONFIG.storageSchemaVersion}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => void handleReset()}
        title="Reset all demo data?"
        description="Your projects, edits, and notifications will be replaced with the original demo content. This cannot be undone."
        confirmLabel="Reset data"
      />
    </div>
  );
}
