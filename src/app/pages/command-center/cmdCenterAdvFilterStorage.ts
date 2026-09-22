import type { CmdCenterAdvFilter } from "./CmdCenterAdvFilterPage";

// No backend for Command Center advanced filters yet — same pattern as Email Template Exceptions'
// storage: the listing page and the (full-page) editor both read from / write to this, so a filter
// created or edited in one survives navigating to the other, and across a reload.
const STORAGE_KEY = "intellisight.cmdCenterAdvFilters";

export function loadCmdCenterAdvFilters(fallback: CmdCenterAdvFilter[]): CmdCenterAdvFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveCmdCenterAdvFilters(filters: CmdCenterAdvFilter[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage unavailable (private browsing, quota) — the in-memory state still works for this session.
  }
}
