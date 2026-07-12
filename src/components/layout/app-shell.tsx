"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { isCustomerAllowedPath } from "@/lib/customer-workspace";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationsPanel } from "./notifications-panel";
import { SearchButton } from "./search-dialog";
import { Sidebar, SidebarContent } from "./sidebar";
import { UserMenu } from "./user-menu";
import { BrandMark } from "@/components/brand/brand-mark";

/**
 * Authenticated application chrome: sidebar, top header, mobile nav.
 * Hydrates the client stores from local storage on mount.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionHydrated = useSessionStore((s) => s.hydrated);
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  const hydrateSession = useSessionStore((s) => s.hydrate);
  const projectsHydrated = useProjectsStore((s) => s.hydrated);
  const hydrateProjects = useProjectsStore((s) => s.hydrate);
  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    hydrateSession();
    void hydrateProjects();
    void hydrateNotifications();
  }, [hydrateSession, hydrateProjects, hydrateNotifications]);

  useEffect(() => {
    if (sessionHydrated && !isLoggedIn) {
      router.replace("/login");
    }
  }, [sessionHydrated, isLoggedIn, router]);

  const isCustomer = useSessionStore((s) => s.user.role === "customer");

  // Customers get a focused, editor-only workspace: any screen outside their
  // allowed set (home, editor, review, revisions) bounces back home.
  const customerBlocked = isCustomer && !isCustomerAllowedPath(pathname);
  useEffect(() => {
    if (sessionHydrated && isLoggedIn && customerBlocked) {
      router.replace("/dashboard");
    }
  }, [sessionHydrated, isLoggedIn, customerBlocked, router]);

  // Close the mobile nav whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const ready = sessionHydrated && projectsHydrated && isLoggedIn;

  if (isCustomer) {
    const inEditor = /^\/projects\/[^/]+\/editor/.test(pathname);
    return (
      <div className="flex min-h-screen flex-col">
        {/* The editor brings its own header; other customer screens get a slim one. */}
        {!inEditor && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-white px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-7 rounded-lg" />
              <span className="font-display text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                {APP_CONFIG.name}
              </span>
            </div>
            <UserMenu />
          </header>
        )}
        <main className={inEditor ? "min-w-0 flex-1" : "flex-1 px-4 py-8 sm:px-6"}>
          {ready && !customerBlocked ? (
            inEditor ? (
              children
            ) : (
              <div className="mx-auto w-full max-w-4xl">{children}</div>
            )
          ) : (
            <PageSkeleton />
          )}
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      {/* Mobile navigation drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex h-full w-72 animate-slide-in-right flex-col bg-white shadow-[var(--shadow-overlay)]">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-2.5">
                <BrandMark className="size-7 rounded-lg" />
                <span className="text-sm font-semibold text-slate-900">{APP_CONFIG.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border-default)] bg-white/95 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-1">
            <SearchButton />
            <NotificationsPanel />
            <UserMenu />
          </div>
        </header>
        {/^\/projects\/[^/]+\/editor/.test(pathname) ? (
          // The wireframe editor manages its own layout and needs full width.
          <main className="min-w-0 flex-1">
            {ready ? children : <PageSkeleton />}
          </main>
        ) : (
          <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            <div className="mx-auto w-full max-w-6xl">
              {ready ? children : <PageSkeleton />}
            </div>
          </main>
        )}
      </div>
      <Toaster />
    </div>
  );
}
