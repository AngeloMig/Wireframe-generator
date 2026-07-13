import type { CommentStatus } from "@/types";
import type { UserRole } from "@/types";

export function conversationStatusLabel(status: CommentStatus, authorRole?: UserRole): string {
  if (status === "resolved") return "Resolved";
  if (status === "reopened") return "Reopened";
  if (status === "in-progress") return authorRole === "customer" ? "Waiting for agency" : "Waiting for customer";
  return authorRole === "customer" ? "Waiting for agency" : "Open";
}

export function conversationStatusTone(label: string): string {
  if (label === "Resolved") return "bg-emerald-50 text-emerald-700";
  if (label === "Waiting for agency") return "bg-amber-50 text-amber-700";
  if (label === "Waiting for customer") return "bg-blue-50 text-blue-700";
  if (label === "Reopened") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}
