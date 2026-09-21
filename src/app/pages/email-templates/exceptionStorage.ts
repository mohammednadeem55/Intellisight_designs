import type { TemplateException } from "./EmailTemplatePage";

// No backend for template exceptions yet — this is the one place both the listing tab and the (now
// full-page, not modal) editor read from / write to, so an exception created or edited in one survives
// navigating to the other, and across a reload, instead of living only in that page's local component state.
const STORAGE_KEY = "intellisight.templateExceptions";

export function loadTemplateExceptions(fallback: TemplateException[]): TemplateException[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveTemplateExceptions(exceptions: TemplateException[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exceptions));
  } catch {
    // Storage unavailable (private browsing, quota) — the in-memory state still works for this session.
  }
}
