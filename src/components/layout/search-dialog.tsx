"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckSquare,
  FolderKanban,
  History,
  LayoutTemplate,
  MessageSquare,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  globalSearch,
  SEARCH_KIND_LABELS,
  type SearchResult,
  type SearchResultKind,
} from "@/lib/global-search";
import { canViewInternalNotes } from "@/lib/permissions";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const KIND_ICONS: Record<SearchResultKind, LucideIcon> = {
  project: FolderKanban,
  "section-design": LayoutTemplate,
  comment: MessageSquare,
  "action-item": CheckSquare,
  version: History,
  approval: ShieldCheck,
  member: UserRound,
  activity: Activity,
};

const KIND_ORDER: SearchResultKind[] = [
  "project",
  "comment",
  "action-item",
  "member",
  "version",
  "approval",
  "section-design",
  "activity",
];

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const user = useSessionStore((s) => s.user);

  // Debounced global search across all collaboration records.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      void globalSearch(q, projects, {
        includeInternal: canViewInternalNotes(user.role),
      })
        .then(setResults)
        .finally(() => setSearching(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, projects, user.role]);

  const grouped = useMemo(() => {
    const groups = new Map<SearchResultKind, SearchResult[]>();
    for (const kind of KIND_ORDER) {
      const forKind = results.filter((r) => r.kind === kind);
      if (forKind.length > 0) groups.set(kind, forKind);
    }
    return groups;
  }, [results]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Search">
        <Search className="size-4.5" aria-hidden />
      </Button>
      <Dialog open={open} onClose={close} title="Search" size="lg">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, comments, versions, people…"
            className="pl-9"
            aria-label="Search everything"
          />
        </div>
        <div className="mt-4 max-h-96 min-h-40 overflow-y-auto">
          {!hasQuery && (
            <p className="py-8 text-center text-sm text-slate-500">
              Search your projects, section designs, comments, action items, versions,
              approvals, members, and activity.
            </p>
          )}
          {hasQuery && !hasResults && !searching && (
            <div className="flex flex-col items-center py-8 text-center">
              <SearchX className="size-6 text-slate-300" aria-hidden />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No results for “{query}”
              </p>
              <p className="mt-0.5 text-sm text-slate-500">Try a different term.</p>
            </div>
          )}
          {hasQuery && searching && !hasResults && (
            <p className="py-8 text-center text-sm text-slate-400">Searching…</p>
          )}
          {[...grouped.entries()].map(([kind, kindResults]) => {
            const Icon = KIND_ICONS[kind];
            return (
              <div key={kind} className="mb-4">
                <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                  {SEARCH_KIND_LABELS[kind]}
                </h3>
                {kindResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--surface-secondary)]"
                    onClick={() => {
                      close();
                      router.push(result.href);
                    }}
                  >
                    <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {result.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {result.subtitle}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
