"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Inbox as InboxIcon, MessageSquare, Search } from "lucide-react";
import { projectsForUser } from "@/lib/org";
import { isInboxRead, markInboxRead } from "@/lib/inbox-read-state";
import { conversationStatusLabel, conversationStatusTone } from "@/lib/conversation-status";
import { useCommentsStore } from "@/stores/comments-store";
import { useMembersStore } from "@/stores/members-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { formatRelative } from "@/utils/dates";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { CommentCard } from "@/components/collab/comment-card";
import { Badge } from "@/components/ui/badge";

export default function InboxPage() {
  const allProjects = useProjectsStore((state) => state.projects);
  const user = useSessionStore((state) => state.user);
  const commentsByProject = useCommentsStore((state) => state.byProject);
  const membersByProject = useMembersStore((state) => state.byProject);
  const loadComments = useCommentsStore((state) => state.load);
  const loadMembers = useMembersStore((state) => state.load);
  const projects = useMemo(() => projectsForUser(allProjects, user), [allProjects, user]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "questions" | "unresolved" | "replies" | "waiting-agency" | "waiting-customer" | "resolved">("all");
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    for (const project of projects) {
      void loadComments(project.id);
      void loadMembers(project.id);
    }
  }, [projects, loadComments, loadMembers]);

  useEffect(() => {
    const onReadStateChange = () => setReadVersion((value) => value + 1);
    window.addEventListener("inbox-read-state-changed", onReadStateChange);
    return () => window.removeEventListener("inbox-read-state-changed", onReadStateChange);
  }, []);

  const threads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.flatMap((project) =>
      (commentsByProject[project.id] ?? [])
        .filter((comment) => comment.visibility === "customer" || user.role !== "customer")
        .filter((comment) => {
          const author = (membersByProject[project.id] ?? []).find((member) => member.userId === comment.authorId);
          const statusLabel = conversationStatusLabel(comment.status, author?.role);
          return filter === "all" || (filter === "questions" && comment.message.startsWith("[Question for")) || (filter === "unresolved" && comment.status !== "resolved") || (filter === "replies" && comment.replies.length > 0) || (filter === "waiting-agency" && statusLabel === "Waiting for agency") || (filter === "waiting-customer" && statusLabel === "Waiting for customer") || (filter === "resolved" && statusLabel === "Resolved");
        })
        .filter((comment) => !q || comment.message.toLowerCase().includes(q) || project.name.toLowerCase().includes(q) || comment.replies.some((reply) => reply.message.toLowerCase().includes(q)))
        .map((comment) => ({ project, comment })),
    ).sort((a, b) => b.comment.updatedAt.localeCompare(a.comment.updatedAt));
  }, [projects, commentsByProject, membersByProject, user.role, query, filter]);
  const unreadCount = useMemo(
    () => { void readVersion; return projects.reduce((total, project) => total + (commentsByProject[project.id] ?? []).filter((comment) => comment.status !== "resolved" && comment.authorId !== user.id && !isInboxRead(user.id, comment.id)).length, 0); },
    [projects, commentsByProject, user.id, readVersion],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="mb-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">Messages</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Inbox</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Questions, replies, mentions, and feedback across your projects.</p>
        {unreadCount > 0 && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--info-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--info-text)]"><span className="size-1.5 rounded-full bg-[var(--info)]" />{unreadCount} conversation{unreadCount === 1 ? "" : "s"} need your attention</p>}
      </header>

      <Card>
        <CardHeader title="Conversation inbox" description="Open a thread to reply in its original project context." />
        <CardBody className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages…" aria-label="Search messages" className="pl-9" /></div>
          <Select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter inbox"><option value="all">All conversations</option><option value="waiting-agency">Waiting for agency</option><option value="waiting-customer">Waiting for customer</option><option value="unresolved">Needs a response</option><option value="questions">Customer questions</option><option value="replies">Has replies</option><option value="resolved">Resolved</option></Select>
        </CardBody>
      </Card>

      {threads.length === 0 ? (
        <EmptyState icon={InboxIcon} title="Your inbox is clear" description="New customer questions and project replies will appear here." />
      ) : (
        <div className="space-y-4">
          {threads.map(({ project, comment }) => (
            <Card key={comment.id}>
              <CardBody>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
                  <div><p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">{project.name}<Badge className={conversationStatusTone(conversationStatusLabel(comment.status, (membersByProject[project.id] ?? []).find((member) => member.userId === comment.authorId)?.role))}>{conversationStatusLabel(comment.status, (membersByProject[project.id] ?? []).find((member) => member.userId === comment.authorId)?.role)}</Badge></p><p className="mt-0.5 text-xs text-[var(--text-muted)]">Updated {formatRelative(comment.updatedAt)}</p></div>
                  <div className="flex items-center gap-2">
                    {isInboxRead(user.id, comment.id) && <Button variant="ghost" size="sm" onClick={() => markInboxRead(user.id, comment.id, false)}>Mark unread</Button>}
                    <Link onClick={() => markInboxRead(user.id, comment.id)} href={`${user.role === "customer" ? `/projects/${project.id}/review` : `/projects/${project.id}/agency-review?comment=${comment.id}`}`}><Button variant="outline" size="sm">{isInboxRead(user.id, comment.id) ? "Open project thread" : "Mark read & open"} <MessageSquare className="size-3.5" aria-hidden /></Button></Link>
                  </div>
                </div>
                <CommentCard project={project} comment={comment} members={membersByProject[project.id] ?? []} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
