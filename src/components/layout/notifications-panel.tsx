"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, X } from "lucide-react";
import { useNotificationsStore } from "@/stores/notifications-store";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/dates";
import { Button } from "@/components/ui/button";

export function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;

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

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
      >
        <Bell className="size-4.5" aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white"
          >
            {unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-80 animate-scale-in rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-panel)] sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={unreadOnly}
                onClick={() => setUnreadOnly((v) => !v)}
                className={cn(unreadOnly && "bg-indigo-50 text-indigo-700")}
              >
                Unread
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
                  <CheckCheck className="size-4" aria-hidden />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <BellOff className="size-6 text-slate-300" aria-hidden />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {unreadOnly ? "No unread notifications" : "You're all caught up"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Updates about your projects will appear here.
                </p>
              </div>
            ) : (
              <ul>
                {visible.map((notification) => (
                  <li
                    key={notification.id}
                    className="group flex items-start border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left"
                      onClick={() => {
                        void markRead(notification.id);
                        setOpen(false);
                        if (notification.actionUrl) router.push(notification.actionUrl);
                      }}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          notification.isRead ? "bg-slate-200" : "bg-indigo-500",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">
                          {notification.title}
                          {!notification.isRead && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {formatRelative(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="mt-3 mr-2 cursor-pointer rounded-md p-1 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100"
                      aria-label={`Clear notification: ${notification.title}`}
                      onClick={() => void clear(notification.id)}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
