"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { useAccessRequestsStore } from "@/stores/access-requests-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage, AccessRequestLevel } from "@/types";
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
  const [level, setLevel] = useState<AccessRequestLevel>("page");
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request more access"
      description="Your agency will review the request before anything changes."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              createRequest({
                projectId: project.id,
                requesterId: user.id,
                requesterName: user.name,
                level,
                pageId: page.id,
                reason: reason.trim(),
              });
              toast("Access request sent", "success", "The agency will review it shortly.");
              setReason("");
              onClose();
            }}
          >
            <Send className="size-4" aria-hidden /> Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>What do you need?</Label>
          <div role="radiogroup" aria-label="What do you need?" className="mt-1.5 space-y-2">
            {ACCESS_OPTIONS.map((option) => {
              const selected = level === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLevel(option.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-[var(--focus-ring)] bg-[var(--info-soft)]/60"
                      : "border-[var(--border-default)] bg-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                      selected
                        ? "border-[var(--focus-ring)] bg-[var(--focus-ring)] text-white"
                        : "border-[var(--border-strong)] bg-white",
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--text-primary)]">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                      {option.description}
                    </span>
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
      </div>
    </Dialog>
  );
}
