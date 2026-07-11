"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/utils/cn";

/**
 * Lightweight accessible dropdown menu: outside click + Escape to close,
 * arrow-key navigation between items.
 */

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string;
  }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length];
    next.focus();
  }, []);

  return (
    <MenuContext.Provider value={{ open, setOpen, menuId }}>
      <div ref={containerRef} className="relative inline-block">
        {trigger({
          onClick: () => setOpen(!open),
          "aria-expanded": open,
          "aria-haspopup": "menu",
          "aria-controls": menuId,
        })}
        {open && (
          <div
            id={menuId}
            role="menu"
            onKeyDown={handleMenuKeyDown}
            className={cn(
              "absolute z-40 mt-1.5 min-w-44 animate-scale-in rounded-xl border border-slate-200 bg-white p-1 shadow-[var(--shadow-panel)]",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

export function DropdownItem({
  onSelect,
  children,
  destructive,
  disabled,
}: {
  onSelect: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const context = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-slate-300",
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      )}
      onClick={() => {
        context?.setOpen(false);
        onSelect();
      }}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="mx-1 my-1 h-px bg-slate-200" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
      {children}
    </div>
  );
}
