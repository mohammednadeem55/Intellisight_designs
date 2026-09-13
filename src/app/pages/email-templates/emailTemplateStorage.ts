import type { EmailTemplate } from "./EmailTemplatePage";

// No backend for email templates yet — this is the one place both the listing page and the editor read
// from / write to, so a template (and its sample data) created or edited in one survives navigating to the
// other, and across a reload, instead of living only in that page's local component state.
const STORAGE_KEY = "intellisight.emailTemplates";

export function loadEmailTemplates(fallback: EmailTemplate[]): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveEmailTemplates(templates: EmailTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Storage unavailable (private browsing, quota) — the in-memory state still works for this session.
  }
}
