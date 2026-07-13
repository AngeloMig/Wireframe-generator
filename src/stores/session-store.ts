"use client";

import { create } from "zustand";
import { getUserById, getUserForRole, MOCK_USERS, normalizeLegacyRole } from "@/data/users";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import type { AppUser, UserRole } from "@/types";

/**
 * Simulated session — development-only user switching, no real auth.
 * Sessions are per-USER (not per-role) so the multi-agency demo can sign in
 * as staff of different agencies. Replaced later by Supabase auth.
 */

interface SessionState {
  user: AppUser;
  hydrated: boolean;
  isLoggedIn: boolean;
  hydrate: () => void;
  /** Sign in as a specific mock user. */
  login: (userId: string) => void;
  logout: () => void;
  /** Switch to a specific mock user (dev-only switcher). */
  switchUser: (userId: string) => void;
  /** Legacy helper: switch to the first mock user with this role. */
  switchRole: (role: UserRole) => void;
}

interface StoredSession {
  userId?: string;
  /** Pre-v4 sessions stored a role instead of a user id. */
  role?: string;
  isLoggedIn: boolean;
}

function resolveUser(stored: StoredSession): AppUser {
  if (stored.userId) {
    const user = getUserById(stored.userId);
    if (user) return user;
  }
  if (stored.role) return getUserForRole(normalizeLegacyRole(stored.role));
  return MOCK_USERS[0];
}

function persist(user: AppUser, isLoggedIn: boolean) {
  writeJson(STORAGE_KEYS.session, {
    userId: user.id,
    isLoggedIn,
  } satisfies StoredSession);
}

export const useSessionStore = create<SessionState>((set) => ({
  user: MOCK_USERS[0],
  hydrated: false,
  isLoggedIn: false,

  hydrate: () => {
    const stored = readJson<StoredSession | null>(STORAGE_KEYS.session, null);
    if (stored) {
      set({
        user: resolveUser(stored),
        isLoggedIn: stored.isLoggedIn,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  login: (userId) => {
    const user = getUserById(userId) ?? MOCK_USERS[0];
    persist(user, true);
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    persist(MOCK_USERS[0], false);
    set({ user: MOCK_USERS[0], isLoggedIn: false });
  },

  switchUser: (userId) => {
    const user = getUserById(userId) ?? MOCK_USERS[0];
    persist(user, true);
    set({ user, isLoggedIn: true });
  },

  switchRole: (role) => {
    const user = getUserForRole(role);
    persist(user, true);
    set({ user, isLoggedIn: true });
  },
}));
