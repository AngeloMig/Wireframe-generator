"use client";

import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage/local-storage";
import { createId, nowIso } from "@/utils/id";
import type { AccessRequest, AccessRequestLevel } from "@/types";

interface AccessRequestsState {
  requests: AccessRequest[];
  hydrated: boolean;
  hydrate: () => void;
  createRequest: (input: Omit<AccessRequest, "id" | "createdAt" | "status">) => AccessRequest;
  decide: (id: string, status: "approved" | "declined", decidedById: string, response?: string) => void;
}

export const useAccessRequestsStore = create<AccessRequestsState>((set, get) => ({
  requests: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ requests: readJson<AccessRequest[]>(STORAGE_KEYS.accessRequests, []), hydrated: true });
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
}));

export function accessLevelForRequest(level: AccessRequestLevel) {
  return level === "page" ? "comment" : "edit";
}
