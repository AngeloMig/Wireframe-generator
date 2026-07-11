"use client";

import { create } from "zustand";
import { getUserForRole, MOCK_USERS, normalizeLegacyRole } from "@/data/users";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import type { AppUser, UserRole } from "@/types";

/**
 * Simulated session — development-only role switching, no real auth.
 * Replaced later by Supabase auth without changing consumers.
 */

interface SessionState {
  user: AppUser;
  hydrated: boolean;
  isLoggedIn: boolean;
  hydrate: () => void;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

interface StoredSession {
  role: UserRole;
  isLoggedIn: boolean;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: MOCK_USERS[0],
  hydrated: false,
  isLoggedIn: false,
  hydrate: () => {
    const stored = readJson<StoredSession | null>(STORAGE_KEYS.session, null);
    if (stored) {
      // Pre-v3 sessions stored the legacy "agency" role.
      const role = normalizeLegacyRole(stored.role);
      set({
        user: getUserForRole(role),
        isLoggedIn: stored.isLoggedIn,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
  login: (role) => {
    writeJson(STORAGE_KEYS.session, { role, isLoggedIn: true } satisfies StoredSession);
    set({ user: getUserForRole(role), isLoggedIn: true });
  },
  logout: () => {
    writeJson(STORAGE_KEYS.session, { role: "customer", isLoggedIn: false } satisfies StoredSession);
    set({ user: getUserForRole("customer"), isLoggedIn: false });
  },
  switchRole: (role) => {
    writeJson(STORAGE_KEYS.session, { role, isLoggedIn: true } satisfies StoredSession);
    set({ user: getUserForRole(role), isLoggedIn: true });
  },
}));
