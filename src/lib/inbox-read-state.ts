const STORAGE_KEY = "wb-inbox-read-state";

type ReadState = Record<string, string[]>;

function readState(): ReadState {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function isInboxRead(userId: string, commentId: string): boolean {
  return readState()[userId]?.includes(commentId) ?? false;
}

export function markInboxRead(userId: string, commentId: string, read = true): void {
  if (typeof window === "undefined") return;
  const state = readState();
  const current = new Set(state[userId] ?? []);
  if (read) current.add(commentId);
  else current.delete(commentId);
  state[userId] = [...current].slice(-500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("inbox-read-state-changed"));
}
