"use client";

import {
  CheckCircle2,
  FilePlus2,
  FileX2,
  History,
  ImagePlus,
  LayoutGrid,
  MessageSquare,
  PencilLine,
  RefreshCcw,
  Send,
  type LucideIcon,
} from "lucide-react";
import { ROLE_LABELS } from "@/config/labels";
import type { ActivityEntry, ActivityType } from "@/types";
import { formatRelative } from "@/utils/dates";
import { EmptyState } from "@/components/ui/empty-state";

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  "project-created": FilePlus2,
  "project-updated": PencilLine,
  "page-added": FilePlus2,
  "page-updated": PencilLine,
  "page-deleted": FileX2,
  "section-added": LayoutGrid,
  "section-removed": LayoutGrid,
  "page-submitted": Send,
  "project-submitted": Send,
  "comment-created": MessageSquare,
  "revisions-requested": RefreshCcw,
  "page-approved": CheckCircle2,
  "status-changed": RefreshCcw,
  "asset-added": ImagePlus,
};

/** Chronological activity list, shared by project and global activity pages. */
export function ActivityFeed({
  entries,
  showProjectName,
  projectNames,
  emptyDescription,
}: {
  entries: ActivityEntry[];
  showProjectName?: boolean;
  projectNames?: Map<string, string>;
  emptyDescription: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState icon={History} title="No recent activity" description={emptyDescription} />
    );
  }

  return (
    <ol className="space-y-0 rounded-xl border border-slate-200 bg-white shadow-sm">
      {entries.map((entry, index) => {
        const Icon = ACTIVITY_ICONS[entry.type] ?? History;
        return (
          <li
            key={entry.id}
            className={
              index < entries.length - 1
                ? "border-b border-slate-100"
                : undefined
            }
          >
            <div className="flex items-start gap-3 px-5 py-3.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Icon className="size-3.5 text-slate-500" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">{entry.message}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {entry.actorName} ({ROLE_LABELS[entry.actorRole]})
                  {showProjectName && projectNames?.get(entry.projectId) && (
                    <> · {projectNames.get(entry.projectId)}</>
                  )}
                  {" · "}
                  {formatRelative(entry.createdAt)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
