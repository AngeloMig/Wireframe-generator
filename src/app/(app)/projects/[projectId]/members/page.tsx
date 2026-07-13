"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldOff, Star, Trash2, UserPlus, Users } from "lucide-react";
import { ACCESS_LEVEL_LABELS, ROLE_LABELS } from "@/config/labels";
import { ALL_MOCK_USERS } from "@/data/users";
import { canManageMembers } from "@/lib/permissions";
import { notifyUsers } from "@/lib/collab-service";
import { withActivity } from "@/lib/project-utils";
import { useProject } from "@/hooks/use-project";
import { selectProjectMembers, useMembersStore } from "@/stores/members-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { approvedLevelsFor, useAccessRequestsStore } from "@/stores/access-requests-store";
import { toast } from "@/stores/ui-store";
import type { AccessRequestLevel, ProjectAccessLevel, ProjectMember, UserRole } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Label, Select } from "@/components/ui/input";

const ASSIGNABLE_ROLES: UserRole[] = [
  "customer",
  "agency-designer",
  "agency-developer",
  "agency-pm",
];

const LEVEL_LABEL: Record<AccessRequestLevel, string> = {
  page: "add or edit pages",
  content: "edit page content",
  builder: "build and arrange sections",
};

/** Project members: mock people with role, access level, and primary contact. */
export default function MembersPage() {
  const { project, projectId } = useProject();
  const user = useSessionStore((s) => s.user);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const store = useMembersStore();
  const members = useMembersStore((s) => selectProjectMembers(s, projectId));
  // Select the stable store array first; filtering inside a Zustand selector
  // creates a new snapshot every render and triggers an infinite update loop.
  const allRequests = useAccessRequestsStore((s) => s.requests);
  const requests = useMemo(
    () => allRequests.filter((request) => request.projectId === projectId),
    [allRequests, projectId],
  );
  const hydrateRequests = useAccessRequestsStore((s) => s.hydrate);
  const decideRequest = useAccessRequestsStore((s) => s.decide);
  const revokeAccess = useAccessRequestsStore((s) => s.revoke);

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);

  useEffect(() => {
    if (projectId) void store.load(projectId);
    hydrateRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hydrateRequests]);

  if (!project) return null;

  const canManage = canManageMembers(user.role);
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const availableUsers = ALL_MOCK_USERS.filter(
    (u) => !members.some((m) => m.userId === u.id),
  );

  const logMemberActivity = (type: "member-added" | "member-removed" | "member-role-changed", message: string) => {
    updateProject(projectId, (p) => withActivity(p, type, message, user), {
      immediate: true,
    });
  };

  const revokeMemberAccess = (member: ProjectMember) => {
    // Clear both grant sources: an explicit "edit" member level and any
    // approved capability requests. Either alone re-unlocks the editor.
    if (member.accessLevel === "edit") {
      void store.updateMember(projectId, member.id, { accessLevel: "comment" });
    }
    revokeAccess(projectId, member.userId, user.id, "Access revoked by the agency");
    void notifyUsers([member.userId], user.id, {
      projectId,
      type: "general",
      title: "Edit access turned off",
      message:
        "The agency turned off your editing access on this project. You can still view and comment — request access again if you need it.",
    });
    toast(`${member.name}'s edit access revoked`, "info");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {canManage && pendingRequests.length > 0 && (
        <Card>
          <CardHeader title={`Access requests (${pendingRequests.length})`} description="Review customer requests before granting additional editor permissions." />
          <CardBody className="space-y-3">
            {pendingRequests.map((request) => {
              const askedFrom = request.pageId ? project.pages.find((page) => page.id === request.pageId)?.name : null;
              const approve = () => {
                decideRequest(request.id, "approved", user.id, "Access granted");
                void notifyUsers([request.requesterId], user.id, {
                  projectId,
                  type: "general",
                  title: "Access approved",
                  message: `The agency approved your request to ${LEVEL_LABEL[request.level]}.`,
                });
                toast("Access approved", "success");
              };
              const decline = () => {
                const response = "Please discuss this change with the agency first.";
                decideRequest(request.id, "declined", user.id, response);
                void notifyUsers([request.requesterId], user.id, {
                  projectId,
                  type: "general",
                  title: "Access request declined",
                  message: `Your request to ${LEVEL_LABEL[request.level]} was declined. ${response}`,
                });
                toast("Request declined", "info");
              };
              return <div key={request.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{request.requesterName} requested to {LEVEL_LABEL[request.level]}</p><p className="mt-1 text-sm text-slate-600">{request.reason}</p><p className="mt-1 text-xs text-slate-500">Unlocks this capability for the customer{askedFrom ? ` · asked from ${askedFrom}` : ""}</p></div><div className="flex gap-2"><Button size="sm" onClick={approve}>Approve</Button><Button variant="outline" size="sm" onClick={decline}>Decline</Button></div></div></div>;
            })}
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-slate-400" aria-hidden />
              Project members ({members.length})
            </span>
          }
          description={
            canManage
              ? "Manage who can view, comment on, and edit this blueprint."
              : "Who's collaborating on this blueprint. Project managers and admins manage membership."
          }
          action={
            canManage ? (
              <Button size="sm" onClick={() => setAddOpen(true)} disabled={availableUsers.length === 0}>
                <UserPlus className="size-3.5" aria-hidden />
                Add member
              </Button>
            ) : undefined
          }
        />
        <CardBody className="divide-y divide-slate-100 p-0">
          {members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span
                aria-hidden
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                  member.avatarColor,
                )}
              >
                {member.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                  {member.name}
                  {member.isPrimaryContact && (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      <Star className="mr-0.5 size-3" aria-hidden />
                      Primary contact
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {member.email} · {member.organization} · added{" "}
                  {formatRelative(member.addedAt)}
                </p>
              </div>

              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    aria-label={`Role for ${member.name}`}
                    value={member.role}
                    className="h-8 w-44 text-xs"
                    onChange={(e) => {
                      void store
                        .updateMember(projectId, member.id, {
                          role: e.target.value as UserRole,
                        })
                        .then(() =>
                          logMemberActivity(
                            "member-role-changed",
                            `${member.name}'s role changed to ${ROLE_LABELS[e.target.value as UserRole]}`,
                          ),
                        );
                    }}
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label={`Access level for ${member.name}`}
                    value={member.accessLevel}
                    className="h-8 w-28 text-xs"
                    onChange={(e) =>
                      void store.updateMember(projectId, member.id, {
                        accessLevel: e.target.value as ProjectAccessLevel,
                      })
                    }
                  >
                    {(["view", "comment", "edit"] as const).map((level) => (
                      <option key={level} value={level}>
                        {ACCESS_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </Select>
                  {!member.isPrimaryContact && member.role !== "customer" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Make ${member.name} the primary agency contact`}
                      onClick={() =>
                        void store
                          .setPrimaryContact(projectId, member.id)
                          .then(() => toast(`${member.name} is now the primary contact`, "success"))
                      }
                    >
                      <Star className="size-4" aria-hidden />
                    </Button>
                  )}
                  {member.role === "customer" &&
                    (member.accessLevel === "edit" ||
                      approvedLevelsFor(requests, projectId, member.userId).length > 0) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Revoke ${member.name}'s edit access`}
                        title="Revoke edit access"
                        onClick={() => revokeMemberAccess(member)}
                      >
                        <ShieldOff className="size-4 text-amber-500" aria-hidden />
                      </Button>
                    )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${member.name} from the project`}
                    onClick={() => setRemoveTarget(member)}
                  >
                    <Trash2 className="size-4 text-rose-400" aria-hidden />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                    {ROLE_LABELS[member.role]}
                  </Badge>
                  <span>{ACCESS_LEVEL_LABELS[member.accessLevel]} access</span>
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              No members yet — reset demo data from Settings to restore the demo team.
            </p>
          )}
        </CardBody>
      </Card>

      {addOpen && (
        <AddMemberDialog
          projectId={projectId}
          projectCompany={project.companyName}
          availableUsers={availableUsers}
          onClose={() => setAddOpen(false)}
          onAdded={(name) => {
            logMemberActivity("member-added", `${name} was added to the project`);
            setAddOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget ? `Remove ${removeTarget.name}?` : ""}
        description="They'll lose access to this project. Their comments and history remain."
        confirmLabel="Remove member"
        onConfirm={() => {
          if (!removeTarget) return;
          void store.removeMember(projectId, removeTarget.id).then(() => {
            logMemberActivity("member-removed", `${removeTarget.name} was removed from the project`);
            toast("Member removed", "info");
          });
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

function AddMemberDialog({
  projectId,
  projectCompany,
  availableUsers,
  onClose,
  onAdded,
}: {
  projectId: string;
  projectCompany: string;
  availableUsers: typeof ALL_MOCK_USERS;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const addMember = useMembersStore((s) => s.addMember);
  const [userId, setUserId] = useState(availableUsers[0]?.id ?? "");
  const [accessLevel, setAccessLevel] = useState<ProjectAccessLevel>("comment");
  const [busy, setBusy] = useState(false);
  const selected = availableUsers.find((u) => u.id === userId);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a project member"
      description="Prototype note: pick from the mock people — real invitations arrive with the backend phase."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={!selected || busy}
            onClick={async () => {
              if (!selected) return;
              setBusy(true);
              try {
                await addMember({
                  projectId,
                  userId: selected.id,
                  name: selected.name,
                  email: selected.email,
                  initials: selected.initials,
                  avatarColor: selected.avatarColor,
                  role: selected.role,
                  organization:
                    selected.role === "customer" ? projectCompany : selected.organization,
                  accessLevel,
                  isPrimaryContact: false,
                });
                toast(`${selected.name} added`, "success");
                onAdded(selected.name);
              } finally {
                setBusy(false);
              }
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            Add member
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="add-member-user">Person</Label>
          <Select
            id="add-member-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1.5"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {ROLE_LABELS[u.role]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="add-member-access">Access level</Label>
          <Select
            id="add-member-access"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as ProjectAccessLevel)}
            className="mt-1.5"
          >
            <option value="view">View — read only</option>
            <option value="comment">Comment — view + discuss</option>
            <option value="edit">Edit — full editing</option>
          </Select>
        </div>
      </div>
    </Dialog>
  );
}
