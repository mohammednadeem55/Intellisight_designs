import type { DocType } from "./feedbackCenterData";

// A reviewer's own saved Feedback Center filters — a snapshot of what was applied in the toolbar and the
// Filters popover (search text, Checks + Any/All mode, Outcome, Date, and the field filters), stored per doc type since each one
// has its own checks and queue. Kept in localStorage like the other per-user saved selections in the app.
export type AiResultFilter = "All results" | "Flagged only" | "Clean only";
export type PanelFilters = { aiResult: AiResultFilter; ccc: string; po: string; quote: string; customer: string; requestor: string };
export const EMPTY_PANEL_FILTERS: PanelFilters = { aiResult: "All results", ccc: "", po: "", quote: "", customer: "", requestor: "" };

export type SavedFeedbackFilter = {
  id: string;
  name: string;
  checks: string[];
  checksMode: "any" | "all";
  outcomes: string[];
  date: string | null;
  panel: PanelFilters;
  search: string;
};

function storageKey(docType: DocType) {
  return `intellisight.feedbackCenter.savedFilters.${docType}`;
}

export function loadSavedFeedbackFilters(docType: DocType): SavedFeedbackFilter[] {
  try {
    const raw = localStorage.getItem(storageKey(docType));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Older saves (before the panel became a form) have no `panel` — default it rather than crash on read.
    return Array.isArray(parsed) ? parsed.map((f) => ({ ...f, checksMode: f.checksMode ?? "any", search: f.search ?? "", panel: { ...EMPTY_PANEL_FILTERS, ...(f.panel ?? {}) } })) : [];
  } catch {
    return [];
  }
}

export function saveSavedFeedbackFilters(docType: DocType, filters: SavedFeedbackFilter[]) {
  try {
    localStorage.setItem(storageKey(docType), JSON.stringify(filters));
  } catch {
    // Storage unavailable (private browsing, quota) — filters still work in memory for this session.
  }
}
