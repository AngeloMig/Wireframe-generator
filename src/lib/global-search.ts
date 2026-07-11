import { SECTION_VARIATIONS } from "@/data/section-variations";
import { commentRepository } from "@/lib/repositories/local-comment-repository";
import { memberRepository } from "@/lib/repositories/local-member-repository";
import { approvalRepository } from "@/lib/repositories/local-approval-repository";
import { versionRepository } from "@/lib/repositories/local-version-repository";
import type { Project } from "@/types";

/**
 * Global search across projects, section designs, comments, action items,
 * versions, approvals, members, and activity. Every result links to where
 * the match lives.
 */

export type SearchResultKind =
  | "project"
  | "section-design"
  | "comment"
  | "action-item"
  | "version"
  | "approval"
  | "member"
  | "activity";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
}

const MAX_PER_KIND = 4;

export async function globalSearch(
  rawQuery: string,
  projects: Project[],
  options: { includeInternal: boolean },
): Promise<SearchResult[]> {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  const matches = (text: string | undefined | null) =>
    Boolean(text && text.toLowerCase().includes(q));
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  // Projects
  for (const project of projects) {
    if (matches(project.name) || matches(project.companyName)) {
      results.push({
        id: project.id,
        kind: "project",
        title: project.name,
        subtitle: project.companyName,
        href: `/projects/${project.id}/overview`,
      });
    }
  }

  // Section designs
  for (const variation of SECTION_VARIATIONS) {
    if (matches(variation.name) || matches(variation.description)) {
      results.push({
        id: variation.id,
        kind: "section-design",
        title: variation.name,
        subtitle: variation.description,
        href: "/templates",
      });
    }
  }

  // Comments, action items, replies
  for (const project of projects) {
    const comments = await commentRepository.getProjectComments(project.id);
    for (const comment of comments) {
      if (!options.includeInternal && comment.visibility === "agency") continue;
      const replyMatch = comment.replies.find((r) => matches(r.message));
      if (matches(comment.message) || replyMatch) {
        results.push({
          id: comment.id,
          kind: comment.isActionItem ? "action-item" : "comment",
          title: replyMatch && !matches(comment.message) ? replyMatch.message : comment.message,
          subtitle: `${projectName.get(project.id) ?? "Project"}${comment.isActionItem ? " · action item" : ""}`,
          href: `/projects/${project.id}/overview?comment=${comment.id}`,
        });
      }
    }
  }

  // Versions
  for (const project of projects) {
    const versions = await versionRepository.getProjectVersions(project.id);
    for (const version of versions) {
      if (matches(version.label) || matches(version.description)) {
        results.push({
          id: version.id,
          kind: "version",
          title: `v${version.versionNumber} — ${version.label}`,
          subtitle: projectName.get(project.id) ?? "Project",
          href: `/projects/${project.id}/versions`,
        });
      }
    }
  }

  // Approval notes
  for (const project of projects) {
    const approvals = await approvalRepository.getProjectApprovals(project.id);
    for (const approval of approvals) {
      if (matches(approval.note) || matches(approval.revokeReason)) {
        results.push({
          id: approval.id,
          kind: "approval",
          title: approval.note ?? approval.revokeReason ?? "Approval",
          subtitle: `${projectName.get(project.id) ?? "Project"} · ${approval.scope} approval`,
          href: `/projects/${project.id}/handoff`,
        });
      }
    }
  }

  // Members
  const seenMembers = new Set<string>();
  for (const project of projects) {
    const members = await memberRepository.getProjectMembers(project.id);
    for (const member of members) {
      if ((matches(member.name) || matches(member.email)) && !seenMembers.has(member.userId + project.id)) {
        seenMembers.add(member.userId + project.id);
        results.push({
          id: member.id,
          kind: "member",
          title: member.name,
          subtitle: `${projectName.get(project.id) ?? "Project"} · ${member.email}`,
          href: `/projects/${project.id}/members`,
        });
      }
    }
  }

  // Activity
  for (const project of projects) {
    for (const entry of project.activity) {
      if (matches(entry.message)) {
        results.push({
          id: entry.id,
          kind: "activity",
          title: entry.message,
          subtitle: `${projectName.get(project.id) ?? "Project"} · ${entry.actorName}`,
          href: `/projects/${project.id}/activity`,
        });
      }
    }
  }

  // Cap each kind so one noisy source doesn't drown the rest.
  const byKind = new Map<SearchResultKind, SearchResult[]>();
  for (const result of results) {
    const list = byKind.get(result.kind) ?? [];
    if (list.length < MAX_PER_KIND) list.push(result);
    byKind.set(result.kind, list);
  }
  return [...byKind.values()].flat();
}

export const SEARCH_KIND_LABELS: Record<SearchResultKind, string> = {
  project: "Projects",
  "section-design": "Section designs",
  comment: "Comments",
  "action-item": "Action items",
  version: "Versions",
  approval: "Approvals",
  member: "Members",
  activity: "Activity",
};
