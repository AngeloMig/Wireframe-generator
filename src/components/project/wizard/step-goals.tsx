"use client";

import {
  BookOpen,
  Briefcase,
  Calendar,
  Image as ImageIcon,
  Magnet,
  Mail,
  Megaphone,
  ShoppingBag,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { GOAL_OPTIONS } from "@/config/options";
import type { WebsiteGoal } from "@/types";
import { SelectableCard } from "@/components/ui/selectable-card";

const GOAL_ICONS: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  magnet: Magnet,
  calendar: Calendar,
  briefcase: Briefcase,
  megaphone: Megaphone,
  image: ImageIcon,
  "book-open": BookOpen,
  ticket: Ticket,
  mail: Mail,
  users: Users,
};

export function StepGoals({
  selected,
  onChange,
}: {
  selected: WebsiteGoal[];
  onChange: (goals: WebsiteGoal[]) => void;
}) {
  const toggle = (goal: WebsiteGoal) => {
    onChange(
      selected.includes(goal) ? selected.filter((g) => g !== goal) : [...selected, goal],
    );
  };

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500" id="goals-hint">
        Select everything this website should do — you can pick more than one.
      </p>
      <div
        role="group"
        aria-labelledby="goals-hint"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {GOAL_OPTIONS.map((goal) => {
          const Icon = GOAL_ICONS[goal.icon] ?? Briefcase;
          return (
            <SelectableCard
              key={goal.value}
              selected={selected.includes(goal.value)}
              onToggle={() => toggle(goal.value)}
              title={goal.label}
              description={goal.description}
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="size-4.5" aria-hidden />
              </span>
            </SelectableCard>
          );
        })}
      </div>
    </div>
  );
}
