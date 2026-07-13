"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { useAccessRequestsStore } from "@/stores/access-requests-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import { memberIdsByRole, notifyUsers } from "@/lib/collab-service";
import { isAgencyUser } from "@/types";
import type { AccessRequest, Project, ProjectPage, AccessRequestLevel } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";

const ACCESS_OPTIONS: {
  value: AccessRequestLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "page",
    label: "Add or edit a page",
    description: "Create new pages or change page settings.",
  },
  {
    value: "content",
    label: "Edit page content",
    description: "Update the words and images on existing pages.",
  },
  {
    value: "builder",
    label: "Build and arrange sections",
    description: "Add, remove, and reorder sections on the canvas.",
  },
];

type LevelState = "available" | "pending" | "granted" | "declined";

/** The most recent request for a level decides its current state. */
function latestRequest(
  requests: AccessRequest[],
  projectId: string,
  requesterId: string,
  level: AccessRequestLevel,
): AccessRequest | undefined {
  return requests
    .filter(
      (request) =>
        request.projectId === projectId &&
        request.requesterId === requesterId &&
        request.level === level,
    )
    .reduce<AccessRequest | undefined>(
      (latest, request) =>
        !latest || request.createdAt > latest.createdAt ? request : latest,
      undefined,
    );
}

export function AccessRequestDialog({
  project,
  page,
  open,
  onClose,
}: {
  project: Project;
  page: ProjectPage;
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((state) => state.user);
  const createRequest = useAccessRequestsStore((state) => state.createRequest);
  const hydrate = useAccessRequestsStore((state) => state.hydrate);
  const requests = useAccessRequestsStore((state) => state.requests);
  const [selected, setSelected] = useState<AccessRequestLevel[]>([]);
  // Declined levels the customer chose to raise again — they don't silently
  // reappear as available, so a decline actually sticks until they act on it.
  const [reopened, setReopened] = useState<AccessRequestLevel[]>([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Each capability is tracked independently. Once the agency approves one it
  // disappears; a pending one is locked (no duplicate asks); a declined one
  // shows the agency's reply and waits for an explicit "Ask again".
  const levels = useMemo(() => {
    return ACCESS_OPTIONS.map((option) => {
      const latest = latestRequest(requests, project.id, user.id, option.value);
      const state: LevelState =
        latest?.status === "approved"
          ? "granted"
          : latest?.status === "pending"
            ? "pending"
            : latest?.status === "declined"
              ? "declined"
              : "available"; // never asked, or a prior grant was revoked
      return { option, state, response: latest?.response };
    });
  }, [requests, project.id, user.id]);

  const visibleLevels = levels.filter((l) => l.state !== "granted");
  const selectableLevels = visibleLevels.filter(
    (l) => l.state === "available" || (l.state === "declined" && reopened.includes(l.option.value)),
  );
  const allGranted = visibleLevels.length === 0;
  const allSelected =
    selectableLevels.length > 0 && selected.length === selectableLevels.length;

  const toggle = (value: AccessRequestLevel) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const askAgain = (value: AccessRequestLevel) => {
    setReopened((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSelected((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  const reset = () => {
    setSelected([]);
    setReopened([]);
    setReason("");
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={closeAndReset}
      title="Request more access"
      description="Your agency will review the request before anything changes."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={closeAndReset}>
            {allGranted ? "Close" : "Cancel"}
          </Button>
          {!allGranted && (
            <Button
              disabled={selected.length === 0 || !reason.trim()}
              onClick={() => {
                for (const level of selected) {
                  createRequest({
                    projectId: project.id,
                    requesterId: user.id,
                    requesterName: user.name,
                    level,
                    pageId: page.id,
                    reason: reason.trim(),
                  });
                }
                // Let the agency PMs/admins know something is waiting.
                void (async () => {
                  const reviewers = await memberIdsByRole(
                    project.id,
                    (role) => role === "agency-pm" || role === "admin" || isAgencyUser(role),
                  );
                  await notifyUsers(reviewers, user.id, {
                    projectId: project.id,
                    type: "general",
                    title: "Access request",
                    message: `${user.name} requested more editing access on ${project.name}.`,
                    actionUrl: `/projects/${project.id}/members`,
                  });
                })();
                toast(
                  selected.length === 1
                    ? "Access request sent"
                    : `${selected.length} access requests sent`,
                  "success",
                  "The agency will review them shortly.",
                );
                closeAndReset();
              }}
            >
              <Send className="size-4" aria-hidden />{" "}
              {selected.length > 1 ? `Send ${selected.length} requests` : "Send request"}
            </Button>
          )}
        </>
      }
    >
      {allGranted ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            You already have full editing access.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            There&apos;s nothing left to request on this project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>What do you need?</Label>
              {selectableLevels.length > 1 && (
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--focus-ring)] hover:underline"
                  onClick={() =>
                    setSelected(
                      allSelected ? [] : selectableLevels.map((l) => l.option.value),
                    )
                  }
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            <div aria-label="What do you need?" className="mt-1.5 space-y-2">
              {visibleLevels.map(({ option, state, response }) => {
                const pending = state === "pending";
                const declined = state === "declined" && !reopened.includes(option.value);
                const locked = pending || declined;
                const checked = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={locked ? "mixed" : checked}
                    disabled={locked}
                    onClick={() => !locked && toggle(option.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      locked
                        ? "cursor-default border-[var(--border-default)] bg-[var(--surface-secondary)]"
                        : checked
                          ? "cursor-pointer border-[var(--focus-ring)] bg-[var(--info-soft)]/60"
                          : "cursor-pointer border-[var(--border-default)] bg-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                        locked
                          ? "border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                          : checked
                            ? "border-[var(--focus-ring)] bg-[var(--focus-ring)] text-white"
                            : "border-[var(--border-strong)] bg-white",
                      )}
                      aria-hidden
                    >
                      {pending ? (
                        <Clock className="size-3" strokeWidth={2.5} />
                      ) : (
                        checked && <Check className="size-3" strokeWidth={3} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {option.label}
                        </span>
                        {pending && (
                          <span className="rounded-full bg-[var(--warning-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--warning)]">
                            Awaiting review
                          </span>
                        )}
                        {declined && (
                          <span className="rounded-full bg-[var(--critical-soft,#fee2e2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--critical,#b42318)]">
                            Declined
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                        {pending
                          ? "You've already asked for this — the agency is reviewing it."
                          : declined
                            ? response || "The agency declined this for now."
                            : option.description}
                      </span>
                      {declined && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            askAgain(option.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              askAgain(option.value);
                            }
                          }}
                          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[var(--focus-ring)] hover:underline"
                        >
                          <RotateCcw className="size-3" aria-hidden />
                          Ask again
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="access-request-reason">Why do you need access?</Label>
            <Textarea
              id="access-request-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell the agency what you want to change…"
              rows={4}
              className="mt-1.5"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Approved access lasts until the agency turns it off, and pauses
            automatically while your blueprint is in review.
          </p>
        </div>
      )}
    </Dialog>
  );
}
