"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ProjectMember } from "@/types";
import { cn } from "@/utils/cn";
import { Textarea } from "@/components/ui/input";

/**
 * Textarea with @mention support. Typing "@" opens a member dropdown;
 * selecting inserts the display name into the text and records the member's
 * userId — mentioned ids are stored separately from the message text.
 */
export function MentionTextarea({
  value,
  onChange,
  mentions,
  onMentionsChange,
  members,
  placeholder,
  rows = 3,
  disabled,
  autoFocus,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  mentions: string[];
  onMentionsChange: (userIds: string[]) => void;
  members: ProjectMember[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const candidates =
    query === null
      ? []
      : members.filter((m) =>
          m.name.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, 6);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function detectMention(text: string, caret: number) {
    // Look back from the caret for an "@" that starts a mention.
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setQuery(null);
      return;
    }
    const charBefore = at === 0 ? " " : before[at - 1];
    if (!/[\s([{]/.test(charBefore) && at !== 0) {
      setQuery(null);
      return;
    }
    const partial = before.slice(at + 1);
    if (/[\n@]/.test(partial) || partial.length > 30) {
      setQuery(null);
      return;
    }
    setQuery(partial);
    setQueryStart(at);
  }

  function insertMention(member: ProjectMember) {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    const next = `${value.slice(0, queryStart)}@${member.name} ${value.slice(caret)}`;
    onChange(next);
    if (!mentions.includes(member.userId)) {
      onMentionsChange([...mentions, member.userId]);
    }
    setQuery(null);
    requestAnimationFrame(() => {
      const pos = queryStart + member.name.length + 2;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (query === null || candidates.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % candidates.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertMention(candidates[activeIndex]);
    } else if (event.key === "Escape") {
      setQuery(null);
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={query !== null && candidates.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          detectMention(e.target.value, e.target.selectionStart ?? 0);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay so option clicks land before the list closes.
          setTimeout(() => setQuery(null), 150);
        }}
      />
      {query !== null && candidates.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Mention a team member"
          className="absolute right-0 left-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {candidates.map((member, index) => (
            <li key={member.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm",
                  index === activeIndex ? "bg-indigo-50 text-indigo-900" : "text-slate-700",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(member);
                }}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                    member.avatarColor,
                  )}
                >
                  {member.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{member.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {member.organization}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
