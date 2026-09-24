import type { CmdCenterAdvFilter } from "./CmdCenterAdvFilterPage";

// A user's own forked Command Center filters — created from New Overview's Filters panel when they change
// a predefined (or another saved) filter's values and choose "Save as new filter" instead of applying the
// change just once. Kept separate from cmdCenterAdvFilterStorage.ts (the admin-managed predefined list) and
// keyed per user, same pattern as the CSR Summary View column selection.
function storageKey(userName: string) {
  return `intellisight.cmdCenterUserAdvFilters.${userName}`;
}

export function loadUserAdvFilters(userName: string): CmdCenterAdvFilter[] {
  try {
    const raw = localStorage.getItem(storageKey(userName));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserAdvFilters(userName: string, filters: CmdCenterAdvFilter[]) {
  try {
    localStorage.setItem(storageKey(userName), JSON.stringify(filters));
  } catch {
    // Storage unavailable (private browsing, quota) — the in-memory state still works for this session.
  }
}
