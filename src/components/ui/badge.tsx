import { cn } from "@/utils/cn";
import { PAGE_STATUS_META, PROJECT_STATUS_META } from "@/config/labels";
import type { PageStatus, ProjectStatus } from "@/types";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}

export function PageStatusBadge({ status }: { status: PageStatus }) {
  const meta = PAGE_STATUS_META[status];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}
