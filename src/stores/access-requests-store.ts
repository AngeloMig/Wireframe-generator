"use client";

import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import { createId, nowIso } from "@/utils/id";
import type { AccessRequest, AccessRequestLevel } from "@/types";

interface AccessRequestsState {
  requests: AccessRequest[];
  hydrated: boolean;
  hydrate: () => void;
  refresh: () => void;
  createRequest: (input: Omit<AccessRequest, "id" | "createdAt" | "status">) => AccessRequest;
  decide: (id: string, status: "approved" | "declined", decidedById: string, response?: string) => void;
  /** Revoke every capability a requester currently holds on a project. */
  revoke: (projectId: string, requesterId: string, decidedById: string, response?: string) => void;
}

export const useAccessRequestsStore = create<AccessRequestsState>((set, get) => ({
  requests: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = readJson<AccessRequest[]>(STORAGE_KEYS.accessRequests, []);
    set({ requests: Array.isArray(stored) ? stored : [], hydrated: true });
  },
  refresh: () => {
    const stored = readJson<AccessRequest[]>(STORAGE_KEYS.accessRequests, []);
    set({ requests: Array.isArray(stored) ? stored : [], hydrated: true });
  },
  createRequest: (input) => {
    const request: AccessRequest = { ...input, id: createId(), status: "pending", createdAt: nowIso() };
    const next = [...get().requests, request];
    writeJson(STORAGE_KEYS.accessRequests, next);
    set({ requests: next });
    return request;
  },
  decide: (id, status, decidedById, response) => {
    const next = get().requests.map((request) => request.id === id ? { ...request, status, decidedById, response, decidedAt: nowIso() } : request);
    writeJson(STORAGE_KEYS.accessRequests, next);
    set({ requests: next });
  },
  revoke: (projectId, requesterId, decidedById, response) => {
    // Flip the requester's still-active grants (approved or pending) to
    // "revoked" so grantedCapabilities drops them and the editor re-locks.
    const next = get().requests.map((request) =>
      request.projectId === projectId &&
      request.requesterId === requesterId &&
      (request.status === "approved" || request.status === "pending")
        ? { ...request, status: "revoked" as const, decidedById, response, decidedAt: nowIso() }
        : request,
    );
    writeJson(STORAGE_KEYS.accessRequests, next);
    set({ requests: next });
  },
}));

/** The capability levels a requester currently holds (approved, not revoked). */
export function approvedLevelsFor(
  requests: AccessRequest[],
  projectId: string,
  requesterId: string,
): AccessRequestLevel[] {
  return requests
    .filter(
      (request) =>
        request.projectId === projectId &&
        request.requesterId === requesterId &&
        request.status === "approved",
    )
    .map((request) => request.level);
}
